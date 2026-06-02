/**
 * Tests for src/observability/metrics/derive.js — run timelines, stage
 * durations, totals, and cross-run trends derived from events + tasks.
 *
 * owner: RStack developed by Richardson Gunde
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  taskStageMap,
  normalizeStageCompletions,
  deriveStageElapsed,
  deriveRunTimeline,
  deriveRunTotals,
  buildStageTrends,
} from '../src/observability/metrics/derive.js';

const TASKS = [
  { id: '002-requirements', stage_artifacts: [{ stage_id: '02-requirements' }, { stage_id: '04-planning' }] },
  { id: '003-architecture', stage_artifacts: [{ stage_id: '06-architecture' }] },
  { id: '00-environment', stage_artifacts: [] }, // task id IS canonical
  { id: '999-custom', stage_artifacts: [] },     // no canonical mapping at all
];

test('taskStageMap maps stage_artifacts and canonical task ids, never invents stages', () => {
  const map = taskStageMap(TASKS);
  assert.deepEqual(map['002-requirements'], ['02-requirements', '04-planning']);
  assert.deepEqual(map['003-architecture'], ['06-architecture']);
  assert.deepEqual(map['00-environment'], ['00-environment']);
  assert.deepEqual(map['999-custom'], []);
});

test('normalizeStageCompletions passes canonical events through and remaps legacy task-id events', () => {
  const events = [
    // New-format event: canonical stage id
    { type: 'stage_completed', stage_id: '06-architecture', task_id: '003-architecture', ts: '2026-06-01T05:00:00.000Z', elapsed_ms: 60000, stages_in_task: 1 },
    // Legacy event: stage_id is the plan task id
    { type: 'stage_completed', stage_id: '002-requirements', task_id: '002-requirements', ts: '2026-06-01T05:01:00.000Z', elapsed_ms: 120000 },
    // Legacy event with no mapping — must produce nothing rather than garbage
    { type: 'stage_completed', stage_id: '999-custom', task_id: '999-custom', ts: '2026-06-01T05:02:00.000Z', elapsed_ms: 5000 },
    { type: 'tool_call', ts: '2026-06-01T05:03:00.000Z' },
  ];
  const normalized = normalizeStageCompletions(events, TASKS);
  assert.deepEqual(normalized.map((completion) => completion.stage_id).sort(), ['02-requirements', '04-planning', '06-architecture']);
  const remapped = normalized.filter((completion) => completion.task_id === '002-requirements');
  assert.equal(remapped.length, 2, 'legacy multi-stage task remaps to one completion per stage');
  for (const completion of remapped) assert.equal(completion.stages_in_task, 2);
});

test('deriveStageElapsed splits multi-stage task time evenly instead of double-counting', () => {
  const events = [
    { type: 'stage_completed', stage_id: '02-requirements', task_id: '002-requirements', elapsed_ms: 120000, stages_in_task: 2 },
    { type: 'stage_completed', stage_id: '04-planning', task_id: '002-requirements', elapsed_ms: 120000, stages_in_task: 2 },
    { type: 'stage_completed', stage_id: '06-architecture', task_id: '003-architecture', elapsed_ms: 30000, stages_in_task: 1 },
  ];
  const elapsed = deriveStageElapsed(events, TASKS);
  assert.equal(elapsed['02-requirements'], 60000);
  assert.equal(elapsed['04-planning'], 60000);
  assert.equal(elapsed['06-architecture'], 30000);
  const total = Object.values(elapsed).reduce((sum, ms) => sum + ms, 0);
  assert.equal(total, 150000, 'sum of stage shares equals total task time, not double');
});

test('deriveRunTimeline produces ordered segments with attempts and in-flight tasks', () => {
  const events = [
    { type: 'task_started', task_id: '002-requirements', ts: '2026-06-01T05:00:00.000Z' },
    { type: 'task_validated', task_id: '002-requirements', status: 'FAIL', ts: '2026-06-01T05:02:00.000Z' },
    { type: 'task_started', task_id: '002-requirements', ts: '2026-06-01T05:03:00.000Z' },
    { type: 'task_validated', task_id: '002-requirements', status: 'PASS', ts: '2026-06-01T05:05:00.000Z' },
    { type: 'task_started', task_id: '003-architecture', ts: '2026-06-01T05:06:00.000Z' },
  ];
  const timeline = deriveRunTimeline(events, TASKS);
  assert.equal(timeline.length, 3);
  const [first, second, third] = timeline;
  assert.equal(first.status, 'FAIL');
  assert.equal(first.attempt, 1);
  assert.equal(first.elapsed_ms, 120000);
  assert.equal(second.status, 'PASS');
  assert.equal(second.attempt, 2);
  assert.deepEqual(second.stage_ids, ['02-requirements', '04-planning']);
  assert.equal(third.status, 'IN_PROGRESS');
  assert.equal(third.ended_at, null);
});

test('deriveRunTotals aggregates tool calls, cost, tokens, outcomes, quality', () => {
  const events = [
    { type: 'run_started', ts: '2026-06-01T05:00:00.000Z' },
    { type: 'tool_call', ts: '2026-06-01T05:00:30.000Z' },
    { type: 'tool_call', ts: '2026-06-01T05:01:00.000Z' },
    { type: 'cost_recorded', usd: 0.25, tokens: 12000, ts: '2026-06-01T05:01:30.000Z' },
    { type: 'cost_recorded', cost: 0.15, tokens: 8000, ts: '2026-06-01T05:02:00.000Z' },
    { type: 'task_validated', status: 'PASS', task_id: 'a', ts: '2026-06-01T05:03:00.000Z' },
    { type: 'task_validated', status: 'FAIL', task_id: 'b', ts: '2026-06-01T05:04:00.000Z' },
    { type: 'guardrail_triggered', ts: '2026-06-01T05:05:00.000Z' },
    { type: 'quality_score_recorded', score: 0.9, ts: '2026-06-01T05:06:00.000Z' },
    { type: 'quality_score_recorded', score: 0.7, ts: '2026-06-01T05:10:00.000Z' },
  ];
  const totals = deriveRunTotals(events);
  assert.equal(totals.tool_calls, 2);
  assert.equal(totals.cost_usd, 0.4);
  assert.equal(totals.tokens, 20000);
  assert.equal(totals.tasks_passed, 1);
  assert.equal(totals.tasks_failed, 1);
  assert.equal(totals.guardrails, 1);
  assert.equal(totals.quality_avg, 0.8);
  assert.equal(totals.duration_ms, 10 * 60 * 1000);
});

test('deriveRunTotals handles empty and malformed event streams', () => {
  assert.equal(deriveRunTotals([]).duration_ms, 0);
  assert.equal(deriveRunTotals(null).tool_calls, 0);
  const totals = deriveRunTotals([{ type: 'cost_recorded', usd: 'not-a-number' }, { ts: 'garbage' }]);
  assert.equal(totals.cost_usd, 0);
});

test('buildStageTrends aggregates per-stage averages and per-run rows across runs', () => {
  const runs = [
    {
      runId: '2026-06-01T05-00-00-000Z-run-a',
      manifest: { created_at: '2026-06-01T05:00:00.000Z', goal: 'Run A' },
      tasks: TASKS,
      events: [
        { type: 'stage_completed', stage_id: '06-architecture', task_id: '003-architecture', elapsed_ms: 60000, stages_in_task: 1, ts: '2026-06-01T05:01:00.000Z' },
        { type: 'task_validated', status: 'PASS', task_id: '003-architecture', ts: '2026-06-01T05:01:00.000Z' },
      ],
    },
    {
      runId: '2026-06-02T05-00-00-000Z-run-b',
      manifest: { created_at: '2026-06-02T05:00:00.000Z', goal: 'Run B' },
      tasks: TASKS,
      events: [
        { type: 'stage_completed', stage_id: '06-architecture', task_id: '003-architecture', elapsed_ms: 120000, stages_in_task: 1, ts: '2026-06-02T05:02:00.000Z' },
        { type: 'task_validated', status: 'PASS', task_id: '003-architecture', ts: '2026-06-02T05:02:00.000Z' },
      ],
    },
  ];
  const trends = buildStageTrends(runs);
  assert.equal(trends.stages['06-architecture'].runs, 2);
  assert.equal(trends.stages['06-architecture'].avg_elapsed_ms, 90000);
  assert.equal(trends.runs.length, 2);
  assert.equal(trends.runs[0].runId, '2026-06-02T05-00-00-000Z-run-b', 'newest run first');
  assert.equal(trends.runs[0].tasks_passed, 1);
});
