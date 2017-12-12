const express = require('express');
const router = express.Router();
const moment = require('moment');
const execBuffer = require('exec-buffer');
const PDFMerge = require('easy-pdf-merge');
const path = require('path');
const fs = require('fs');

const db = require('../db');
const converterPath = path.join(__dirname, '..', 'lib', 'converter.jar');

router.post('/', async (req, res) => {
  try {
    let files = [];
    const empIds = req.body.empIds;
    const emps = await db.search(...req.body.searchData);
    const allTask = emps
      .filter(emp => {
        return emp && empIds.indexOf(emp.id.toString()) !== -1;
      })
      .map(async emp => {
        // const fileConvert = path.join(
        //   __dirname,
        //   '../../pdfs',
        //   `${emp.namae}.pdf`
        // );

        const data = await execBuffer({
          input: emp.fairu,
          bin: 'java',
          args: [
            '-jar',
            converterPath,
            '-i',
            execBuffer.input,
            '-o',
            execBuffer.output,
            '-t',
            'DOCX',
            '-v'
          ]
        });

        return data;

        // return new Promise((resolve, reject) => {
        //   fs.writeFile(fileConvert, data, err => {
        //     if (err) {
        //       reject(err);
        //     } else {
        //       files.push(fileConvert);
        //       resolve();
        //     }
        //   });
        // });
      });

    const buffer = await Promise.all(allTask);

    // await new Promise((resolve, reject) => {
    //   files.length > 1
    //     ? PDFMerge(
    //       files,
    //       path.join(__dirname, '../../pdfs', `report_${moment(new Date()).format('YYYYDDMMHHmmss')}.pdf`),
    //       err => {
    //         if (err) {
    //           reject(new Error(err));
    //         } else {
    //           resolve();
    //         }
    //       }
    //     )
    //     : fs.rename(
    //       files[0],
    //       path.join(__dirname, '../../pdfs', `report_${moment(new Date()).format('YYYYDDMMHHmmss')}.pdf`),
    //       err => {
    //         if (err) {
    //           reject(err);
    //         } else {
    //           resolve();
    //         }
    //       }
    //     );
    // });

    // await new Promise((resolve, reject) => {
    //   files.forEach(f =>
    //     fs.unlink(f, err => {
    //       if (err) {
    //         reject(err);
    //       } else {
    //         resolve();
    //       }
    //     })
    //   );
    // });

    res.json({ success: true, file: buffer });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

module.exports = router;
