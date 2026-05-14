# How Richardson Built the rstack SDLC Pipeline

A senior architect's walkthrough of `SDLC-rstack/.claude/`. Reads top-down: what the system is, how each folder contributes, how the pipeline actually runs, and the construction patterns Richardson used to put it all together.

## What you are looking at

This is not a normal codebase. It is a *meta-framework* — a directory that, when scaffolded into any project, turns Claude Code into a 200-agent engineering team with a deterministic SDLC pipeline running on top of it. The Node.js part of the repo (`bin/`, `src/`, `tests/`, `package.json`) is just the installer. The actual product lives in `.claude/`. Everything inside `.claude/` is markdown, YAML, JSON, and Python — no compiled code, because the runtime *is* Claude Code itself. Richardson is essentially programming an LLM-driven OS using prompts as instructions and JSON files as the message bus.

The architectural commitment in `ETHOS.md` is the key to reading the rest. Richardson's stated belief is that AI should be designed *from the agent layer up*, with the failure contract written before the happy path. Every file in `.claude/` is an expression of that commitment — agents declare their failure modes before their workflow, hooks block dangerous actions before they happen, validators check contracts before work moves forward. Once you see that pattern, the whole structure clicks.

## The folder map

```
.claude/
├── CLAUDE.md          ← project-level rules read on every session
├── AGENTS.md          ← discovery index: every agent/skill/plugin path
├── ETHOS.md           ← Richardson's builder principles (the "why")
├── DESIGN.md          ← visual aesthetic for outputs
├── CHANGELOG.md       ← user-facing release notes
├── VERSION            ← single line, branch-scoped semver
├── SKILL.md.tmpl      ← canonical template every skill is built from
├── settings.json      ← hook registrations + env + default agent
├── settings.local.json← user-machine overrides
├── sdlc-pipeline.yml  ← DAG of which SDLC stages run in parallel
│
├── agents/            ← 199 agent definitions
│   ├── core/          ← orchestrator, builder, validator (the runtime nucleus)
│   ├── sdlc/          ← 15 numbered stages (00-environment → 14-cost)
│   └── specialists/   ← backend, frontend, devops, qa, security, data,
│                        product, docs, crypto (177 domain experts)
│
├── skills/            ← 66 reusable workflow templates
├── plugins/           ← 72 domain packs (each with its own agents + skills)
├── commands/          ← 37 user-facing slash commands
├── hooks/             ← Python lifecycle scripts + validators
│
├── bin/               ← shell helpers (rstack-config, rstack-learnings, etc.)
├── scripts/           ← migration scripts that *built* the framework
├── tools/             ← subagent-catalog metadata
├── specs/             ← design docs for upcoming features
├── docs/              ← rendered architecture diagram + Python generator
├── outputs/           ← runtime state — JSON contracts written by agents
└── logs/              ← rolling tool-use logs (post_tool_use.json, etc.)
```

## Folder-by-folder, from the outside in

### Top-level docs (`CLAUDE.md`, `AGENTS.md`, `ETHOS.md`, `DESIGN.md`)

These are not generic README files — they are operational. `CLAUDE.md` is Richardson's instruction set to Claude itself, loaded automatically on every session. It declares the routing rules ("complex multi-step task → orchestrator", "domain specialist → AGENTS.md"), the JSON communication contract, the platform-agnostic skill rule, the commit style, and the non-negotiables. `AGENTS.md` is the index — a flat lookup table so any agent can find any other resource in under a second. `ETHOS.md` is the philosophical anchor; agents that drift toward sloppy work get pulled back by reading it. `DESIGN.md` governs visual outputs. Together these four files are the "constitution" — every agent reads them before acting.

### `settings.json` and `sdlc-pipeline.yml` — the configuration boundary

`settings.json` is where the runtime is wired to Claude Code itself. It registers hook commands against lifecycle events (`PreToolUse`, `PostToolUse`, `SessionStart`, `SessionEnd`, `SubagentStop`, `Stop`), turns on the experimental agent teams flag, sets the default agent to `orchestrator`, and enables a curated set of upstream Claude Code plugins (frontend-design, context7, code-review, github, superpowers, feature-dev, ralph-loop, pr-review-toolkit, commit-commands). `sdlc-pipeline.yml` defines the parallel execution DAG — which SDLC stages can run together, which depend on which, and which are optional. Phase 1 runs transcript and environment in parallel. Phase 3 runs documentation and planning in parallel after requirements. Phase 7 runs testing and compliance in parallel after code. This is how Richardson keeps the pipeline fast without losing the JSON contract guarantees.

