# Agent polish research notes

Date: 2026-05-14
Reference repo: `https://github.com/amosblomqvist/pi-config`
Local research checkout: `/tmp/pi-config`

## What was useful

`pi-config` is intentionally small, but it has strong patterns RStack should adopt:

1. **Evidence-first orchestration.** The orchestrator skill says not to assume, to verify with repo facts or current docs, and to ask when requirements materially affect implementation.
2. **Context hygiene.** Exploration is delegated to scouts/researchers so the main context stays clean.
3. **Small, clear agent roles.** Scout, researcher, and worker have narrow tool sets and clear model choices.
4. **User questions are a tool, not a failure.** Ambiguous requirements are handled by one direct question instead of guessing.
5. **Verification before claims.** The skill requires running the actual command before saying tests/builds pass.
6. **Copyable pieces.** The repo documents each extension or skill as a standalone component rather than a monolithic install.

## RStack implications

RStack should not expose hundreds of agents directly. The production UX should be:

```text
user goal
  -> small lifecycle tools
  -> orchestrator selects a few relevant specialists
  -> builder writes contract
  -> validator proves or rejects the contract
  -> memory captures real learnings
```

## Changes made from this research

- Added `.claude/agents/OPERATING-STANDARD.md` as a shared production bar.
- Injected the standard reference into all core and SDLC stage agents.
- Updated core orchestrator workflow to clarify, scout, decompose, dispatch, validate, and synthesize around `.rstack/runs/<run_id>/`.
- Updated builder instructions to write the Pi-first builder contract at `$RSTACK_RUN_DIR/tasks/<task_id>/builder.json`.
- Updated validator instructions to require evidence-backed checks and write `$RSTACK_RUN_DIR/tasks/<task_id>/validation.json`.

## Next recommended polish

1. Convert each SDLC stage from legacy `outputs/*` artifacts to explicit `.rstack/runs/<run_id>/artifacts/*` outputs.
2. Add a registry quality score so `sdlc_plan` selects specialists by domain, stage affinity, and prompt quality.
3. Add a `sdlc_clarify` or interactive clarification phase before planning.
4. Add validation tests that fail if core agents reference legacy `outputs/team_state/` outside compatibility notes.
5. Add a lightweight subagent bridge later, inspired by `pi-config/extensions/subagents`, but keep it optional so RStack stays Pi-first and small by default.
