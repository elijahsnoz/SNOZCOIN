const { MODERATION, OWNER_IDS } = require('./config');

// Per-chat join timestamps: `${chatId}:${userId}` -> ms epoch
const joinedAt = new Map();
// Per-chat strike counts: `${chatId}:${userId}` -> count
const strikes = new Map();
// Short-lived admin id cache per chat: chatId -> { at, ids: Set }
const adminCache = new Map();
const ADMIN_CACHE_MS = 5 * 60_000;

const INVITE_LINK_RE = /t\.me\/(joinchat|\+)/i;
const URL_RE = /(https?:\/\/|www\.)\S+/i;
const SCAM_PHRASES = [
  /seed phrase/i,
  /private key/i,
  /wallet.{0,15}(drain|verify|connect).{0,15}(claim|airdrop)/i,
  /\bairdrop\b.{0,20}\bclaim\b/i,
  /dm (me|us) for (support|help)/i,
  /customer support/i,
  /free (sol|snoz|tokens?)\b/i,
];

function key(chatId, userId) {
  return `${chatId}:${userId}`;
}

function recordJoin(chatId, userId) {
  joinedAt.set(key(chatId, userId), Date.now());
}

function isRecentJoiner(chatId, userId) {
  const t = joinedAt.get(key(chatId, userId));
  if (!t) return false;
  return (Date.now() - t) / 1000 <= MODERATION.NEW_MEMBER_WINDOW_SECONDS;
}

async function isAdmin(ctx) {
  const userId = String(ctx.from?.id);
  if (OWNER_IDS.includes(userId)) return true;
  if (!ctx.chat || ctx.chat.type === 'private') return true;

  const cached = adminCache.get(ctx.chat.id);
  if (cached && Date.now() - cached.at < ADMIN_CACHE_MS) {
    return cached.ids.has(ctx.from.id);
  }

  try {
    const admins = await ctx.telegram.getChatAdministrators(ctx.chat.id);
    const ids = new Set(admins.map((a) => a.user.id));
    adminCache.set(ctx.chat.id, { at: Date.now(), ids });
    return ids.has(ctx.from.id);
  } catch {
    // If we can't check (e.g. missing permission), fail open for admin-gated
    // commands rather than silently locking everyone out.
    return false;
  }
}

/**
 * Heuristic scam/spam classification for a text message. Not a guarantee —
 * crypto group scams evolve constantly, so this catches the common raid
 * patterns (impersonation DMs, invite-link floods, seed-phrase phishing)
 * without pretending to be a complete solution.
 */
function classify(text, { recentJoiner }) {
  if (!text) return null;
  const hasLink = URL_RE.test(text) || INVITE_LINK_RE.test(text);
  const hasScamPhrase = SCAM_PHRASES.some((re) => re.test(text));

  if (hasScamPhrase) return 'scam_phrase';
  if (INVITE_LINK_RE.test(text)) return 'invite_link';
  if (recentJoiner && hasLink) return 'new_member_link';
  return null;
}

async function handleText(ctx) {
  const text = ctx.message?.text || ctx.message?.caption;
  if (!text || !ctx.chat || ctx.chat.type === 'private') return;

  if (await isAdmin(ctx)) return;

  const reason = classify(text, {
    recentJoiner: isRecentJoiner(ctx.chat.id, ctx.from.id),
  });
  if (!reason) return;

  try {
    await ctx.deleteMessage();
  } catch {
    // bot may lack delete rights — nothing more we can do here
  }

  const k = key(ctx.chat.id, ctx.from.id);
  const count = (strikes.get(k) || 0) + 1;
  strikes.set(k, count);

  const name = ctx.from.first_name || ctx.from.username || 'that user';

  if (count >= MODERATION.STRIKE_LIMIT) {
    try {
      await ctx.telegram.restrictChatMember(ctx.chat.id, ctx.from.id, {
        permissions: { can_send_messages: false },
        until_date: Math.floor(Date.now() / 1000) + MODERATION.MUTE_MINUTES * 60,
      });
      await ctx.reply(
        `🔇 Muted ${name} for ${MODERATION.MUTE_MINUTES}m after repeated suspicious messages (${reason}).`
      );
    } catch {
      await ctx.reply(`⚠️ Flagged a suspicious message from ${name} (${reason}) — I need admin rights to mute.`);
    }
    strikes.delete(k);
  } else {
    await ctx.reply(
      `⚠️ Removed a suspicious message from ${name} (${reason}). Reminder: SNOZ admins never DM first or ask for your seed phrase.`
    );
  }
}

module.exports = { recordJoin, isAdmin, handleText };
