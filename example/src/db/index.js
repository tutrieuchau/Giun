const promise = require('bluebird');

const DB_URL = 'postgres://postgres:123@localhost:5432/mail';

const options = {
  promiseLib: promise
};

const pgp = require('pg-promise')(options);
const db = pgp(DB_URL);

const getAllShokanMst = () => {
  const sql = `SELECT * FROM shokan_mst`;

  return db.manyOrNone(sql);
};

const insertShokanMst = (
  ki,
  employeeId,
  applyEmail,
  fileName,
  fileContent,
  applyDate,
  applyTime,
  updateTimes
) => {
  const params = [
    ki,
    employeeId,
    applyEmail,
    fileName,
    fileContent,
    applyDate,
    applyTime,
    updateTimes
  ];
  const sql = `INSERT INTO shokan_mst(ki_no, employee_id, apply_email, file_name, file_content, apply_date, apply_time, update_times)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`;

  return db.any(sql, params);
};

const updateShokanMst = (
  ki,
  employeeId,
  fileName,
  fileContent,
  applyDate,
  applyTime,
  updateTimes
) => {
  const params = [
    ki,
    employeeId,
    fileName,
    fileContent,
    applyDate,
    applyTime,
    updateTimes
  ];
  const sql = `UPDATE shokan_mst 
              SET (file_name, file_content, apply_date, apply_time, update_times) = ($3, $4, $5, $6, $7)
              WHERE ki_no = $1 AND employee_id = $2`;

  return db.any(sql, params);
};

const insertEmp = (ki, employeeId, employeeName, email) => {
  const params = [ki, employeeId, employeeName, email];
  const sql = `INSERT INTO shain_mst(ki_no, employee_id, employee_name, email) VALUES ($1, $2, $3, $4)`;

  return db.any(sql, params);
};

const findEmpIdByEmail = email => {
  const sql = `SELECT DISTINCT employee_id AS id FROM shain_mst WHERE email = $1 AND delete_flg = '0'`;

  return db.any(sql, email);
};

const findAllShokan = () => {
  const sql = `SELECT sosiki_mst.ki_no, sosiki_mst.employee_id, apply_email, file_name, file_content, apply_date, apply_time, update_times, organize_id, organize_name, display_order1, display_order2
              FROM shokan_mst 
                              INNER JOIN sosiki_mst ON shokan_mst.ki_no = sosiki_mst.ki_no 
                                                    AND shokan_mst.employee_id = sosiki_mst.employee_id
              WHERE sosiki_mst.delete_flg = '0' AND shokan_mst.delete_flg = '0'
              ORDER BY sosiki_mst.ki_no`;

  return db.manyOrNone(sql);
};

const findShokan = (ki, empIds) => {
  const sql = `SELECT shain_mst.ki_no, shain_mst.employee_id, apply_email, file_name, file_content, apply_date, apply_time, update_times
              FROM shokan_mst 
                              INNER JOIN shain_mst ON shokan_mst.ki_no = shain_mst.ki_no 
                                                    AND shokan_mst.employee_id = shain_mst.employee_id
              WHERE shain_mst.ki_no = $1 AND shain_mst.employee_id = ANY('{${empIds.join(
    ','
  )}}'::varchar[]) AND shain_mst.delete_flg = '0' AND shokan_mst.delete_flg = '0'`;

  return db.manyOrNone(sql, ki);
};

const getAllKiSosiki = () => {
  const sql = `SELECT DISTINCT ki_no as ki from sosiki_mst ORDER BY ki_no ASC`;

  return db.manyOrNone(sql);
};
/** Get All Information */
const getExcelInfo = () => {
  const sql =
    'SELECT sosiki_mst.organize_id,sosiki_mst.organize_name,shain_mst.employee_id,shain_mst.employee_name,shain_mst.ki_no as start_ki_no,shokan_mst.ki_no as upload_ki_no,shokan_mst.update_times' +
    'FROM sosiki_mst,shokan_mst,shain_mst WHERE sosiki_mst.organize_id = shain_mst.organize_id AND shokan_mst.employee_id = shain_mst.employee_id' +
    'ORDER BY sosiki_mst.display_order1,shain_mst.department,shain_mst.position,shokan_mst.employee_id';
  return db.any(sql);
};
const getFileInfoBySemester = kiNo => {
  const sql =
    "SELECT employee_id,update_times FROM shokan_mst WHERE ki_no = '$1' AND delete_flg = '0' ORDER BY employee_id";
  return db.any(sql, kiNo);
};
const getAllEmployeeInfoBySemester = semester => {
  const sql =
    "SELECT employee_id FROM shain_mst WHERE cast(ki_no as INTEGER) <= $1 AND delete_flg = '0'";
  return db.any(sql, semester);
};

module.exports = {
  getAllShokanMst,
  insertShokanMst,
  updateShokanMst,
  insertEmp,
  findEmpIdByEmail,
  findAllShokan,
  findShokan,
  getAllKiSosiki,
  getExcelInfo,
  getFileInfoBySemester,
  getAllEmployeeInfoBySemester
};
