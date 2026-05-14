# rstack — Richardson Gunde's AI Engineering Workspace

## Architecture

This workspace orchestrates 200+ specialized agents across a clean domain hierarchy.
**Never solve complex tasks alone — delegate to the right specialist.**

Full agent/skill/command discovery: read **`AGENTS.md`**
Builder philosophy: read **`ETHOS.md`**
Visual aesthetic: read **`DESIGN.md`**

---

## Routing Rules

1. **Any complex multi-step task** → `agents/core/orchestrator.md`
2. **Find a domain specialist** → read `AGENTS.md`, find the domain table, use that path
3. **Need domain knowledge or a workflow** → `skills/[name]/SKILL.md`
4. **Full project lifecycle** → `agents/sdlc/00-environment.md` to start the pipeline

---

## Communication Protocol

Prefer Pi-first RStack run state. If `RSTACK_RUN_DIR` is set, use it. Otherwise use the active `.rstack/runs/<run_id>/` selected by the orchestrator.

```
Builder  writes → $RSTACK_RUN_DIR/tasks/<task_id>/builder.json
                  Required fields: task_id, agent, status, summary, files_modified, tests_run, risks, next_steps

Validator reads → $RSTACK_RUN_DIR/tasks/<task_id>/builder.json
Validator writes → $RSTACK_RUN_DIR/tasks/<task_id>/validation.json
                  Required fields: task_id, validator, status, checks[], issues[], retry_recommendation
```

Legacy `outputs/team_state/` is compatibility input only unless a task explicitly targets the old Claude Code scaffold.

---

## SDLC Pipeline

Sequential chain — each agent writes JSON and signals the next:

```
00-environment → 01-transcript → 02-requirements → 03-documentation →
04-planning → 05-jira → 06-architecture → 07-code → 08-testing →
09-deployment → 10-summary
```

Optional: 11-feedback-loop, 12-security-threat-model, 13-compliance-checker, 14-cost-estimation

Config: `sdlc-pipeline.yml`

---

## Hooks

Hooks fire automatically based on agent config. Only `builder` and `validator` have hooks.

| Script | Fires On | Purpose |
|--------|----------|---------|
| `pre_tool_use.py` | PreToolUse (builder) | Dangerous command detection (`rm -rf`), `.env` file protection |
| `post_tool_use.py` | PostToolUse Write/Edit (builder) | Post-write validation |
| `ruff_validator.py` | PostToolUse Write/Edit (builder) | Python linting (ruff) |
| `ty_validator.py` | PostToolUse Write/Edit (builder) | Python type checking (ty) |
| `session_start.py` | SessionStart | Context loading, environment setup |
| `session_end.py` | SessionEnd (builder) | Cleanup, state persistence |
| `post_agent_contract_validator.py` | SessionEnd (validator) | JSON contract validation |
| `pre_handoff_checker.py` | Pre-handoff | Agent handoff contract validation |

All hook scripts: `hooks/scripts/` | Validators: `hooks/validators/`

---

## Parallel Execution

Requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` (set in `settings.json`).

Rules:
- Orchestrator defines parallel groups
- Parallel agents **must not write to the same file**
- Use `sdlc-pipeline.yml` phase groups for SDLC parallelism

---

## Platform-Agnostic Design

Skills must NEVER hardcode framework-specific commands, file patterns, or directory structures.

1. **Read AGENTS.md** for project-specific config (test commands, deploy commands, etc.)
2. **If missing, AskUserQuestion** — let Richardson specify or search the repo
3. **Persist the answer to AGENTS.md** so we never ask again

This applies to test runners, build commands, deploy targets, and any project-specific behavior.
The project owns its config; rstack reads it.

---

## Skill Authoring Rules (SKILL.md.tmpl pattern)

Skills are prompt templates read by Codex, not bash scripts.
Each bash code block runs in a separate shell — variables do not persist between blocks.

- **Use natural language for logic and state.** Don't use shell variables to pass state between code blocks. Reference prior steps in prose.
- **Express conditionals as English.** Write numbered decision steps: "1. If X, do Y. 2. Otherwise, do Z."
- **Keep bash blocks self-contained.** Each block must work independently.
- **Don't hardcode branch names.** Detect `main`/`master` dynamically.

---

## VERSION + CHANGELOG Style

**Branch-scoped.** Every feature branch that ships gets its own version bump and CHANGELOG entry.

**When to write the CHANGELOG entry:** At ship time, not during development.

**Rules:**
- The entry covers ALL commits on this branch vs the base branch
- Never fold new work into an existing CHANGELOG entry from a prior version
- If main is at `v1.2.0` and your branch adds features, bump to `v1.3.0` — don't edit the `v1.2.0` entry
- After any CHANGELOG edit: run `grep "^## \[" CHANGELOG.md` and verify the version sequence is contiguous

**Writing style:** CHANGELOG.md is for users, not contributors.
- Lead with what Richardson can now DO that he couldn't before
- Plain language, not implementation details. "You can now..." not "Refactored the..."
- Never mention internal tracking or contributor-facing details
- Every entry should feel like a product release note

---

## Commit Style

**Always bisect commits.** Every commit = one logical change.
- Rename/move separate from behavior changes
- Test infrastructure separate from test implementations
- Template changes separate from generated file regeneration
- Mechanical refactors separate from new features

---

## Search Before Building

Before designing any solution involving concurrency, unfamiliar patterns, or infrastructure:

1. Search for `{runtime} {thing} built-in`
2. Search for `{thing} best practice 2026`
3. Check official docs

Three layers: tried-and-true (Layer 1), new-and-popular (Layer 2), first-principles (Layer 3).
Prize Layer 3 above all. See `ETHOS.md` for the full builder philosophy.

---

## AI Effort Compression Reference

| Task type | Human team | rstack | Compression |
|-----------|-----------|--------|-------------|
| Boilerplate / scaffolding | 2 days | 15 min | ~100x |
| Test writing | 1 day | 15 min | ~50x |
| Feature implementation | 1 week | 30 min | ~30x |
| Bug fix + regression test | 4 hours | 15 min | ~20x |
| Architecture / design | 2 days | 4 hours | ~5x |
| Research / exploration | 1 day | 3 hours | ~3x |

Completeness is cheap. Don't recommend shortcuts when the complete implementation is a "lake" — achievable in minutes. See `ETHOS.md: Completeness is cheap`.

---

## Richardson's Non-Negotiables

1. **Transparency first.** If a system can't handle a condition, say so before shipping it.
2. **Accountability stays human.** AI executes; Richardson decides and is responsible.
3. **Done means structurally sound** — not "working for now." Read `ETHOS.md`.
4. **Never ship sloppy.** The last 5% of correctness costs seconds with rstack. Do it.
