# rstack Changelog

All notable changes to Richardson Gunde's AI engineering workspace.

Format: Keep a Changelog (https://keepachangelog.com)
Versioning: Semantic — MAJOR.MINOR.PATCH

---

## [1.0.0] — 2026-03-30

### The Foundation

First complete version of rstack — Richardson Gunde's personal AI engineering workspace,
built from scratch and organized for serious production use.

### What you can now do

**Full AI agent orchestration** — orchestrator routes any complex task to the right
specialist automatically. Builder executes with hooks that catch dangerous commands
before they run. Validator verifies everything before it moves forward.

**Complete SDLC pipeline** — 15 sequential agents (00 → 14) take a project from raw
brief through requirements, architecture, code generation, testing, and deployment.
Each stage references the right skill. Each stage writes a JSON contract for the next.

**195 specialist agents** across 9 domains — backend, frontend, devops, security, data,
QA, product, docs, crypto. Every agent has: a real identity (not a capabilities list),
writing rules, a domain outcome test, and a machine-readable completion protocol.

**50 skills** — 30 adapted from gstack (investigate, ship, qa-testing, code-review-pr,
careful, freeze, guard, retro, autoplan, plan-eng-review, security-owasp, and more) +
20 custom skills. All rebranded `(rstack)`. Skills reference bin/ tools once those exist.

**72 plugin domain packs** — backend-development, ui-design, machine-learning-ops,
payment-processing, incident-response, developer-essentials. All formats fixed.

**16 hook scripts** with docstrings — pre/post tool use, session lifecycle, YAML
validation, Python linting, agent contract validation.

**ETHOS.md** — Richardson's builder philosophy. The soul of the workspace.

**AGENTS.md** — master discovery index. Every agent, skill, command, and plugin
in one place with exact paths.

**prompt-engineering skill** — wizard for creating new agents/skills/plugins/hooks
following the rstack format standard. Includes 5 reference files covering the
full format spec + anti-patterns.

### Architecture decisions made

- Agents use gstack-style Voice pattern: identity sentence + core principle + tone
  comparison + writing rules + domain outcome test
- Skills imported from gstack rather than rewritten from scratch (gstack is proven)
- Plugins kept as separate domain packs (not merged into flat agents/ hierarchy)
- Orchestrator → Builder → Validator as the core execution loop
- JSON state files as the handshake between agents (files_modified, tests_run, status)
- `(rstack)` tag on all skill descriptions for discoverability

### Known gaps (addressed in future versions)

- bin/ scripts not yet built (rstack-config, learnings, analytics, repo-mode)
- Standard preamble not yet injected into skills
- Learnings system not yet active (cross-session JSONL)
- Analytics not yet tracking skill usage
- Full Voice pattern applied to 3 agents; 192 have lightweight version
- No DESIGN.md yet for Richardson's visual aesthetic

---

## Roadmap

### [1.1.0] — bin/ infrastructure + preamble
- `bin/rstack-config` — read/write `~/.rstack/config.yaml`
- `bin/rstack-slug` — project slug from git remote
- `bin/rstack-repo-mode` — solo vs collaborative detection
- `bin/rstack-learnings-log` — append learnings to JSONL
- `bin/rstack-learnings-search` — search across sessions
- `bin/rstack-review-log` + `rstack-review-read` — gate ship behind review
- `bin/check-careful.sh` — hook for careful/freeze safety
- Standard preamble injected into all 50 skills

### [1.2.0] — Full Voice on all 195 agents
- Every agent gets the full identity pattern
- Domain-specific outcome tests on every specialist

### [1.3.0] — Learnings + analytics live
- Cross-session learnings compounding per project
- Skill usage tracking in `~/.rstack/analytics/`
- Review gate active: ship blocked if code-review-pr not run

### [1.4.0] — rstack-skill-check health dashboard
- Validates all 50 SKILL.md files
- Catches: missing Completion Protocol, placeholder text, wrong format
- Output: health score per skill, overall workspace grade

### [2.0.0] — Teaching platform
- Public-facing documentation of the rstack methodology
- "How to learn in 2026" curriculum based on Richardson's ETHOS.md
- Example projects demonstrating rstack principles in production
