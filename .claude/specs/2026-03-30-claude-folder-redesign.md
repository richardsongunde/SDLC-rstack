# .claude/ Full Redesign — Design Document
**Date:** 2026-03-30
**Status:** Approved
**Scope:** Full restructure of `.claude/` folder — agents, skills, commands, plugins, hooks + new prompt-engineering skill

---

## Problem

The `.claude/` workspace has grown organically across 4+ duplicate agent locations, inconsistent naming, and 1088 MD files without a unified discovery layer. Agents are knowledge dumps rather than actionable workflows. Skills lack consistent structure. No standard voice, completion protocol, or escalation pattern.

**Root causes:**
- Agents exist in `agents/team/specialists/`, `agents/specialists/`, `categories/01-10/`, and `plugins/*/agents/` simultaneously
- No canonical naming convention (snake_case vs kebab-case vs Title Case)
- Prompts lack: Voice, numbered Workflow steps, concrete Output formats, Completion Protocol
- Plugins have agents/skills inside them with no consistent format
- CLAUDE.md routing is complex and points to many locations

---

## Goals

1. Single canonical agent location — one path per agent, no duplicates
2. Flat discoverable index — `AGENTS.md` as the one place to find everything
3. gstack-inspired prompt quality — Voice + Workflow + Completion Protocol on every agent/skill
4. Core team preserved — orchestrator → builder → validator flow unchanged
5. SDLC pipeline intact — 00–14 agents maintain ordering and handshake contracts
6. Plugins as domain packs — stay separate, formats fixed, reachable from AGENTS.md
7. New `prompt-engineering` skill — teaches how to write agents/skills/plugins/hooks

---

## New Directory Structure

```
.claude/
├── CLAUDE.md                    ← simplified routing (3 paths: core, specialists, plugins)
├── AGENTS.md                    ← master index: all agents, skills, commands, plugins
├── settings.json                ← unchanged
├── settings.local.json          ← unchanged
├── sdlc-pipeline.yml            ← unchanged
│
├── agents/
│   ├── core/
│   │   ├── orchestrator.md      ← updated body, frontmatter preserved
│   │   ├── builder.md           ← hooks config preserved exactly
│   │   └── validator.md         ← hooks config preserved exactly
│   │
│   ├── sdlc/                    ← renamed to kebab-case, contracts preserved
│   │   ├── 00-environment.md
│   │   ├── 01-transcript.md
│   │   ├── 02-requirements.md
│   │   ├── 03-documentation.md
│   │   ├── 04-planning.md
│   │   ├── 05-jira.md
│   │   ├── 06-architecture.md
│   │   ├── 07-code.md
│   │   ├── 08-testing.md
│   │   ├── 09-deployment.md
│   │   ├── 10-summary.md
│   │   ├── 11-feedback-loop.md
│   │   ├── 12-security-threat-model.md
│   │   ├── 13-compliance-checker.md
│   │   └── 14-cost-estimation.md
│   │
│   └── specialists/
│       ├── backend/             ← api-architect, backend-architect, database-*, graphql-architect, api-builder, api-designer
│       ├── frontend/            ← ui-designer, shadcn-*, premium-ux-designer, design-system-architect, accessibility-expert
│       ├── devops/              ← cloud-architect, build-engineer, monitoring-specialist, devops-troubleshooter, build-logger, blue-green-deployment
│       ├── security/            ← security-engineer, compliance-auditor, api-security-audit, compliance-specialist, engineering-code-reviewer
│       ├── data/                ← database-designer, ml-engineer, data-scientist, mlops-engineer
│       ├── qa/                  ← e2e-runner, error-detective, architect-reviewer, codebase-pattern-finder, cs-engineering-lead
│       ├── product/             ← product-manager, scrum-master, sprint-prioritizer, cs-agile-product-owner, atlassian-requirements-to-jira
│       └── docs/                ← technical-writer, diagram-architect, changelog-generator, documentation-engineer, se-technical-writer, api-documenter
│
├── skills/                      ← all skills, each in named folder with SKILL.md
│   ├── prompt-engineering/      ← NEW — gstack-inspired prompt authoring skill
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── agent-format.md
│   │       ├── skill-format.md
│   │       ├── plugin-format.md
│   │       ├── hook-format.md
│   │       └── anti-patterns.md
│   └── [all existing skill folders unchanged]
│
├── commands/                    ← all commands, kebab-case (behavior unchanged)
│
├── plugins/                     ← domain packs (structure preserved, formats fixed)
│   ├── backend-development/
│   ├── ui-design/
│   ├── machine-learning-ops/
│   ├── payment-processing/
│   ├── incident-response/
│   ├── developer-essentials/
│   └── [remaining plugins]
│
├── hooks/
│   ├── scripts/                 ← all scripts unchanged
│   └── validators/              ← ruff_validator, ty_validator unchanged
│
├── outputs/
│   └── team_state/              ← builder/validator JSON handshake files
│
└── specs/                       ← planning docs (this file lives here)
```

