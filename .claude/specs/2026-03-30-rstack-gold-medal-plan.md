# rstack Gold Medal Plan
## Richardson Gunde's Personal AI Engineering Workspace

**Date:** 2026-03-30
**Goal:** Transform `.claude/` from an organized collection of files into a living,
self-aware, Richardson-branded AI engineering system — the personal equivalent of gstack.

---

## The Name: rstack

**rstack** = Richardson's Stack.

Built by Richardson Gunde for Richardson Gunde. Every skill says `(rstack)` in its
description. The state directory is `~/.rstack/`. The config tool is `rstack-config`.
The ethos is Richardson's philosophy, not Garry Tan's.

---

## Current State — Honest Assessment

### What we built (solid foundation)
- ✅ **195 agents** in clean domain hierarchy (core/sdlc/specialists/[9 domains])
- ✅ **50 skills** — 30 from gstack + 20 custom, all at correct paths
- ✅ **72 plugins** — domain packs with fixed frontmatter
- ✅ **16 hook scripts** — with docstrings, pre/post tool use, session lifecycle
- ✅ **AGENTS.md** — master discovery index with every path
- ✅ **CLAUDE.md** — simplified 3-rule routing
- ✅ **Orchestrator → Builder → Validator** — wired correctly with hooks preserved
- ✅ **SDLC pipeline (00-14)** — agents reference correct skills per stage
- ✅ **gstack-style Voice** — identity + core principle + tone + writing rules (2 agents done well)
- ✅ **prompt-engineering skill** — wizard for creating new agents/skills/plugins/hooks

