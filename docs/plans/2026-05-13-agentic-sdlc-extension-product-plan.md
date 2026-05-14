# Agentic SDLC Extension Product Plan

Date: 2026-05-13
Owner: Richardson Gunde
Working repo: `/Users/richardsongunde/projects/SDLC-rstack`

## Product thesis

Turn `SDLC-rstack` from a Claude Code scaffold into a portable agentic SDLC extension that any coding agent can use. The extension should give the host agent an orchestrated software-delivery pipeline: product discovery, planning, implementation, validation, security review, release preparation, and learning capture.

The key product idea is not "more agents". It is a managed software factory with contracts, gates, and memory.

## Target users

1. Solo developers who want a repeatable AI-assisted build pipeline.
2. Engineering teams that want specialist AI roles with validation gates.
3. Agent-platform users who want the same SDLC workflow across Pi, Claude Code, Codex-style agents, and other coding agents.
4. Maintainers who want PR-quality automation, not one-shot code generation.

## Current assets in the repo

- NPM CLI shell: `bin/`, `src/`, `tests/`.
- Claude runtime package: `.claude/`.
- Core agents: `.claude/agents/core/orchestrator.md`, `builder.md`, `validator.md`.
- SDLC stage agents: `.claude/agents/sdlc/00-environment.md` through `14-cost-estimation.md`.
- Specialist agents: roughly 199 agent files total.
- Skills: `.claude/skills/` and `.agents/skills/`.
- Plugins: `.claude/plugins/`.
- Hook lifecycle: `.claude/hooks/scripts`, `.claude/hooks/validators`, category configs.
- Pipeline config: `.claude/sdlc-pipeline.yml`.
- Contract/state bus: `outputs/team_state/*.json`.
- Memory/learning store: `outputs/team_state/rstack_learnings.json`.

## Product shape

### Extension layers

```text
Host coding agent
  ↓
RStack SDLC Extension API
  ↓
Orchestrator
  ├─ Builder team
  │   ├─ product / frontend / backend / devops / docs / data / security specialists
  │   └─ implementation tools
  ├─ Validator team
  │   ├─ static checks
  │   ├─ test checks
  │   ├─ security checks
  │   └─ contract checks
  ├─ Lifecycle hooks
  │   ├─ session_start
  │   ├─ pre_tool_use
  │   ├─ post_tool_use
  │   ├─ subagent_stop
  │   └─ session_end
  └─ Memory/state bus
      ├─ run manifest
      ├─ task contracts
      ├─ validation reports
      └─ learnings
```

### Agent teams

#### 1. Orchestrator

Responsibilities:
- Classify the request.
- Build a run plan.
- Select specialists.
- Create task contracts.
- Dispatch builder work.
- Dispatch validator work.
- Decide retry, escalate, or complete.
- Summarize outcomes and update memory.

The orchestrator should not edit code directly.

#### 2. Builder team

Responsibilities:
- Execute one bounded task at a time.
- Read only the assigned context.
- Modify files only within declared scope.
- Run required local checks.
- Write a builder contract JSON.

Builder output contract:

```json
{
  "task_id": "string",
  "agent": "string",
  "status": "PASS|FAIL|BLOCKED|DONE_WITH_CONCERNS",
  "summary": "string",
  "files_modified": [],
  "tests_run": [],
  "risks": [],
  "next_steps": []
}
```

#### 3. Validator team

Responsibilities:
- Read-only verification of builder output.
- Re-run relevant tests.
- Check scope compliance.
- Check contract completeness.
- Write validation JSON.

Validator output contract:

```json
{
  "task_id": "string",
  "validator": "string",
  "status": "PASS|FAIL|BLOCKED",
  "checks": [
    { "name": "string", "status": "PASS|FAIL", "evidence": "string" }
  ],
  "issues": [],
  "retry_recommendation": "none|retry_builder|escalate_to_user"
}
```

## Core workflows

### Workflow A: `plan`

Goal: convert user intent into a scoped implementation plan.

Steps:
1. Prime repository context.
2. Ask missing product/technical questions.
3. Produce requirements and acceptance criteria.
4. Produce architecture and risk review.
5. Produce implementation tasks.
6. Wait for user approval.

Output:
- `outputs/team_state/run_manifest.json`
- `docs/plans/YYYY-MM-DD-[slug].md`

### Workflow B: `build`

Goal: execute an approved plan with builder/validator loops.

Steps:
1. Load run manifest.
2. Dispatch bounded builder tasks.
3. Run validators after each task.
4. Retry failed tasks up to a limit.
5. Stop on unsafe/destructive ambiguity.
6. Produce final build report.

Output:
- task JSONs under `outputs/team_state/`
- final summary JSON

### Workflow C: `review`

Goal: review a PR or local diff.

Steps:
1. Gather diff.
2. Run code review specialist.
3. Run security checks.
4. Run test/build checks.
5. Produce actionable findings.

Output:
- `outputs/team_state/review_report.json`

### Workflow D: `ship`

Goal: prepare release/PR.

Steps:
1. Confirm clean tree or expected diff.
2. Run final validation.
3. Update docs/changelog if needed.
4. Create branch/commit/PR if allowed.
5. Capture learnings.

Output:
- PR/release report
- memory updates

## Extension API proposal

Expose a small set of host-agent tools rather than hundreds of specialist tools.

