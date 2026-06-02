/**
 * Slack Block Kit payload → plain text, for channels without rich blocks
 * (Telegram, WhatsApp).
 *
 * owner: RStack developed by Richardson Gunde
 */

function stripMrkdwn(text) {
  return String(text ?? '')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/^> /gm, '')
    .trim();
}

export function slackPayloadToText(slackPayload) {
  if (!slackPayload) return '';
  if (typeof slackPayload.text === 'string' && !slackPayload.attachments) {
    return stripMrkdwn(slackPayload.text);
  }
  const lines = [];
  for (const attachment of slackPayload.attachments ?? []) {
    for (const block of attachment.blocks ?? []) {
      if (block.type === 'section' && block.text?.text) {
        lines.push(stripMrkdwn(block.text.text));
      }
      if (block.type === 'fields' && Array.isArray(block.fields)) {
        for (const field of block.fields) {
          const parts = String(field.text ?? '').split('\n');
          const name = stripMrkdwn(parts[0]);
          const value = stripMrkdwn(parts.slice(1).join(' '));
          if (name || value) lines.push(`${name} ${value}`.trim());
        }
      }
      if (block.type === 'context' && Array.isArray(block.elements)) {
        lines.push(block.elements.map((el) => stripMrkdwn(el.text)).filter(Boolean).join(' | '));
      }
    }
  }
  return lines.filter(Boolean).join('\n');
}
