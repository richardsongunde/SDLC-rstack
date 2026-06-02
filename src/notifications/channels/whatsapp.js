/**
 * WhatsApp channel — Meta WhatsApp Business Cloud API text message.
 *
 * Config: { token, phone_number_id, to }
 * Env:    RSTACK_WHATSAPP_TOKEN, RSTACK_WHATSAPP_PHONE_ID, RSTACK_WHATSAPP_TO
 *
 * Requires a Meta Business app with the WhatsApp product enabled; `to` is the
 * recipient phone number in international format (no +).
 *
 * owner: RStack developed by Richardson Gunde
 */

import { postJson } from './http.js';
import { slackPayloadToText } from './text.js';

const GRAPH_API_VERSION = 'v19.0';

export function sendWhatsApp(config, slackPayload) {
  if (!config?.token || !config?.phone_number_id || !config?.to) {
    throw new Error('whatsapp channel: token, phone_number_id and to must be configured');
  }
  const text = slackPayloadToText(slackPayload) || 'RStack notification';
  return postJson(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${config.phone_number_id}/messages`,
    {
      messaging_product: 'whatsapp',
      to: config.to,
      type: 'text',
      text: { body: text.slice(0, 4096) },
    },
    { Authorization: `Bearer ${config.token}` },
  );
}
