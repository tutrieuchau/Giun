const moment = require('moment');

const kiStart = {
  day: 1,
  month: 4,
  year: 1970
};

const date2ki = dateString => {
  const mDate = moment(dateString, 'YYYY-MM-DD');
  if (!mDate.isValid()) return 0;

  const dateArr = [mDate.get('y'), mDate.get('M') + 1, mDate.get('D')];

  let currentKi = 0;
  if (dateArr[2] >= kiStart.day && dateArr[1] >= kiStart.month) {
    currentKi = dateArr[0] - kiStart.year - 1;
  } else {
    currentKi = dateArr[0] - kiStart.year - 2;
  }

  return currentKi;
};

module.exports = date2ki;
