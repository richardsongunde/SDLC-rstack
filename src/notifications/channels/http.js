/**
 * Shared HTTPS JSON POST for webhook channels.
 *
 * owner: RStack developed by Richardson Gunde
 */

import { request } from 'node:https';

export function postJson(urlString, payload, headers = {}) {
  return new Promise((resolvePromise, reject) => {
    try {
      const url = new URL(urlString);
      const data = JSON.stringify(payload);
      const options = {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
          ...headers,
        },
      };
      const req = request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolvePromise(body || 'ok');
          } else {
            reject(new Error(`Webhook post failed with status: ${res.statusCode}. Body: ${body}`));
          }
        });
      });
      req.on('error', reject);
      req.write(data);
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}
