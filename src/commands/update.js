/**
 * `rstack-agents update` — refresh the framework while preserving user customizations.
 *
 * Full update:
 *   - Replaces everything inside .claude/ EXCEPT settings.json and settings.local.json.
 *
 * --agents-only:
 *   - Only updates agents/, skills/, plugins/.
 *   - Leaves hooks/, commands/, settings*.json untouched.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fsExtra from 'fs-extra';
import ora from 'ora';
import chalk from 'chalk';
import { log } from '../utils/logger.js';
import { copyTemplate } from '../utils/copy.js';

const { pathExists, readJson, writeJson, ensureDir } = fsExtra;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = path.resolve(__dirname, '..', '..');
const TEMPLATE_DIR = path.join(PACKAGE_ROOT, 'templates', '.claude');

const PRESERVE_FILES = ['settings.json', 'settings.local.json'];
const AGENTS_ONLY_DIRS = ['agents', 'skills', 'plugins'];

async function snapshotPreserved(targetDir) {
  const preserved = {};
  for (const file of PRESERVE_FILES) {
    const fp = path.join(targetDir, file);
    if (await pathExists(fp)) {
      try {
        preserved[file] = await readJson(fp);
      } catch {
        // not JSON or unreadable — skip silently; user file wins
      }
    }
  }
  return preserved;
}

async function restorePreserved(targetDir, preserved) {
  for (const [file, data] of Object.entries(preserved)) {
    const fp = path.join(targetDir, file);
    await writeJson(fp, data, { spaces: 2 });
  }
}

export async function updateCommand(options = {}) {
  const cwd = process.cwd();
  const targetDir = path.join(cwd, '.claude');

  if (!(await pathExists(targetDir))) {
    throw new Error(
      `.claude/ not found in ${cwd}. Run \`rstack-agents init\` first.`
    );
  }
  if (!(await pathExists(TEMPLATE_DIR))) {
    throw new Error(
      `Template directory not found at ${TEMPLATE_DIR}. The npm package may be corrupted.`
    );
  }

  const spinner = ora({
    text: options.agentsOnly ? 'Updating agents, skills, plugins...' : 'Updating framework...',
    color: 'cyan'
  }).start();

  const summary = { updated: [], preserved: [] };

  try {
    if (options.agentsOnly) {
      for (const sub of AGENTS_ONLY_DIRS) {
        const src = path.join(TEMPLATE_DIR, sub);
        const dst = path.join(targetDir, sub);
        if (await pathExists(src)) {
          await ensureDir(dst);
          const result = await copyTemplate(src, dst, { overwrite: true });
          summary.updated.push(`${sub}/ (${result.filesCopied} files)`);
        }
      }
      summary.preserved.push('hooks/', 'commands/', 'settings.json', 'settings.local.json');
    } else {
      const preserved = await snapshotPreserved(targetDir);
      const result = await copyTemplate(TEMPLATE_DIR, targetDir, {
        overwrite: true,
        skip: PRESERVE_FILES
      });
      await restorePreserved(targetDir, preserved);
      summary.updated.push(`.claude/ (${result.filesCopied} files)`);
      summary.preserved.push(...Object.keys(preserved));
    }
    spinner.succeed(chalk.green('Update complete.'));
  } catch (err) {
    spinner.fail(chalk.red('Update failed.'));
    throw err;
  }

  log.success('rstack-agents updated.');
  if (summary.updated.length > 0) {
    log.info('Updated:');
    summary.updated.forEach((u) => log.info(`  + ${u}`));
  }
  if (summary.preserved.length > 0) {
    log.info('Preserved:');
    summary.preserved.forEach((p) => log.info(`  = ${p}`));
  }

  return summary;
}
