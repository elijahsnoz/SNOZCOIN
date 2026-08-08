require('dotenv').config();

function int(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

const MINT_ADDRESS = process.env.MINT_ADDRESS || 'Ghy5KXwBbfagjtMx7pTfR7RTfbtTNjuHrVS54q59pump';

module.exports = {
  BOT_TOKEN: process.env.BOT_TOKEN || '',
  MINT_ADDRESS,
  OWNER_IDS: (process.env.BOT_OWNER_IDS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  MODERATION: {
    STRIKE_LIMIT: int('MODERATION_STRIKE_LIMIT', 2),
    MUTE_MINUTES: int('MODERATION_MUTE_MINUTES', 60),
    NEW_MEMBER_WINDOW_SECONDS: int('MODERATION_NEW_MEMBER_WINDOW_SECONDS', 300),
  },

  ALERTS: {
    DIGEST_INTERVAL_HOURS: int('ALERT_DIGEST_INTERVAL_HOURS', 6),
    MOVE_CHECK_MINUTES: int('ALERT_MOVE_CHECK_MINUTES', 10),
    MOVE_THRESHOLD_PERCENT: int('ALERT_MOVE_THRESHOLD_PERCENT', 8),
  },

  LINKS: {
    website: 'https://snozcoin.xyz',
    explorer: `https://explorer.solana.com/address/${MINT_ADDRESS}`,
    solscan: `https://solscan.io/token/${MINT_ADDRESS}`,
    dexscreener: `https://dexscreener.com/solana/${MINT_ADDRESS}`,
    pumpfun: `https://pump.fun/coin/${MINT_ADDRESS}`,
    telegram: 'https://t.me/snoz',
    x: 'https://x.com/snoz',
  },

  ROADMAP: [
    ['Phase 00 — Live', 'Genesis', 'SNOZ character defined, token deployed on Solana, first art studies and memes released.'],
    ['Phase 01 — In progress', 'Culture Build', 'Weekly meme drops, community art contests, first Buttersnoz lore fragments.'],
    ['Phase 02 — Planned', 'Expansion', 'Buttersnoz storyline expands, animated shorts explored, community art highlighted.'],
    ['Phase 03 — Planned', 'Collectibles', 'Collectible SNOZ and Buttersnoz releases, designed with the community.'],
  ],
};
