const { LINKS } = require('./config');
const { recordJoin } = require('./moderation');

function register(bot) {
  bot.on('new_chat_members', async (ctx) => {
    for (const member of ctx.message.new_chat_members) {
      if (member.is_bot) continue;
      recordJoin(ctx.chat.id, member.id);

      const name = member.first_name || member.username || 'friend';
      await ctx.reply(
        [
          `👋 Welcome to SNOZ, ${name}.`,
          '',
          'This is an art universe, meme culture and community by Elijah Snoz — the token just carries it on-chain.',
          '',
          `🌐 ${LINKS.website}`,
          '',
          'A couple of house rules: admins never DM you first, we never ask for your seed phrase, and any "support" account sliding into your DMs is a scammer. Try /help for bot commands.',
        ].join('\n')
      );
    }
  });
}

module.exports = { register };
