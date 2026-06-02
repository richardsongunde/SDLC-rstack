/**
 * Regression: stage_completed events must carry canonical stage ids.
 *
 * Plan task ids (e.g. "002-requirements") are NOT canonical stage ids
 * (e.g. "02-requirements"). sdlc_validate used to emit stage_completed with
 * stage_id = task.id, corrupting every per-stage aggregation (reporter
 * stage_elapsed, alerts stage labels, dashboard stage matrix).
 *
 * owner: RStack developed by Richardson Gunde
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CANONICAL_SDLC_STAGES } from '../src/core/harness/stages.js';
import extension from '../extensions/rstack-sdlc.ts';

const mockPi = {
  tools: {},
  commands: {},
  on: () => {},
  registerTool(tool) { this.tools[tool.name] = tool; },
  registerCommand(name, command) { this.commands[name] = command; },
};

test('sdlc_validate attributes stage_completed to canonical stages, not task ids', async (t) => {
  const projectRoot = mkdtempSync(join(tmpdir(), 'rstack-stage-attr-'));
  const previousProjectRoot = process.env.RSTACK_PROJECT_ROOT;
  const previousWebhook = process.env.RSTACK_SLACK_WEBHOOK;
  process.env.RSTACK_PROJECT_ROOT = projectRoot;
  delete process.env.RSTACK_SLACK_WEBHOOK;

  extension(mockPi);

  const start = await mockPi.tools.sdlc_start.execute('1', { goal: 'Stage attribution regression' });
  const runId = start.details.run_id;
  await mockPi.tools.sdlc_plan.execute('2', { run_id: runId });

  // Pick the requirements task — a plan task whose id (002-requirements) differs
  // from its canonical stage targets (02-requirements, ...).
  const tasksPath = join(projectRoot, '.rstack', 'runs', runId, 'tasks.json');
  const task = JSON.parse(readFileSync(tasksPath, 'utf8')).tasks.find((entry) => entry.id === '002-requirements');
  assert.ok(task, 'plan should contain the 002-requirements task');
  const expectedStageIds = [...new Set(task.stage_artifacts.map((artifact) => artifact.stage_id))];
  assert.ok(expectedStageIds.length > 0, 'task should target at least one canonical stage');

  // Write a passing builder contract straight to the task output dir.
  const outputDir = join(projectRoot, task.output_dir);
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(join(outputDir, 'builder.json'), JSON.stringify({
    task_id: task.id,
    agent: 'builder',
    status: 'PASS',
    summary: 'Requirements extracted and documented for regression test',
    files_modified: [],
    tests_run: ['SKIPPED: regression fixture'],
    risks: [],
    next_steps: [],
    memory_summary: {
      work_done: 'Captured requirements for the regression scenario',
      evidence: ['tasks.json'],
    },
    stage_summaries: expectedStageIds.map((stageId) => ({
      stage_id: stageId,
      work_done: `Stage ${stageId} artifacts produced for regression test`,
      evidence: ['tasks.json'],
    })),
  }, null, 2));

  const result = await mockPi.tools.sdlc_validate.execute('3', { run_id: runId, task_id: task.id });
  assert.equal(result.details.status, 'PASS', `validation should pass: ${JSON.stringify(result.details.issues)}`);

  const events = readFileSync(join(projectRoot, '.rstack', 'runs', runId, 'events.jsonl'), 'utf8')
    .split('\n').filter(Boolean).map((line) => JSON.parse(line));
  const stageEvents = events.filter((event) => event.type === 'stage_completed');
  assert.ok(stageEvents.length > 0, 'PASS validation should emit stage_completed');

  const canonicalIds = new Set(CANONICAL_SDLC_STAGES.map((stage) => stage.id));
  for (const event of stageEvents) {
    assert.ok(canonicalIds.has(event.stage_id), `stage_id must be canonical, got: ${event.stage_id}`);
    assert.notEqual(event.stage_id, task.id, 'stage_id must never be the plan task id');
    assert.equal(event.task_id, task.id, 'task_id should keep the plan task attribution');
    assert.equal(typeof event.elapsed_ms, 'number');
  }
  assert.deepEqual(
    stageEvents.map((event) => event.stage_id).sort(),
    [...expectedStageIds].sort(),
    'one stage_completed per canonical stage the task targets',
  );

  // Checkpoints used to throw (task.id is not a canonical stage) and were never saved.
  const checkpointEvents = events.filter((event) => event.type === 'stage_checkpoint_saved');
  assert.deepEqual(
    checkpointEvents.map((event) => event.stage_id).sort(),
    [...expectedStageIds].sort(),
    'every canonical stage the task produced should be checkpointed',
  );

  rmSync(projectRoot, { recursive: true, force: true });
  if (previousProjectRoot) process.env.RSTACK_PROJECT_ROOT = previousProjectRoot;
  else delete process.env.RSTACK_PROJECT_ROOT;
  if (previousWebhook) process.env.RSTACK_SLACK_WEBHOOK = previousWebhook;
});
