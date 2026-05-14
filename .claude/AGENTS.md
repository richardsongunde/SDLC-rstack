# AGENTS.md — Master Discovery Index

## Production Operating Standard

All agents follow `agents/OPERATING-STANDARD.md`.

Prefer Pi-first RStack run state:

```text
$RSTACK_RUN_DIR/tasks/<task_id>/builder.json
$RSTACK_RUN_DIR/tasks/<task_id>/validation.json
$RSTACK_RUN_DIR/artifacts/*
```

Legacy `outputs/team_state/` is read-only compatibility input unless the task explicitly targets the old Claude Code scaffold.

## How To Route

| Situation | What to do |
|-----------|------------|
| Complex multi-step task | Load `agents/core/orchestrator.md` |
| Single execution task | Load `agents/core/builder.md` |
| Full project lifecycle | Start `agents/sdlc/00-environment.md` |
| Domain specialist | Find domain table below, use that path |
| Specialized workflow | Load `skills/[name]/SKILL.md` |
| Domain pack | Load from `plugins/[name]/` |

---

## Core Team

| Agent | Path | Purpose | Model |
|-------|------|---------|-------|
| orchestrator | `agents/core/orchestrator.md` | Routes tasks, spawns teams, knows all paths | opus |
| builder | `agents/core/builder.md` | Executes ONE task, loads relevant skill first | opus |
| validator | `agents/core/validator.md` | Read-only verification of builder output | opus |

---

## SDLC Pipeline

Run in order. Each agent reads the previous stage's JSON and writes its own.

| # | Agent | Path | Reads | Writes | Key Skill |
|---|-------|------|-------|--------|-----------|
| 00 | environment | `agents/sdlc/00-environment.md` | — | `environment_report.json` | — |
| 01 | transcript | `agents/sdlc/01-transcript.md` | environment_report | `transcript.json` | — |
| 02 | requirements | `agents/sdlc/02-requirements.md` | transcript | `requirement_spec.json` | plan-eng-review |
| 03 | documentation | `agents/sdlc/03-documentation.md` | requirement_spec | `documentation.json` | document-release |
| 04 | planning | `agents/sdlc/04-planning.md` | requirement_spec | `plan.json` | plan-ceo-review, plan-eng-review |
| 05 | jira | `agents/sdlc/05-jira.md` | plan | `jira_tickets.json` | — |
| 06 | architecture | `agents/sdlc/06-architecture.md` | jira_tickets + requirement_spec | `system_design.json` + `HLD.md` | plan-eng-review, security-owasp |
| 07 | code | `agents/sdlc/07-code.md` | system_design | `code_report.json` | investigate, careful |
| 08 | testing | `agents/sdlc/08-testing.md` | code_report | `test_report.json` | qa-testing, webapp-testing |
| 09 | deployment | `agents/sdlc/09-deployment.md` | test_report | `deployment_report.json` | ship, setup-deploy, canary |
| 10 | summary | `agents/sdlc/10-summary.md` | all | `summary.json` + `PROJECT_SUMMARY.md` | document-release |
| 11 | feedback-loop | `agents/sdlc/11-feedback-loop.md` | summary | `feedback.json` | retro |
| 12 | security-threat-model | `agents/sdlc/12-security-threat-model.md` | system_design | `threat_model.json` | security-owasp |
| 13 | compliance-checker | `agents/sdlc/13-compliance-checker.md` | system_design | `compliance_report.json` | security-owasp |
| 14 | cost-estimation | `agents/sdlc/14-cost-estimation.md` | plan + system_design | `cost_estimate.json` | — |

---

## Specialists

### Backend (49 agents) — `agents/specialists/backend/`
Key agents: `api-architect`, `api-builder`, `api-designer`, `backend-developer`, `backend-architect`,
`database-architect`, `database-designer`, `database-administrator`, `graphql-architect`,
`microservices-architect`, `staff-engineer`, `system-architect`, `code-architect`,
`golang-pro`, `python-pro`, `typescript-expert`, `javascript-pro`, `nextjs-developer`,
`react-pro`, `django-developer`, `java-architect`, `blockchain-developer`, `fintech-engineer`

