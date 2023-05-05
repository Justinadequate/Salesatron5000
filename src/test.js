const {extractDate, getDateTimeInfoFromRegex} = require('./date-extract');




extractDate('may 11 12 pm');
extractDate('may 1st 2pm')
extractDate('today at 5pm');
extractDate('I NEEDS A DEMO 5/6 11:23 PM');
extractDate('June 3rd 2:12 pm')