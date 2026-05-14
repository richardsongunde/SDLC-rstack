/**
 * Copy utilities for the rstack-agents installer.
 */

import path from 'node:path';
import { readdir, stat } from 'node:fs/promises';
import fsExtra from 'fs-extra';

const { copy, pathExists } = fsExtra;

/**
 * Recursively copy a template directory and report stats about what was copied.
 *
 * @param {string} src
 * @param {string} dest
 * @param {object} [options]
 * @param {boolean} [options.overwrite=true]
 * @param {string[]} [options.skip] - top-level filenames to NOT copy from src into dest
 * @returns {Promise<{filesCopied:number, agents:number, skills:number, plugins:number, hooks:number}>}
 */
export async function copyTemplate(src, dest, options = {}) {
  const overwrite = options.overwrite ?? true;
  const skip = new Set(options.skip || []);

  if (!(await pathExists(src))) {
    throw new Error(`Source not found: ${src}`);
  }

  const srcStat = await stat(src);

  if (srcStat.isDirectory()) {
    const entries = await readdir(src);
    for (const name of entries) {
      if (skip.has(name)) continue;
      await copy(path.join(src, name), path.join(dest, name), {
        overwrite,
        errorOnExist: false
      });
    }
  } else {
    if (skip.has(path.basename(src))) {
      // explicitly skipped
    } else {
      await copy(src, dest, { overwrite, errorOnExist: false });
    }
  }

  const stats = await collectStats(dest);
  return stats;
}

async function countMatching(dir, predicate) {
  if (!(await pathExists(dir))) return 0;
  let total = 0;
  const stack = [dir];
  while (stack.length > 0) {
    const cur = stack.pop();
    let entries;
    try {
      entries = await readdir(cur, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const full = path.join(cur, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (predicate(full, entry)) {
        total++;
      }
    }
  }
  return total;
}

async function countTopLevelDirs(dir) {
  if (!(await pathExists(dir))) return 0;
  const entries = await readdir(dir, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory()).length;
}

async function collectStats(dest) {
  const filesCopied = await countMatching(dest, () => true);
  const agents = await countMatching(path.join(dest, 'agents'), (p) => p.endsWith('.md'));
  const skills = await countTopLevelDirs(path.join(dest, 'skills'));
  const plugins = await countTopLevelDirs(path.join(dest, 'plugins'));
  const hooks = await countMatching(
    path.join(dest, 'hooks'),
    (p) => p.endsWith('.py') || p.endsWith('.sh') || p.endsWith('.js')
  );
  return { filesCopied, agents, skills, plugins, hooks };
}

/**
 * Merge a template settings.json with an existing one. Existing values win
 * for primitive keys; arrays are concatenated and de-duplicated; nested objects
 * are merged recursively.
 *
 * @param {object} templateSettings
 * @param {object} existingSettings
 * @returns {object}
 */
export function mergeSettings(templateSettings, existingSettings) {
  if (templateSettings === null || templateSettings === undefined) return existingSettings;
  if (existingSettings === null || existingSettings === undefined) return templateSettings;
  if (Array.isArray(templateSettings) && Array.isArray(existingSettings)) {
    const out = [...templateSettings];
    for (const item of existingSettings) {
      const exists = out.some((x) => JSON.stringify(x) === JSON.stringify(item));
      if (!exists) out.push(item);
    }
    return out;
  }
  if (
    typeof templateSettings === 'object' &&
    typeof existingSettings === 'object' &&
    !Array.isArray(templateSettings) &&
    !Array.isArray(existingSettings)
  ) {
    const out = { ...templateSettings };
    for (const [key, val] of Object.entries(existingSettings)) {
      if (key in out) {
        out[key] = mergeSettings(out[key], val);
      } else {
        out[key] = val;
      }
    }
    return out;
  }
  // primitives: existing wins (user's config is authoritative)
  return existingSettings;
}
