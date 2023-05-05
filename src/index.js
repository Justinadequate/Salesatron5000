require("dotenv").config();
const { App } = require("@slack/bolt");

const fs = require("fs").promises;
const path = require("path");
const { authenticate } = require("@google-cloud/local-auth");
const { google } = require("googleapis");
const extractDate = require("./date-extract");

// If modifying these scopes, delete token.json.
const SCOPES = ["https://www.googleapis.com/auth/calendar", "https://www.googleapis.com/auth/calendar.events"];

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
  const date = extractDate(message);

  if (!date) {
    return false;
  }

  // TODO: Schedule event.
  return date;
}

app.message(async ({ message, say }) => {
  try {
    const result = await handleScheduling(message.text);
    if (result !== false) {
      // respond
      console.log("responding");
      say(`I'm on it!  I'll schedule that for you at ${result}`);
    }
    console.log("responded, maybe");
  } catch (e) {
    console.log('COULDN"T Send msag', e);
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
