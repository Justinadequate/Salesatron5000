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

  const ires = await calendarApi.events.insert({
    calendarId: calendarId,
    requestBody: {
      summary: "SALES DEMO",
      description: "Yo!  A demo is happening",
      start: {
        dateTime: "2023-05-04T05:00:00-06:00",
      },
      end: {
        dateTime: "2023-05-04T06:00:00-06:00",
      },
    },
  });
}

const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  token: process.env.SLACK_BOT_TOKEN,
  logLevel: "INFO",
  // socketMode: true,
  // appToken: process.env.SLACK_APP_TOKEN,
});

async function handleScheduling(message) {

  if( message.indexOf('schedule') > -1){
    return true;
  }

  var groomedMessage = groomMessage(message);
  let matches = [...groomedMessage.matchAll(regex)];
  var dateTimeInfo = getDateTimeInfoFromRegex(matches);

  return false;
}

app.message(async ({ message, say }) => {
  console.log(message);

  if(await handleScheduling(message.text)) {
    // respond
    say("I'm on it!  I'll schedule that for you.");
  }

  console.log(dateTimeInfo);
});

(async () => {
  // Start the app
  try {
    await app.start(process.env.PORT || 3001);
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
  return {
    day: matches[0].groups.Day ?? matches[0].groups.Day2,
    month: matches[0].groups.Month ?? matches[0].groups.Month2,
    year: matches[0].groups.Year ?? matches[0].groups.Year2 ?? Date().getFullYear(),
    hour: matches[1].groups.Hour,
    minute: matches[1].groups.Minute,
    amPm: matches[1].groups.AmPm
  }
}