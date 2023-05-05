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

  // List events
  const res2 = await calendarApi.events.list({
    calendarId: calendarId,
    timeMin: new Date().toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: "startTime",
  });

  const events = res2.data.items;
  if (events.length) {
    console.log("Upcoming 10 events:");
    
    console.log(events);

    return events.map((event, i) => {
      const start = event.start.dateTime || event.start.date;
      console.log(`${start} - ${event.description}`);
      return {
        start: start,
        description: event.description,
        permaLink: event.htmlLink,
      };
    });
  }

  return [];
}

const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  token: process.env.SLACK_BOT_TOKEN,
  logLevel: "INFO",
});

async function handleScheduling(message) {
  const calendarId = "c_f4bad3838ed561bf803618c1fa21c36bee072eba934ef29b3fb12e80ec2aec17@group.calendar.google.com";

  const date = extractDate(message.text);

  if (!date) {
    return false;
  }


  // get message permalink
  const permalink = await app.client.chat.getPermalink({
    token: process.env.SLACK_BOT_TOKEN,
    channel: message.channel,
    message_ts: message.ts,
  });

  const auth = await authorize();
  const calendarApi = google.calendar({ version: "v3", auth });

  console.log('DATE', date);
  console.log('DATE ISO', date.toISO());

  // TODO: Schedule event.
  const res = await calendarApi.events.insert({
    calendarId: calendarId,
    requestBody: {
      summary: "SALES DEMO",
      description: `Yo!  A demo is happening.\n${message.text}\n${permalink.permalink}`,
      start: {
        dateTime: date.toISO(),
      },
      end: {
        dateTime: date.plus({ hours: 1 }).toISO(),
      },
    },
  });


  return date.toLocaleString(DateTime.DATETIME_FULL);
}

app.message(async ({ message, say }) => {
  console.log(message);
  if(message.subtype !== undefined) {
    return;
  }

  if(message.bot_id !== undefined || message.subtype === 'bot_message') {
    console.log("Ignoring bot message");
    return;
  } 

  try {
    const msg = await handleScheduling(message);
    if (msg !== false) {

      // reply to message, in thread only to the user
      await app.client.chat.postEphemeral({
        token: process.env.SLACK_BOT_TOKEN,
        channel: message.channel,
        user: message.user,
        text: `I'm on it!  I'll schedule that for you at ${msg}`,
        //thread_ts: message.thread_ts ?? message.ts,
      });

      // react to message
      
      await app.client.reactions.add({
        token: process.env.SLACK_BOT_TOKEN,
        channel: message.channel,
        name: "meow_business",
        timestamp: message.ts,
      });
    }
  } catch (e) {
    say(`Something when wrong when making calendar. ${e}`);
    console.log('COULDN"T Send message', e);
  }
});

// demos command
app.command("/demos", async ({ command, ack, say }) => {
  // Acknowledge command request
  
  await ack();

  let blocks = [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "*Upcoming Demos*"
        }
      },
      {
        "type": "divider"
      }
  ];

  // add events as sections
  const upcomingEvents = await listEvents(await authorize());
  console.log(upcomingEvents);
  if (upcomingEvents.length > 0) {
    upcomingEvents.forEach((event) => {
      const startTime = DateTime.fromISO(event.start).toLocaleString(DateTime.DATE_FULL);
      blocks.push({
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `*${startTime}* - ${event.description}`
        },
        "accessory": {
          "type": "button",
          "text": {
            "type": "plain_text",
            "emoji": true,
            "text": "Event Link",
          },
          "value": "click_me_123",
          "url": event.permaLink,
          "action_id": "button-action"
        }
      });
    });
  } else {
    blocks.push({
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "There are no upcoming demos."
      }
    });
  }

  await app.client.chat.postEphemeral({
    token: process.env.SLACK_BOT_TOKEN,
    channel: command.channel_id,
    user: command.user_id,
    blocks: blocks
  });
});

app.action('button-action', async ({ body, ack, say }) => {
  // Acknowledge the action
  await ack();
  console.log(body);
});

(async () => {
  // Start the app
  try {
    await app.start(process.env.PORT || 3000);
    const auth = await authorize();
    console.log(await listEvents(auth));
  } catch (e) {
    console.error(e);
  }

  console.log("⚡️ Bolt app is running!");
})();
