const { Markup } = require('telegraf');
const { MINT_ADDRESS, LINKS, ROADMAP } = require('./config');
const { getBestPair, formatUsd } = require('./dexscreener');
const { randomArt, randomMeme } = require('./assets');
const { isAdmin } = require('./moderation');
const state = require('./state');

const linkKeyboard = Markup.inlineKeyboard([
  [Markup.button.url('Chart', LINKS.dexscreener), Markup.button.url('pump.fun', LINKS.pumpfun)],
  [Markup.button.url('Solscan', LINKS.solscan), Markup.button.url('Explorer', LINKS.explorer)],
  [Markup.button.url('Website', LINKS.website)],
]);

function register(bot) {
  bot.command('help', (ctx) =>
    ctx.reply(
      [
        '*SNOZ Bot*',
        '',
        '/price — current price, market cap, liquidity',
        '/ca — token mint address (Solana)',
        '/chart — DexScreener chart link',
        '/website — snozcoin.xyz',
        '/art — random piece from the SNOZ gallery',
        '/meme — random SNOZ meme',
        '/roadmap — where SNOZ is headed',
        '/alerts on|off — (admins) toggle price alerts in this chat',
      ].join('\n'),
      { parse_mode: 'Markdown' }
    )
  );

  bot.command(['price', 'p'], async (ctx) => {
    try {
      const pair = await getBestPair();
      if (!pair) {
        return ctx.reply('No live trading pair found for SNOZ yet — check back once it has liquidity.', linkKeyboard);
      }
      const price = Number(pair.priceUsd);
      const change = pair.priceChange?.h24;
      const changeStr =
        change === undefined || change === null ? '—' : `${change >= 0 ? '+' : ''}${Number(change).toFixed(1)}%`;

      state.setLastPrice(price);

      const lines = [
        `*SNOZ* — ${Number.isFinite(price) ? `$${price < 0.01 ? price.toPrecision(3) : price.toFixed(4)}` : '—'}`,
        `24h: ${changeStr}`,
        `Market cap: ${formatUsd(pair.fdv)}`,
        `Liquidity: ${formatUsd(pair.liquidity?.usd)}`,
        `Volume (24h): ${formatUsd(pair.volume?.h24)}`,
      ];
      await ctx.reply(lines.join('\n'), { parse_mode: 'Markdown', ...linkKeyboard });
    } catch (err) {
      await ctx.reply('Could not reach DexScreener right now — try again shortly.');
    }
  });

  bot.command(['ca', 'contract'], (ctx) =>
    ctx.reply(`\`${MINT_ADDRESS}\`\n\nAlways double check this address yourself before trading.`, {
      parse_mode: 'Markdown',
      ...linkKeyboard,
    })
  );

  bot.command('chart', (ctx) => ctx.reply(`📈 ${LINKS.dexscreener}`));
  bot.command('website', (ctx) => ctx.reply(`🌐 ${LINKS.website}`));

  bot.command('roadmap', (ctx) => {
    const text = ROADMAP.map(([phase, title, desc]) => `*${title}* _(${phase})_\n${desc}`).join('\n\n');
    ctx.reply(text, { parse_mode: 'Markdown' });
  });

  bot.command('art', async (ctx) => {
    const { source, caption } = randomArt();
    await ctx.replyWithPhoto({ source }, { caption });
  });

  bot.command('meme', async (ctx) => {
    const { source, caption } = randomMeme();
    await ctx.replyWithPhoto({ source }, { caption });
  });

  bot.command('alerts', async (ctx) => {
    if (ctx.chat.type === 'private') {
      return ctx.reply('Alerts are for groups — add me to your group first.');
    }
    if (!(await isAdmin(ctx))) {
      return ctx.reply('Only group admins can toggle alerts.');
    }
    const arg = ctx.message.text.split(/\s+/)[1]?.toLowerCase();
    if (arg === 'on') {
      state.enableAlerts(ctx.chat.id);
      return ctx.reply('🔔 Price alerts enabled for this chat.');
    }
    if (arg === 'off') {
      state.disableAlerts(ctx.chat.id);
      return ctx.reply('🔕 Price alerts disabled for this chat.');
    }
    return ctx.reply(`Alerts are currently ${state.isAlertsEnabled(ctx.chat.id) ? 'ON' : 'OFF'}. Use /alerts on or /alerts off.`);
  });
}

module.exports = { register };
