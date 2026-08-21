const cron = require('node-cron');
const { ALERTS } = require('./config');
const { getBestPair, formatUsd } = require('./dexscreener');
const state = require('./state');

async function broadcast(bot, text) {
  for (const chatId of state.getAlertChats()) {
    try {
      await bot.telegram.sendMessage(chatId, text, { parse_mode: 'Markdown' });
    } catch {
      // chat may have removed the bot — ignore and continue with the rest
    }
  }
}

function priceLine(pair) {
  const price = Number(pair.priceUsd);
  const priceStr = Number.isFinite(price) ? `$${price < 0.01 ? price.toPrecision(3) : price.toFixed(4)}` : '—';
  return `*SNOZ* — ${priceStr} · MC ${formatUsd(pair.fdv)} · Liq ${formatUsd(pair.liquidity?.usd)}`;
}

function register(bot) {
  if (ALERTS.DIGEST_INTERVAL_HOURS > 0) {
    // node-cron has no native "every N hours" shorthand beyond 23, so build the expression
    const hours = Math.min(23, Math.max(1, ALERTS.DIGEST_INTERVAL_HOURS));
    cron.schedule(`0 */${hours} * * *`, async () => {
      if (state.getAlertChats().length === 0) return;
      try {
        const pair = await getBestPair();
        if (!pair) return;
        await broadcast(bot, `📊 Price update\n${priceLine(pair)}`);
      } catch {
        // skip this tick, try again next interval
      }
    });
  }

  if (ALERTS.MOVE_CHECK_MINUTES > 0) {
    cron.schedule(`*/${ALERTS.MOVE_CHECK_MINUTES} * * * *`, async () => {
      if (state.getAlertChats().length === 0) return;
      try {
        const pair = await getBestPair();
        if (!pair) return;
        const price = Number(pair.priceUsd);
        const last = state.getLastPrice();
        state.setLastPrice(price);
        if (!last || !Number.isFinite(price)) return;

        const changePercent = ((price - last) / last) * 100;
        if (Math.abs(changePercent) >= ALERTS.MOVE_THRESHOLD_PERCENT) {
          const emoji = changePercent >= 0 ? '🚀' : '📉';
          await broadcast(
            bot,
            `${emoji} SNOZ moved ${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(1)}% \n${priceLine(pair)}`
          );
        }
      } catch {
        // skip this tick, try again next interval
      }
    });
  }
}

module.exports = { register };
