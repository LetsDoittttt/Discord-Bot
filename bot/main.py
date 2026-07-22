"""
Discord Auto-Poster Bot
Scrapes links from Telegram source channel,
bypasses them, then posts link + media to Discord.
Reports activity to the dashboard API.
"""

import asyncio
import re
import os
import logging
import aiohttp
import discord
from datetime import datetime, timezone
from telethon import TelegramClient, events
from telethon.sessions import StringSession

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger(__name__)

# ── CONFIG ─────────────────────────────────────────────────────────────────────
TELEGRAM_API_ID       = int(os.environ.get("TELEGRAM_API_ID", "0"))
TELEGRAM_API_HASH     = os.environ.get("TELEGRAM_API_HASH", "")
TELEGRAM_SESSION      = os.environ.get("TELEGRAM_SESSION", "")

DISCORD_BOT_TOKEN     = os.environ.get("DISCORD_BOT_TOKEN", "")
DISCORD_CHANNEL_ID    = int(os.environ.get("DISCORD_CHANNEL_ID", "1513592918101987460"))

SOURCE_CHANNEL        = int(os.environ.get("SOURCE_CHANNEL", "-1001758598979"))

BYPASS_API_URL        = os.environ.get("BYPASS_API_URL", "https://api.bypass.vip/bypass")
BYPASS_API_KEY        = os.environ.get("BYPASS_API_KEY", "")
ADMAVEN_API_KEY       = os.environ.get("ADMAVEN_API_KEY", "")

# Internal dashboard API URL
API_BASE_URL          = os.environ.get("API_BASE_URL", "http://localhost:80/api")

# ── LINK DETECTION ─────────────────────────────────────────────────────────────
LINK_PATTERNS = [
    re.compile(r"https?://linkvertise\.com/\S+", re.IGNORECASE),
    re.compile(r"https?://link-to\.net/\S+", re.IGNORECASE),
    re.compile(r"https?://up-to-down\.net/\S+", re.IGNORECASE),
    re.compile(r"https?://direct-link\.net/\S+", re.IGNORECASE),
    re.compile(r"https?://link-target\.net/\S+", re.IGNORECASE),
    re.compile(r"https?://link-center\.net/\S+", re.IGNORECASE),
    re.compile(r"https?://admaven\.com/\S+", re.IGNORECASE),
]

def extract_link(text: str):
    for pattern in LINK_PATTERNS:
        match = pattern.search(text or "")
        if match:
            return match.group(0)
    return None

# ── BYPASS ─────────────────────────────────────────────────────────────────────
async def bypass_link(session: aiohttp.ClientSession, url: str):
    try:
        params = {"url": url}
        headers = {"x-api-key": BYPASS_API_KEY} if BYPASS_API_KEY else {}
        async with session.get(BYPASS_API_URL, params=params, headers=headers, timeout=aiohttp.ClientTimeout(total=20)) as resp:
            if resp.status != 200:
                return None
            data = await resp.json()
            return data.get("result") or data.get("url") or data.get("bypassed")
    except Exception as e:
        log.error("Bypass error: %s", e)
        return None

# ── ADMAVEN ────────────────────────────────────────────────────────────────────
async def admaven_wrap(session: aiohttp.ClientSession, url: str):
    if not ADMAVEN_API_KEY:
        return None
    try:
        async with session.post(
            "https://publishers.ad-maven.com/api/public/content_locker",
            headers={"Authorization": f"Bearer {ADMAVEN_API_KEY}", "Content-Type": "application/json"},
            json={"title": "Content", "url": url},
            timeout=aiohttp.ClientTimeout(total=20)
        ) as resp:
            if resp.status != 200:
                return None
            data = await resp.json()
            msg = data.get("message", {})
            if isinstance(msg, list) and msg:
                return msg[0].get("full_short")
            if isinstance(msg, dict):
                return msg.get("desturl") or msg.get("url") or msg.get("full_short")
            return None
    except Exception as e:
        log.error("AdMaven error: %s", e)
        return None

# ── DISCORD CLIENT ─────────────────────────────────────────────────────────────
intents = discord.Intents.default()
discord_client = discord.Client(intents=intents)

