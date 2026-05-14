/**
 * Tests for hook scripts and validators referenced from .claude/settings.json.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const REPO_ROOT = path.resolve(import.meta.dirname, '..');
const CLAUDE_DIR = path.join(REPO_ROOT, '.claude');
const SETTINGS_PATH = path.join(CLAUDE_DIR, 'settings.json');

function expandProjectVar(p) {
  return p.replace(/\$CLAUDE_PROJECT_DIR/g, REPO_ROOT);
}

function extractScriptPath(command) {
  // commands look like: `uv run $CLAUDE_PROJECT_DIR/.claude/hooks/scripts/foo.py`
  // or `python /path/to/script.py` or just `/path/to/script.sh`
  const expanded = expandProjectVar(command);
  const tokens = expanded.split(/\s+/);
  for (const t of tokens) {
    if (/\.(py|sh|js|ts)$/.test(t)) return t;
  }
  return null;
}

async function loadSettings() {
  const raw = await readFile(SETTINGS_PATH, 'utf8');
  return JSON.parse(raw);
}

test('settings.json exists and is valid JSON', async () => {
  assert.ok(existsSync(SETTINGS_PATH), `${SETTINGS_PATH} should exist`);
  const settings = await loadSettings();
  assert.equal(typeof settings, 'object');
});

test('all hook scripts referenced in settings.json exist on disk', async () => {
  const settings = await loadSettings();
  const hooks = settings.hooks || {};
  const missing = [];
  for (const [event, hookGroups] of Object.entries(hooks)) {
    if (!Array.isArray(hookGroups)) continue;
    for (const group of hookGroups) {
      const handlers = group.hooks || [];
      for (const handler of handlers) {
        if (handler.type !== 'command' || !handler.command) continue;
        const scriptPath = extractScriptPath(handler.command);
        if (!scriptPath) continue;
        if (!existsSync(scriptPath)) {
          missing.push(`${event}: missing -> ${scriptPath}`);
        }
      }
    }
  }
  assert.deepEqual(missing, [], `missing hook scripts:\n${missing.join('\n')}`);
});

test('all validator scripts in hooks/validators/ exist and have a shebang or are .py', async () => {
  const validatorsDir = path.join(CLAUDE_DIR, 'hooks', 'validators');
  if (!existsSync(validatorsDir)) {
    // not all installs ship validators; tolerate absence
    return;
  }
  const { readdir } = await import('node:fs/promises');
  const entries = await readdir(validatorsDir);
  const failures = [];
  for (const entry of entries) {
    if (!/\.(py|sh|js|ts)$/.test(entry)) continue;
    const full = path.join(validatorsDir, entry);
    if (!existsSync(full)) {
      failures.push(`missing: ${full}`);
      continue;
    }
    if (entry.endsWith('.py')) continue; // python files don't strictly need a shebang
    const head = (await readFile(full, 'utf8')).slice(0, 200);
    if (!head.startsWith('#!')) {
      failures.push(`${entry}: missing shebang`);
    }
  }
  assert.deepEqual(failures, [], `validator script issues:\n${failures.join('\n')}`);
});

test('hook scripts are executable (shebang present or .py file)', async () => {
  const scriptsDir = path.join(CLAUDE_DIR, 'hooks', 'scripts');
  if (!existsSync(scriptsDir)) return;
  const { readdir } = await import('node:fs/promises');
  const entries = await readdir(scriptsDir);
  const failures = [];
  for (const entry of entries) {
    if (!/\.(py|sh|js|ts)$/.test(entry)) continue;
    const full = path.join(scriptsDir, entry);
    if (entry.endsWith('.py')) continue;
    const head = (await readFile(full, 'utf8')).slice(0, 200);
    if (!head.startsWith('#!')) {
      failures.push(`${entry}: missing shebang`);
    }
  }
  assert.deepEqual(failures, [], `hook script issues:\n${failures.join('\n')}`);
});
