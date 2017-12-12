const express = require('express');
const router = express.Router();
const multer = require('multer');
const fse = require('fs-extra');
const os = require('os');
const XLSX = require('xlsx');
const moment = require('moment');
const path = require('path');

const db = require('../db');

const upload = multer({ dest: os.tmpdir() }).fields([
  { name: 'words', maxCount: 1000 },
  { name: 'excel', maxCount: 1 }
]);

router.get('/', (req, res) => {
  res.render('screen1');
});

router.post('/', upload, async (req, res) => {
  const logs = [];
  let logsFile;
  try {
    let insertSuccess = 0;
    let insertFail = 0;
    const wb = XLSX.readFile(req.files.excel[0].path);
    const excel = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {
      header: 1,
      blankrows: false
    });

    if (excel.length === 0 || excel[0].length !== 5) {
      return res.json({ success: false, error: 'Invalid' });
    }

    let data = [];
    excel.map((item, idx) => {
      if (idx > 0 && item[3]) {
        const wordFile = req.files.words.find(w => w.originalname === item[3]);

        if (wordFile) {
          item[5] = wordFile;
          data.push(item);
        }
      }
    });

    // Get all data of mst_apply table
    const shokans = await db.getAllShokanMst();

    const result = data.map(async (item, idx) => {
      const empId = await db.findEmpIdByEmail(item[2]);
      if (empId.length === 0) {
        const report = `Employee not found with email: ${item[2]}`;
        insertFail += 1;
        logs.push(report);
        return;
      }

      const applyDate = moment(new Date(item[1])).format('YYYYMMDD');
      const applyTime = moment(new Date(item[1])).format('HHmmss');

      const shokan = shokans.filter(
        s => s.ki_no === item[0] && s.employee_id === empId[0].id
      );

      if (shokan.length > 0) {
        return db
          .updateShokanMst(
            item[0],
            empId[0].id,
            item[5].originalname,
            fse.readFileSync(item[5].path),
            applyDate,
            applyTime,
            item[4]
          )
          .then(() => {
            const report = `Row ${idx} update successfully.`;
            insertSuccess += 1;
            logs.push(report);
          })
          .catch(err => {
            if (err) {
              const report = `Row ${idx} update failed. Error: ${err.detail}`;
              insertFail += 1;
              logs.push(report);
            }
          });
      } else {
        return db
          .insertShokanMst(
            item[0],
            empId[0].id,
            item[2],
            item[5].originalname,
            fse.readFileSync(item[5].path),
            applyDate,
            applyTime,
            item[4]
          )
          .then(() => {
            const report = `Row ${idx} insert successfully.`;
            insertSuccess += 1;
            logs.push(report);
          })
          .catch(err => {
            if (err) {
              const report = `Row ${idx} insert failed. Error: ${err.detail}`;
              insertFail += 1;
              logs.push(report);
            }
          });
      }
    });

    await Promise.all(result);

    logs.unshift(`Success: ${insertSuccess} rows. Failed: ${insertFail} rows.`);

    logsFile = {
      name: `logs_${moment(new Date()).format('YYYYMMDDHHmmss')}.log`,
      link: path.join(
        __dirname,
        '../../logs',
        `logs_${moment(new Date()).format('YYYYMMDDHHmmss')}.log`
      )
    };

    fse.writeFileSync(logsFile.link, logs.join('\r\n'));

    insertSuccess > 0
      ? res.json({ success: true, logs: { ...logsFile } })
      : res.json({
        success: false,
        error: 'DBへのアップロードが完了しました。',
        logs: { ...logsFile }
      });
  } catch (error) {
    res.json({ success: false, error, logs: { ...logsFile } });
  }
});

module.exports = router;
