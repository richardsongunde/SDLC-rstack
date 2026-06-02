/**
 * Tests for the people/presence state module (#42).
 *
 * owner: RStack developed by Richardson Gunde
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPeople, buildPresence } from '../src/observability/dashboard/state/people.js';

const NOW = Date.parse('2026-06-02T12:00:00.000Z');

const RUNS = [
  {
    runId: 'run-live',
    projectRoot: '/proj/a',
    manifest: { goal: 'Live run', created_at: '2026-06-02T11:00:00.000Z', started_by: { name: 'Sirisha', email: 's@x.com' } },
    approvals: [
      { artifact: 'plan.md', status: 'APPROVED', approver: 'Manager Maya', timestamp: '2026-06-02T11:10:00.000Z' },
      { artifact: 'spec.md', status: 'REJECTED', approver: 'Manager Maya', timestamp: '2026-06-02T11:12:00.000Z' },
    ],
    tasks: [{ id: '004-implementation', title: 'Implementation', status: 'IN_PROGRESS', agent: 'agent.07-code' }],
    events: [
      { ts: '2026-06-02T11:30:00.000Z', type: 'clarification_answers_added', count: 2, answered_by: 'Dev Dan' },
      { ts: '2026-06-02T11:58:30.000Z', type: 'tool_call' },
    ],
  },
  {
    runId: 'run-stale',
    projectRoot: '/proj/b',
    manifest: { goal: 'Old run', created_at: '2026-06-01T10:00:00.000Z' }, // pre-people-layer: no started_by
    approvals: [{ artifact: 'plan.md', status: 'APPROVED', approver: 'human-user', timestamp: '2026-06-01T10:05:00.000Z' }],
    tasks: [],
    events: [{ ts: '2026-06-01T10:30:00.000Z', type: 'tool_call' }],
  },
];

test('buildPeople attributes runs, approvals, guidance — legacy runs become unattributed', () => {
  const people = buildPeople(RUNS);
  const byName = Object.fromEntries(people.map((person) => [person.name, person]));

  assert.equal(byName['Sirisha'].runsStarted, 1);
  assert.equal(byName['Sirisha'].email, 's@x.com');
  assert.equal(byName['Manager Maya'].approvals, 1);
  assert.equal(byName['Manager Maya'].rejections, 1);
  assert.equal(byName['Dev Dan'].guidance, 2);
  // Legacy run: no started_by + 'human-user' approver both fold into unattributed.
  assert.ok(byName['unattributed'].runsStarted >= 1);
  assert.ok(byName['unattributed'].approvals >= 1);
});

test('buildPresence reports live runs with current task and recency', () => {
  const presence = buildPresence(RUNS, NOW);
  assert.equal(presence.length, 1, 'stale run (yesterday) excluded');
  const live = presence[0];
  assert.equal(live.runId, 'run-live');
  assert.equal(live.startedBy, 'Sirisha');
  assert.equal(live.live, true, 'event 90s ago is live');
  assert.equal(live.secondsAgo, 90);
  assert.equal(live.currentTask.id, '004-implementation');
  assert.equal(live.currentTask.agent, 'agent.07-code');
});

test('buildPresence: 6-30 min old activity is recent but not live', () => {
  const presence = buildPresence([{
    ...RUNS[0],
    events: [{ ts: '2026-06-02T11:50:00.000Z', type: 'tool_call' }], // 10 min ago
  }], NOW);
  assert.equal(presence.length, 1);
  assert.equal(presence[0].live, false);
});
