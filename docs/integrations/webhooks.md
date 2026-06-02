# Webhooks & Notifications

<!-- owner: RStack developed by Richardson Gunde -->

RStack notifies your team where they already are: **Slack, Microsoft Teams,
Discord, Telegram, and WhatsApp**. One event fans out to every configured
channel; a webhook failure never fails a run.

## What gets notified

- Run started (`sdlc_start`)
- Task validated — pass/fail with summary and attempt count
- Rich task execution report — tool calls, guardrail hits, memory actions, checks
- Human approval recorded (`sdlc_approve`)

## Configure

### Option A — environment variables

| Channel | Variables |
|---|---|
| Slack | `RSTACK_SLACK_WEBHOOK` (Teams/Discord URLs are auto-routed too) |
| Teams | `RSTACK_TEAMS_WEBHOOK` |
| Discord | `RSTACK_DISCORD_WEBHOOK` |
| Telegram | `RSTACK_TELEGRAM_BOT_TOKEN` + `RSTACK_TELEGRAM_CHAT_ID` |
| WhatsApp | `RSTACK_WHATSAPP_TOKEN` + `RSTACK_WHATSAPP_PHONE_ID` + `RSTACK_WHATSAPP_TO` |

### Option B — `.rstack/notifications.json` in the project root

```json
{
  "channels": {
    "slack":    { "webhook": "https://hooks.slack.com/services/..." },
    "teams":    { "webhook": "https://yourorg.webhook.office.com/..." },
    "discord":  { "webhook": "https://discord.com/api/webhooks/..." },
    "telegram": { "bot_token": "123456:ABC...", "chat_id": "-1001234567890" },
    "whatsapp": { "token": "EAAB...", "phone_number_id": "1055...", "to": "15551234567" }
  }
}
```

Environment variables win over the file for the same channel.

## Verify your setup

```bash
npx rstack-agents notify          # show configured channels
npx rstack-agents notify --test   # send a test message to every channel
```

Per-channel results are printed; exit code 1 if any channel fails.

## Channel notes

- **Slack** — incoming webhook; payloads are native Block Kit.
- **Teams** — incoming webhook (connector); payloads converted to MessageCard.
- **Discord** — webhook; payloads converted to embeds.
- **Telegram** — create a bot with @BotFather, add it to your chat/group, use
  the bot token + chat id. Messages are rendered as plain text.
- **WhatsApp** — Meta WhatsApp Business Cloud API: a Meta app with the
  WhatsApp product, a system-user access token, the sender phone-number id,
  and the recipient number in international format (no `+`).

## For adapter authors

```js
import { notifyAll, hasConfiguredChannels, formatSlackStageMessage } from 'rstack-agents';

if (hasConfiguredChannels({ projectRoot })) {
  await notifyAll(formatSlackStageMessage(runId, stageId, 'PASS', { message }), { projectRoot });
}
```

`notifyAll` never throws — it returns `[{ channel, ok, detail }]`.
