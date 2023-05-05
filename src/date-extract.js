const DATE_TIME_REGEX = /\b(?<Month>\d{1,2})[-/](?<Day>\d{1,2})[-/]?(?<Year>\d{0,4})\b|\b(?<Month2>Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[.,]?\s+(?<Day2>\d{1,2}[a-z]{0,2}),?\s+(?<Year2>\d{0,4})\b|\b(?<Hour>1[012]|[1-9])(?!\/)(?!:(?=1(?!\s)))(?::(?<Minute>\d{2}))?\s?(?<AmPm>am|pm|AM|PM)?\b/gm;

function extractDate(message) {
  var groomedMessage = groomMessage(message);
  let matches = [...groomedMessage.matchAll(DATE_TIME_REGEX)];

  if (matches.length > 0) {
    var dateTimeInfo = getDateTimeInfoFromRegex(matches);
    var date = new Date(
      dateTimeInfo.year,
      months[dateTimeInfo.month],
      dateTimeInfo.day.replace("th", "").replace("rd", "").replace("nd", ""),
      parseInt(dateTimeInfo.hour) + (amPmOffset[dateTimeInfo.amPm] || 0),
      dateTimeInfo.minute
    );

    // Host is in CDT
    let time = date.getTime();

    // We want to display in EDT, so remove an hour
    time = time - 1000 * 60 * 60 * 1; // remove an hour

    let timeEst = new Date(time);

    console.log("LLLLLLLLLLLl");
    console.log(timeEst.toLocaleTimeString());
    console.log(timeEst.toLocaleDateString());
    console.log(timeEst.toTimeString());
    console.log(timeEst.toUTCString());
    console.log("LLLLLLLLLLLl");
    return timeEst.toTimeString();
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
    year:
      matches[0].groups.Year ?? matches[0].groups.Year2.trim().length === 0
        ? matches[0].groups.Year2
        : new Date().getFullYear(),
    hour: matches[1]?.groups.Hour ?? 0,
    minute: matches[1]?.groups.Minute ?? 0,
    amPm: matches[1]?.groups.AmPm,
  };
};

const months = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
  1: 0,
  2: 1,
  3: 2,
  4: 3,
  5: 4,
  6: 5,
  7: 6,
  8: 7,
  9: 8,
  10: 9,
  11: 10,
  12: 11,
};
const amPmOffset = {
  am: 0,
  pm: 12,
};

module.exports = extractDate;