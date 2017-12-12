const express = require('express');
const router = express.Router();
const multer = require('multer');
const os = require('os');
const XLSX = require('xlsx');
const fse = require('fs-extra');
const path = require('path');
const moment = require('moment');

const db = require('../db');

const upload = multer({ dest: os.tmpdir() }).single('emp_file');

router.post('/', upload, async (req, res) => {
  const logs = [];
  let logsFile;
  try {
    let insertSuccess = 0;
    let insertFail = 0;
    if (req.file !== undefined) {
      const wb = XLSX.readFile(req.file.path);
      const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {
        header: 1,
        blankrows: false
      });

      if (data.length === 0) {
        return res.json({ success: false, error: 'Invalid' });
      }

      const empKi = req.body.emp_ki;

      const result = data.map(async (item, idx) => {
        if (idx > 0) {
          if (!item[0] || !item[1] || !item[3] || !item[5]) {
            const report = 'Data not valid.';
            insertFail += 1;
            logs.push(report);
            return;
          }

          return db
            .insertEmp(
              empKi,
              item[0].trim(),
              `${item[1].trim()} ${item[3].trim()}`,
              item[5].trim()
            )
            .then(() => {
              const report = `Employee with id: ${item[0].trim()} insert successfully.`;
              insertSuccess += 1;
              logs.push(report);
            })
            .catch(err => {
              if (err) {
                const report = `Employee with id: ${item[0].trim()}  insert failed. Error: ${
                  err.detail
                }`;
                insertFail += 1;
                logs.push(report);
              }
            });
        }
      });

      await Promise.all(result);

      logs.unshift(
        `Insert success: ${insertSuccess} rows. Insert failed: ${insertFail} rows.`
      );

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
    } else {
      res.json({
        success: false,
        error: 'アップロードが失敗しました。',
        logs: { ...logsFile }
      });
    }
  } catch (error) {
    res.json({ success: false, error: error.message, logs: { ...logsFile } });
  }
});

module.exports = router;