### Frontend (10 agents) — `agents/specialists/frontend/`
Key agents: `frontend-developer`, `fullstack-developer`, `ui-designer`, `premium-ux-designer`,
`shadcn-component-researcher`, `shadcn-implementation-builder`, `shadcn-quick-helper`,
`design-system-architect`, `accessibility-expert`

### DevOps (34 agents) — `agents/specialists/devops/`
Key agents: `cloud-architect`, `devops-engineer`, `docker-expert`, `kubernetes-specialist`,
`terraform-engineer`, `git-commit-helper`, `git-workflow-manager`, `monitoring-specialist`,
`devops-troubleshooter`, `build-engineer`

### Security (11 agents) — `agents/specialists/security/`
Key agents: `api-security-audit`, `security-auditor`, `penetration-tester`, `compliance-auditor`,
`engineering-security-engineer`, `security-engineer`

### Data / AI (13 agents) — `agents/specialists/data/`
Key agents: `ml-engineer`, `data-engineer`, `data-scientist`, `llm-architect`,
`llm-research-agent`, `data-analyst`, `database-optimizer`, `mlops-engineer`

### QA (18 agents) — `agents/specialists/qa/`
Key agents: `bounty-hunter`, `debugger`, `code-reviewer`, `senior-code-reviewer`,
`error-detective`, `e2e-runner`, `performance-engineer`, `test-automator`, `architect-reviewer`

### Product (19 agents) — `agents/specialists/product/`
Key agents: `product-manager`, `project-manager`, `scrum-master`, `product-strategy-advisor`,
`competitive-analyst`, `ux-researcher`, `atlassian-requirements-to-jira`

### Docs (13 agents) — `agents/specialists/docs/`
Key agents: `technical-writer`, `diagram-architect`, `changelog-generator`,
`documentation-engineer`, `api-documenter`, `meta-agent`

### Crypto (10 agents) — `agents/specialists/crypto/`
All model variants: `crypto-coin-analyzer-[haiku|sonnet|opus]`,
`crypto-investment-plays-[haiku|sonnet|opus]`, `crypto-market-agent-[haiku|sonnet|opus]`

---

## Skills (50 total) — `skills/[name]/SKILL.md`

### Workflow Skills (from gstack — production-grade)
| Skill | Path | When to invoke |
|-------|------|---------------|
| investigate | `skills/investigate/SKILL.md` | debug, root cause, "why is this broken" |
| qa-testing | `skills/qa-testing/SKILL.md` | browser QA, "test this site", "find bugs" |
| qa-only | `skills/qa-only/SKILL.md` | QA report only, no code changes |
| code-review-pr | `skills/code-review-pr/SKILL.md` | PR review, "check my diff", pre-landing |
| ship | `skills/ship/SKILL.md` | "ship", "deploy", "push to main", "create PR" |
| land-and-deploy | `skills/land-and-deploy/SKILL.md` | merge + deploy + canary verify |
| canary | `skills/canary/SKILL.md` | post-deploy monitoring |
| careful | `skills/careful/SKILL.md` | before rm -rf, DROP TABLE, force-push |
| freeze | `skills/freeze/SKILL.md` | lock edits to one directory |
| guard | `skills/guard/SKILL.md` | careful + freeze combined |
| unfreeze | `skills/unfreeze/SKILL.md` | remove freeze |
| retro | `skills/retro/SKILL.md` | weekly retrospective |
| document-release | `skills/document-release/SKILL.md` | update docs after ship |
| autoplan | `skills/autoplan/SKILL.md` | full CEO + eng + design review pipeline |
| plan-ceo-review | `skills/plan-ceo-review/SKILL.md` | CEO-level product plan review |
| plan-eng-review | `skills/plan-eng-review/SKILL.md` | architecture + tests + edge cases |
| plan-design-review | `skills/plan-design-review/SKILL.md` | UI/UX design review |
| design-review | `skills/design-review/SKILL.md` | design audit + fix loop |
| design-consultation | `skills/design-consultation/SKILL.md` | build a design system |
| design-shotgun | `skills/design-shotgun/SKILL.md` | multiple design variants |
| office-hours | `skills/office-hours/SKILL.md` | YC office hours, product brainstorm |
| codex-review | `skills/codex-review/SKILL.md` | OpenAI Codex second opinion |
| security-owasp | `skills/security-owasp/SKILL.md` | OWASP Top 10 + STRIDE audit |
| benchmark | `skills/benchmark/SKILL.md` | performance regression detection |
| learn | `skills/learn/SKILL.md` | manage project learnings |
| browse | `skills/browse/SKILL.md` | headless Chromium browser |
| setup-browser-cookies | `skills/setup-browser-cookies/SKILL.md` | import real browser cookies |
| connect-chrome | `skills/connect-chrome/SKILL.md` | headed Chrome with side panel |
| setup-deploy | `skills/setup-deploy/SKILL.md` | configure deployment settings |