### `agents/core/` — the runtime nucleus

Three files. `orchestrator.md` (opus) routes work and never executes. `builder.md` (opus) executes exactly one task per invocation, loads the relevant skill first, and writes a JSON state file when done. `validator.md` (opus) is read-only — it consumes the builder's JSON, runs checks, and writes a separate validation JSON with PASS or FAIL. This three-agent core is the entire runtime. Every other agent in the system is something the orchestrator delegates to. Richardson chose opus for all three because routing and verification are the highest-leverage decisions in the pipeline — getting them wrong wastes more compute than running a slightly-cheaper model.

### `agents/sdlc/` — the 15-stage pipeline

This is the centerpiece. Fifteen numbered markdown files, each a complete agent definition with frontmatter (name, description, model, tools, color), a "Voice" section (Richardson writes these in first person, with battle scars — the requirements agent has "watched a team build an entire user management system that nobody asked for"), a workflow with concrete bash commands, a JSON output schema, and a context recovery block that lets the agent resume after a session restart.

| # | Stage | Reads | Writes | Model |
|---|-------|-------|--------|-------|
| 00 | environment | — | environment_report.json | sonnet |
| 01 | transcript | environment_report | transcript.json | sonnet |
| 02 | requirements | transcript | requirement_spec.json | sonnet |
| 03 | documentation | requirement_spec | documentation.json | sonnet |
| 04 | planning | requirement_spec | plan.json | opus |
| 05 | jira | plan | jira_tickets.json | sonnet |
| 06 | architecture | jira + requirements | system_design.json + HLD.md | opus |
| 07 | code | system_design | code_report.json + actual source | opus |
| 08 | testing | code_report | test_report.json | sonnet |
| 09 | deployment | test_report | deployment_report.json | sonnet |
| 10 | summary | all upstream | summary.json + PROJECT_SUMMARY.md | sonnet |
| 11 | feedback-loop (opt) | summary | feedback.json | sonnet |
| 12 | security-threat-model (opt) | system_design | threat_model.json | opus |
| 13 | compliance-checker (opt) | system_design | compliance_report.json | sonnet |
| 14 | cost-estimation (opt) | plan + system_design | cost_estimate.json | sonnet |

Notice the model selection. Architecture and code use opus because mistakes there cascade. Routine reporting uses sonnet. Threat modeling escalates back to opus because security errors are silent killers. Richardson is buying the most intelligence exactly where it pays back.

### `agents/specialists/` — 177 domain experts

Nine subdirectories — backend (49), devops (34), product (19), qa (18), data (13), docs (13), security (11), frontend (10), crypto (10). Each agent is a single markdown file. The orchestrator references these by path, never by import. When the SDLC code stage needs to scaffold a Django service, it doesn't write the code itself — it delegates to `specialists/backend/django-developer.md`. This is how Richardson scales without bloating any single agent's context window. Each specialist only needs to know its own domain.

### `agents/specialists/crypto/` is the unusual one

It contains the same three "agent jobs" (coin-analyzer, investment-plays, market-agent) replicated across three model tiers (haiku, sonnet, opus). This is a cost-control pattern: cheap haiku scans for movers continuously, sonnet does intermediate analysis, opus is invoked only for high-stakes plays. Richardson built the same agent at three intelligence levels and lets the orchestrator pick.

### `skills/` — 66 reusable workflows

Skills are *not* agents. They are workflow templates that any agent can load. A skill is one folder with one `SKILL.md` inside. The template at `.claude/SKILL.md.tmpl` enforces a strict structure: frontmatter with allowed-tools, a preamble that runs first (initializing telemetry, learnings, repo-mode detection), and the workflow itself. The preamble is the clever part — every skill, before doing real work, runs a bash block that detects whether telemetry is on, whether the user has been prompted about proactive mode, whether the project is in solo or collaborative repo-mode, and whether prior learnings exist. This means skills self-configure to the environment without the user having to set anything up.

