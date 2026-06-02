/**
 * Discord channel — converts Slack Block Kit payloads to Discord embeds.
 *
 * owner: RStack developed by Richardson Gunde
 */

import { postJson } from './http.js';

export function convertSlackToDiscord(slackPayload) {
  if (!slackPayload || !slackPayload.attachments) return slackPayload;
  const embeds = slackPayload.attachments.map((att) => {
    const embed = {
      color: att.color ? parseInt(att.color.replace('#', ''), 16) : 0,
      fields: []
    };

    let descriptionLines = [];
    let footerText = '';

    for (const block of (att.blocks || [])) {
      if (block.type === 'section' && block.text) {
        descriptionLines.push(block.text.text);
      }
      if (block.type === 'fields' && block.fields) {
        for (const f of block.fields) {
          const raw = f.text || '';
          const parts = raw.split('\n');
          const name = parts[0] ? parts[0].replace(/\*/g, '') : 'Detail';
          const value = parts.slice(1).join('\n') || '—';
          embed.fields.push({ name, value, inline: true });
        }
      }
      if (block.type === 'context' && block.elements) {
        footerText = block.elements.map(e => e.text || '').join(' | ');
      }
    }

    if (descriptionLines.length > 0) {
      embed.description = descriptionLines.join('\n');
    }
    if (footerText) {
      embed.footer = { text: footerText };
    }
    return embed;
  });

  return { embeds };
}

export function sendDiscord(config, slackPayload) {
  if (!config?.webhook) throw new Error('discord channel: webhook not configured');
  return postJson(config.webhook, convertSlackToDiscord(slackPayload));
}
