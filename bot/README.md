# Discord Auto-Poster Bot

Listens to a Telegram channel, bypasses shortlinks, and posts clean links + media to Discord. Reports every action to the dashboard API.

## Required environment variables

| Variable | Description |
|---|---|
| `TELEGRAM_API_ID` | Telegram API ID (from my.telegram.org) |
| `TELEGRAM_API_HASH` | Telegram API Hash |
| `TELEGRAM_SESSION` | Telethon session string |
| `DISCORD_BOT_TOKEN` | Discord bot token (from Discord Developer Portal) |
| `DISCORD_CHANNEL_ID` | Target Discord channel ID |
| `BYPASS_API_KEY` | bypass.vip API key |
| `ADMAVEN_API_KEY` | AdMaven API key (optional — disable via dashboard) |

## Optional environment variables

| Variable | Default | Description |
|---|---|---|
| `SOURCE_CHANNEL` | `-1001758598979` | Telegram channel ID to monitor |
| `DISCORD_CHANNEL_ID` | `1513592918101987460` | Discord channel to post into |
| `BYPASS_API_URL` | `https://api.bypass.vip/bypass` | Bypass API endpoint |
| `API_BASE_URL` | `http://localhost:80/api` | Dashboard API base URL |

## Running

Install dependencies:
```bash
pip install -r requirements.txt
```

Run the bot:
```bash
python main.py
```

## How it works

1. Connects to Telegram and watches the source channel for new messages
2. Extracts shortlinks (linkvertise, admaven, etc.)
3. Calls bypass.vip to get the real URL
4. Optionally wraps it with AdMaven content locker
5. Posts the final URL (+ downloaded media if < 8 MB) to Discord
6. Reports every action to the dashboard API so you can monitor it
7. Sends a heartbeat every 30 seconds so the dashboard shows online/offline status
