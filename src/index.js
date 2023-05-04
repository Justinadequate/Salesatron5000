require("dotenv").config();
const { App } = require("@slack/bolt");

const fs = require("fs").promises;
const path = require("path");
const { authenticate } = require("@google-cloud/local-auth");
const { google } = require("googleapis");

const regex = /\b(?<Month>\d{1,2})[-/](?<Day>\d{1,2})[-/]?(?<Year>\d{0,4})\b|\b(?<Month2>Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[.,]?\s+(?<Day2>\d{1,2}[a-z]{0,2}),?\s+(?<Year2>\d{0,4})\b|\b(?<Hour>1[012]|[1-9])(?!\/)(?!:(?=1(?!\s)))(?::(?<Minute>\d{2}))?\s?(?<AmPm>am|pm|AM|PM)?\b/gm;

// If modifying these scopes, delete token.json.
const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
];

// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), "token.json");
const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file compatible with GoogleAUth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: "authorized_user",
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

/**
 * Lists the next 10 events on the user's primary calendar.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
async function listEvents(auth) {
  const calendarApi = google.calendar({ version: "v3", auth });
  const calendarId = "c_f4bad3838ed561bf803618c1fa21c36bee072eba934ef29b3fb12e80ec2aec17@group.calendar.google.com";
  
  // Create calendar
  
  const res = await calendarApi.calendars.get({
    calendarId: calendarId,
  });
  console.log(res.data);

  // const ires = await calendarApi.events.insert({
  //   calendarId: calendarId,
  //   requestBody: {
  //     summary: "SALES DEMO",
  //     description: "Yo!  A demo is happening",
  //     start: {
  //       dateTime: "2023-05-04T05:00:00-06:00",
  //     },
  //     end: {
  //       dateTime: "2023-05-04T06:00:00-06:00",
  //     },
  //   },
  // });
}

const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  token: process.env.SLACK_BOT_TOKEN,
  logLevel: "INFO",
});

async function handleScheduling(message) {

  // if( message.indexOf('schedule') > -1){
  //   return true;
  // }

  var groomedMessage = groomMessage(message);
  let matches = [...groomedMessage.matchAll(regex)];

  if (matches.length > 0) {
    var dateTimeInfo = getDateTimeInfoFromRegex(matches);
    console.log(dateTimeInfo);
    var date = new Date(
      dateTimeInfo.year,
      months[dateTimeInfo.month],
      dateTimeInfo.day.replace('th', '').replace('rd', '').replace('nd', ''),
      parseInt(dateTimeInfo.hour) + (amPmOffset[dateTimeInfo.amPm] || 0),
      dateTimeInfo.minute
    );

    // Host is in CDT
    let time = date.getTime();

    // We want to display in EDT, so remove an hour
    time = time - (1000*60*60*1) // remove an hour 

    let timeEst = new Date(time) ;

    console.log('LLLLLLLLLLLl');
    console.log(timeEst.toLocaleTimeString());
    console.log(timeEst.toLocaleDateString());
    console.log(timeEst.toTimeString());
    console.log(timeEst.toUTCString());
    console.log('LLLLLLLLLLLl');
    return timeEst.toTimeString();
  }
  console.log('NO FIND TIME', matches);

  return false;
}

app.message(async ({ message, say }) => {
  try {
    const messageSent = await handleScheduling(message.text);
    if(messageSent !== false) {
      // respond
      console.log('responding')
      say(`I'm on it!  I'll schedule that for you at ${messageSent}`);
    }
    console.log('responded, maybe')
  } catch (e) {
    console.log('COULDN"T Send msag', e)
  }
});

(async () => {
  // Start the app
  try {
    await app.start(process.env.PORT || 3000);
    const auth = await authorize();
    listEvents(auth);
  } catch (e) {
    console.error(e);
  }

  console.log("⚡️ Bolt app is running!");
})();

let groomMessage = (message) => {
  message.replace(' 1:1 ', ' ');
  return message
}

let getDateTimeInfoFromRegex = (matches) => {
  console.log(matches)
  return {
    day: matches[0].groups.Day ?? matches[0].groups.Day2,
    month: matches[0].groups.Month ?? matches[0].groups.Month2,
    year: matches[0].groups.Year ?? matches[0].groups.Year2.trim().length === 0
    	?matches[0].groups.Year2
    	:new Date().getFullYear(),
    hour: matches[1]?.groups.Hour ?? 0,
    minute: matches[1]?.groups.Minute ?? 0,
    amPm: matches[1]?.groups.AmPm 
  }
}

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
  12: 11
}
const amPmOffset = {
	am: 0,
  pm: 12
}