# ── REPORT TO DASHBOARD ────────────────────────────────────────────────────────
async def report_log(
    session: aiohttp.ClientSession,
    original_url: str,
    status: str,
    bypassed_url: str | None = None,
    final_url: str | None = None,
    had_media: bool = False,
    level: str = "info",
    message: str | None = None,
):
    try:
        payload = {
            "originalUrl": original_url,
            "status": status,
            "level": level,
            "hadMedia": had_media,
        }
        if bypassed_url:
            payload["bypassedUrl"] = bypassed_url
        if final_url:
            payload["finalUrl"] = final_url
        if message:
            payload["message"] = message

        async with session.post(
            f"{API_BASE_URL}/logs",
            json=payload,
            timeout=aiohttp.ClientTimeout(total=5),
        ) as resp:
            if resp.status not in (200, 201):
                log.warning("Dashboard log report failed: %s", resp.status)
    except Exception as e:
        log.warning("Could not report to dashboard: %s", e)

# ── HEARTBEAT ─────────────────────────────────────────────────────────────────
async def heartbeat_loop(session: aiohttp.ClientSession, started_at: str):
    while True:
        try:
            async with session.post(
                f"{API_BASE_URL}/bot/heartbeat",
                json={"startedAt": started_at},
                timeout=aiohttp.ClientTimeout(total=5),
            ) as resp:
                if resp.status == 200:
                    log.debug("Heartbeat sent")
                else:
                    log.warning("Heartbeat failed: %s", resp.status)
        except Exception as e:
            log.warning("Heartbeat error: %s", e)
        await asyncio.sleep(30)

# ── PROCESS MESSAGE ────────────────────────────────────────────────────────────
async def process_message(tg_client: TelegramClient, http: aiohttp.ClientSession, message):
    text = message.text or message.caption or ""
    url = extract_link(text)
    if not url:
        return

    log.info("Found link: %s", url)

    # Bypass
    clean_url = await bypass_link(http, url)
    if not clean_url:
        log.warning("Bypass failed for %s", url)
        await report_log(http, url, "failed", message="Bypass failed", level="warn")
        return

    # AdMaven wrap
    final_url = await admaven_wrap(http, clean_url) or clean_url
    log.info("Final URL: %s", final_url)

    # Get Discord channel
    channel = discord_client.get_channel(DISCORD_CHANNEL_ID)
    if not channel:
        log.error("Discord channel not found: %s", DISCORD_CHANNEL_ID)
        await report_log(http, url, "failed", bypassed_url=clean_url, final_url=final_url,
                         message="Discord channel not found", level="error")
        return

    # Download and post media
    file_path = None
    had_media = False
    if message.media:
        try:
            doc = getattr(message.media, "document", None)
            file_size = getattr(doc, "size", 0) if doc else 0
            if file_size < 25 * 1024 * 1024:  # 25 MB Discord bot limit
                file_path = f"/tmp/media_{message.id}.mp4"
                await tg_client.download_media(message, file=file_path)
                had_media = True
                log.info("Downloaded media")
                await channel.send(content=final_url, file=discord.File(file_path))
                log.info("Posted to Discord with media")
            else:
                log.warning("File too large (%s bytes), sending link only", file_size)
                await channel.send(content=final_url)
        except Exception as e:
            log.error("Media error: %s", e)
            await channel.send(content=final_url)
    else:
        await channel.send(content=final_url)
        log.info("Posted link to Discord")

    # Cleanup
    if file_path and os.path.exists(file_path):
        os.remove(file_path)

    # Report success to dashboard
    await report_log(
        http,
        original_url=url,
        status="success",
        bypassed_url=clean_url,
        final_url=final_url,
        had_media=had_media,
    )

# ── MAIN ───────────────────────────────────────────────────────────────────────
async def main():
    if not TELEGRAM_API_ID or not TELEGRAM_API_HASH:
        raise RuntimeError("TELEGRAM_API_ID and TELEGRAM_API_HASH must be set")
    if not DISCORD_BOT_TOKEN:
        raise RuntimeError("DISCORD_BOT_TOKEN must be set")

    started_at = datetime.now(timezone.utc).isoformat()

    tg_client = TelegramClient(StringSession(TELEGRAM_SESSION), TELEGRAM_API_ID, TELEGRAM_API_HASH)
    await tg_client.connect()
    log.info("Telegram connected!")

    async with aiohttp.ClientSession() as http:
        # Start heartbeat loop
        asyncio.create_task(heartbeat_loop(http, started_at))

        @tg_client.on(events.NewMessage(chats=[SOURCE_CHANNEL]))
        async def on_new_message(event):
            await process_message(tg_client, http, event.message)

        log.info("Listening on Telegram channel %s", SOURCE_CHANNEL)

        # Start Discord bot in background
        await discord_client.login(DISCORD_BOT_TOKEN)
        asyncio.create_task(discord_client.connect())
        await asyncio.sleep(3)  # wait for Discord to connect
        log.info("Discord connected!")

        await tg_client.run_until_disconnected()

if __name__ == "__main__":
    asyncio.run(main())