### Development Skills
| Skill | Path | When to invoke |
|-------|------|---------------|
| frontend-design | `skills/frontend-design/SKILL.md` | UI components, pages, styling |
| mcp-builder | `skills/mcp-builder/SKILL.md` | building MCP servers |
| claude-api | `skills/claude-api/SKILL.md` | Claude API / Anthropic SDK |
| webapp-testing | `skills/webapp-testing/SKILL.md` | Playwright browser testing |
| bounty-hunting | `skills/bounty-hunting/SKILL.md` | code smells, technical debt |
| prompt-engineering | `skills/prompt-engineering/SKILL.md` | create/audit agents, skills, plugins |

### Document / File Skills
| Skill | Path | When to invoke |
|-------|------|---------------|
| pdf | `skills/pdf/SKILL.md` | PDF operations |
| docx | `skills/docx/SKILL.md` | Word document operations |
| xlsx | `skills/xlsx/SKILL.md` | spreadsheet operations |
| pptx | `skills/pptx/SKILL.md` | PowerPoint operations |

### Creative Skills
| Skill | Path | When to invoke |
|-------|------|---------------|
| algorithmic-art | `skills/algorithmic-art/SKILL.md` | generative art, p5.js |
| canvas-design | `skills/canvas-design/SKILL.md` | visual design, posters |
| web-artifacts-builder | `skills/web-artifacts-builder/SKILL.md` | multi-component HTML artifacts |
| slack-gif-creator | `skills/slack-gif-creator/SKILL.md` | animated GIFs for Slack |
| brand-guidelines | `skills/brand-guidelines/SKILL.md` | Anthropic brand |
| theme-factory | `skills/theme-factory/SKILL.md` | styling artifacts |

---

## Plugins (Domain Packs) — `plugins/[name]/`

| Plugin | Path | Agents | Skills | Use When |
|--------|------|--------|--------|----------|
| backend-development | `plugins/backend-development/` | 8 | 10 | building backend services |
| ui-design | `plugins/ui-design/` | 3 | 7 | UI/design system work |
| machine-learning-ops | `plugins/machine-learning-ops/` | 3 | 1 | ML pipelines, MLOps |
| payment-processing | `plugins/payment-processing/` | 1 | 4 | Stripe, PayPal, billing |
| incident-response | `plugins/incident-response/` | 6 | 3 | production incidents |
| developer-essentials | `plugins/developer-essentials/` | 1 | 2 | monorepo, auth patterns |

To use a plugin: `cat .claude/plugins/[name]/agents/[agent].md`

---

## Commands (43 total) — `commands/`

Key commands: `plan.md`, `build.md`, `code-review.md`, `create-pr.md`,
`create-feature.md`, `prime.md`, `sentient.md`, `cook.md`, `crypto_research.md`

List all: `ls .claude/commands/`
