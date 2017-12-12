const Excel = require('exceljs');
const express = require('express');
const router = express.Router();
const execBuffer = require('exec-buffer');
const fse = require('fs-extra');
const path = require('path');
const multer = require('multer');
const os = require('os');
const PDFParser = require('pdf2json');
const uuid = require('uuid');
const PDFMerge = require('easy-pdf-merge');

const XLSX = require('xlsx');

var fs = require('fs');
var archiver = require('archiver-promise');

var zipFolder = require('zip-folder');

const HEADER_ROW = 5;
const EMPLOYEE_ID = 5;
const START_FIND_ROW = 7;
const COLUMN_ID = ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"]

const db = require('../db');
const converterPath = path.join(__dirname, '..', 'lib', 'converter.jar');

const upload = multer({ dest: os.tmpdir() }).single('template_file');

router.get('/', async (req, res) => {
  res.render('screen2');
});

router.post('/', upload, async (req, res) => {
  const semester = parseInt(req.body.template_ki_no);
    let file = req.file;
    let workbook = new Excel.Workbook();
    let outWorkBook = new Excel.Workbook();
    var outputCurrentRow = 2;
    const filesInfo = await db.getFileInfoBySemester(semester);
    if(!file.originalname.includes(".xlsx")){
      res.render('screen2',{error:'ファイル形式が正しくありません。再度確認してください。'});
      return;
    }


    // change Lib excel
    var targetColumn = 0;
    let mWorkbook = XLSX.readFile(file.path);
    let mWorksheet = mWorkbook.Sheets('今期実績');
    for(let index = 0;index < COLUMN_ID.length;index ++){
      let headRow = mWorksheet[COLUMN_ID[index] + HEADER_ROW];
      let headRowValue = headRow?headRow.v:undefined;
      if(headRowValue && (headRowValue == (semester+"期") || headRowValue.result == (semester+"期"))){
        targetColumn = index;
      }
    }
    if(targetColumn == 0){
        res.render('screen2',{error:'テンプレートに期が存在しません。'});
        return;
    }
    
    var rowNum;
    var range = XLSX.utils.decode_range(mWorksheet['!ref']);
    for(rowNum = range.s.r; rowNum <= range.e.r; rowNum++){
       let empCell  = mWorksheet[COLUMN_ID[4] + rowNum];
       let employeeId = empCell?empCell.v:undefined;
       
       result.push(row);
   }
    





    
    workbook.xlsx.readFile(file.path).then(async() => {
        
        const ws = workbook.getWorksheet('今期実績');
        var outWS = outWorkBook.addWorksheet('downloadList');
        //write header
        outWS.getRow(1).getCell(1).value = "期";
        outWS.getRow(1).getCell(2).value = "社員番号";
        outWS.getRow(1).getCell(3).value = "提出";
        outWS.getRow(1).getCell(4).value = "枚数";
        if(!ws){
            res.render('screen2',{error:'テンプレートに期が存在しません。'});
            return;
        }
        const headRow = ws.getRow(HEADER_ROW);
        var targetColumn = 0;
        var pdfNumberColumn = 0;
        for(let index = 1; index < 500 ; index ++){
            let headRowValue = headRow.getCell(index).value;
            if(headRowValue && (headRowValue == (semester+"期") || headRowValue.result == (semester+"期"))){
                targetColumn = index;
            }
            if(headRowValue && (headRowValue == "枚数")){
                pdfNumberColumn = index;
                break;
            }
        }
        if(targetColumn == 0){
            res.render('screen2',{error:'テンプレートに期が存在しません。'});
            return;
        }
        const employees = await db.getAllEmployeeInfoBySemester(semester);
        var employeeIdObArray = [];
        var employeeIdRowArray = [];
        var departmentNameArray = [];
        var flag = false;
        var first = true;
        ws.eachRow({ includeEmpty: true }, async (row, rowNumber) => {
          if (rowNumber > START_FIND_ROW) {

              let firstKiNo = row.getCell(targetColumn-1).value;
              let secondKiNo = row.getCell(targetColumn-2).value;
              if(!firstKiNo && !secondKiNo) return;
              let employeeId = row.getCell(EMPLOYEE_ID).value;
              if(!employeeId || isNaN(employeeId)){
                if(flag){
                  employeeIdObArray.push(employeeIdRowArray);
                  employeeIdRowArray = [];
                  flag = false;
                }
                let departmentName = ws.getRow(rowNumber-4).getCell(3).value;
                if(departmentName && departmentName.toString().includes("【")){
                  departmentNameArray.push(departmentName.toString());
                }
                return;
              }
              // employeeIdRowArray.push({rowNumber:rowNumber,employeeId:employeeId});

              flag = true;
              let fileInfo = filesInfo.find(ob => ob.employee_id == employeeId );
              //write new workBook;
              employeeIdRowArray.push({rowNumber:outputCurrentRow,employeeId:employeeId});
              let outRow = outWS.getRow(outputCurrentRow);
              outputCurrentRow++;
              outRow.getCell(1).value = semester.toString();
              outRow.getCell(2).value = employeeId;
              
              if(!employees||employees && !employees.find(ob => ob.employee_id == employeeId)){
                outRow.getCell(3).value = "-";
                // row.getCell(targetColumn).value = "-";
              }else if(fileInfo && parseInt(fileInfo.update_times) > 1){
                outRow.getCell(3).value = "▲";
                // row.getCell(targetColumn).value = "▲";
              }else if(fileInfo && parseInt(fileInfo.update_times) < 2){
                outRow.getCell(3).value = "●";
                // row.getCell(targetColumn).value = "●";
              }else{
                outRow.getCell(3).value = "×";
                // row.getCell(targetColumn).value = "×";
              }
              row.commit();
          }
        });
        for(let ind = 0; ind < employeeIdObArray.length; ind ++){
          let element = employeeIdObArray[ind];
          var employeeIdArray = [];
           element.forEach(empOb => {
              employeeIdArray.push(empOb.employeeId.toString());
           });
          var report = await createReport(semester.toString(),employeeIdArray,departmentNameArray[ind]);
          for(let index = 0; index < employeeIdArray.length ; index ++){
            let empRow = element.find(ob => ob.employeeId == employeeIdArray[index]);
            let numberPdfPage = report.find(ob => ob.empId == employeeIdArray[index]);
            // ws.getRow(empRow.rowNumber).getCell(pdfNumberColumn).value = numberPdfPage?numberPdfPage.pageCount:'0';
            outWS.getRow(empRow.rowNumber).getCell(4).value = numberPdfPage?numberPdfPage.pageCount:'0';

          }
          console.log(report);
        }
        res.writeHead(200, {
            "Content-Type": 'application/vnd.openxmlformats',
            "Content-Disposition": "attachment; filename=" +  "Output.zip"
        });

        outWorkBook.xlsx.writeFile(path.dirname(require.main.filename) +"/subdir/downloadList.xlsx").then(async () =>{
          //  await zipFile();
           await zip();
           rmDir(path.dirname(require.main.filename) +"/subdir");
            var stream = fs.createReadStream(path.dirname(require.main.filename) + "/Output.zip");
            stream.pipe(res);
            // res.download(path.dirname(require.main.filename) + "/example.zip");
        });

        // workbook.xlsx.writeFile(path.dirname(require.main.filename) +"/subdir/report.xlsx").then(async () =>{
        //    await zipFile();
        //     var stream = fs.createReadStream(path.dirname(require.main.filename) + "/example.zip");
        //     stream.pipe(res);
        //     // res.download(path.dirname(require.main.filename) + "/example.zip");
        // });
    });
});


