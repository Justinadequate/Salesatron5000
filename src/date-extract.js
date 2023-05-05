const { DateTime } = require('luxon');

const DATE_TIME_REGEX = /\b(?<Month>\d{1,2})[-/](?<Day>\d{1,2})[-/]?(?<Year>\d{2,4})?\b|\b(?<Month2>Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[.,]?\s+(?<Day2>\d{1,2}[a-z]{0,2}),?\s+(?<Year2>\d{2,4})?\b|\b(?<Hour>1[012]|[1-9])(?!\/)(?!:(?=1(?!\s)))(?::(?<Minute>\d{2}))?\s?(?<AmPm>am|pm|AM|PM)?\b/gmi;

function extractDate(message) {
  const groomedMessage = groomMessage(message);
  const matches = [...groomedMessage.matchAll(DATE_TIME_REGEX)];

  if (matches.length > 0) {
    const dateTimeInfo = getDateTimeInfoFromRegex(matches);
    
    // look up month, if it's not a number
    if( isNaN(dateTimeInfo.month) ) {
      const index = monthLookup.indexOf(dateTimeInfo.month.toLowerCase().substring(0, 3));
      if( index >= 0 ) {
        dateTimeInfo.month = index + 1;
      } else {
        // current month
        dateTimeInfo.month = DateTime.local().month;
      }
    }

    let dt = DateTime.fromObject({
      year: dateTimeInfo.year,
      month: dateTimeInfo.month,
      day: dateTimeInfo.day.replace("th", "").replace("rd", "").replace("nd", ""), 
      hour: parseInt(dateTimeInfo.hour, 10) + amPmOffset[dateTimeInfo.amPm.toLowerCase()],
      minute: dateTimeInfo.minute,
    }, {zone: 'America/New_York'});

    return dt
  }

  console.log('NO FIND TIME', matches);
  return null;
}

const groomMessage = (message) => {
  message.replace(" 1:1 ", " ");
  return message;
};

const getDateTimeInfoFromRegex = (matches) => {
  console.log(matches);
  return {
    day: matches[0].groups.Day ?? matches[0].groups.Day2,
    month: matches[0].groups.Month ?? matches[0].groups.Month2,
    year: matches[0].groups.Year ?? matches[0].groups.Year2 ?? new Date().getFullYear(),
    hour: matches[1]?.groups.Hour ?? 0,
    minute: matches[1]?.groups.Minute ?? 0,
    amPm: matches[1]?.groups.AmPm || 'am',
  };
};

const monthLookup = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "nov", "dec"];

const amPmOffset = {
  am: 0,
  pm: 12,
};

module.exports = extractDate;