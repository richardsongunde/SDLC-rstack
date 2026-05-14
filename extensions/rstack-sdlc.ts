import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, writeFile, appendFile } from "node:fs/promises";
import { basename, dirname, join, relative, resolve } from "node:path";

const RSTACK_VERSION = "0.2.0";

type RegistryItem = {
  id: string;
  name: string;
  kind: "agent" | "skill" | "plugin";
  path: string;
  description?: string;
  domains: string[];
  stageAffinity: string[];
};

type RunManifest = {
  run_id: string;
  created_at: string;
  updated_at: string;
  goal: string;
  mode: "interactive" | "express";
  status: "STARTED" | "CLARIFYING" | "PLANNED" | "IN_PROGRESS" | "BLOCKED" | "DONE";
  project_root: string;
  rstack_version: string;
};

type LifecycleStage = {
  id: string;
  title: string;
  domains: string[];
  artifact: string;
  description: string;
  acceptanceCriteria: string[];
  validationChecks: string[];
};

const lifecycleStages: LifecycleStage[] = [
  {
    id: "001-product-clarification",
    title: "Product clarification",
    domains: ["product", "docs"],
    artifact: "product-brief.md",
    description: "Confirm target users, business outcome, must-have behavior, non-goals, risks, and open decisions.",
    acceptanceCriteria: ["User goal is restated in concrete product terms", "Open questions are resolved or explicitly marked NEEDS_CONTEXT", "Non-goals and release boundaries are listed"],
    validationChecks: ["Product brief exists", "Ambiguities are not silently guessed", "Recommended option is provided for each unresolved decision"],
  },
  {
    id: "002-requirements",
    title: "Requirements and acceptance criteria",
    domains: ["product", "sdlc"],
    artifact: "requirements.json",
    description: "Convert the clarified goal into testable functional requirements, non-functional requirements, user stories, and out-of-scope items.",
    acceptanceCriteria: ["Every requirement has observable acceptance criteria", "NFRs use measurable targets where possible", "Out-of-scope items are explicit"],
    validationChecks: ["No vague requirements like fast/easy/secure without measurable criteria", "Acceptance criteria can be tested by QA", "Requirements map to the original goal"],
  },
  {
    id: "003-architecture",
    title: "Architecture and technical design",
    domains: ["backend", "frontend", "devops", "data", "security"],
    artifact: "architecture.md",
    description: "Design the system, data flow, interfaces, storage, security boundaries, deployment shape, and trade-offs.",
    acceptanceCriteria: ["Architecture maps to requirements", "Key trade-offs and failure modes are documented", "Security and data boundaries are identified"],
    validationChecks: ["No unexplained tech stack choices", "Interfaces and data models are clear enough to build", "Threat-sensitive areas are flagged"],
  },
  {
    id: "004-implementation",
    title: "Implementation",
    domains: ["backend", "frontend", "data"],
    artifact: "implementation-report.json",
    description: "Build scoped, working code that follows the architecture and existing project conventions.",
    acceptanceCriteria: ["Required behavior is implemented without placeholder TODO stubs", "Files changed stay within scope", "Relevant local verification command is run or blocked with reason"],
    validationChecks: ["Code starts or compiles when applicable", "Error handling exists for expected failure paths", "No unrelated refactors or broad rewrites"],
  },
  {
    id: "005-testing",
    title: "Testing and QA",
    domains: ["qa"],
    artifact: "qa-report.json",
    description: "Create or run unit, integration, browser, and regression checks appropriate to the project.",
    acceptanceCriteria: ["Critical acceptance criteria have tests or manual verification steps", "Test command output is captured", "Known coverage gaps are listed"],
    validationChecks: ["Tests actually ran or blockers are explicit", "Failures include root-cause direction", "No false pass when tests were skipped"],
  },
  {
    id: "006-security-review",
    title: "Security review",
    domains: ["security", "backend", "devops"],
    artifact: "security-review.md",
    description: "Review auth, secrets, input validation, permissions, PII, dependency, and deployment risks.",
    acceptanceCriteria: ["Security-sensitive surfaces are enumerated", "Critical and high risks have mitigation or block recommendation", "Secrets and destructive operations are checked"],
    validationChecks: ["OWASP-style risks considered", "No secrets are introduced", "Auth/payment/PII changes get conservative review"],
  },
  {
    id: "007-documentation",
    title: "Documentation",
    domains: ["docs", "product"],
    artifact: "handoff.md",
    description: "Update user, developer, release, and operations documentation needed to maintain the work.",
    acceptanceCriteria: ["Setup and run instructions are current", "Changed behavior is documented", "Known limitations and next steps are listed"],
    validationChecks: ["Docs match implemented behavior", "No stale commands are introduced", "Handoff is useful to a new maintainer"],
  },
  {
    id: "008-release-readiness",
    title: "Release readiness",
    domains: ["devops", "qa", "docs", "security"],
    artifact: "release-readiness.json",
    description: "Verify package boundaries, tests, docs, versioning, git status, and release blockers before shipping.",
    acceptanceCriteria: ["All previous required tasks are PASS or explicitly accepted with concerns", "Release blockers are listed", "Next release or PR action is clear"],
    validationChecks: ["Package excludes private files", "Tests pass", "No unreviewed destructive or deployment step is implied"],
  },
];

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 64) || "sdlc-run";
}

