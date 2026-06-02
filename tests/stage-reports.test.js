/**
 * Tests for the stage-report collector (#60) — parses the structured
 * deliverables a run produced for the Run Report page + Studio 3D panels.
 *
 * owner: RStack developed by Richardson Gunde
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { collectStageReports, stageReportIndex, STAGE_ARTIFACTS } from '../src/observability/dashboard/state/stage-reports.js';

function seedRun() {
  const runDir = mkdtempSync(join(tmpdir(), 'rstack-stagerep-'));
  const stagesDir = join(runDir, 'artifacts', 'stages');
  const write = (stage, file, obj) => {
    mkdirSync(join(stagesDir, stage), { recursive: true });
    writeFileSync(join(stagesDir, stage, file), JSON.stringify(obj));
  };
  write('12-security-threat-model', 'threat_model.json', {
    status: 'FAIL_HIGH_RISKS_FOUND',
    threats: [{ severity: 'HIGH' }, { severity: 'HIGH' }, { severity: 'MEDIUM' }, { severity: 'LOW' }],
    release_gate: { ready: false, reason: 'fix highs' },
  });
  write('13-compliance-checker', 'compliance_report.json', { overall_score: 63, release_gate: { ready: false, blockers: ['SOC2-CC6.1'] } });
  write('02-requirements', 'requirements.json', { functional: [1, 2, 3], user_stories: [1] });
  return runDir;
}

test('collectStageReports parses present stage artifacts, null for missing', async () => {
  const runDir = seedRun();
  const { stages, deliverables } = await collectStageReports(runDir);

  assert.equal(stages['12-security-threat-model'].threats.length, 4);
  assert.equal(stages['13-compliance-checker'].overall_score, 63);
  assert.equal(stages['02-requirements'].functional.length, 3);
  // Stages with no artifact are null, not errors.
  assert.equal(stages['07-code'], null);
  assert.equal(stages['14-cost-estimation'], null);
  // Every canonical stage key is present in the result.
  assert.deepEqual(Object.keys(stages).sort(), Object.keys(STAGE_ARTIFACTS).sort());
  // Deliverables resolve (summary maps to the stage path).
  assert.ok('release-readiness' in deliverables && 'summary' in deliverables);

  rmSync(runDir, { recursive: true, force: true });
});

test('stageReportIndex lists only stages that produced a report', async () => {
  const runDir = seedRun();
  const index = await stageReportIndex(runDir);
  assert.deepEqual(index.sort(), ['02-requirements', '12-security-threat-model', '13-compliance-checker']);
  rmSync(runDir, { recursive: true, force: true });
});

test('collectStageReports tolerates malformed JSON without throwing', async () => {
  const runDir = mkdtempSync(join(tmpdir(), 'rstack-stagerep-bad-'));
  mkdirSync(join(runDir, 'artifacts', 'stages', '08-testing'), { recursive: true });
  writeFileSync(join(runDir, 'artifacts', 'stages', '08-testing', 'test_report.json'), '{ not valid json');
  const { stages } = await collectStageReports(runDir);
  assert.equal(stages['08-testing'], null, 'malformed JSON → null, not a crash');
  rmSync(runDir, { recursive: true, force: true });
});
