# RStack on Claude Code

<!-- owner: RStack developed by Richardson Gunde -->

Claude Code drives RStack through the `sdlc-automation` plugin (skills for
every pipeline agent) while RStack keeps the governed state in `.rstack/`.

## Setup

```bash
cd your-project
npx rstack-agents init --framework claude-code
```

This creates `.claude/rstack-sdlc.md` (project-local usage guide) and
registers the project with the Business Hub. Then install the plugin inside
Claude Code:

```
/plugin install sdlc-automation
```

## Daily flow

| Command | Purpose |
|---|---|
| `/sdlc-start` | Full pipeline, agents chain autonomously |
| `/sdlc-sequential` / `/sdlc-parallel` | One agent at a time, or DAG mode |
| `/sdlc-status` | Which agents completed, which are pending |
| `/sdlc-resume` | Resume from a specific agent |
| `/sdlc-agent <name>` | Run a single SDLC agent in isolation |

## Observability

```bash
npx rstack-business
```

Run timelines, stage durations, approvals, alerts, and traceability on :3008 —
aggregated across every project on this machine.