function timestamp(): string {
  return new Date().toISOString();
}

function runId(goal: string): string {
  return `${timestamp().replace(/[:.]/g, "-")}-${slugify(goal)}`;
}

function findProjectRoot(): string {
  return resolve(process.env.RSTACK_PROJECT_ROOT || process.cwd());
}

function rstackDir(projectRoot = findProjectRoot()): string {
  return resolve(process.env.RSTACK_STATE_DIR || join(projectRoot, ".rstack"));
}

function runsDir(projectRoot = findProjectRoot()): string {
  return join(rstackDir(projectRoot), "runs");
}

function memoryDir(projectRoot = findProjectRoot()): string {
  return join(rstackDir(projectRoot), "memory");
}

function registryDir(projectRoot = findProjectRoot()): string {
  return join(rstackDir(projectRoot), "registry");
}

function parseFrontmatter(raw: string): Record<string, string> {
  if (!raw.startsWith("---")) return {};
  const end = raw.indexOf("\n---", 3);
  if (end === -1) return {};
  const block = raw.slice(3, end).trim();
  const result: Record<string, string> = {};
  let currentKey = "";
  for (const line of block.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (match) {
      currentKey = match[1];
      result[currentKey] = match[2].replace(/^['"]|['"]$/g, "");
    } else if (currentKey && /^\s+/.test(line)) {
      result[currentKey] = `${result[currentKey]} ${line.trim()}`.trim();
    }
  }
  return result;
}

async function walk(dir: string, predicate: (path: string) => boolean): Promise<string[]> {
  if (!existsSync(dir)) return [];
  const entries = await readdir(dir, { withFileTypes: true });
  const out: string[] = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(path, predicate));
    else if (predicate(path)) out.push(path);
  }
  return out;
}

function inferDomains(path: string, text: string): string[] {
  const lower = `${path} ${text}`.toLowerCase();
  const domains = ["product", "frontend", "backend", "devops", "qa", "security", "data", "docs", "sdlc", "crypto"]
    .filter((domain) => lower.includes(domain));
  return domains.length ? [...new Set(domains)] : ["general"];
}

function inferStageAffinity(domains: string[]): string[] {
  const map: Record<string, string[]> = {
    product: ["clarification", "requirements", "planning"],
    sdlc: ["requirements", "planning", "release"],
    frontend: ["architecture", "implementation", "testing"],
    backend: ["architecture", "implementation", "testing"],
    data: ["architecture", "implementation"],
    devops: ["architecture", "release"],
    qa: ["testing", "validation"],
    security: ["security", "validation"],
    docs: ["documentation", "release"],
  };
  return [...new Set(domains.flatMap((domain) => map[domain] || ["implementation"]))];
}

async function loadRegistry(projectRoot = findProjectRoot()): Promise<RegistryItem[]> {
  const cached = join(registryDir(projectRoot), "registry.json");
  if (existsSync(cached)) {
    try { return JSON.parse(await readFile(cached, "utf8")); } catch {}
  }
  return buildRegistry(projectRoot);
}

