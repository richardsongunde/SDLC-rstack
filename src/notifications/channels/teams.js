/**
 * Microsoft Teams channel — converts Slack Block Kit payloads to MessageCard.
 *
 * owner: RStack developed by Richardson Gunde
 */

import { postJson } from './http.js';

export function convertSlackToTeams(slackPayload) {
  if (!slackPayload || !slackPayload.attachments) return slackPayload;
  const att = slackPayload.attachments[0];
  const themeColor = att && att.color ? att.color.replace('#', '') : '3b82f6';

  const sections = [];
  let summary = 'RStack SDLC Notification';

  if (att && att.blocks) {
    for (const block of att.blocks) {
      if (block.type === 'section' && block.text) {
        summary = block.text.text.replace(/\*/g, '');
        sections.push({
          activityTitle: block.text.text,
          activitySubtitle: 'RStack System Event',
          facts: []
        });
      }
      if (block.type === 'fields' && block.fields) {
        const currentSection = sections[sections.length - 1] || { facts: [] };
        if (!sections.includes(currentSection)) {
          sections.push(currentSection);
        }
        for (const f of block.fields) {
          const raw = f.text || '';
          const parts = raw.split('\n');
          const name = parts[0] ? parts[0].replace(/\*/g, '') : 'Detail';
          const value = parts.slice(1).join('\n') || '—';
          currentSection.facts.push({ name, value });
        }
      }
    }
  }

  return {
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",
    themeColor,
    summary,
    sections
  };
}

export function sendTeams(config, slackPayload) {
  if (!config?.webhook) throw new Error('teams channel: webhook not configured');
  return postJson(config.webhook, convertSlackToTeams(slackPayload));
}
