require('dotenv').config()
const { App } = require('@slack/bolt');

console.log(process.env.SLACK_BOT_TOKEN);
console.log(process.env.SLACK_SIGNING_SECRET);

const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  token: process.env.SLACK_BOT_TOKEN,
  logLevel: 'INFO',
  // socketMode: true,
  // appToken: process.env.SLACK_APP_TOKEN,
});

app.message(async ({message, say}) => {
  console.log(message);
  say('I GOT YO MESSAGE?');
});



(async () => {
  // Start the app
  await app.start(process.env.PORT || 3000);

  console.log('⚡️ Bolt app is running!');
})();