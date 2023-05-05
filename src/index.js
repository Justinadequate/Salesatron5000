require("dotenv").config();
const { App } = require("@slack/bolt");
const { google } = require("googleapis");
const { DateTime } = require('luxon');

const extractDate = require("./date-extract");
const authorize = require("./auth");


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


  return date.toLocaleString(DateTime.DATETIME_FULL);
}

app.message(async ({ message, say }) => {
  try {
    const msg = await handleScheduling(message.text);
    if (msg !== false) {

      // reply to message, in thread only to the user
      await app.client.chat.postMessage({
        token: process.env.SLACK_BOT_TOKEN,
        channel: message.channel,
        text: `I'm on it!  I'll schedule that for you at ${msg}`,
        thread_ts: message.thread_ts ?? message.ts,
        reply_broadcast: false,
      });

      await say(`I'm on it!  I'll schedule that for you at ${msg}`);

      // react to message
      await app.client.reactions.add({
        token: process.env.SLACK_BOT_TOKEN,
        channel: message.channel,
        name: "meow_business",
        timestamp: message.ts,
      });
    }
  } catch (e) {
    say('Something when wrong when making calendar.')
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
