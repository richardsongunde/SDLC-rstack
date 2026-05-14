# Pi-first Agentic SDLC Blueprint

Date: 2026-05-13
Decision owner: Richardson Gunde
Repo: `/Users/richardsongunde/projects/SDLC-rstack`

## Locked product decisions

1. **First target is Pi.**
   Build a Pi extension first, not a generic MCP server.

2. **Avoid MCP for the MVP.**
   MCP adds useful interoperability, but its startup/tool-description context cost is not desirable for the first version. The MVP should be a Pi plugin/extension with a small tool surface.

3. **Reuse specialists where possible.**
   Existing `.claude/agents`, `.claude/skills`, and `.claude/plugins` remain the knowledge base. The Pi extension should load and route to them through a registry rather than duplicating them.

4. **Use `.rstack/runs/` for clean state.**
   Move new pipeline run state out of `outputs/team_state/` into `.rstack/runs/[run_id]/`. Keep compatibility readers for old `outputs/team_state/` files.

5. **The product goal is complete software-company style delivery.**
   The extension should let an agent team handle the full lifecycle of building an application: product clarification, requirements, architecture, implementation, testing, validation, security, docs, PR/release, and learning capture.

## Market/research synthesis

A lightweight scan plus known agent-framework patterns points to the same direction:

- Multi-agent coding systems work best when roles are explicit: planner, implementer, reviewer, tester, security, release.
- State machines/graphs are better than free-form chats for long software workflows.
- Validator/critic agents reduce error rates when they are read-only and have clear checklists.
- Persistent memory is useful only when it records concrete failure modes, repo conventions, and validation rules, not generic summaries.
- Too many exposed tools increase context overhead and routing confusion. A small set of high-level lifecycle tools is better than exposing every specialist as a tool.
- Human approval gates are important at product decisions, destructive operations, and release/merge steps.

Implication for RStack: the differentiator should be **agentic SDLC governance**, not just a large agent library.

## Product concept

RStack for Pi should behave like a small software company inside the coding agent.

```text
User goal
  ↓
CEO/PM clarification
  ↓
Orchestrator creates run plan
  ↓
Specialist routing
  ↓
Builder team executes scoped tasks
  ↓
Validator team checks scope/tests/security
  ↓
Retry or escalate
  ↓
Release/PR/docs
  ↓
Memory updated for next run
```

## Pi extension tool surface

Keep this intentionally small.

### `sdlc_start`

Start a new software lifecycle run.

Use for:
- full app build
- feature build
- bug fix
- PR review
- release prep

Creates:
- `.rstack/runs/[run_id]/manifest.json`
- `.rstack/runs/[run_id]/context.md`

### `sdlc_plan`

Turn the goal into requirements, acceptance criteria, architecture, task graph, and validation gates.

Creates:
- `.rstack/runs/[run_id]/plan.md`
- `.rstack/runs/[run_id]/tasks.json`

### `sdlc_build_next`

Execute the next ready task through builder instructions.

Creates:
- `.rstack/runs/[run_id]/tasks/[task_id]/builder.json`

### `sdlc_validate`

Run read-only validation for a task, diff, or full run.

Creates:
- `.rstack/runs/[run_id]/tasks/[task_id]/validation.json`

### `sdlc_status`

Show current run state, blocked tasks, failed validations, next action.

### `sdlc_memory`

Search or append repo learnings.

Creates/reads:
- `.rstack/memory/learnings.jsonl`

## Minimal run directory layout

```text
.rstack/
  config.json
  registry/
    agents.json
    skills.json
    plugins.json
  memory/
    learnings.jsonl
    repo_profile.json
  runs/
    2026-05-13T090000Z-build-shopping-app/
      manifest.json
      context.md
      plan.md
      tasks.json
      decisions.jsonl
      events.jsonl
      summary.md
      tasks/
        001-requirements/
          prompt.md
          builder.json
          validation.json
        002-architecture/
          prompt.md
          builder.json
          validation.json
```

## Specialist reuse model

Do not expose 199 specialists directly to Pi.

Instead, build a registry:

```json
{
  "id": "frontend.react",
  "name": "React Frontend Specialist",
  "source": ".claude/agents/specialists/frontend/react-specialist.md",
  "domains": ["frontend", "react", "ui"],
  "stage_affinity": ["architecture", "implementation", "testing"],
  "skills": ["frontend-design", "webapp-testing"],
  "risk_level": "medium"
}
```

The orchestrator uses the registry to generate task packets. The host model still does the work, but it receives the right specialist prompt and constraints.

## Builder/validator loop

Each task follows this loop:

1. Orchestrator creates task packet.
2. Builder receives exact scope, files allowed, specialist prompt, skills, output contract.
3. Builder edits and writes `builder.json`.
4. Validator reads diff + `builder.json`, runs checks, writes `validation.json`.
5. Orchestrator decides:
   - PASS → next task
   - FAIL → retry builder with validator feedback
   - BLOCKED → ask user

## Lifecycle hooks in Pi

Map Pi extension events into RStack events:

| Pi event | RStack behavior |
| --- | --- |
| extension load/session start | load registry, memory, active run |
| tool_call before write/bash | optional scope guard and dangerous-command guard |
| tool_call after write/edit/bash | append event, mark changed files, suggest validation |
| session shutdown | write run checkpoint and summary |

## First demo target

A full software lifecycle demo should be small but complete:

**Demo:** Build a simple production-grade web app from a one-paragraph idea.

Flow:
1. PM asks 5 clarifying questions.
2. Requirements agent writes acceptance criteria.
3. Architect picks stack and folder plan.
4. Builder implements app.
5. QA runs tests/browser checks.
6. Security checks common issues.
7. Docs writes README/update notes.
8. Release agent prepares PR summary.
9. Memory records misses and repo conventions.

## Implementation backlog

### Phase 1: Pi extension skeleton

- Create `.pi/extensions/rstack-sdlc/index.ts`.
- Add root/package dependencies if needed.
- Register `sdlc_start`, `sdlc_status`, `sdlc_memory` first.

### Phase 2: `.rstack` state bus

- Add run ID generation.
- Add manifest writer.
- Add event log writer.
- Add JSON schema validation.

### Phase 3: Registry generator

- Parse `.claude/agents/**/*.md` frontmatter.
- Parse `.claude/skills/**/SKILL.md` frontmatter.
- Parse `.claude/plugins/*/plugin.json`.
- Write `.rstack/registry/*.json`.

### Phase 4: Planning workflow

- Implement `sdlc_plan`.
- Generate `plan.md` and `tasks.json`.
- Start with deterministic templates before advanced routing.

### Phase 5: Build/validate workflow

- Implement `sdlc_build_next` task packet generation.
- Implement `sdlc_validate` contract checks.
- Add retry state.

### Phase 6: Complete app demo

- Run on a toy app.
- Record failures.
- Strengthen validators.

## Product rule

RStack should feel like a software company run by agents, with the user as product owner and release approver. The user should not have to manually remember the SDLC steps. The extension should carry the process.
