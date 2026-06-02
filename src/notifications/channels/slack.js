/**
 * Slack channel — payloads are already Slack Block Kit format.
 *
 * owner: RStack developed by Richardson Gunde
 */

import { postJson } from './http.js';

export function sendSlack(config, slackPayload) {
  if (!config?.webhook) throw new Error('slack channel: webhook not configured');
  return postJson(config.webhook, slackPayload);
}