### What's missing (the gap to gold medal)
- ❌ **No identity** — no ETHOS.md (Richardson's philosophy), no VERSION, no CHANGELOG
- ❌ **No bin/ scripts** — no rstack-config, no learnings system, no analytics, no preamble runner
- ❌ **No preamble in skills** — gstack injects a live environment check before every skill workflow
- ❌ **No learnings system** — gstack learns from every session; we forget everything
- ❌ **No analytics** — no tracking of which skills run, how long, what outcome
- ❌ **No repo-mode detection** — don't know if we're in a solo vs collaborative repo
- ❌ **No review-log** — don't know if /review was run before /ship on a branch
- ❌ **No skill health check** — no `rstack-skill-check` to validate all SKILL.md files
- ❌ **No DESIGN.md** — no aesthetic direction for any UI work Richardson does
- ❌ **Voice only on 3 agents** — 192 agents have lightweight voice, not the full identity pattern
- ❌ **No safety bins** — careful/freeze have the SKILL.md but no `check-careful.sh` bin script
- ❌ **No workspace VERSION** — no way to know what version the workspace is at

---

## The Gold Medal Vision

A gold medal `.claude/` workspace is:

1. **Self-aware** — knows its version, tracks skill usage, learns from every session
2. **Discoverable** — any agent can find any resource without reading AGENTS.md first
3. **Richardson-branded** — ETHOS.md with his philosophy, not a copy of Garry Tan's
4. **Battle-tested** — preambles that check state before running, safety hooks that work
5. **Living** — improves over time via the learnings system
6. **Complete** — every workflow path covered, every skill has a proper preamble
7. **Validated** — skill-check confirms every SKILL.md is well-formed

---

## 7 Phases to Gold Medal

---

### Phase 1: Identity + Branding
**Goal:** Give rstack its own identity. Richardson's philosophy, not a copy.

**Files to create:**

#### 1A. `ETHOS.md` — Richardson Gunde's Builder Philosophy
Content framework (to be written by Richardson + Claude together):
- **The Richardson Principle** — Richardson's core belief about building with AI
- **Completeness is cheap** — adapted from gstack's Boil the Lake for his context
- **Search before building** — Layer 1/2/3 framework (same concept, his voice)
- **User sovereignty** — the human stays in the loop
- **Ship discipline** — his personal standard for what "done" means
- **What rstack is for** — who it serves (Richardson), what it optimizes for

#### 1B. `VERSION`
```
1.0.0
```

#### 1C. `CHANGELOG.md`
```markdown
# rstack Changelog

## [1.0.0] — 2026-03-30

### Foundation
- 195 agents across 9 specialist domains + core + SDLC pipeline
- 50 skills (30 from gstack + 20 custom)
- 72 plugin packs
- 16 hook scripts with docstrings
- gstack-style Voice on core agents (orchestrator, builder, validator)
- AGENTS.md master discovery index
- prompt-engineering skill with full format spec
```

#### 1D. `DESIGN.md` — Richardson's Visual Aesthetic
His personal design system for any UI work rstack produces. Include:
- Color palette (his preference: dark/light, accent color)
- Typography (preferred fonts)
- Density preference (minimal vs data-dense)
- Component aesthetic (flat, material, skeuomorphic, etc.)

**Effort:** 1 session with Richardson to capture his voice and aesthetic.

---

### Phase 2: The bin/ Infrastructure
**Goal:** Give rstack the same plumbing gstack has — the tools that make skills powerful.

**Directory:** `.claude/bin/`

| Script | Purpose | Adapted from |
|--------|---------|-------------|
| `rstack-config` | read/write `~/.rstack/config.yaml` | gstack-config |
| `rstack-slug` | compute project slug from git remote | gstack-slug |
| `rstack-repo-mode` | detect solo vs collaborative (80% commit threshold) | gstack-repo-mode |
| `rstack-learnings-log` | append learning to `~/.rstack/projects/$SLUG/learnings.jsonl` | gstack-learnings-log |
| `rstack-learnings-search` | search learnings with keyword filter | gstack-learnings-search |
| `rstack-review-log` | record that /review ran on this branch | gstack-review-log |
| `rstack-review-read` | check if /review ran before /ship | gstack-review-read |
| `rstack-analytics` | append skill usage event to `~/.rstack/analytics/` | gstack-telemetry-log |
| `rstack-skill-check` | validate all SKILL.md files (commands, frontmatter, sections) | gstack skill-check.ts |
| `check-careful.sh` | called by careful/freeze hooks — blocks destructive commands | gstack careful/bin/ |

These are ~10 short bash/Python scripts. All adapted from gstack's open-source bin/.
State directory: `~/.rstack/` (not `~/.gstack/`).
Config file: `~/.rstack/config.yaml`.

**Effort:** 1 session to adapt and test each script.

---

### Phase 3: The Standard Preamble
**Goal:** Every rstack skill runs a lightweight preamble before its workflow.

gstack injects `{{PREAMBLE}}` into every skill. We adapt this pattern.

**Our preamble** (simpler than gstack's — no telemetry, no update check):

```bash
## Preamble (run first)

```bash
_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
_REPO_MODE=$(~/.claude/bin/rstack-repo-mode 2>/dev/null || echo "REPO_MODE=unknown")
eval "$_REPO_MODE"
_SLUG=$(~/.claude/bin/rstack-slug 2>/dev/null || echo "unknown")
_LEARN_FILE="$HOME/.rstack/projects/$_SLUG/learnings.jsonl"
_LEARN_COUNT=0
[ -f "$_LEARN_FILE" ] && _LEARN_COUNT=$(wc -l < "$_LEARN_FILE" | tr -d ' ')
echo "BRANCH: $_BRANCH | REPO_MODE: ${REPO_MODE:-unknown} | LEARNINGS: $_LEARN_COUNT"
```

**What it provides every skill:**
- `$_BRANCH` — current git branch (re-grounds context after long sessions)
- `REPO_MODE` — solo or collaborative (changes whether to fix vs flag issues)
- `$_LEARN_COUNT` — number of project learnings loaded for this session

**Preamble is added to:** all 50 skills in `skills/*/SKILL.md`
**Method:** Python script that inserts the preamble block after frontmatter if not present.

---

### Phase 4: Full Voice Rewrite — All 195 Agents
**Goal:** Every agent has the proper gstack-style Voice (not the lightweight 2-liner).

Currently only 3 agents (orchestrator, builder, validator) have the full identity pattern.
The other 192 have: `"Direct, concrete. Name the file."` — not a real voice.

**The full Voice pattern (from our backend-developer.md — use this as the template):**
```markdown
## Voice

You are a [identity sentence — who this agent IS].
[Core principle — the one thing this agent believes above all else.]

**Tone:** [concrete comparison — "sound like X, not Y"]
**Concreteness:** [domain-specific version — "name the endpoint, the file, the line"]

**Writing rules:**
- No em dashes. Use commas, periods, or "...".
- No AI vocabulary: [domain-specific banned list]
- No throat-clearing. Just act.
- End with the action.

**[Domain] outcome test:** [one question the agent asks before declaring done]
```

**Approach:** Batch Python script, processes 192 agents by domain:
- Each domain gets a domain-specific identity sentence template
- Each domain gets a domain-specific outcome test
- Writing rules are universal across all agents
- Script reads existing Voice content, replaces lightweight version with full version

**Effort:** 1 session — the script + review of outputs.

---

### Phase 5: Learnings System
**Goal:** rstack learns from every session and applies those learnings in future sessions.

gstack stores learnings at `~/.gstack/projects/$SLUG/learnings.jsonl`.
We store at `~/.rstack/projects/$SLUG/learnings.jsonl`.

**Format:**
```json
{"skill":"investigate","type":"pitfall","key":"missing-index","insight":"Missing index on user_id caused 2s query times in high-traffic endpoint","confidence":9,"source":"observed","files":["src/models/user.py"],"ts":"2026-03-30T..."}
```

**Types:** `pattern` (reusable approach) | `pitfall` (what NOT to do) | `preference` (Richardson stated) | `architecture` (structural decision) | `tool` (library insight)

**Where learnings are logged:**
- In `skills/investigate/SKILL.md` — after root cause found
- In `skills/code-review-pr/SKILL.md` — after findings confirmed
- In `skills/qa-testing/SKILL.md` — after bugs verified
- In `agents/core/builder.md` — after task complete (patterns discovered)

**Where learnings are read:**
- Skills preamble reports `LEARNINGS: N entries loaded`
- Each skill has a "Prior Learnings" section that searches `rstack-learnings-search --limit 5`
- Learnings matching the current task are surfaced before the workflow starts

**Effort:** 1 session — adapt gstack-learnings-log/search bash scripts + add to 5 key skills.

---

### Phase 6: Analytics + Review Tracking
**Goal:** Know which skills ran, how long, what outcome. Know if /review ran before /ship.

**Skill usage analytics:**
```bash
# Written at end of each skill workflow
~/.rstack/analytics/skill-usage.jsonl
{"skill":"investigate","duration_s":47,"outcome":"success","branch":"feat/auth","ts":"..."}
```

**Review tracking:**
```bash
# Written by code-review-pr skill when review completes
~/.rstack/analytics/review-log.jsonl
{"skill":"review","branch":"feat/auth","status":"clean","commit":"abc1234","ts":"..."}
```

**Review gate in ship skill:**
```bash
# ship skill checks review-log before pushing
~/.claude/bin/rstack-review-read → checks if review ran on current branch
# If not: warn "No review logged for this branch. Run /code-review-pr first."
```

This prevents Richardson from accidentally shipping code that hasn't been reviewed.

**Effort:** 1 session — 3 scripts + update ship/code-review-pr skills.

---

### Phase 7: Skill Health Check
**Goal:** A single command that validates every SKILL.md is well-formed.

```bash
~/.claude/bin/rstack-skill-check
```

**What it checks for each `skills/*/SKILL.md`:**
- [ ] Valid YAML frontmatter (name + description required)
- [ ] `name:` is kebab-case
- [ ] `description:` is block scalar (not quoted)
- [ ] Has `## Completion Protocol` section
- [ ] No placeholder text (`[domain]`, `relevant-pattern`, `TODO`)
- [ ] Preamble block present
- [ ] Under 500 lines (progressive disclosure rule)

**Output:**
```
=== rstack Skill Health ===

✅ investigate/SKILL.md         — 579 lines, 5 bash blocks, all valid
✅ ship/SKILL.md                — 2034 lines, 43 bash blocks, all valid
⚠️  template-skill/SKILL.md    — placeholder text found: "DESCRIPTION_PLACEHOLDER"
❌ check-owasp/SKILL.md         — missing description, missing Completion Protocol

Summary: 48/50 healthy | 1 warning | 1 error
```

**Effort:** 1 session — Python script, ~150 lines.

---

## The Gold Medal Scorecard

| Dimension | Current | Gold Medal |
|-----------|---------|-----------|
| Identity | None (anonymous) | ETHOS.md + VERSION + CHANGELOG |
| Branding | "gstack" skills in system | `(rstack)` in all descriptions |
| Voice | 3 agents done well | All 195 agents |
| Skills | 50 (30 gstack + 20 custom) | 50 with preamble + learnings integration |
| Infrastructure | 0 bin/ scripts | 10 bin/ scripts |
| Learnings | Forget every session | Cross-session JSONL learnings |
| Analytics | Nothing tracked | Skill usage + review log |
| Safety | Skills exist but no bin hooks | check-careful.sh + check-freeze.sh wired |
| Validation | Manual checks | rstack-skill-check health dashboard |
| Design | Nothing | DESIGN.md with Richardson's aesthetic |
| Repo awareness | None | Solo vs collaborative mode detection |

---

## Recommended Execution Order

1. **Phase 1 (Identity)** — Do this first. ETHOS.md is the soul. Everything else extends it.
2. **Phase 2 (bin/ scripts)** — The plumbing. Everything else depends on these.
3. **Phase 3 (Preamble)** — Add to all skills once bin/ is working.
4. **Phase 5 (Learnings)** — The compounding value. Earlier = more sessions of learning.
5. **Phase 4 (Voice rewrite)** — Large but mechanical. Can be scripted.
6. **Phase 6 (Analytics)** — Lower urgency but good for long-term insight.
7. **Phase 7 (Health check)** — Last because it validates everything else.

---

## What Makes This Uniquely Richardson's

gstack is Garry Tan's philosophy. rstack should be Richardson Gunde's.

In Phase 1, Richardson writes (with Claude's help):
- **What he believes about building software in 2026**
- **His personal standard for "done"** (his outcome test)
- **His aesthetic** (DESIGN.md — what his tools look like)
- **His workflow preferences** (when he likes automation vs control)

This is not something that can be scripted. It requires Richardson to answer:
- "What's the one principle you'd never compromise on when building?"
- "When is AI assistance going too far?"
- "What does excellent engineering look like to you specifically?"

Those answers become the ETHOS.md that makes rstack uniquely his.

---

## Quick Win — Do Right Now

Before starting the full plan, do these 3 things (30 minutes):

1. **Create `VERSION`** — `echo "1.0.0" > .claude/VERSION`
2. **Create `CHANGELOG.md`** — document what was built today
3. **Rename all `(gstack)` tags** in the 30 imported skills to `(rstack)` — one sed command

```bash
find ~/.../projects/.claude/skills -name "SKILL.md" | \
  xargs grep -l "(gstack)" | \
  xargs sed -i 's/(gstack)/(rstack)/g'
```

This immediately makes the workspace feel like yours.
