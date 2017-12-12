const Excel = require('exceljs');
const db = require('../db');
const fs = require('fs');
const os = require('os');
const express = require('express');
const router = express.Router();
const multer = require('multer');
const HEADER_ROW = 7;
const EMPLOYEE_ID = 4;
const RETURN_FILE_NAME = 'report.xlsx';
const RETURN_FILE_PATH = './report.xlsx';
const TEMPLATE_FILE_FATH = './template.xlsx';

const upload = multer({ dest: os.tmpdir() }).single('template_file');
router.post('/', upload, async (req, res) => {
  const semester = parseInt(req.body.template_ki_no);
  console.log(semester);
  const file = req.file;

  res.render('screen2');

  //   if (semester && file) {
  //     const filesInfo = await db.getFileInfoBySemester(semester);
  //     const workbook = new Excel.Workbook();
  //     workbook.xlsx.readFile(file.path).then(async () => {
  //       const ws = workbook.getWorksheet(1);
  //       const headRow = ws.getRow(HEADER_ROW);
  //       var targetRow = 0;
  //       for (let index = 1; index < 2000; index++) {
  //         if (headRow.getCell(index).value === semester + '期') {
  //           targetRow = index;
  //           break;
  //         }
  //       }
  //       if (targetRow === 0) {
  //         res.render('screen2', { error: '期が無効しました' });
  //       }
  //       const employees = await db.getAllEmployeeInfoBySemester(semester);
  //       ws.eachRow({ includeEmpty: true }, (row, rowNumber) => {
  //         if (rowNumber > 7) {
  //           let employeeId = row.getCell(EMPLOYEE_ID).value;
  //           if (filesInfo) {
  //             let fileInfo = filesInfo.find(ob => ob.employee_id === employeeId);
  //             if (fileInfo && parseInt(fileInfo.update_times) > 1) {
  //               row.getCell(targetRow).value = '▲';
  //             } else if (fileInfo && parseInt(fileInfo.update_times) < 2) {
  //               row.getCell(targetRow).value = '●';
  //             } else if (
  //               employees &&
  //               employees.find(ob => ob.employee_id === employeeId)
  //             ) {
  //               row.getCell(targetRow).value = '×';
  //             } else {
  //               row.getCell(targetRow).value = '-';
  //             }
  //           } else {
  //             row.getCell(targetRow).value = '-';
  //           }
  //           row.commit();
  //         }
  //       });
  //       workbook.xlsx.writeFile(RETURN_FILE_PATH).then(() => {
  //         res.writeHead(200, {
  //           'Content-Type': 'application/octet-stream',
  //           'Content-Disposition': 'attachment; filename=' + RETURN_FILE_NAME
  //         });
  //         fs.createReadStream(RETURN_FILE_PATH).pipe(res);
  //       });
  //     });
  //   } else if (file) {
  //     res.render('screen2', { error: '期がない' });
  //   } else {
  //     res.render('screen2', { error: 'Excelファイルがない' });
  //   }
});
module.exports = router;
