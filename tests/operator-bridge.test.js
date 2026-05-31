import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BRIDGE = resolve(__dirname, '..', 'bin', 'rstack-operator-bridge.ts');

function runBridge(tool, params, projectRoot) {
  return new Promise((resolveRun) => {
    const proc = spawn('npx', ['tsx', BRIDGE, tool, JSON.stringify(params)], {
      cwd: resolve(__dirname, '..'),
      env: { ...process.env, RSTACK_PROJECT_ROOT: projectRoot },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (c) => { stdout += c.toString(); });
    proc.stderr.on('data', (c) => { stderr += c.toString(); });
    proc.on('close', (code) => resolveRun({ code, stdout, stderr }));
  });
}

test('operator bridge runs sdlc_agents and returns JSON with text content', async () => {
  const projectRoot = mkdtempSync(join(tmpdir(), 'rstack-op-'));
  const { code, stdout, stderr } = await runBridge('sdlc_agents', { limit: 5 }, projectRoot);

  assert.equal(code, 0, `bridge exited ${code}: ${stderr}`);
  const result = JSON.parse(stdout);
  assert.ok(Array.isArray(result.content), 'result has a content array');
  assert.equal(result.content[0].type, 'text');
  assert.equal(typeof result.content[0].text, 'string');
});

test('operator bridge reports unknown tools with a non-zero exit', async () => {
  const projectRoot = mkdtempSync(join(tmpdir(), 'rstack-op-'));
  const { code, stderr } = await runBridge('sdlc_does_not_exist', {}, projectRoot);

  assert.notEqual(code, 0);
  assert.match(stderr, /unknown tool/);
});
