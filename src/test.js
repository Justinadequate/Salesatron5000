const {extractDate, getDateTimeInfoFromRegex} = require('./date-extract');
const { DateTime } = require("luxon");


const validString = [
// 'may 11 12 pm',
// 'may 1st 2pm',
'today at 5pm',
// 'I NEEDS A DEMO 5/6 11:23 PM',
// 'June 3rd 2:12 pm',
// '2:43pm',
// 'Discovery Call scheduled with [REDACTED] - Director of Provider Data Management & Referral Services at [REDACTED] on 6/3 for Referral Management discussion'
];

validString.forEach(s => {
  console.log(`${s} => ${extractDate(s).toLocaleString(DateTime.DATETIME_FULL)}`)
})


// extractDate('may 11 12 pm');
// extractDate('may 1st 2pm')
// extractDate('today at 5pm');
// extractDate('I NEEDS A DEMO 5/6 11:23 PM');
// extractDate('June 3rd 2:12 pm')
// extractDate('2:43pm')