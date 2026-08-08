const { MINT_ADDRESS } = require('./config');

const API_URL = `https://api.dexscreener.com/latest/dex/tokens/${MINT_ADDRESS}`;
const CACHE_MS = 30_000;

let cache = { at: 0, data: null };

/**
 * Returns the highest-liquidity pair for the SNOZ mint, or null if the token
 * has no indexed pairs yet (e.g. not trading / not picked up by DexScreener).
 * Results are cached briefly so bursts of commands don't hammer the API.
 */
async function getBestPair() {
  if (Date.now() - cache.at < CACHE_MS && cache.data) return cache.data;

  const res = await fetch(API_URL, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`DexScreener responded ${res.status}`);
  const json = await res.json();
  const pairs = Array.isArray(json.pairs) ? json.pairs : [];

  const best = pairs.reduce((a, b) => {
    const la = a?.liquidity?.usd || 0;
    const lb = b?.liquidity?.usd || 0;
    return lb > la ? b : a;
  }, null);

  cache = { at: Date.now(), data: best || null };
  return cache.data;
}

function formatUsd(n) {
  if (n === undefined || n === null || Number.isNaN(n)) return '—';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  return `$${n.toPrecision(3)}`;
}

module.exports = { getBestPair, formatUsd };
