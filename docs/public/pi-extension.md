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
  memory/
    learnings.jsonl
  runs/
    <run_id>/
      manifest.json
      context.md
      plan.md
      tasks.json
      events.jsonl
      tasks/
        <task_id>/
          prompt.md
          builder.json
          validation.json
```

## Specialist reuse

If a project already has RStack/Claude-style assets under `.claude/`, the extension indexes them:

- `.claude/agents/**/*.md`
- `.claude/skills/**/SKILL.md`
- `.claude/plugins/*/plugin.json`

The extension does not expose every specialist as a separate tool. It uses the registry to select specialist context for each lifecycle task, then embeds the selected `.claude/agents` markdown into the builder task packet. This matters in Pi because a `.claude/agents` folder by itself is not an executable subagent runtime.

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
5. Call `sdlc_build_next` to get the next builder task packet with embedded specialist instructions.
6. Execute the task using normal coding tools.
7. Write the required `builder.json` contract.
8. Call `sdlc_validate`.
9. Repeat until complete.
10. Call `sdlc_memory` to record important learnings.

## Publishing note

The npm package is configured to ship only the public package artifacts needed by end users, not the private working `.claude/` or `.agents/` directories.
