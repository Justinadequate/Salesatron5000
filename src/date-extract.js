const { DateTime } = require("luxon");

const DATE_TIME_REGEX =
  /\b(?<Month>\d{1,2})[-/](?<Day>\d{1,2})[-/]?(?<Year>\d{2,4})?\b|\b(?<Month2>Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[.,]?\s+(?<Day2>\d{1,2}[a-z]{0,2}),?\s+(?<Year2>\d{2,4})?\b|\b(?<Hour>1[012]|[1-9])(?!\/)(?!:(?=1(?!\s)))(?::(?<Minute>\d{2}))?\s?(?<AmPm>am|pm|AM|PM)?\b/gim;

function extractDate(message) {
  const groomedMessage = groomMessage(message);
  const matches = [...groomedMessage.matchAll(DATE_TIME_REGEX)];

  if (matches.length > 0) {
    const dateTimeInfo = getDateTimeInfoFromRegex(matches);

    let dt = DateTime.fromObject(
      {
        year: dateTimeInfo.year,
        month: dateTimeInfo.month,
        day: dateTimeInfo.day,
        hour: parseInt(dateTimeInfo.hour, 10) + amPmOffset[dateTimeInfo.amPm.toLowerCase()],
        minute: dateTimeInfo.minute,
      },
      { zone: "America/New_York" }
    );

    console.log(dt.toLocaleString(DateTime.DATETIME_FULL))
    return dt;
  }

  console.log("NO FIND TIME", matches);
  return null;
}

const groomMessage = (message) => {
  message.replace(" 1:1 ", " ");
  return message;
};

const getDateTimeInfoFromRegex = (matches) => {
  let year = new Date().getFullYear();
  let strYear = matches[0].groups.Year ?? matches[0].groups.Year2;
  try {
    const parsedYear = parseInt(strYear, 10);
    if (parsedYear < 100) year = parsedYear + 2000;
  } catch (e) {
    console.log("ERROR parsing year", e?.message);
  }

  let day = DateTime.local().day;
  let strDay = matches[0].groups.Day ?? matches[0].groups.Day2;
  if (strDay) {
    try {
      day = parseInt(strDay.replace("th", "").replace("rd", "").replace("nd", ""))
    } catch(e) {
      console.log('Error parsing day', e?.message);
    }
  }

  let month = DateTime.local().month;
  let strMonth = matches[0].groups.Month ?? matches[0].groups.Month2 
  if (strMonth) {
    const index = monthLookup.indexOf(strMonth.toLowerCase().substring(0, 3));
    if (index >= 0) {
      month = index + 1;
    } 
  }

  return {
    day,
    month,
    year,
    hour: matches[1]?.groups.Hour ?? 0,
    minute: matches[1]?.groups.Minute ?? 0,
    amPm: matches[1]?.groups.AmPm || "am",
  };
};

const monthLookup = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "nov", "dec"];

const amPmOffset = {
  am: 0,
  pm: 12,
};

module.exports = {
  extractDate,
  getDateTimeInfoFromRegex,
};
