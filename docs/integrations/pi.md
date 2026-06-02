# RStack on Pi

<!-- owner: RStack developed by Richardson Gunde -->

Pi is RStack's native host: the adapter is a first-class Pi extension,
declared in the package's `pi.extensions`, so Pi loads it automatically.

## Setup (under 2 minutes)

```bash
cd your-project
npm install rstack-agents
npx rstack-agents init --framework pi
```

That's it. The next Pi session in this project has every `sdlc_*` tool.

## What you get

| Tool | Purpose |
|---|---|
| `sdlc_start` | Create a governed run (15 canonical stages, approval gates) |
| `sdlc_plan` | Bootstrap specs, tasks, and the agent registry |
| `sdlc_build_next` | Prepare the next task for a builder agent |
| `sdlc_validate` | Validate the builder contract, emit evidence + stage events |
| `sdlc_approve` | Record human approval gates |
| `sdlc_status` / `sdlc_trace` | Run state and traceability |
| `sdlc_rollback` | Restore a stage from its checkpoint |
| `sdlc_dashboard` | Open the Business Hub |

Slash commands: `/sdlc`, `/sdlc-agents`, `/sdlc-dashboard`, `/sdlc-trace`,
`/sdlc-rollback`.

## Worker delegation

`sdlc_delegate` spawns builder agents with a Pi-compatible CLI. Configure via
`RSTACK_WORKER_COMMAND`, `RSTACK_DEFAULT_MODEL`, `RSTACK_ESCALATED_MODEL`.