const createReport = async (ki, empIds, bumnonName) => {
  const shokans = await db.findShokan(ki, empIds);
  const fileReport = [];
  const buffers = shokans.map(async item => {
    if (item.file_name && item.file_content) {
      const pdf = await execBuffer({
        input: item.file_content,
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

      const pdfDir = `${os.tmpdir}/${uuid.v4()}.pdf`;
      fse.writeFileSync(pdfDir, pdf);

      const report = {
        empId: item.employee_id,
        pdf: pdfDir
      };

      fileReport.push(report);

      return pdf;
    } else {
      const report = {
        empId: item.employee_id
      };

      fileReport.push(report);
    }
  });

  await Promise.all(buffers);
const fileReportSorted = [];
  empIds.forEach(function(element){
    fileReport.forEach(function(ele){
      if(ele.empId == element){
        fileReportSorted.push(ele);
      }
  })
  })
  const pdfTmpFiles = fileReportSorted.map(f => f.pdf);

  // const pdfBuffer = await mergePDF(pdfTmpFiles,bumnonName);
  await mergePDF(pdfTmpFiles,bumnonName);
  const tasks = fileReportSorted.map(async file => {
    const pageCount = file.pdf ? await getPageCount(file.pdf) : 0;
    file.pageCount = pageCount;
    delete file.pdf;
  });

  await Promise.all(tasks);
  return fileReportSorted;
  // return { pdfBuffer, fileReportSorted };
};

const getPageCount = pdf => {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();

    pdfParser.on('pdfParser_dataReady', pdfData => {
      const pageNumbers =
        pdfData.formImage &&
        pdfData.formImage.Pages &&
        pdfData.formImage.Pages.length;
      resolve(pageNumbers);
    });
    pdfParser.on('pdfParser_dataError', errData => {
      reject(errData);
    });
    pdfParser.loadPDF(pdf);
  });
};