### Tool 1: `sdlc_plan`

Create a plan from user goal and repo context.

Parameters:
- `goal: string`
- `mode: "interactive" | "express"`
- `domains?: string[]`
- `constraints?: string[]`

### Tool 2: `sdlc_build`

Execute a plan or task through builder/validator teams.

Parameters:
- `plan_path?: string`
- `task?: string`
- `max_retries?: number`
- `allow_file_patterns?: string[]`

### Tool 3: `sdlc_validate`

Run validator team against current diff or specific task output.

Parameters:
- `target: "diff" | "task" | "repo"`
- `task_id?: string`
- `checks?: string[]`

### Tool 4: `sdlc_review_pr`

Review a GitHub PR or local diff.

Parameters:
- `pr_url?: string`
- `base?: string`
- `head?: string`

### Tool 5: `sdlc_memory`

Read or append project learnings.

Parameters:
- `action: "search" | "append" | "summarize"`
- `query?: string`
- `learning?: object`

### Tool 6: `sdlc_status`

Show active run, last task, validation status, and next recommended action.

## Lifecycle hooks

Portable hook concepts should be normalized independent of host platform:

| Hook | Purpose |
| --- | --- |
| `session_start` | Load repo context, previous run state, and learnings. |
| `pre_tool_use` | Block dangerous commands, protect secrets, enforce scope. |
| `post_tool_use` | Trigger checks after writes/edits. |
| `subagent_start` | Write task manifest and lock scope. |
| `subagent_stop` | Validate output contract. |
| `session_end` | Persist run summary and learnings. |

Implementation detail: each host adapter maps native events into this normalized lifecycle.

## Cross-agent portability strategy

Split the product into two packages:

### 1. `@rstack/sdlc-core`

Host-independent logic:
- pipeline parser
- agent registry
- contract schemas
- state bus
- hook runner
- memory store
- validators
- run planner

### 2. Host adapters

- `@rstack/pi-extension`
- `@rstack/claude-code-pack`
- `@rstack/codex-adapter`
- future: Cursor, Windsurf, VS Code, MCP server

Adapters should be thin. They expose the same core tools and map host lifecycle events to core lifecycle hooks.

## MVP scope

Build the Pi extension first because it can prove portability outside Claude Code.

MVP includes:
1. Register Pi tools: `sdlc_plan`, `sdlc_build`, `sdlc_validate`, `sdlc_status`, `sdlc_memory`.
2. Use existing `.claude` assets as the source registry, but do not require Claude Code.
3. Store run state in `.rstack/runs/[run_id]/` or `outputs/team_state/`.
4. Implement builder/validator contracts as JSON schemas.
5. Add lifecycle event handlers for Pi session start/shutdown and tool-call interception where available.
6. Provide one happy-path pipeline: plan → build → validate → summary.
7. Add docs showing how other coding agents can integrate the same contracts.

Out of MVP:
- Full 199-agent runtime execution.
- Real parallel subagent execution across all hosts.
- Cloud/Jira/deployment integrations.
- Plugin marketplace.

## Risks

1. Host agents differ in subagent support. Mitigation: model team members as contracts and prompts first, native subagents where supported.
2. Too many agents can confuse routing. Mitigation: MVP uses a compact registry and gradually expands.
3. Hooks are not portable as-is. Mitigation: define normalized lifecycle events and host adapters.
4. Builders can over-edit. Mitigation: explicit scope locks, validator diff checks, retry limits.
5. State files can become messy. Mitigation: run directories, JSON schemas, status command.

## First implementation milestones

### Milestone 1: Inventory and cleanup

- Generate machine-readable registry of agents, skills, plugins, and hooks.
- Identify duplicate or Claude-specific assumptions.
- Define canonical contract schemas.

### Milestone 2: Core package skeleton

- Create `packages/sdlc-core/`.
- Implement registry loader.
- Implement state bus.
- Implement contract validation.
- Implement memory read/append.

### Milestone 3: Pi extension adapter

- Create `packages/pi-extension/` or `.pi/extensions/rstack-sdlc/`.
- Register the five MVP tools.
- Wire session lifecycle to state/memory.
- Add user-facing docs.

### Milestone 4: End-to-end demo

- Pick a small target repo.
- Run `sdlc_plan`.
- Run `sdlc_build` for one scoped task.
- Run `sdlc_validate`.
- Capture memory.

### Milestone 5: Package and distribution

- Publish as npm package or git-installable Pi package.
- Keep Claude Code scaffold as another adapter.

## Open questions

1. Which host should be the first-class MVP target: Pi only, or Pi plus Claude Code compatibility from day one?
2. Should the extension actually execute specialist prompts, or should it produce structured task packets for the host model to execute?
3. Should run state live in existing `outputs/team_state/` or a new `.rstack/runs/` directory?
4. Do we want MCP as the common interface, so any agent can call the SDLC pipeline as tools?
5. What is the first demo project and target workflow: PR review, bug fix, feature build, or full transcript-to-release?
6. How strict should validators be by default, fail closed or warn with DONE_WITH_CONCERNS?

## Recommendation

Proceed with a portable core plus Pi adapter. Do not try to move all 199 agents into the first extension. Start with the orchestrator, builder, validator, contract bus, lifecycle hooks, and memory. Once that loop is reliable, expand specialist routing and plugin packs.
