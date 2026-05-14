#!/usr/bin/env node
/**
 * rstack-agents CLI entry point.
 *
 * Commands:
 *   rstack-agents init [--force]
 *   rstack-agents update [--agents-only]
 *   rstack-agents list <agents|skills|plugins>
 *   rstack-agents add plugin <name>
 *   rstack-agents validate
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from '../src/commands/init.js';
import { updateCommand } from '../src/commands/update.js';
import { listAgents, listSkills, listPlugins, addPlugin } from '../src/commands/list.js';
import { validateCommand } from '../src/commands/validate.js';
import { log } from '../src/utils/logger.js';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(resolve(__dirname, '..', 'package.json'), 'utf8'));

const program = new Command();

program
  .name('rstack-agents')
  .description('Scaffold the rstack Claude Code AI agent framework into any project')
  .version(pkg.version);

program
  .command('init')
  .description('Scaffold .claude/ into the current project')
  .option('-f, --force', 'overwrite an existing .claude/ directory without prompting', false)
  .action(async (options) => {
    try {
      await initCommand(options);
    } catch (err) {
      log.error(err.message);
      process.exit(1);
    }
  });

program
  .command('update')
  .description('Update the framework, preserving local user customizations')
  .option('--agents-only', 'only update agents, skills, and plugins', false)
  .action(async (options) => {
    try {
      await updateCommand(options);
    } catch (err) {
      log.error(err.message);
      process.exit(1);
    }
  });

const listCmd = program
  .command('list')
  .description('List available agents, skills, or plugins');

listCmd
  .command('agents')
  .description('List all agents grouped by domain')
  .action(async () => {
    try {
      await listAgents();
    } catch (err) {
      log.error(err.message);
      process.exit(1);
    }
  });

listCmd
  .command('skills')
  .description('List all skills with descriptions')
  .action(async () => {
    try {
      await listSkills();
    } catch (err) {
      log.error(err.message);
      process.exit(1);
    }
  });

listCmd
  .command('plugins')
  .description('List all plugins with descriptions')
  .action(async () => {
    try {
      await listPlugins();
    } catch (err) {
      log.error(err.message);
      process.exit(1);
    }
  });

program
  .command('add')
  .argument('<resource>', 'resource type to add (currently only "plugin")')
  .argument('<name>', 'name of the resource to add')
  .description('Add a specific plugin to the local .claude/plugins/ directory')
  .action(async (resource, name) => {
    try {
      if (resource !== 'plugin') {
        log.error(`Unknown resource type "${resource}". Only "plugin" is supported.`);
        process.exit(1);
      }
      await addPlugin(name);
    } catch (err) {
      log.error(err.message);
      process.exit(1);
    }
  });

program
  .command('validate')
  .description('Validate local .claude/ agent definitions')
  .action(async () => {
    try {
      const exitCode = await validateCommand();
      process.exit(exitCode);
    } catch (err) {
      log.error(err.message);
      process.exit(1);
    }
  });

program.on('command:*', (operands) => {
  console.error(chalk.red(`[rstack] Unknown command: ${operands.join(' ')}`));
  program.outputHelp();
  process.exit(1);
});

program.parseAsync(process.argv).catch((err) => {
  log.error(err.message);
  process.exit(1);
});
