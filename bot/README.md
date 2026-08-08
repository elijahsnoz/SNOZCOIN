# SNOZ Telegram Bot

Community bot for the SNOZ Telegram group: price/info commands, a welcome
message for new members, lightweight anti-scam moderation, and optional
price-move alerts. Built with [Telegraf](https://telegraf.js.org/).

## 1. Create the bot with BotFather

BotFather only talks to you inside Telegram — this part can't be automated.

1. Open Telegram and start a chat with **[@BotFather](https://t.me/BotFather)**.
2. Send `/newbot`.
3. Give it a display name when asked, e.g. `SNOZ`.
4. Give it a username when asked — must end in `bot`, e.g. `SnozCoinBot`.
5. BotFather replies with an **API token** that looks like `123456789:AAExampleTokenHere`. Copy it — that's your `BOT_TOKEN`.
6. Optional but recommended, still talking to BotFather:
   - `/setdescription` — short description shown on the bot's profile.
   - `/setabouttext` — shown in shared contact cards.
   - `/setuserpic` — upload `assets/art/hero.png` from this repo as the bot's avatar.
   - `/setcommands` — paste this list so Telegram shows a command menu:
     ```
     price - current price, market cap, liquidity
     ca - token mint address
     chart - DexScreener chart link
     website - snozcoin.xyz
     art - random SNOZ art
     meme - random SNOZ meme
     roadmap - where SNOZ is headed
     alerts - admins: toggle price alerts in this chat
     help - list commands
     ```
   - `/setjoingroups` → **Enable** so it can be added to your group.
   - `/setprivacy` → **Disable** — the bot needs to see all group messages (not just commands) for the anti-spam filter and welcome messages to work. Privacy mode is BotFather's default and *will* silently break moderation if left on.

## 2. Add it to your group

1. Add the bot to your SNOZ Telegram group like any other member.
2. Promote it to **admin** with at least: *Delete messages* and *Ban/restrict users*. Without these, `/price` etc. still work, but welcome messages and anti-spam moderation can't act (the bot will just quietly skip deleting/muting instead of failing loudly).

## 3. Configure and run

```bash
cd bot
cp .env.example .env
# paste the BotFather token into BOT_TOKEN in .env
npm install
npm start
```

The bot uses long polling (no public URL/webhook needed), so `npm start` on
any always-on machine (a VPS, a Raspberry Pi, a free host like Railway or
Render's background worker tier) is enough. Get your own numeric Telegram ID
from [@userinfobot](https://t.me/userinfobot) if you want to set
`BOT_OWNER_IDS` — that lets you run `/alerts` from a DM or in case Telegram's
admin list ever fails to load.

## What it does

- **`/price` `/ca` `/chart` `/website` `/art` `/meme` `/roadmap` `/help`** —
  live data comes from the [DexScreener](https://docs.dexscreener.com/api/reference)
  public API for the mint in `MINT_ADDRESS` (defaults to the live SNOZ mint).
  If DexScreener has no indexed pair yet, `/price` says so plainly rather than
  showing a stale or fabricated number.
- **Welcome message** — posted whenever someone joins, with a short scam
  warning baked in (admins never DM first, never ask for a seed phrase).
- **Anti-spam/anti-scam** — deletes messages matching common raid patterns
  (seed-phrase phishing phrases, `t.me/joinchat` invite-link floods, a brand
  new member's first message containing a link). Repeat offenders get muted
  for `MODERATION_MUTE_MINUTES` (default 60). This is a heuristic, not a
  guarantee — tune the word list in `src/moderation.js` as new scam patterns
  show up, and expect occasional false positives on legitimate links.
- **Price alerts** — admins run `/alerts on` in a group to opt it into a
  periodic price digest (`ALERT_DIGEST_INTERVAL_HOURS`) and move alerts when
  price swings past `ALERT_MOVE_THRESHOLD_PERCENT` within a
  `ALERT_MOVE_CHECK_MINUTES` window. `/alerts off` opts back out.

## Notes / limitations

- State (which chats have alerts on, last seen price) is a single JSON file
  at `bot/data/state.json`, not a database. Fine for one bot instance; if you
  ever run more than one replica they'll clobber each other's state.
- Moderation strikes and join timestamps live in memory only and reset on
  restart — acceptable for a community bot, not for anything security-critical.
- Nothing here handles wallet connections, payments, or trading — it's an
  info/moderation bot only.
