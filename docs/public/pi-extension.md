<!-- owner: RStack developed by Richardson Gunde -->

# RStack SDLC Pi Extension

RStack SDLC is a Pi extension that turns a coding agent into a structured software delivery team. It gives the host agent a clean lifecycle instead of a pile of disconnected prompts.

## What it does

RStack coordinates:

1. Product clarification
2. Requirements and acceptance criteria
3. Architecture and implementation plan
4. Builder-team execution
5. Validator-team review
6. Testing and security checks
7. Documentation and release readiness
8. Memory capture for future runs

The extension stores state in `.rstack/runs/` so every run is inspectable, resumable, and auditable.

## Why not MCP for the first version?

The first RStack package is a native Pi extension, not an MCP server. MCP is useful for broad interoperability, but it can add startup and tool-description context overhead. RStack starts with a small, high-level Pi tool surface so the model sees only lifecycle actions, not hundreds of specialist tools.

## Tool flow

```text
sdlc_orchestrate
  -> sdlc_start
  -> sdlc_clarify
  -> sdlc_plan
  -> sdlc_spec
  -> sdlc_approve
  -> sdlc_agents
  -> sdlc_delegate
  -> sdlc_build_next
  -> sdlc_validate
  -> sdlc_status
  -> sdlc_memory
```

## State layout

```text
.rstack/
  registry/
    registry.json
    agents.json
    skills.json
    plugins.json
    routing.json
  memory/
    learnings.jsonl
  runs/
    <run_id>/
      manifest.json
      context.md
      plan.md
      tasks.json
      approvals.json
      traceability.json
      events.jsonl
      specs/
        product-brief.md
        requirements.json
        architecture.md
        qa-report.json
        security-review.md
        release-readiness.json
      tasks/
        <task_id>/
          prompt.md
          builder.json
          validation.json
```

## Hook lifecycle wiring

RStack uses Pi extension hooks as the runtime harness:

| Pi hook | RStack behavior |
| --- | --- |
| `resources_discover` | Exposes package/project skills and prompts to Pi. |
| `session_start` | Creates `.rstack/` state roots and sets the RStack status line. |
| `before_agent_start` | Injects orchestrator/builder/validator instructions when the prompt mentions RStack/SDLC. |
| `tool_call` | Logs tool calls to the active run and blocks destructive shell/write actions unless a human approval exists. |
| `tool_result` | Logs bounded tool result summaries to the active run event stream. |
| `session_shutdown` | Appends a shutdown event to the active run. |

Destructive commands such as `rm -rf`, `git push`, `npm publish`, `terraform apply/destroy`, and writes to secret-like paths are blocked during an active RStack run unless `sdlc_approve` records `destructive-action` or `release-readiness.json`, or `RSTACK_ALLOW_DESTRUCTIVE=1` is set.

## Specialist reuse

The package ships reusable RStack assets directly:

- `agents/**/*.md`
- `skills/**/SKILL.md`
- `prompts/*.md`
- `plugins/*/plugin.json`

Projects can override or add local assets under `.rstack/agents`, `.pi/rstack/agents`, `.rstack/skills`, `.pi/rstack/skills`, `.rstack/plugins`, or `.pi/rstack/plugins`.

The extension uses the registry to select specialist context for lifecycle tasks and can also spawn isolated workers through `sdlc_delegate`.

## Install in Pi

From a published package:

```bash
pi install npm:rstack-agents
```

From a local checkout:

```bash
pi install /path/to/SDLC-rstack
```

Or try once:

```bash
pi -e /path/to/SDLC-rstack
```

## Recommended use

Ask Pi something like:

> Use RStack to build a full production-ready todo app with authentication, tests, docs, and release notes.

Then follow the lifecycle:

1. Call `sdlc_orchestrate` with the goal to load RStack core agent instructions.
2. Call `sdlc_start` with the goal.
3. Call `sdlc_clarify` to capture product-owner decisions if the goal is ambiguous.
4. Call `sdlc_plan` to create the delivery plan.
5. Review generated specs with `sdlc_spec`.
6. Record human gates with `sdlc_approve` for `plan.md`, `requirements.json`, `architecture.md`, and release readiness.
7. Call `sdlc_agents` when you need to inspect available specialists.
8. Call `sdlc_delegate` for isolated builder, validator, research, or review workers.
9. Call `sdlc_build_next` to get the next builder task packet with embedded specialist instructions.
10. Execute the task using normal coding tools or delegated workers.
11. Write the required `builder.json` contract.
12. Call `sdlc_validate`.
13. Repeat until complete.
14. Call `sdlc_memory` to record important learnings.

## Publishing note

The npm package is configured to ship the public Pi runtime artifacts: `extensions/`, `agents/`, `skills/`, `prompts/`, `plugins/`, `bin/`, `src/`, `docs/public/`, and `README.md`.