The skill list reflects how Richardson actually works — there are skills for shipping (`ship`, `land-and-deploy`, `canary`), for safety (`careful`, `freeze`, `guard`, `unfreeze`), for review (`code-review-pr`, `plan-eng-review`, `plan-ceo-review`, `plan-design-review`, `design-review`), for investigation (`investigate`, `bounty-hunting`, `learn`), for testing (`qa-testing`, `qa-only`, `webapp-testing`, `benchmark`), and for production AI work (`mcp-builder`, `claude-api`, `prompt-engineering`). The names are imperative verbs — Richardson doesn't store knowledge as nouns, he stores it as actions you can take.

### `plugins/` — 72 domain packs

A plugin is a self-contained mini-rstack — its own `agents/`, its own `skills/`, and a `plugin.json` manifest. The `payment-processing` plugin is illustrative: one agent (`payment-integration.md`) plus four skills (`billing-automation`, `paypal-integration`, `pci-compliance`, `stripe-integration`). When the orchestrator detects a payments-related task, it loads the whole pack at once instead of pulling pieces from the global pool. This is how Richardson keeps domain knowledge cohesive — Stripe and PCI live next to each other, not scattered across the framework.

### `commands/` — 37 slash commands

These are user-facing entry points (`plan.md`, `build.md`, `code-review.md`, `create-pr.md`, `create-feature.md`, `prime.md`, `crypto_research.md`, `cook.md`, `sentient.md`, etc.). When you type `/plan` in Claude Code, the runtime loads the corresponding `commands/plan.md` and follows its instructions, which typically delegate to the orchestrator with a specific framing. Commands are the keyboard shortcuts of the system.

### `hooks/` — Python enforcement layer

This is where the system gets teeth. The structure splits cleanly into `scripts/` (lifecycle handlers), `validators/` (post-write checks), and four category folders (`security/`, `code-quality/`, `devops/`, `quality-gates/`) that hold both `.py` enforcers and `.json` configs. The lifecycle scripts are: `pre_tool_use.py` (blocks `rm -rf` and `.env` access before any tool runs), `post_tool_use.py` (post-write validation), `session_start.py` and `session_end.py` (context loading and persistence), `subagent_stop.py` and `stop.py` (agent termination), `pre_handoff_checker.py` (validates the JSON contract between agents), `pre_compact.py` (runs before context compaction), and `user_prompt_submit.py` (intercepts user input). The validators include `ruff_validator.py` and `ty_validator.py` for Python lint and type-check, plus `post_agent_contract_validator.py` which is the enforcer that fails the build if a builder's JSON doesn't match the expected schema. Every hook is shebanged with `#!/usr/bin/env -S uv run --script` — Richardson is using `uv` as the universal Python runtime so hooks have no virtualenv setup cost.

### `outputs/team_state/` — the message bus

There is no Redis here, no Kafka, no in-memory queue. The bus is a directory. Every agent writes its result to `outputs/team_state/[task].json`, every consumer reads it. The names are stable and predictable — `requirement_spec.json`, `plan.json`, `system_design.json`, `code_report.json`, `test_report.json`, `deployment_report.json`, `summary.json`. Looking at the directory shows it has been used in real projects already: `portfolio_critical_fixes.json`, `portfolio_blog_fixes.json`, `rstack-agents-npm-package.json`, `github-actions-workflows.json`. This is not a toy. It's been driving real work.

### `bin/` — operational shell helpers

Eleven scripts that the agents call out to: `rstack-config` (get/set config keys), `rstack-learnings-log` and `rstack-learnings-search` (the cross-session memory store), `rstack-analytics` (telemetry), `rstack-skill-check` (skill validation), `rstack-repo-mode` (solo vs collaborative detection), `rstack-slug` (project ID derivation), `rstack-review-log` and `rstack-review-read` (review state), `check-careful.sh` (safety preflight), `sync-agents.sh` (template sync). These are the equivalent of Unix utilities — small, single-purpose, composable. Agents shell out to them because shelling out is observable in logs while in-process function calls are not.

### `scripts/` — the construction record

