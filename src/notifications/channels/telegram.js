/**
 * Telegram channel — Bot API sendMessage with the payload rendered as text.
 *
 * Config: { bot_token, chat_id }
 * Env:    RSTACK_TELEGRAM_BOT_TOKEN, RSTACK_TELEGRAM_CHAT_ID
 *
 * owner: RStack developed by Richardson Gunde
 */

import { postJson } from './http.js';
import { slackPayloadToText } from './text.js';

export function sendTelegram(config, slackPayload) {
  if (!config?.bot_token || !config?.chat_id) {
    throw new Error('telegram channel: bot_token and chat_id must be configured');
  }
  const text = slackPayloadToText(slackPayload) || 'RStack notification';
  return postJson(`https://api.telegram.org/bot${config.bot_token}/sendMessage`, {
    chat_id: config.chat_id,
    text: text.slice(0, 4096), // Telegram message limit
    disable_web_page_preview: true,
  });
}
