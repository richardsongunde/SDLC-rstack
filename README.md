# rstack-agents

<!-- owner: RStack developed by Richardson Gunde -->

RStack SDLC is a **framework-independent AI-SDLC harness** developed by Richardson Gunde.

It packages a governed software-delivery operating system for AI agents:

- orchestrator, builder, and validator teams
- SDLC pipeline agents
- specialist agents
- skills
- prompts
- plugin packs
- spec artifacts
- approval gates
- traceability
- runtime state
- safety hooks
- package validation

Pi is the first native runtime adapter. RStack itself is not Pi-only.

## Product positioning

Use this language when explaining RStack:

> RStack SDLC is a portable AI-driven software delivery framework with a first-class Pi adapter today, and portable assets that can be used by Claude Code, Codex CLI, Gemini CLI, Qwen Code, MCP-capable clients, and custom agent harnesses.

Do **not** describe RStack as only a Pi extension. The Pi extension is one adapter.

## Architecture

```text
RStack portable core
├── agents/       Markdown agent definitions
├── skills/       Reusable workflow instructions
├── prompts/      Prompt templates
├── plugins/      Domain packs with manifests, agents, skills, commands
├── docs/public/  Public docs
└── .rstack/      Runtime state format generated inside target projects

Runtime adapters
├── Pi extension                  supported now
├── Claude Code asset adapter      usable now, native adapter planned
├── Codex CLI AGENTS.md adapter    usable now
├── Gemini CLI GEMINI.md adapter   usable now
├── Qwen Code AGENTS.md adapter    usable now
├── MCP adapter                    planned
└── custom harness adapter         possible with the same files
```

## Why Pi is first, but not required

Pi gives RStack a complete runtime host today:

| RStack need | Pi support |
| --- | --- |
| Custom tools | `pi.registerTool()` |
| Slash commands | `pi.registerCommand()` |
| Lifecycle events | `pi.on(...)` |
| Tool safety gates | `tool_call` hook |
| Tool result logging | `tool_result` hook |
| Skills/prompts discovery | `resources_discover` hook |
| Package installation | `pi install` |
| Worker delegation | `pi --mode json` subprocesses |

That is why the first implementation lives in:

```text
extensions/rstack-sdlc.ts
```

But the reusable RStack knowledge is in plain Markdown and JSON-compatible artifacts. Other frameworks can consume those assets even before a native adapter exists.

## Install options by runtime

| Runtime | Status | Best path today |
| --- | --- | --- |
| Pi | Native supported | `pi install npm:rstack-agents` or `pi install .` |
| Claude Code | Asset adapter usable | Copy/symlink RStack agents into `.claude/agents/rstack/` and prompts into `.claude/commands/rstack/` |
| Codex CLI | Asset adapter usable | Add an `AGENTS.md` that points Codex to RStack assets |
| Gemini CLI | Asset adapter usable | Add a `GEMINI.md` that points Gemini CLI to RStack assets |
| Qwen Code | Asset adapter usable | Add an `AGENTS.md` that points Qwen Code to RStack assets |
| Claude Desktop | MCP path planned | Use future RStack MCP adapter; today use RStack as project docs/manual context |
| Perplexity Desktop | Not verified as local agent host | Use future MCP/web adapter if supported; today use exported docs/manual context |
| Custom harness | Supported by design | Read `agents/`, `skills/`, `plugins/`, write `.rstack/runs/` state |

## Universal install, framework-independent

This is the simplest way to use RStack assets from any agentic framework:

```bash
git clone https://github.com/richardsongunde/rstack-agents.git ~/rstack-agents
```

Or use this local checkout:

```bash
export RSTACK_HOME=/Users/richardsongunde/projects/SDLC-rstack
```

Then point your agent to:

```text
$RSTACK_HOME/agents/core/orchestrator.md
$RSTACK_HOME/agents/core/builder.md
$RSTACK_HOME/agents/core/validator.md
$RSTACK_HOME/agents/sdlc/
$RSTACK_HOME/skills/
$RSTACK_HOME/plugins/
$RSTACK_HOME/prompts/
```

Universal bootstrap prompt:

```text
Use RStack SDLC from $RSTACK_HOME.
Read agents/core/orchestrator.md first, then follow the builder/validator contracts.
Create run state under .rstack/runs/<run_id>/.
Use specs, approvals, traceability, builder.json, and validation.json exactly as RStack defines them.
Do not claim DONE without evidence.
```

## Install in Pi, native adapter

### From npm, after publishing

```bash
pi install npm:rstack-agents
```

### From local checkout

