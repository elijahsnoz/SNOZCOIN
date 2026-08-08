const { Telegraf } = require('telegraf');
const { BOT_TOKEN } = require('./config');
const commands = require('./commands');
const welcome = require('./welcome');
const moderation = require('./moderation');
const alerts = require('./alerts');

if (!BOT_TOKEN) {
  console.error('Missing BOT_TOKEN. Copy bot/.env.example to bot/.env and fill it in — see bot/README.md.');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

commands.register(bot);
welcome.register(bot);
alerts.register(bot);

// Anti-spam runs after commands so slash commands are never treated as spam.
bot.on('text', moderation.handleText);

bot.catch((err, ctx) => {
  console.error(`Unhandled error for update ${ctx.updateType}:`, err);
});

let launched = false;
bot
  .launch()
  .then(() => {
    launched = true;
    console.log('SNOZ bot is running.');
  })
  .catch((err) => {
    console.error('Failed to launch bot — check that BOT_TOKEN is valid:', err.message);
    process.exit(1);
  });

const shutdown = (signal) => {
  if (launched) bot.stop(signal);
  process.exit(0);
};
process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));
