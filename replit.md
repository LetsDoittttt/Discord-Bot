# Discord Auto-Poster Bot — Project Overview

A Telegram→Discord auto-posting pipeline with a full management dashboard.

## Architecture

```
Telegram channel
      │  (Telethon listener)
      ▼
  bot/main.py          ← Python bot (background worker)
      │  POST /api/logs
      │  POST /api/bot/heartbeat
      ▼
artifacts/api-server   ← Express + Drizzle ORM (shared API)
      │  reads/writes
      ▼
  PostgreSQL DB        ← bot_logs, bot_status, bot_config tables
      ▲  GET /api/*
      │
artifacts/dashboard    ← React + Vite dashboard (/ preview path)
```

## How it works

1. The Python bot (`bot/main.py`) connects to Telegram via Telethon and watches `SOURCE_CHANNEL`
2. When a new message arrives containing a shortlink (linkvertise, admaven, etc.), the bot:
   - Calls **bypass.vip** to resolve the real URL
   - Optionally wraps the result with an **AdMaven** content locker
   - Downloads any attached media if it's under 8 MB (Discord webhook limit)
   - Posts the final link + media to the configured Discord webhook
   - Reports the action to `POST /api/logs` for dashboard tracking
3. The bot also sends a **heartbeat** to `POST /api/bot/heartbeat` every 30 seconds
4. The dashboard shows the bot as **ONLINE** if the last heartbeat was within 2 minutes

## Workflows

| Workflow | Purpose |
|---|---|
| `artifacts/api-server: API Server` | Express REST API — always running |
| `artifacts/dashboard: web` | React dashboard at `/` |
| `Bot: Discord Auto-Poster` | Python bot — start manually after adding secrets |

## Required secrets (add in the Secrets panel)

| Secret | Description |
|---|---|
| `TELEGRAM_API_ID` | From my.telegram.org |
| `TELEGRAM_API_HASH` | From my.telegram.org |
| `TELEGRAM_SESSION` | Telethon StringSession |
| `DISCORD_BOT_TOKEN` | Discord bot token (Discord Developer Portal) |
| `DISCORD_CHANNEL_ID` | Target Discord channel ID |
| `BYPASS_API_KEY` | bypass.vip API key |
| `ADMAVEN_API_KEY` | AdMaven API key (optional) |

## Starting the bot

1. Add the six secrets above in the Secrets panel (⚙️ → Secrets)
2. Start the **Bot: Discord Auto-Poster** workflow from the Workflows panel
3. The dashboard status indicator will flip to **SYS_ONLINE** within 30 seconds

## User preferences

- Dark-mode-first dashboard with dense/cockpit aesthetic
- Bot reports every link action (success/failed/skipped) to the dashboard API
