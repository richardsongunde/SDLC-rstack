# rstack-agents

[![npm version](https://img.shields.io/npm/v/rstack-agents.svg)](https://www.npmjs.com/package/rstack-agents)
[![license](https://img.shields.io/npm/l/rstack-agents.svg)](LICENSE)
[![node](https://img.shields.io/node/v/rstack-agents.svg)](package.json)

Production-ready agentic SDLC framework for Pi and coding agents. RStack gives an AI coding agent a software-company workflow: orchestrator, builder team, validator team, specialist routing, lifecycle state, memory, and release-ready quality gates.

`rstack-agents` started as Richardson Gunde's Claude Code `rstack` workspace. It is now evolving into a portable Pi-first extension that can reuse specialist prompts and skills without exposing hundreds of tools or requiring MCP at startup.

## Architecture

```
                       +-----------------------+
                       |     orchestrator      |
                       +-----------+-----------+
                                   |
                +------------------+------------------+
                |                                     |
        +-------v--------+                  +---------v--------+
        |  Builder Team  |                  |  Validator Team  |
        +-------+--------+                  +---------+--------+
                |                                     |
   writes .rstack/runs/[task]/builder.json  reads + validates contract
                |                                     |
        +-------v---------------------------------v---+
        |             Specialist Agents               |
        |  backend  frontend  devops  qa  security    |
        |  data     product   docs    sdlc            |
        +---------------------------------------------+
                |
        +-------v--------+
        |     Hooks      |
        |  pre/post tool |
        |  session start |
        |  session end   |
        |  validators    |
        +----------------+
```

The orchestrator picks the right specialist for a task. Builders write JSON state files. Validators read those state files and confirm the contract was met before the work moves forward. Lifecycle hooks capture session state, tool activity, validation status, and learnings.

## Quick start

### Use with Pi

Install the Pi package:

```bash
pi install npm:rstack-agents
```

Try from a local checkout:

```bash
pi -e /path/to/SDLC-rstack
```

Then ask Pi to use RStack, for example:

> Use RStack to build a production-ready web app with tests, docs, validation, and release notes.

Primary Pi tools:

| Tool | Purpose |
| --- | --- |
| `sdlc_orchestrate` | Load RStack orchestrator, builder, and validator instructions into the active task before coding. |
| `sdlc_start` | Start a clean `.rstack/runs/<run_id>/` lifecycle. |
| `sdlc_clarify` | Capture product-owner answers before planning so RStack does not guess. |
| `sdlc_plan` | Create requirements, lifecycle plan, and task graph with acceptance criteria and validation checks. |
| `sdlc_build_next` | Prepare the next builder task with specialist context and output contract. |
| `sdlc_validate` | Validate builder contracts and write validation reports. |
| `sdlc_status` | Show current run state and next action. |
| `sdlc_memory` | Search or append project learnings. |

### Use with Claude Code scaffold

The public npm package is Pi-first and does not currently bundle the private `.claude/` template workspace. From a private RStack checkout, maintainers can still sync templates and scaffold Claude Code projects:

```bash
npm run sync:templates
cd your-project
rstack-agents init
```

Once public templates are curated, they can be added back to the package without exposing private workspace files.

## CLI reference

| Command | Description |
| --- | --- |
| `rstack-agents init [--force]` | Scaffold `.claude/` into the current project when templates are present, mainly for private checkout usage until public templates are curated. |
| `rstack-agents update` | Update the framework, preserving `settings.json` and `settings.local.json`. |
| `rstack-agents update --agents-only` | Only refresh `agents/`, `skills/`, `plugins/`. Leaves hooks and settings alone. |
| `rstack-agents list agents` | List all agents grouped by domain. |
| `rstack-agents list skills` | List all skills with descriptions. |
| `rstack-agents list plugins` | List all plugins with descriptions. |
| `rstack-agents add plugin <name>` | Install a single plugin into `.claude/plugins/<name>`. |
| `rstack-agents validate` | Validate every agent's frontmatter and hook references. Exit code 1 on failure. |

## What's included

- **200+ specialist agents** across core, sdlc, backend, frontend, devops, qa, security, data, product, docs, and crypto domains.
- **66 skills** — workflows like `investigate`, `ship`, `plan-eng-review`, `frontend-design`, `security-owasp`, `code-review-pr`.
- **72 plugins** — drop-in domain packs for backend development, payments, ML ops, incident response, and more.
- **Hook system** — `pre_tool_use.py` for dangerous-command detection, `post_tool_use.py` for validation, `ruff_validator.py` and `ty_validator.py` for Python lint and types, plus session lifecycle hooks.
- **SDLC pipeline** — sequential agent chain from environment setup through deployment and summary, with optional security threat modeling, compliance checking, and cost estimation phases.
- **Pi extension** — native Pi tools for clean `.rstack/runs/` state, clarification, planning, builder/validator contracts, status, and memory.
- **Agent instruction loading** — `sdlc_orchestrate` and `sdlc_build_next` embed the actual `.claude/agents` markdown into task packets so Pi uses the RStack agents instead of merely naming them.
- **Production operating standard** — shared evidence-first instructions for orchestrator, builder, validator, and SDLC stage agents.

## Team architecture

Two teams move work through the system:

- **Builder team.** Writes code, edits files, runs tests. After every task, writes `.rstack/runs/<run_id>/tasks/<task_id>/builder.json` with `task_id`, `agent`, `status`, `summary`, `files_modified`, `tests_run`, `risks`, and `next_steps`.
- **Validator team.** Reads the builder's state file and writes `.rstack/runs/<run_id>/tasks/<task_id>/validation.json` with `task_id`, `validator`, `checks[]`, `status` (PASS/FAIL), `issues[]`, and `retry_recommendation`.

The orchestrator routes a task to a builder, waits for the state file, then routes to a validator. If the validator fails, the orchestrator decides whether to retry, escalate, or mark the work blocked.

Parallel execution is supported via `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` (set automatically in the shipped `settings.json`). Parallel agents must not write to the same file — the SDLC pipeline phase groups define safe parallel partitions.

## Hook system

Hooks fire automatically based on agent configuration. Only `builder` and `validator` agents have hooks attached.

| Script | Fires on | Purpose |
| --- | --- | --- |
| `pre_tool_use.py` | PreToolUse (builder) | Dangerous command detection (`rm -rf`), `.env` file protection. |
| `post_tool_use.py` | PostToolUse Write/Edit | Post-write validation. |
| `ruff_validator.py` | PostToolUse Write/Edit | Python linting via ruff. |
| `ty_validator.py` | PostToolUse Write/Edit | Python type checking via ty. |
| `session_start.py` | SessionStart | Context loading, environment setup. |
| `session_end.py` | SessionEnd (builder) | Cleanup, state persistence. |
| `post_agent_contract_validator.py` | SessionEnd (validator) | JSON contract validation. |
| `pre_handoff_checker.py` | Pre-handoff | Agent handoff contract validation. |

All scripts live in `.claude/hooks/scripts/`. Validators live in `.claude/hooks/validators/`.

## Publishing and package boundary

The package is configured to ship public runtime artifacts only:

- `extensions/`
- `bin/`
- `src/`
- `docs/public/`
- curated `templates/` only after they are intentionally prepared for public release
- `README.md`

The private working directories `.claude/`, `.agents/`, logs, and local run outputs are excluded from the package. This keeps the end-user install clean while allowing the public extension to reuse specialist assets when they exist in the target project.

For more Pi details, see [`docs/public/pi-extension.md`](docs/public/pi-extension.md).

## Programmatic use

```js
import {
  initCommand,
  updateCommand,
  listAgents,
  listSkills,
  listPlugins,
  validateCommand
} from 'rstack-agents';

await initCommand({ force: false });
const exitCode = await validateCommand();
```

## Contributing

1. Fork and clone.
2. `npm install`.
3. Add an agent (`.claude/agents/your-agent.md`), skill (`.claude/skills/your-skill/SKILL.md`), or plugin.
4. Run `npm test` and `rstack-agents validate` locally.
5. Open a PR against `main`. Bump `VERSION` and add a `CHANGELOG.md` entry that leads with what users can now DO that they couldn't before.

Every commit should be one logical change. Renames stay separate from behavior changes. See `CLAUDE.md` for the full commit style guide.

## License

MIT.