```bash
cd /Users/richardsongunde/projects/SDLC-rstack
pi install .
```

### One-off local testing

```bash
pi -e /Users/richardsongunde/projects/SDLC-rstack/extensions/rstack-sdlc.ts
```

Then ask Pi:

```text
Use RStack to plan, build, validate, test, document, and prepare this feature for release: <your goal>
```

## Install in Claude Code, asset adapter

Claude Code supports project/user subagents and slash commands. RStack can be used there by copying or symlinking the portable assets.

From a target project:

```bash
export RSTACK_HOME=/Users/richardsongunde/projects/SDLC-rstack
mkdir -p .claude/agents/rstack .claude/commands/rstack .rstack/vendor/rstack
cp -R "$RSTACK_HOME/agents" .rstack/vendor/rstack/
cp -R "$RSTACK_HOME/skills" .rstack/vendor/rstack/
cp -R "$RSTACK_HOME/plugins" .rstack/vendor/rstack/
cp -R "$RSTACK_HOME/prompts" .rstack/vendor/rstack/
cp -R "$RSTACK_HOME/agents"/* .claude/agents/rstack/
cp "$RSTACK_HOME/prompts"/*.md .claude/commands/rstack/ 2>/dev/null || true
```

Add this to your project `CLAUDE.md`:

```markdown
# RStack SDLC

Use RStack SDLC from `.rstack/vendor/rstack`.
Start with `.rstack/vendor/rstack/agents/core/orchestrator.md`.
Use `.rstack/vendor/rstack/agents/core/builder.md` for implementation tasks.
Use `.rstack/vendor/rstack/agents/core/validator.md` for read-only verification.
Write all run state under `.rstack/runs/<run_id>/`.
Require specs, approvals, traceability, `builder.json`, and `validation.json`.
Never claim DONE without evidence.
```

Claude Code asset mode gives agent instructions and commands. It does not yet provide the Pi-native runtime hooks unless a Claude Code-specific adapter is added later.

## Install in Codex CLI, AGENTS.md adapter

Codex CLI uses repository guidance files such as `AGENTS.md`. From a target project:

```bash
export RSTACK_HOME=/Users/richardsongunde/projects/SDLC-rstack
mkdir -p .rstack/vendor/rstack
cp -R "$RSTACK_HOME/agents" .rstack/vendor/rstack/
cp -R "$RSTACK_HOME/skills" .rstack/vendor/rstack/
cp -R "$RSTACK_HOME/plugins" .rstack/vendor/rstack/
cp -R "$RSTACK_HOME/prompts" .rstack/vendor/rstack/
cat > AGENTS.md <<'EOF'
# RStack SDLC

Use RStack SDLC from `.rstack/vendor/rstack`.
Read `.rstack/vendor/rstack/agents/core/orchestrator.md` first.
For implementation, follow `.rstack/vendor/rstack/agents/core/builder.md`.
For verification, follow `.rstack/vendor/rstack/agents/core/validator.md`.
Use SDLC pipeline agents from `.rstack/vendor/rstack/agents/sdlc/`.
Use skills from `.rstack/vendor/rstack/skills/` and plugin packs from `.rstack/vendor/rstack/plugins/`.
Write run state under `.rstack/runs/<run_id>/`.
Require specs, approval gates, traceability, builder contracts, validation contracts, and command evidence.
EOF
```

Then run Codex CLI from that project.

## Install in Gemini CLI, GEMINI.md adapter

Gemini CLI supports project context through `GEMINI.md`. From a target project:

```bash
export RSTACK_HOME=/Users/richardsongunde/projects/SDLC-rstack
mkdir -p .rstack/vendor/rstack
cp -R "$RSTACK_HOME/agents" .rstack/vendor/rstack/
cp -R "$RSTACK_HOME/skills" .rstack/vendor/rstack/
cp -R "$RSTACK_HOME/plugins" .rstack/vendor/rstack/
cp -R "$RSTACK_HOME/prompts" .rstack/vendor/rstack/
cat > GEMINI.md <<'EOF'
# RStack SDLC

Use RStack SDLC from `.rstack/vendor/rstack`.
Start with `.rstack/vendor/rstack/agents/core/orchestrator.md`.
Use the SDLC pipeline in `.rstack/vendor/rstack/agents/sdlc/`.
Use plugin packs from `.rstack/vendor/rstack/plugins/` only when relevant to the task domain.
Maintain `.rstack/runs/<run_id>/` with specs, approvals, traceability, tasks, builder.json, and validation.json.
Do not perform destructive actions without explicit human approval.
Do not claim DONE without command evidence.
EOF
```