This folder is the most revealing one in the entire repo, because it is *how Richardson built the framework*. The files are `migrate_agents.py`, `migrate_sdlc.py`, `rewrite_sdlc_agents.py`, `upgrade_agents_v2.py`, `fix_agent_quality.py`, `fix_descriptions.py`, `fix_plugins.py`, `fix_skill_preambles.py`, `add_hook_docstrings.py`, plus TypeScript helpers for managing duplicate GitHub issues. He didn't hand-write 199 agent files. He wrote *generators and migrators* that produced and refined them in batches. When he discovered a quality issue (vague descriptions, missing preambles, inconsistent voice), he wrote a script that fixed it across every agent at once. This is the "AI Effort Compression" principle from `CLAUDE.md` applied to the framework's own construction — boilerplate that would take a human team two weeks to standardize gets done in fifteen minutes by a script.

### `specs/` — design docs ahead of code

Five markdown files: `2026-03-30-claude-folder-redesign.md`, `2026-03-30-rstack-gold-medal-plan.md`, `bun-cli-task-manager.md`, `hooks-update-with-team.md`, `subagent-tts-summary-queue.md`. Richardson writes a spec before a major refactor. The two dated 2026-03-30 documents are when he redesigned the entire `.claude/` folder structure — exactly the structure you see now. The architecture decisions are not implicit; they are written down before the code changes.

### `docs/` — the architecture render

`generate_diagram.py`, `rstack-architecture.excalidraw`, `rstack-architecture.png`. Richardson keeps a rendered diagram of the framework checked into the repo, with a Python script that regenerates it. This is the same discipline he asks of the SDLC stage 06 (architecture) agent applied to rstack itself.

### `logs/` and `outputs/`

Ephemeral runtime state. `logs/post_tool_use.json` accumulates every Write/Edit the system has ever performed; `logs/subagent_stop.json` records every subagent termination. These are debugging breadcrumbs — when something goes wrong at 2am (per the ETHOS), this is what you read first.

## How the pipeline actually runs

Here is the step-by-step of a full SDLC run, traced through the files.

The user types `/cook` (or runs `rstack-agents init` then opens Claude Code). Claude Code reads `settings.json`, registers the eight hooks, sets `orchestrator` as the default agent, and fires `SessionStart` which runs `hooks/scripts/session_start.py` to load context. The orchestrator reads `CLAUDE.md` and `AGENTS.md` to learn its routing rules. The user provides a meeting transcript or feature brief. The orchestrator consults `sdlc-pipeline.yml` and starts Phase 1: `00-environment` and `01-transcript` in parallel.

The `00-environment` agent runs bash commands to detect installed tools (`git`, `node`, `python3`, `docker`, `gh`, `kubectl`, `terraform`), checks for credentials in environment variables, creates output directories, and writes `outputs/team_state/environment_report.json` with `pipeline_ready: true` and a `fallbacks` map. In parallel, `01-transcript` reads the user's input file and structures it into `outputs/team_state/transcript.json`.

Phase 2 begins — `02-requirements` reads the transcript and writes `requirement_spec.json` containing functional requirements with IDs (F-001, F-002…), non-functional requirements with measurable metrics ("API p95 latency < 200ms under 1000 concurrent users"), Given/When/Then user stories, and explicit out-of-scope items. Notice the discipline — Richardson's requirements agent refuses to write "the system should be fast"; it must be testable.

Phase 3 fans out — `03-documentation` and `04-planning` run in parallel. Documentation produces user-facing docs structure. Planning produces sprint breakdowns with team capacity factored in.

Phase 4 fans out again — `05-jira` either calls the Jira REST API directly or produces a `jira_tickets.json` for manual import (the fallback chosen in the user_preferences block of `sdlc-pipeline.yml`). In parallel, `06-architecture` writes `system_design.json` and `HLD.md` covering tech stack, schema, API contracts, service architecture, and security design — each decision with a rationale and a reversal trigger.

Optional Phase 5 — if `optional_agents.security_threat_model` is true, `12-security-threat-model` reads the system design and writes `threat_model.json`.

Phase 6 — `07-code` reads the architecture and writes *actual working code*, not pseudocode. Richardson's voice in this agent is explicit: "a stubbed codebase is not a codebase." The code agent invokes the builder, which loads the relevant skill (`investigate`, `careful`) and the relevant plugin (`backend-development`), generates files, runs the entry point to verify it starts, and writes `code_report.json`.

Phase 7 fans out — `08-testing` runs the test suite and writes `test_report.json`. In parallel, `13-compliance-checker` (auto-enabled per `sdlc-pipeline.yml`) audits regulated-domain rules and writes `compliance_report.json`.

