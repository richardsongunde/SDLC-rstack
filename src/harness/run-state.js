import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { CANONICAL_SDLC_STAGES, assertCanonicalStages, getCanonicalStage } from './stages.js';

export function stageArtifactsDir(runDir) {
  return join(runDir, 'artifacts', 'stages');
}

export function stageDir(runDir, stageId) {
  const stage = getCanonicalStage(stageId);
  if (!stage) throw new Error(`Unknown canonical SDLC stage: ${stageId}`);
  return join(stageArtifactsDir(runDir), stage.id);
}

export function stageArtifactPath(runDir, stageId, artifactName) {
  const stage = getCanonicalStage(stageId);
  if (!stage) throw new Error(`Unknown canonical SDLC stage: ${stageId}`);
  return join(stageDir(runDir, stage.id), artifactName || stage.artifact);
}

export async function prepareStageFolders(runDir, stages = CANONICAL_SDLC_STAGES) {
  assertCanonicalStages(stages);
  await mkdir(stageArtifactsDir(runDir), { recursive: true });
  for (const stage of stages) {
    await mkdir(join(stageArtifactsDir(runDir), stage.id), { recursive: true });
  }
  return stageArtifactsDir(runDir);
}

export async function prepareRunState(runDir) {
  await mkdir(join(runDir, 'tasks'), { recursive: true });
  await mkdir(join(runDir, 'artifacts'), { recursive: true });
  await prepareStageFolders(runDir);
  return runDir;
}