Then run Gemini CLI from that project.

## Install in Qwen Code, AGENTS.md adapter

Qwen Code can consume repository guidance through `AGENTS.md`. From a target project:

```bash
export RSTACK_HOME=/Users/richardsongunde/projects/SDLC-rstack
mkdir -p .rstack/vendor/rstack
cp -R "$RSTACK_HOME/agents" .rstack/vendor/rstack/
cp -R "$RSTACK_HOME/skills" .rstack/vendor/rstack/
cp -R "$RSTACK_HOME/plugins" .rstack/vendor/rstack/
cp -R "$RSTACK_HOME/prompts" .rstack/vendor/rstack/
cat > AGENTS.md <<'EOF'
# RStack SDLC

Use RStack SDLC from `.rstack/vendor/rstack`.
Act as the RStack orchestrator first, not as a direct coder.
Read `.rstack/vendor/rstack/agents/core/orchestrator.md`, then route to builder and validator contracts.
Use `.rstack/vendor/rstack/agents/sdlc/` for lifecycle stages.
Use `.rstack/vendor/rstack/plugins/` as domain packs.
Write `.rstack/runs/<run_id>/` state and preserve traceability.
Require human approval gates before implementation and release decisions.
EOF
```

Then run Qwen Code from that project.

## Install in Claude Desktop

Claude Desktop is best supported through MCP for local tools and external integrations. RStack does not yet ship an MCP server adapter in this package.

Current options:

1. Use RStack as project documentation/context by adding this repo or exported files to the conversation.
2. Use the Pi adapter for full native runtime behavior.
3. Build or wait for the planned RStack MCP adapter, which should expose the same high-level tools:

```text
sdlc_start
sdlc_clarify
sdlc_plan
sdlc_spec
sdlc_approve
sdlc_agents
sdlc_build_next
sdlc_validate
sdlc_status
sdlc_memory
```

Planned MCP package shape:

```text
adapters/mcp/
  server.ts
  tools/
    start.ts
    plan.ts
    approve.ts
    validate.ts
```

When the MCP adapter exists, Claude Desktop installation should be a normal local MCP server entry in Claude Desktop config.

## Install in Perplexity Desktop

Perplexity Desktop is not currently verified here as a local coding-agent extension host. Do not claim native support until an official local extension/MCP path is verified.

Current options:

1. Use RStack docs and prompts as manual context.
2. Use RStack through a supported runtime such as Pi.
3. Use a future MCP or web adapter if Perplexity Desktop exposes compatible local tool integration.

## Install in a custom harness

A custom harness only needs to implement the RStack runtime contract.

Minimum required behavior:

```text
1. Read agents/core/orchestrator.md.
2. Create .rstack/runs/<run_id>/manifest.json.
3. Create context.md, plan.md, tasks.json.
4. Create specs/ artifacts.
5. Record approvals.json.
6. Record traceability.json.
7. Route tasks to agents/sdlc, agents/specialists, skills, and plugins.
8. Require builders to write builder.json.
9. Require validators to write validation.json.
10. Block DONE unless validation evidence exists.
```

Minimum generated layout:

```text
.rstack/
  registry/
    registry.json
    agents.json
    skills.json
    plugins.json
    routing.json
  runs/<run_id>/
    manifest.json
    context.md
    plan.md
    tasks.json
    approvals.json
    traceability.json
    events.jsonl
    specs/
    tasks/<task_id>/
      prompt.md
      builder.json
      validation.json
```

## Native Pi quickstart flow

Inside Pi, use:

```text
sdlc_orchestrate
sdlc_start
sdlc_clarify
sdlc_plan
sdlc_spec
sdlc_approve
sdlc_build_next
sdlc_validate
sdlc_status
sdlc_memory
```

Example:

```text
Use RStack to build a production-ready todo app with auth, tests, docs, and release readiness.
```

Recommended first calls:

```text
sdlc_orchestrate(goal="Build a production-ready todo app with auth, tests, docs, and release readiness")
sdlc_start(goal="Build a production-ready todo app with auth, tests, docs, and release readiness")
sdlc_clarify()
sdlc_plan()
```

Approve gates before build execution:

```text
sdlc_approve(artifact="plan.md", status="APPROVED")
sdlc_approve(artifact="requirements.json", status="APPROVED")
sdlc_approve(artifact="architecture.md", status="APPROVED")
```

Then continue:

```text
sdlc_build_next()
sdlc_validate()
sdlc_status()
```

## Native Pi tools