**Deleted/merged locations:**
- `categories/01-10/` → `agents/specialists/[domain]/`
- `agents/team/specialists/` → `agents/specialists/[domain]/`
- `agents/specialists/` (old path) → `agents/specialists/[domain]/`
- `agents/AGENT_TEAMS_MODE.md` → content absorbed into updated `CLAUDE.md`
- `agents/_COMMUNICATION_PROTOCOL.md` → content absorbed into updated `AGENTS.md`

---

## Agent Prompt Format Standard

Every agent (core, sdlc, specialist) uses this structure:

```markdown
---
name: kebab-case-name
description: |
  Sharp one-paragraph description. What this agent does. When to trigger it.
  Concrete trigger phrases a user would say. Domain tag at end in parens.
  Example: "Use when designing REST/GraphQL APIs or reviewing service contracts. (backend)"
model: opus|sonnet|haiku|inherit
tools:
  - Bash
  - Read
  - Grep
  - Glob
  [explicit list — not a catch-all]
color: cyan|blue|red|green|yellow|magenta|white
[hooks: only for builder and validator — preserved exactly as-is]
---

## Voice
[How this agent communicates. Tone. Writing rules. What to avoid.
 Concrete: "Name the file, the function, the line number. No filler."]

## When To Use
- Trigger phrase / condition 1
- Trigger phrase / condition 2
[3–6 bullet points with example user phrases]

## Workflow
1. **Step name** — What to do. Self-contained bash block if needed:
   ```bash
   git diff origin/main --stat
   ```
2. **Step name** — Reference Step 1 output in prose, not shell variables.
3. If X → do Y. If Z → do W.
[Steps are English + bash. State passes via prose, not variables between blocks.]

## Output Format
[Exact output structure. Tables, JSON shape, markdown headers. Be concrete.]

## Completion Protocol
STATUS: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
REASON: [1–2 sentences if not DONE]
ATTEMPTED: [what was tried, if BLOCKED]
RECOMMENDATION: [what the user should do next, if escalating]
```

**Key rules from gstack:**
- Each bash block is self-contained — no variable sharing between blocks
- Conditionals expressed as English numbered steps, not nested bash if/elif
- State from one step referenced in prose of the next step
- NEVER say "I'll help you with that" — just act

---

## Skill Format Standard

```markdown
---
name: skill-name
description: |
  What this skill provides. When Claude should trigger it. Specific use cases.
  Trigger phrases the user would type. Domain tag if applicable.
---

[Core workflow — imperative, under 500 lines]
[Bash blocks are self-contained]
[Reference files for anything detailed]

## References
- See references/topic.md for [when to read it]

## Completion Protocol
STATUS: DONE | BLOCKED | NEEDS_CONTEXT
REASON: [if not DONE]
```

**Progressive disclosure rules:**
- SKILL.md body: essentials only, under 500 lines
- Detailed material → `references/` subfolder, loaded only when needed
- Each reference file has a table of contents if >100 lines

---

## Plugin Format Standard

Plugins keep their folder structure. Each plugin agent and skill gets:
1. Frontmatter updated to match agent/skill standard above
2. A `## Voice` section added
3. A `## Workflow` section (numbered steps) replacing freeform instructions
4. A `## Completion Protocol` added at the bottom

Plugin `README.md` or index (if present) gets a summary table of its agents and skills.

---

## Hook Documentation Standard

Hooks in `hooks/scripts/` stay unchanged functionally. Each script gets:
1. A docstring at top: purpose, when it fires, what it checks/does
2. `CLAUDE.md` updated with a hook reference table

Hook frontmatter in agent files (builder, validator):
```yaml
hooks:
  PreToolUse:
    - hooks:
        - type: command
          command: uv run $CLAUDE_PROJECT_DIR/.claude/hooks/scripts/pre_tool_use.py
  PostToolUse:
    - matcher: "Write|Edit"
      hooks:
        - type: command
          command: uv run $CLAUDE_PROJECT_DIR/.claude/hooks/scripts/post_tool_use.py
```
This format is already correct — preserved as-is.

---

## New: `prompt-engineering` Skill

**Purpose:** A wizard-style skill for creating well-formatted agents, skills, plugins, and hooks — inspired by gstack patterns.

**`SKILL.md` (core — ~150 lines):**
- Asks: what are you creating? (agent / skill / plugin / hook)
- Routes to the right reference file
- Asks clarifying questions one at a time
- Outputs a complete, properly-formatted file

**Reference files:**

| File | Contents |
|------|----------|
| `agent-format.md` | Full agent spec: frontmatter fields, Voice patterns, Workflow step rules, Output format, Completion Protocol. Good/bad examples. |
| `skill-format.md` | Skill frontmatter spec, progressive disclosure, when to use references/, body length rules. Examples. |
| `plugin-format.md` | Plugin pack structure, how agents/skills inside plugins differ from standalone, index file format. |
| `hook-format.md` | Hook frontmatter syntax for agents (PreToolUse, PostToolUse, SessionEnd), script docstring standard, what each hook type does. |
| `anti-patterns.md` | What NOT to do: knowledge dumps, no workflow steps, wrong tool names, variables between bash blocks, implicit state, missing completion protocol. |