async function buildRegistry(projectRoot = findProjectRoot()): Promise<RegistryItem[]> {
  const items: RegistryItem[] = [];
  const agentFiles = await walk(join(projectRoot, ".claude", "agents"), (path) => path.endsWith(".md"));
  for (const file of agentFiles) {
    const raw = await readFile(file, "utf8");
    const fm = parseFrontmatter(raw);
    const rel = relative(projectRoot, file);
    const name = fm.name || basename(file, ".md");
    const domains = inferDomains(rel, `${name} ${fm.description || ""}`);
    items.push({
      id: `agent.${slugify(name)}`,
      name,
      kind: "agent",
      path: rel,
      description: fm.description,
      domains,
      stageAffinity: inferStageAffinity(domains),
    });
  }

  const skillFiles = await walk(join(projectRoot, ".claude", "skills"), (path) => basename(path) === "SKILL.md");
  for (const file of skillFiles) {
    const raw = await readFile(file, "utf8");
    const fm = parseFrontmatter(raw);
    const rel = relative(projectRoot, file);
    const name = fm.name || basename(dirname(file));
    const domains = inferDomains(rel, `${name} ${fm.description || ""}`);
    items.push({
      id: `skill.${slugify(name)}`,
      name,
      kind: "skill",
      path: rel,
      description: fm.description,
      domains,
      stageAffinity: inferStageAffinity(domains),
    });
  }

  const pluginFiles = await walk(join(projectRoot, ".claude", "plugins"), (path) => basename(path) === "plugin.json");
  for (const file of pluginFiles) {
    const rel = relative(projectRoot, file);
    try {
      const plugin = JSON.parse(await readFile(file, "utf8"));
      const name = plugin.name || basename(dirname(file));
      const description = plugin.description || undefined;
      const domains = inferDomains(rel, `${name} ${description || ""}`);
      items.push({ id: `plugin.${slugify(name)}`, name, kind: "plugin", path: rel, description, domains, stageAffinity: inferStageAffinity(domains) });
    } catch {}
  }

  await mkdir(registryDir(projectRoot), { recursive: true });
  await writeFile(join(registryDir(projectRoot), "registry.json"), JSON.stringify(items, null, 2));
  return items;
}