| Tool | Purpose |
| --- | --- |
| `sdlc_orchestrate` | Load RStack orchestrator, builder, and validator operating instructions for a goal. |
| `sdlc_start` | Create `.rstack/runs/<run_id>/` state for a new SDLC run. |
| `sdlc_clarify` | Ask or capture product-owner answers before planning. |
| `sdlc_plan` | Create lifecycle tasks, draft specs, registry files, routing metadata, and traceability. |
| `sdlc_spec` | Read or update governed spec artifacts under `.rstack/runs/<run_id>/specs/`. |
| `sdlc_approve` | Record human approval or rejection gates for plans, requirements, architecture, release readiness, or destructive actions. |
| `sdlc_agents` | List available packaged/project-local agents, skills, and plugins by kind/domain. |
| `sdlc_delegate` | Spawn isolated Pi worker agents for single or bounded parallel tasks. Validators default to read-only tools. |
| `sdlc_build_next` | Prepare the next gated builder task packet with core, SDLC, specialist, skill, and plugin context. |
| `sdlc_validate` | Validate builder output and write `validation.json`. |
| `sdlc_status` | Show run status, task progress, missing approvals, registry counts, and next recommended action. |
| `sdlc_memory` | Search or append project learnings for future runs. |

## Native Pi slash commands

```text
/sdlc          Show RStack SDLC tool guidance
/sdlc-agents   Show RStack registry counts
```

## Package CLI commands

The package CLI is framework-neutral and useful for inspection:

```bash
rstack-agents list agents
rstack-agents list skills
rstack-agents list plugins
rstack-agents validate
rstack-agents add plugin <name>
```

Local development equivalents:

```bash
node bin/rstack-agents.js list agents
node bin/rstack-agents.js list skills
node bin/rstack-agents.js list plugins
node bin/rstack-agents.js validate
node bin/rstack-agents.js add plugin backend-development
```

## What ships

```text
extensions/  Pi runtime adapter and SDLC harness
agents/      core team, SDLC pipeline agents, and specialists
skills/      reusable workflow instructions
prompts/     prompt templates
plugins/     domain packs with manifests, agents, skills, commands
bin/         CLI entry point
src/         CLI helpers
docs/public/ public documentation
```

Hidden workspaces such as `.claude/`, `.agents/`, and `.codex/` are not required and are not shipped as package runtime assets. Adapter setup may create those directories inside a target project when that framework expects them.

## Runtime governance model

RStack uses a strict governance loop:

```text
clarify -> plan -> spec -> approve -> build -> validate -> release-readiness -> memory
```

Required controls:

- no implementation before plan approval in interactive mode
- no implementation after requirements/architecture gates without approval
- destructive actions require explicit approval
- validators default to read-only tools
- every task has acceptance criteria
- every builder writes `builder.json`
- every validator writes `validation.json`
- traceability is written to `traceability.json`
- no DONE without evidence

## Runtime state layout

```text
.rstack/
  memory/
    learnings.jsonl
  registry/
    registry.json
    agents.json
    skills.json
    plugins.json
    routing.json
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
        implementation-report.json
        qa-report.json
        security-review.md
        handoff.md
        release-readiness.json
      tasks/
        <task_id>/
          prompt.md
          builder.json
          validation.json
```

## Team model

```text
Orchestrator / team lead
├── SDLC pipeline agents
│   ├── environment
│   ├── transcript
│   ├── requirements
│   ├── documentation
│   ├── planning
│   ├── jira
│   ├── architecture
│   ├── code
│   ├── testing
│   ├── deployment
│   ├── summary
│   ├── feedback loop
│   ├── security threat model
│   ├── compliance checker
│   └── cost estimation
├── Builder team
│   ├── backend specialists
│   ├── frontend specialists
│   ├── devops specialists
│   ├── data specialists
│   └── docs specialists
└── Validator team
    ├── QA specialists
    ├── security specialists
    ├── architecture reviewers
    ├── code reviewers
    └── performance/accessibility reviewers
```

## SDLC pipeline routing

The native Pi adapter maps lifecycle tasks to packaged SDLC agents:

```text
001-product-clarification -> 00-environment, 01-transcript
002-requirements          -> 02-requirements, 04-planning, 05-jira
003-architecture          -> 06-architecture, 12-security-threat-model, 14-cost-estimation
004-implementation        -> 07-code
005-testing               -> 08-testing
006-security-review       -> 12-security-threat-model, 13-compliance-checker
007-documentation         -> 03-documentation, 10-summary
008-release-readiness     -> 09-deployment, 10-summary, 11-feedback-loop
```

Each generated task includes:

```json
{
  "pipeline_agents": ["agent.02-requirements", "agent.04-planning"],
  "specialists": ["agent.02-requirements", "plugin.backend-development"]
}
```

Other adapters should preserve the same routing contract.

## Plugin routing

Plugin packs under `plugins/` are domain bundles. Each pack can include:

```text
plugin.json
agents/*.md
skills/**/SKILL.md
commands/*.md
```

RStack uses them this way:

1. Build a registry of agents, skills, prompts, and plugins.
2. Select plugin IDs that match the task domain, for example `plugin.backend-development`.
3. Include the selected plugin manifest plus a bounded preview/list of nested plugin assets in the task packet.
4. Let builders read only the specific nested plugin agent/skill needed for the task.
5. Let validators treat plugin output as guidance, while still enforcing RStack contracts and evidence rules.

## Hook lifecycle, native Pi adapter

The Pi extension uses these lifecycle hooks:

| Pi hook | RStack behavior |
| --- | --- |
| `resources_discover` | Exposes package/project skills and prompts to Pi. |
| `session_start` | Creates `.rstack/` state roots and sets RStack status. |
| `before_agent_start` | Injects RStack core instructions when the prompt mentions RStack/SDLC. |
| `tool_call` | Logs tool calls and blocks destructive commands/protected writes unless approved. |
| `tool_result` | Logs bounded tool result summaries to `events.jsonl`. |
| `session_shutdown` | Appends shutdown event to the active run. |

Other adapters should implement equivalent lifecycle behavior where possible.

## Protected actions

RStack blocks these during governed native runs unless approved:

```text
rm -rf
git push
npm publish
terraform apply/destroy
kubectl apply/delete
helm install/upgrade/uninstall
DROP TABLE
DELETE FROM
```

RStack also protects secret-like write paths:

```text
.env
.env.*
id_rsa
id_ed25519
credentials.*
secrets.*
.npmrc
.pypirc
```

To allow a destructive action:

```text
sdlc_approve(artifact="destructive-action", status="APPROVED")
```

or set:

```bash
RSTACK_ALLOW_DESTRUCTIVE=1
```

## Project-local overrides

RStack ships package-local assets, but target projects can add overrides:

```text
.rstack/agents/
.rstack/skills/
.rstack/prompts/
.rstack/plugins/
.pi/rstack/agents/
.pi/rstack/skills/
.pi/rstack/prompts/
.pi/rstack/plugins/
```

Package assets remain the default source of truth. Project-local assets are discovered and included in the registry at runtime by the Pi adapter. Other adapters should follow the same precedence.

## Development

```bash
cd /Users/richardsongunde/projects/SDLC-rstack
npm install
npm test
npm run validate
npm audit --audit-level=high
npm pack --dry-run
```

Type-check the Pi extension:

```bash
npx -y -p typescript tsc --noEmit --allowImportingTsExtensions --module NodeNext --moduleResolution NodeNext --target ES2022 --skipLibCheck extensions/rstack-sdlc.ts
```

## Validation status

Current package assets:

```text
196 agents
156 skills
36 prompts
72 plugins
```

Test suite covers:

- extension import
- registered Pi tools and commands
- harness run creation
- spec generation
- approval gates
- traceability writes
- registry metadata
- agent frontmatter
- duplicate agent names
- packaged skill/plugin references
- owner labels
- package asset cleanliness

## Publish to npm

1. Verify package metadata:

```bash
npm pkg get name version files pi
```

2. Run checks:

```bash
npm test
npm run validate
npm audit --audit-level=high
```

3. Inspect package contents:

```bash
npm pack --dry-run
```

Confirm it includes:

```text
extensions/
agents/
skills/
prompts/
plugins/
bin/
src/
docs/public/
README.md
```

Confirm it excludes:

```text
.claude/
.agents/
.codex/
node_modules/
logs/
outputs/
```

4. Publish:

```bash
npm login
npm publish --access public
```

5. Test install:

```bash
pi install npm:rstack-agents
```

## Adapter roadmap

Recommended next adapters:

```text
1. adapters/mcp        expose RStack tools to MCP clients
2. adapters/claude-code export agents/commands/skills into Claude Code layout
3. adapters/codex      generate AGENTS.md + task runner
4. adapters/gemini     generate GEMINI.md + command pack
5. adapters/qwen       generate AGENTS.md + command pack
6. adapters/sdk        Node/Python library for custom harnesses
```

## More documentation

```text
docs/public/pi-extension.md
docs/public/productivity-roadmap.md
docs/public/product-overview.md
```

## License

MIT