Phase 8 — `09-deployment` containerizes the code, configures CI/CD (defaults to GitHub Actions per user prefs), and pushes the deployment manifest. Writes `deployment_report.json`.

Phase 9 — `10-summary` reads every upstream JSON contract and produces both `summary.json` and a human-readable `PROJECT_SUMMARY.md` with the architecture decision log. If enabled, `14-cost-estimation` calculates expected monthly costs from the architecture and load profile, and `11-feedback-loop` runs a retrospective, logging genuine discoveries to the learnings store via `bin/rstack-learnings-log`.

Throughout all of this, the hook layer is firing in the background. Every `Write` or `Edit` tool call triggers `post_tool_use.py`, then `ruff_validator.py`, then `ty_validator.py`. Every `Bash` invocation passes through `pre_tool_use.py` first, which blocks dangerous commands before they execute. Every agent termination triggers `post_agent_contract_validator.py` which reads the JSON the agent just wrote and verifies it matches the contract.

If validation fails, the orchestrator decides — retry the agent, escalate to the user, or mark the work blocked.

## The construction patterns Richardson used

A few patterns recur across the framework that are worth naming directly because they explain the *style* of the build, not just its shape.

**Voice as guardrails.** Every agent file opens with a "Voice" section written in first person, often referencing scars from past failures ("you have watched a team build an entire user management system that nobody asked for…"). This is not flavor text. It is psychological grounding for the LLM — the model is more careful when it has been given a persona that has been burned by exactly the failure mode it's about to avoid. Richardson uses voice the way other engineers use type signatures.

**JSON as the only message format.** Nothing in the system passes objects in memory between agents. Every interaction is a file write followed by a file read. This is intentionally slower than in-process calls, but it makes every step inspectable, replayable, and resumable after a context compaction. Stage 02 can re-run alone if `requirement_spec.json` is wrong.

**Skills as composable verbs, not nouns.** A skill is always something you *do* (`ship`, `careful`, `investigate`, `freeze`). Agents *are* roles; skills *are* actions. Any agent can take any action by loading the skill first.

**Plugins as cohesive packs.** When domain knowledge needs to live together (Stripe + PCI compliance + billing automation), it gets a plugin. The plugin is a single unit the orchestrator can load atomically, instead of cherry-picking from the global skill pool.

**Hooks as the safety floor.** Every dangerous action is gated by Python before Claude can do it. Richardson trusts the LLM to do the right thing 95% of the time, but never relies on that — the hooks catch the other 5%.

**Migration scripts as the construction record.** The `scripts/` folder shows that Richardson built the framework the way he wants others to build with it: programmatically, in batches, with quality fixes applied across every file at once. He doesn't carry technical debt across 199 agents — he writes a `fix_agent_quality.py` and re-runs it.

**Specs before code.** Every major architectural change has a spec in `specs/`. The two dated 2026-03-30 specs describe the redesign that produced the structure you are reading now.

**Branch-scoped versions.** Per `CLAUDE.md`, every shipped branch bumps `VERSION` and adds a `CHANGELOG.md` entry written in user-facing language ("you can now…"), never internal jargon. The release notes read like product announcements because Richardson treats rstack as a product, not a tool.

## The non-negotiables, restated

`CLAUDE.md` ends with four rules: transparency first, accountability stays human, done means structurally sound, never ship sloppy. These are the same four rules `ETHOS.md` opens with. They are the same rules every agent is asked to enforce. The framework is consistent all the way down because Richardson designed the constitution before he designed any of the agencies under it.

That is how this SDLC pipeline got built. The CLI is just a delivery mechanism. The real construction was the writing of 199 agent personas, 66 skill workflows, 72 plugin packs, and a hook layer that stops the model from doing the wrong thing — all governed by a written constitution and validated by a JSON contract bus.

---

Your message ended at "and then come up with…" — what would you like me to produce next? A few likely candidates so you can pick:

a sequence diagram showing one full SDLC run end-to-end with timing,
a "first contributor" onboarding guide a new developer could read in 30 minutes,
a Mermaid C4 model (Context / Container / Component) for the framework,
a gap analysis flagging where the framework could break under unusual conditions,
or a getting-started tutorial that takes a real feature request through all 15 stages.

Tell me which one (or describe what you actually meant) and I'll build it.
