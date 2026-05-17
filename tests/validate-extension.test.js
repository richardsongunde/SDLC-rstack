/**
 * Validate Pi extension imports and tool schema construction.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '..');

test('rstack Pi extension imports successfully', async () => {
  const mod = await import(path.join(REPO_ROOT, 'extensions', 'rstack-sdlc.ts'));
  assert.equal(typeof mod.default, 'function');
});

test('rstack Pi extension registers expected tools and commands with mock Pi API', async () => {
  const mod = await import(path.join(REPO_ROOT, 'extensions', 'rstack-sdlc.ts'));
  const tools = [];
  const commands = [];
  const handlers = [];
  const pi = {
    on: (event, handler) => handlers.push({ event, handler }),
    registerTool: (tool) => tools.push(tool),
    registerCommand: (name, command) => commands.push({ name, command }),
  };
  mod.default(pi);
  const toolNames = tools.map((tool) => tool.name).sort();
  assert.deepEqual(toolNames, [
    'sdlc_agents',
    'sdlc_approve',
    'sdlc_build_next',
    'sdlc_clarify',
    'sdlc_delegate',
    'sdlc_memory',
    'sdlc_orchestrate',
    'sdlc_plan',
    'sdlc_spec',
    'sdlc_start',
    'sdlc_status',
    'sdlc_validate',
  ].sort());
  assert.ok(commands.some((command) => command.name === 'sdlc'));
  assert.ok(commands.some((command) => command.name === 'sdlc-agents'));
  for (const tool of tools) {
    assert.equal(typeof tool.execute, 'function', `${tool.name} execute should be a function`);
    assert.equal(tool.parameters.type, 'object', `${tool.name} parameters should be object schema`);
  }
});