async function latestRun(projectRoot = findProjectRoot()): Promise<string | undefined> {
  if (!existsSync(runsDir(projectRoot))) return undefined;
  const entries = (await readdir(runsDir(projectRoot), { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  return entries.at(-1);
}

async function readManifest(projectRoot: string, id?: string): Promise<RunManifest> {
  const selected = id || await latestRun(projectRoot);
  if (!selected) throw new Error("No RStack run found. Start one with sdlc_start first.");
  return JSON.parse(await readFile(join(runsDir(projectRoot), selected, "manifest.json"), "utf8"));
}

async function writeManifest(manifest: RunManifest): Promise<void> {
  manifest.updated_at = timestamp();
  const dir = join(runsDir(manifest.project_root), manifest.run_id);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "manifest.json"), JSON.stringify(manifest, null, 2));
}

async function appendEvent(projectRoot: string, id: string, event: Record<string, unknown>): Promise<void> {
  await appendFile(join(runsDir(projectRoot), id, "events.jsonl"), JSON.stringify({ ts: timestamp(), ...event }) + "\n");
}

function selectRegistry(registry: RegistryItem[], domains: string[], limit = 6): RegistryItem[] {
  const scored = registry.map((item) => ({
    item,
    score: item.domains.filter((domain) => domains.includes(domain)).length * 2 + item.stageAffinity.filter((stage) => domains.includes(stage)).length,
  }));
  return scored.filter((entry) => entry.score > 0).sort((a, b) => b.score - a.score).slice(0, limit).map((entry) => entry.item);
}

function builderPrompt(task: any, selected: RegistryItem[]): string {
  return `# RStack Builder Task: ${task.title}\n\nYou are acting as the builder team for this bounded SDLC task. Follow .claude/agents/OPERATING-STANDARD.md when available.\n\n## Scope\n${task.description}\n\n## Acceptance criteria\n${(task.acceptance_criteria || []).map((item: string) => `- ${item}`).join("\n") || "- Meet the task description without scope creep."}\n\n## Validation checklist\n${(task.validation_checks || []).map((item: string) => `- ${item}`).join("\n") || "- Provide evidence for every claim."}\n\n## Artifact target\nWrite stage artifacts under: ${task.artifact_path}\n\n## Rules\n- Make only the changes needed for this task.\n- If requirements are ambiguous, stop and report NEEDS_CONTEXT in the summary.\n- If the existing code appears unrelated or broken beyond this task, stop and report BLOCKED.\n- Run relevant checks before marking the task complete.\n- Write the builder contract to ${task.output_dir}/builder.json.\n\n## Recommended specialists to load\n${selected.map((item) => `- ${item.kind}: ${item.name} (${item.path})`).join("\n") || "- No specialist registry entries found. Use general engineering judgment."}\n\n## Builder contract\n\`\`\`json\n{\n  "task_id": "${task.id}",\n  "agent": "builder",\n  "status": "PASS|FAIL|BLOCKED|DONE_WITH_CONCERNS",\n  "summary": "",\n  "files_modified": [],\n  "tests_run": [],\n  "risks": [],\n  "next_steps": []\n}\n\`\`\`\n`;
}

export default function (pi: ExtensionAPI) {
  pi.on("session_start", async (_event, ctx) => {
    const projectRoot = findProjectRoot();
    await mkdir(rstackDir(projectRoot), { recursive: true });
    await mkdir(memoryDir(projectRoot), { recursive: true });
    ctx.ui.setStatus("rstack", "RStack SDLC ready");
  });

  pi.on("session_shutdown", async () => {
    const projectRoot = findProjectRoot();
    const id = await latestRun(projectRoot);
    if (id) await appendEvent(projectRoot, id, { type: "session_shutdown" });
  });

  pi.registerTool({
    name: "sdlc_start",
    label: "RStack Start SDLC Run",
    description: "Start a clean .rstack/runs lifecycle for building, testing, validating, and shipping software with agent teams.",
    parameters: Type.Object({
      goal: Type.String({ description: "Software goal, feature, app, bug fix, or release objective." }),
      mode: Type.Optional(Type.Union([Type.Literal("interactive"), Type.Literal("express")], { default: "interactive" })),
    }),
    async execute(_id, params) {
      const projectRoot = findProjectRoot();
      const id = runId(params.goal);
      const dir = join(runsDir(projectRoot), id);
      await mkdir(join(dir, "tasks"), { recursive: true });
      await mkdir(memoryDir(projectRoot), { recursive: true });
      const manifest: RunManifest = {
        run_id: id,
        created_at: timestamp(),
        updated_at: timestamp(),
        goal: params.goal,
        mode: params.mode ?? "interactive",
        status: "STARTED",
        project_root: projectRoot,
        rstack_version: RSTACK_VERSION,
      };
      await writeManifest(manifest);
      await writeFile(join(dir, "context.md"), `# RStack Run Context\n\nGoal: ${params.goal}\n\nMode: ${manifest.mode}\n\n## Product-owner notes\n\n`);
      await mkdir(join(dir, "artifacts"), { recursive: true });
      await appendEvent(projectRoot, id, { type: "run_started", goal: params.goal });
      return { content: [{ type: "text", text: `Started RStack SDLC run ${id}\nRun directory: ${relative(projectRoot, dir)}\nNext: call sdlc_clarify for product-owner decisions, or sdlc_plan if the goal is already clear.` }], details: manifest };
    },
  });

  pi.registerTool({
    name: "sdlc_clarify",
    label: "RStack Clarify",
    description: "Capture product-owner answers before planning so RStack does not guess important requirements.",
    parameters: Type.Object({
      run_id: Type.Optional(Type.String()),
      answers: Type.Optional(Type.Array(Type.String({ description: "Product-owner answers or decisions to append to context.md." }))),
    }),
    async execute(_id, params) {
      const projectRoot = findProjectRoot();
      const manifest = await readManifest(projectRoot, params.run_id);
      const runDir = join(runsDir(projectRoot), manifest.run_id);
      const questions = [
        "Who is the primary user and what job are they trying to complete?",
        "What is the smallest release that would be useful in production?",
        "Which tech stack, existing repo conventions, or hosting target must RStack respect?",
        "What data, auth, payment, PII, or compliance risks must be handled conservatively?",
        "What should be explicitly out of scope for this run?",
      ];
      if (params.answers?.length) {
        await appendFile(join(runDir, "context.md"), `\n## Clarification answers (${timestamp()})\n${params.answers.map((answer) => `- ${answer}`).join("\n")}\n`);
        manifest.status = "CLARIFYING";
        await writeManifest(manifest);
        await appendEvent(projectRoot, manifest.run_id, { type: "clarification_answers_added", count: params.answers.length });
        return { content: [{ type: "text", text: `Added ${params.answers.length} clarification answer(s) to ${relative(projectRoot, join(runDir, "context.md"))}. Next: call sdlc_plan.` }], details: { manifest, answers: params.answers } };
      }
      manifest.status = "CLARIFYING";
      await writeManifest(manifest);
      await appendEvent(projectRoot, manifest.run_id, { type: "clarification_requested", question_count: questions.length });
      const text = `Before planning, answer only what materially changes the build. Recommended questions:\n${questions.map((q, i) => `${i + 1}. ${q}`).join("\n")}\n\nCall sdlc_clarify again with answers, or call sdlc_plan if these are already clear.`;
      return { content: [{ type: "text", text }], details: { manifest, questions } };
    },
  });

  pi.registerTool({
    name: "sdlc_plan",
    label: "RStack Plan",
    description: "Create a full software lifecycle plan and task graph for the active RStack run.",
    parameters: Type.Object({
      run_id: Type.Optional(Type.String()),
      constraints: Type.Optional(Type.Array(Type.String())),
      domains: Type.Optional(Type.Array(Type.String())),
    }),
    async execute(_id, params) {
      const projectRoot = findProjectRoot();
      const manifest = await readManifest(projectRoot, params.run_id);
      const registry = await loadRegistry(projectRoot);
      const runDir = join(runsDir(projectRoot), manifest.run_id);
      const chosenDomains = params.domains?.length ? params.domains : ["product", "frontend", "backend", "qa", "security", "docs", "devops"];
      const tasks = lifecycleStages.map((stage) => {
        const outputDir = `.rstack/runs/${manifest.run_id}/tasks/${stage.id}`;
        return {
          id: stage.id,
          title: stage.title,
          status: "PENDING",
          domains: stage.domains,
          description: `${stage.description}\n\nGoal: ${manifest.goal}`,
          acceptance_criteria: stage.acceptanceCriteria,
          validation_checks: stage.validationChecks,
          artifact_path: `.rstack/runs/${manifest.run_id}/artifacts/${stage.artifact}`,
          output_dir: outputDir,
          specialists: selectRegistry(registry, [...stage.domains, ...chosenDomains], 5).map((item) => item.id),
        };
      });
      for (const task of tasks) await mkdir(join(projectRoot, task.output_dir), { recursive: true });
      await mkdir(join(runDir, "artifacts"), { recursive: true });
      const plan = `# RStack SDLC Plan\n\nGoal: ${manifest.goal}\n\nMode: ${manifest.mode}\n\n## Constraints\n${(params.constraints || ["Ask before destructive actions", "Validate before release", "Keep scope bounded", "Do not claim DONE without evidence", "Use .rstack/runs state, not legacy outputs/team_state"]).map((c) => `- ${c}`).join("\n")}\n\n## Lifecycle\n${tasks.map((t) => `- [ ] ${t.id}: ${t.title}\n  - Artifact: ${t.artifact_path}\n  - Acceptance: ${t.acceptance_criteria.join("; ")}`).join("\n")}\n\n## Operating model\n\nThe orchestrator creates bounded builder tasks. Validators check each task before the run advances. User approval is required for major product decisions, destructive changes, and release/merge actions.\n`;
      await writeFile(join(runDir, "plan.md"), plan);
      await writeFile(join(runDir, "tasks.json"), JSON.stringify({ run_id: manifest.run_id, tasks }, null, 2));
      manifest.status = "PLANNED";
      await writeManifest(manifest);
      await appendEvent(projectRoot, manifest.run_id, { type: "plan_created", task_count: tasks.length });
      return { content: [{ type: "text", text: `Created plan for ${manifest.run_id}\nTasks: ${tasks.length}\nPlan: ${relative(projectRoot, join(runDir, "plan.md"))}\nNext: call sdlc_build_next.` }], details: { manifest, tasks } };
    },
  });

  pi.registerTool({
    name: "sdlc_build_next",
    label: "RStack Build Next",
    description: "Prepare the next pending builder task with specialist context and an output contract.",
    parameters: Type.Object({ run_id: Type.Optional(Type.String()) }),
    async execute(_id, params) {
      const projectRoot = findProjectRoot();
      const manifest = await readManifest(projectRoot, params.run_id);
      const tasksPath = join(runsDir(projectRoot), manifest.run_id, "tasks.json");
      const registry = await loadRegistry(projectRoot);
      const taskState = JSON.parse(await readFile(tasksPath, "utf8"));
      const task = taskState.tasks.find((t: any) => t.status === "PENDING" || t.status === "READY") || taskState.tasks.find((t: any) => t.status === "FAIL");
      if (!task) return { content: [{ type: "text", text: `No pending task for ${manifest.run_id}. Run sdlc_status or sdlc_validate for final checks.` }], details: taskState };
      task.status = "IN_PROGRESS";
      await writeFile(tasksPath, JSON.stringify(taskState, null, 2));
      const selected = registry.filter((item) => task.specialists?.includes(item.id));
      const prompt = builderPrompt(task, selected);
      await writeFile(join(projectRoot, task.output_dir, "prompt.md"), prompt);
      manifest.status = "IN_PROGRESS";
      await writeManifest(manifest);
      await appendEvent(projectRoot, manifest.run_id, { type: "builder_task_prepared", task_id: task.id });
      return { content: [{ type: "text", text: prompt }], details: { run_id: manifest.run_id, task } };
    },
  });

  pi.registerTool({
    name: "sdlc_validate",
    label: "RStack Validate",
    description: "Validate an RStack task contract and produce a read-only validation report.",
    parameters: Type.Object({
      run_id: Type.Optional(Type.String()),
      task_id: Type.Optional(Type.String()),
    }),
    async execute(_id, params) {
      const projectRoot = findProjectRoot();
      const manifest = await readManifest(projectRoot, params.run_id);
      const tasksPath = join(runsDir(projectRoot), manifest.run_id, "tasks.json");
      const taskState = JSON.parse(await readFile(tasksPath, "utf8"));
      const task = params.task_id ? taskState.tasks.find((t: any) => t.id === params.task_id) : taskState.tasks.find((t: any) => t.status === "IN_PROGRESS");
      if (!task) throw new Error("No task selected for validation.");
      const builderPath = join(projectRoot, task.output_dir, "builder.json");
      const checks = [];
      let status = "PASS";
      if (!existsSync(builderPath)) {
        status = "FAIL";
        checks.push({ name: "builder_contract_exists", status: "FAIL", evidence: `${task.output_dir}/builder.json not found` });
      } else {
        try {
          const builder = JSON.parse(await readFile(builderPath, "utf8"));
          for (const field of ["task_id", "status", "summary", "files_modified", "tests_run", "risks", "next_steps"]) {
            const ok = Object.prototype.hasOwnProperty.call(builder, field);
            checks.push({ name: `builder_has_${field}`, status: ok ? "PASS" : "FAIL", evidence: ok ? "present" : "missing" });
            if (!ok) status = "FAIL";
          }
          if (builder.task_id !== task.id) {
            status = "FAIL";
            checks.push({ name: "task_id_matches", status: "FAIL", evidence: `expected ${task.id}, got ${builder.task_id}` });
          }
          if (!["PASS", "FAIL", "BLOCKED", "DONE_WITH_CONCERNS"].includes(builder.status)) {
            status = "FAIL";
            checks.push({ name: "builder_status_allowed", status: "FAIL", evidence: `invalid status ${builder.status}` });
          } else {
            checks.push({ name: "builder_status_allowed", status: "PASS", evidence: builder.status });
          }
          for (const field of ["files_modified", "tests_run", "risks", "next_steps"]) {
            const ok = Array.isArray(builder[field]);
            checks.push({ name: `builder_${field}_is_array`, status: ok ? "PASS" : "FAIL", evidence: ok ? `${builder[field].length} item(s)` : "not an array" });
            if (!ok) status = "FAIL";
          }
          if (Array.isArray(builder.files_modified)) {
            for (const file of builder.files_modified.slice(0, 20)) {
              if (typeof file !== "string") continue;
              const exists = existsSync(resolve(projectRoot, file));
              checks.push({ name: "modified_file_exists", status: exists ? "PASS" : "FAIL", evidence: file });
              if (!exists) status = "FAIL";
            }
          }
          if (builder.status === "BLOCKED" || builder.status === "FAIL") {
            status = "FAIL";
            checks.push({ name: "builder_reported_not_pass", status: "FAIL", evidence: builder.status });
          }
        } catch (error) {
          status = "FAIL";
          checks.push({ name: "builder_contract_json", status: "FAIL", evidence: String(error) });
        }
      }
      const validation = { task_id: task.id, validator: "rstack-pi-extension", status, checks, issues: checks.filter((c: any) => c.status === "FAIL"), retry_recommendation: status === "PASS" ? "none" : "retry_builder" };
      await writeFile(join(projectRoot, task.output_dir, "validation.json"), JSON.stringify(validation, null, 2));
      task.status = status;
      await writeFile(tasksPath, JSON.stringify(taskState, null, 2));
      await appendEvent(projectRoot, manifest.run_id, { type: "task_validated", task_id: task.id, status });
      return { content: [{ type: "text", text: `Validation ${status} for ${task.id}\nReport: ${task.output_dir}/validation.json` }], details: validation };
    },
  });

  pi.registerTool({
    name: "sdlc_status",
    label: "RStack Status",
    description: "Show active RStack run status, task progress, registry counts, and next recommended action.",
    parameters: Type.Object({ run_id: Type.Optional(Type.String()) }),
    async execute(_id, params) {
      const projectRoot = findProjectRoot();
      const manifest = await readManifest(projectRoot, params.run_id);
      const registry = await loadRegistry(projectRoot);
      const tasksPath = join(runsDir(projectRoot), manifest.run_id, "tasks.json");
      const tasks = existsSync(tasksPath) ? JSON.parse(await readFile(tasksPath, "utf8")).tasks : [];
      const counts = tasks.reduce((acc: Record<string, number>, task: any) => { acc[task.status] = (acc[task.status] || 0) + 1; return acc; }, {});
      const next = tasks.find((t: any) => ["PENDING", "READY", "FAIL", "IN_PROGRESS"].includes(t.status));
      if (tasks.length > 0 && !next && tasks.every((t: any) => t.status === "PASS")) {
        manifest.status = "DONE";
        await writeManifest(manifest);
      }
      const recommended = next
        ? next.status === "IN_PROGRESS" ? `Validate ${next.id} with sdlc_validate` : `Build ${next.id} with sdlc_build_next`
        : manifest.status === "DONE" ? "Run final documentation/release handoff or sdlc_memory append" : "No pending tasks";
      const text = [`Run: ${manifest.run_id}`, `Goal: ${manifest.goal}`, `Status: ${manifest.status}`, `Tasks: ${JSON.stringify(counts)}`, `Registry: ${registry.length} items`, `Next: ${recommended}`].join("\n");
      return { content: [{ type: "text", text }], details: { manifest, counts, next, registry_count: registry.length, recommended } };
    },
  });

  pi.registerTool({
    name: "sdlc_memory",
    label: "RStack Memory",
    description: "Search or append RStack project learnings used by future SDLC runs.",
    parameters: Type.Object({
      action: Type.Union([Type.Literal("search"), Type.Literal("append"), Type.Literal("summarize")]),
      query: Type.Optional(Type.String()),
      learning: Type.Optional(Type.String({ description: "Learning text to append when action=append." })),
    }),
    async execute(_id, params) {
      const projectRoot = findProjectRoot();
      await mkdir(memoryDir(projectRoot), { recursive: true });
      const path = join(memoryDir(projectRoot), "learnings.jsonl");
      if (params.action === "append") {
        if (!params.learning) throw new Error("learning is required when action=append");
        const entry = { ts: timestamp(), learning: params.learning };
        await appendFile(path, JSON.stringify(entry) + "\n");
        const details: Record<string, unknown> = { action: "append", entry };
        return { content: [{ type: "text", text: `Appended RStack learning to ${relative(projectRoot, path)}` }], details };
      }
      const raw = existsSync(path) ? await readFile(path, "utf8") : "";
      const lines = raw.split(/\r?\n/).filter(Boolean);
      const query = params.query?.toLowerCase();
      const matches = query ? lines.filter((line) => line.toLowerCase().includes(query)).slice(-20) : lines.slice(-20);
      const details: Record<string, unknown> = { action: params.action, count: matches.length };
      return { content: [{ type: "text", text: matches.length ? matches.join("\n") : "No RStack learnings found." }], details };
    },
  });

  pi.registerCommand("sdlc", {
    description: "Show RStack SDLC extension guidance.",
    handler: async (_args, ctx) => {
      ctx.ui.notify("RStack SDLC tools: sdlc_start → sdlc_clarify → sdlc_plan → sdlc_build_next → sdlc_validate → sdlc_status", "info");
    },
  });
}
