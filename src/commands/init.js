/**
 * `rstack-agents init` — scaffold the .claude/ template into the current project.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import fsExtra from 'fs-extra';
import ora from 'ora';
import chalk from 'chalk';
import { log } from '../utils/logger.js';
import { copyTemplate } from '../utils/copy.js';

const { pathExists, ensureDir } = fsExtra;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = path.resolve(__dirname, '..', '..');
const TEMPLATE_DIR = path.join(PACKAGE_ROOT, 'templates', '.claude');

async function confirmOverwrite(targetDir) {
  if (!process.stdin.isTTY) {
    log.warn(`Non-interactive shell detected. Refusing to overwrite ${targetDir} without --force.`);
    return false;
  }
  const rl = createInterface({ input, output });
  try {
    const answer = await rl.question(
      chalk.yellow(`[rstack] ${targetDir} already exists. Overwrite? (y/N) `)
    );
    return /^y(es)?$/i.test(answer.trim());
  } finally {
    rl.close();
  }
}

export async function initCommand(options = {}) {
  const cwd = process.cwd();
  const targetDir = path.join(cwd, '.claude');

  if (!(await pathExists(TEMPLATE_DIR))) {
    throw new Error(
      `Template directory not found at ${TEMPLATE_DIR}. ` +
        `The public package does not currently bundle the private .claude template workspace. ` +
        `Use the Pi extension via \`pi install npm:rstack-agents\`, or run this command from a private RStack checkout after syncing templates.`
    );
  }

  if (await pathExists(targetDir)) {
    if (!options.force) {
      const ok = await confirmOverwrite(targetDir);
      if (!ok) {
        log.warn('Aborted. No files written.');
        return { written: 0, skipped: true };
      }
    } else {
      log.warn(`--force set: overwriting ${targetDir}.`);
    }
  }

  await ensureDir(targetDir);

  const spinner = ora({ text: 'Installing rstack agent framework...', color: 'cyan' }).start();
  let copyResult;
  try {
    copyResult = await copyTemplate(TEMPLATE_DIR, targetDir, { overwrite: true });
    spinner.succeed(chalk.green(`Installed ${copyResult.filesCopied} files into .claude/`));
  } catch (err) {
    spinner.fail(chalk.red('Failed to install rstack agent framework'));
    throw err;
  }

  log.success('rstack-agents installed.');
  log.info(`  Agents:  ${copyResult.agents} files`);
  log.info(`  Skills:  ${copyResult.skills} entries`);
  log.info(`  Plugins: ${copyResult.plugins} entries`);
  log.info(`  Hooks:   ${copyResult.hooks} files`);
  log.info('');
  log.info('Next steps:');
  log.info('  1. Open Claude Code in this directory');
  log.info('  2. Run `rstack-agents list agents` to see available specialists');
  log.info('  3. Run `rstack-agents validate` to verify the install');

  return copyResult;
}