const mergePDF = async (pdfFiles, bumnonName) => {
  const fileDir = path.dirname(require.main.filename)+`/subdir/${bumnonName}.pdf`;
  if(pdfFiles.length == 0){
    return;
  }else if(pdfFiles.length == 1){
    fse.copySync(pdfFiles[0],fileDir);
    return;
  }
  await new Promise((resolve, reject) => {
    PDFMerge(pdfFiles, fileDir, err => {
      if (err) {
        reject(err);
      }else{
        resolve();
      }
    });
  });

  // return new Promise((resolve, reject) => {
  //   fse.readFile(fileDir, (err, buffer) => {
  //     if (err) {
  //       reject(err);
  //     } else {
  //       resolve(buffer);
  //     }
  //   });
  // });
};
// remove dir
const rmDir = function(dirPath) {
      try { var files = fs.readdirSync(dirPath); }
      catch(e) { return; }
      if (files.length > 0)
        for (var i = 0; i < files.length; i++) {
          var filePath = dirPath + '/' + files[i];
          if (fs.statSync(filePath).isFile())
            fs.unlinkSync(filePath);
          else
            rmDir(filePath);
        }
    };

const zip = async () =>{
  await new Promise((resolve,reject) => {
          zipFolder(path.dirname(require.main.filename)+'/subdir',path.dirname(require.main.filename) + '/Output.zip',function(err){
              if(err) {
                  console.log('oh no!', err);
                  reject(err);
              } else {
                  console.log('Zip complete');
                  resolve();
              }
            });
          });
  
}

const zipFile = async () => {
  var output = fs.createWriteStream(path.dirname(require.main.filename) + '/Output.zip');
  var archive = archiver('zip', {
    zlib: { level: 9 } // Sets the compression level.
  });

  output.on('close', function () {
    console.log(archive.pointer() + ' total bytes');
    console.log('archiver has been finalized and the output file descriptor has closed.');
  });
  output.on('end', function () {
    console.log('Data has been drained');
  });
  archive.on('error', function (err) {
    throw err;
  });
  // for (var i = 0; i < fileNames.length; i++) {
  //   archive.file(fileNames[i], { name: fileNames[i] });
  // }
  archive.directory(path.dirname(require.main.filename)+'/subdir/', false);
  archive.pipe(output);
  await archive.finalize();
};

module.exports = router;