---

## AGENTS.md Master Index Structure

```markdown
# AGENTS.md — Master Discovery Index

## How To Route
- Complex multi-step task → orchestrator
- Single execution task → builder directly
- Full project lifecycle → sdlc/00-environment.md to start pipeline
- Domain specialist needed → find in Specialists table below

## Core Team
| Agent | Path | Purpose | Model |
|-------|------|---------|-------|
| orchestrator | agents/core/orchestrator.md | Routes, spawns teams | opus |
| builder | agents/core/builder.md | Executes code/file tasks | opus |
| validator | agents/core/validator.md | Verifies completed work | opus |

## SDLC Pipeline (run in order)
| # | Agent | Path | Input | Output |
|---|-------|------|-------|--------|
| 00 | environment | agents/sdlc/00-environment.md | — | env.json |
...

## Specialists

### Backend
| Agent | Path | Speciality |
...

### Frontend | DevOps | Security | Data | QA | Product | Docs
[one table per domain]

## Plugins (Domain Packs)
| Plugin | Path | Agents | Skills |
...

## Skills
| Skill | Path | Trigger |
...

## Commands
| Command | Path | Purpose |
...
```

---

## Updated CLAUDE.md

Simplified to 3 routing rules:

```markdown
## Routing

1. **Any complex task** → read agents/core/orchestrator.md
2. **Find a specialist** → read AGENTS.md, find domain, use that agent path
3. **Need domain knowledge** → read skills/[skill-name]/SKILL.md

## Communication Protocol
Builder writes → outputs/team_state/[task].json
Validator reads → writes outputs/team_state/[task]_validation.json

## Hooks
See hooks/scripts/ — all hooks fire automatically per agent config.
Hook reference: [table of hook → script → purpose]
```

---

## Migration Map

| From | To | Action |
|------|----|--------|
| `categories/01/` (frontend/backend/etc) | `agents/specialists/backend/`, `agents/specialists/frontend/` etc | Move + rename to kebab-case + rewrite prompts |
| `categories/02/` (language specialists) | `agents/specialists/backend/` | Move, consolidate with existing backend agents |
| `categories/03/` (infra/devops) | `agents/specialists/devops/` | Move + rewrite |
| `categories/04/` (quality/security) | `agents/specialists/security/` + `agents/specialists/qa/` | Split by subdomain |
| `categories/05/` (data/AI) | `agents/specialists/data/` | Move + rewrite |
| `categories/06/` (DX/docs) | `agents/specialists/docs/` | Move + rewrite |
| `categories/07/` (blockchain/IoT/game) | `agents/specialists/backend/` | Merge into backend |
| `categories/08/` (business/product) | `agents/specialists/product/` + `agents/specialists/docs/` | Split |
| `categories/09/` (meta-orchestration) | `agents/core/` | Merge with orchestrator |
| `categories/10/` (research) | `agents/specialists/product/` | Merge |
| `agents/team/specialists/` | `agents/specialists/[domain]/` | Move + rewrite |
| `agents/specialists/` | `agents/specialists/[domain]/` | Move + rewrite |
| `plugins/*/agents/` | Stay in plugins, format fixed | Fix frontmatter + add Voice/Workflow/Protocol |
| `plugins/*/skills/` | Stay in plugins, format fixed | Fix frontmatter + Completion Protocol |

**Deduplication rule:** When the same agent name exists in multiple locations, the most complete/recent version wins. The others are deleted.

---

## Implementation Phases

### Phase 1 — Create prompt-engineering skill
New skill. No migrations. Self-contained. Validates the format standard we're about to apply everywhere.

### Phase 2 — Restructure agents/
- Create new `agents/specialists/[domain]/` folders
- Move + rename agents from `categories/` and `agents/team/specialists/` and `agents/specialists/`
- Rewrite prompts to standard format
- Delete source directories when empty

### Phase 3 — Rewrite core + SDLC agents
- Update orchestrator, builder (preserve hooks), validator (preserve hooks)
- Rename SDLC agents to kebab-case, update body format
- Keep JSON handshake contracts intact

### Phase 4 — Fix plugins
- For each plugin's agents: update frontmatter + add Voice/Workflow/Protocol
- For each plugin's skills: update frontmatter + add Completion Protocol
- Add plugin index table to each plugin folder

### Phase 5 — Update AGENTS.md + CLAUDE.md
- Write new master AGENTS.md index
- Simplify CLAUDE.md routing
- Update sdlc-pipeline.yml paths if any changed

### Phase 6 — Fix hooks documentation
- Add docstrings to hook scripts
- Add hook reference table to CLAUDE.md
