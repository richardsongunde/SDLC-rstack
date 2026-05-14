/**
 * `rstack-agents list <agents|skills|plugins>` and `rstack-agents add plugin <name>`.
 *
 * Reads from the local .claude/ directory in the current project.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdir, readFile, stat } from 'node:fs/promises';
import fsExtra from 'fs-extra';
import chalk from 'chalk';
import { log } from '../utils/logger.js';
import { copyTemplate } from '../utils/copy.js';

const { pathExists, ensureDir } = fsExtra;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = path.resolve(__dirname, '..', '..');
const TEMPLATE_DIR = path.join(PACKAGE_ROOT, 'templates', '.claude');

const DOMAIN_KEYWORDS = {
  core: ['orchestrator', 'builder', 'validator', 'planner', 'router', 'core'],
  sdlc: ['sdlc', 'environment', 'transcript', 'requirements', 'planning', 'jira', 'architecture', 'deployment', 'summary', 'feedback-loop'],
  backend: ['backend', 'api', 'server', 'database', 'sql', 'graphql', 'rest', 'microservice'],
  frontend: ['frontend', 'react', 'vue', 'angular', 'ui', 'css', 'design-system', 'tailwind'],
  devops: ['devops', 'kubernetes', 'docker', 'terraform', 'ci-cd', 'aws', 'azure', 'gcp', 'infra'],
  qa: ['qa', 'test', 'e2e', 'playwright', 'cypress', 'unit-test'],
  security: ['security', 'owasp', 'audit', 'pentest', 'compliance', 'threat'],
  data: ['data', 'analytics', 'etl', 'warehouse', 'pipeline', 'spark', 'hadoop'],
  product: ['product', 'pm', 'prd', 'roadmap', 'feature'],
  docs: ['docs', 'documentation', 'technical-writer', 'changelog'],
  crypto: ['crypto', 'blockchain', 'web3', 'solidity', 'ethereum']
};

function classifyAgent(filename) {
  const lower = filename.toLowerCase();
  // SDLC files start with two digits (00-, 01-, ...)
  if (/^\d{2}-/.test(lower)) return 'sdlc';
  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return domain;
    }
  }
  return 'other';
}

function parseFrontmatter(content) {
  if (!content.startsWith('---')) return {};
  const end = content.indexOf('\n---', 3);
  if (end === -1) return {};
  const block = content.slice(3, end);
  const out = {};
  for (const line of block.split('\n')) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (match) out[match[1]] = match[2].trim().replace(/^["']|["']$/g, '');
  }
  return out;
}

async function readAgentMeta(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    const fm = parseFrontmatter(content);
    return {
      name: fm.name || path.basename(filePath, '.md'),
      description: fm.description || ''
    };
  } catch {
    return { name: path.basename(filePath, '.md'), description: '' };
  }
}

function localClaudeDir() {
  return path.join(process.cwd(), '.claude');
}

async function ensureClaudeInstalled() {
  const dir = localClaudeDir();
  if (!(await pathExists(dir))) {
    throw new Error(`.claude/ not found in ${process.cwd()}. Run \`rstack-agents init\` first.`);
  }
  return dir;
}

export async function listAgents() {
  const claudeDir = await ensureClaudeInstalled();
  const agentsDir = path.join(claudeDir, 'agents');
  if (!(await pathExists(agentsDir))) {
    log.warn('No agents/ directory found.');
    return;
  }
  const entries = await readdir(agentsDir);
  const mdFiles = entries.filter((e) => e.endsWith('.md'));

  const grouped = {};
  for (const file of mdFiles) {
    const meta = await readAgentMeta(path.join(agentsDir, file));
    const domain = classifyAgent(file);
    if (!grouped[domain]) grouped[domain] = [];
    grouped[domain].push(meta);
  }

  const order = ['core', 'sdlc', 'backend', 'frontend', 'devops', 'qa', 'security', 'data', 'product', 'docs', 'crypto', 'other'];
  console.log(chalk.bold(`\nrstack agents (${mdFiles.length} total)\n`));
  for (const domain of order) {
    if (!grouped[domain] || grouped[domain].length === 0) continue;
    console.log(chalk.cyan.bold(`  ${domain} (${grouped[domain].length})`));
    grouped[domain].sort((a, b) => a.name.localeCompare(b.name));
    for (const agent of grouped[domain]) {
      const desc = agent.description ? chalk.gray(` — ${agent.description.slice(0, 80)}`) : '';
      console.log(`    ${chalk.green(agent.name)}${desc}`);
    }
    console.log('');
  }
}

export async function listSkills() {
  const claudeDir = await ensureClaudeInstalled();
  const skillsDir = path.join(claudeDir, 'skills');
  if (!(await pathExists(skillsDir))) {
    log.warn('No skills/ directory found.');
    return;
  }
  const entries = await readdir(skillsDir);
  const skills = [];
  for (const entry of entries) {
    const full = path.join(skillsDir, entry);
    const st = await stat(full).catch(() => null);
    if (!st || !st.isDirectory()) continue;
    const skillFile = path.join(full, 'SKILL.md');
    if (await pathExists(skillFile)) {
      const meta = await readAgentMeta(skillFile);
      skills.push({ name: entry, description: meta.description });
    } else {
      skills.push({ name: entry, description: '' });
    }
  }
  skills.sort((a, b) => a.name.localeCompare(b.name));
  console.log(chalk.bold(`\nrstack skills (${skills.length} total)\n`));
  for (const s of skills) {
    const desc = s.description ? chalk.gray(` — ${s.description.slice(0, 100)}`) : '';
    console.log(`  ${chalk.green(s.name)}${desc}`);
  }
  console.log('');
}

async function readPluginMeta(pluginDir, name) {
  const candidates = ['plugin.json', 'package.json'];
  for (const c of candidates) {
    const fp = path.join(pluginDir, c);
    if (await pathExists(fp)) {
      try {
        const raw = await readFile(fp, 'utf8');
        const json = JSON.parse(raw);
        return {
          name: json.name || name,
          description: json.description || ''
        };
      } catch {
        // fall through
      }
    }
  }
  return { name, description: '' };
}

export async function listPlugins() {
  const claudeDir = await ensureClaudeInstalled();
  const pluginsDir = path.join(claudeDir, 'plugins');
  if (!(await pathExists(pluginsDir))) {
    log.warn('No plugins/ directory found.');
    return;
  }
  const entries = await readdir(pluginsDir);
  const plugins = [];
  for (const entry of entries) {
    const full = path.join(pluginsDir, entry);
    const st = await stat(full).catch(() => null);
    if (!st || !st.isDirectory()) continue;
    plugins.push(await readPluginMeta(full, entry));
  }
  plugins.sort((a, b) => a.name.localeCompare(b.name));
  console.log(chalk.bold(`\nrstack plugins (${plugins.length} total)\n`));
  for (const p of plugins) {
    const desc = p.description ? chalk.gray(` — ${p.description.slice(0, 100)}`) : '';
    console.log(`  ${chalk.green(p.name)}${desc}`);
  }
  console.log('');
}

export async function addPlugin(name) {
  if (!name || !/^[a-z0-9][a-z0-9._-]*$/i.test(name)) {
    throw new Error(`Invalid plugin name "${name}". Use letters, digits, dots, dashes, underscores.`);
  }
  const src = path.join(TEMPLATE_DIR, 'plugins', name);
  const dst = path.join(localClaudeDir(), 'plugins', name);

  if (!(await pathExists(src))) {
    throw new Error(`Plugin "${name}" not found in package templates.`);
  }
  await ensureClaudeInstalled();
  await ensureDir(path.dirname(dst));
  if (await pathExists(dst)) {
    log.warn(`Plugin "${name}" already exists locally. Overwriting.`);
  }
  const result = await copyTemplate(src, dst, { overwrite: true });
  log.success(`Added plugin "${name}" (${result.filesCopied} files).`);
}
