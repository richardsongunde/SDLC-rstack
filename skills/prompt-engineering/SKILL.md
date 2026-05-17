---
name: prompt-engineering
description: |
  Wizard for creating well-formatted Codex agents, skills, plugins, and hooks
  inspired by gstack patterns. Use when creating a new agent, skill, plugin structure,
  or hook script — or auditing existing prompts for quality. Provides the canonical
  format spec and generates complete, properly-formatted output files.
  Trigger phrases: "create an agent", "write a skill", "new agent for X",
  "fix this prompt", "how do I write a skill", "create a plugin", "add a hook",
  "audit this agent", "what's the format for".
owner: RStack developed by Richardson Gunde
---
## Preamble (run first)

```bash
# rstack preamble — session tracking, branch, repo mode, learnings
mkdir -p ~/.rstack/sessions
touch ~/.rstack/sessions/"$PPID"
find ~/.rstack/sessions -mmin +120 -type f -exec rm {} + 2>/dev/null || true

_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
echo "BRANCH: $_BRANCH"

source <(~/.rstack/bin/rstack-repo-mode 2>/dev/null) || true
REPO_MODE=${REPO_MODE:-unknown}
echo "REPO_MODE: $REPO_MODE"

eval "$(~/.rstack/bin/rstack-slug 2>/dev/null)" 2>/dev/null || true
_LEARN_FILE="$HOME/.rstack/projects/${SLUG:-unknown}/learnings.jsonl"
_LEARN_COUNT=0
[ -f "$_LEARN_FILE" ] && _LEARN_COUNT=$(wc -l < "$_LEARN_FILE" | tr -d ' ')
echo "LEARNINGS: $_LEARN_COUNT entries loaded"

_TEL_START=$(date +%s)
_SESSION_ID="$$-$(date +%s)"
```

If `REPO_MODE` is `solo`: you own everything. Fix issues proactively without asking.
If `REPO_MODE` is `collaborative`: flag via AskUserQuestion before fixing anything owned by others.
If `REPO_MODE` is `unknown`: treat as collaborative.

If learnings are loaded (`LEARNINGS > 0`): search for relevant ones before starting:
```bash
~/.rstack/bin/rstack-learnings-search --limit 5 2>/dev/null || true
```

## What This Skill Does

Routes you to the right format spec and generates a complete, properly-formatted file.
Every output follows the gstack-inspired standard used across this workspace.

## Workflow

1. **Identify what you're creating:**
   - Agent → read references/agent-format.md
   - Skill → read references/skill-format.md
   - Plugin → read references/plugin-format.md
   - Hook → read references/hook-format.md
   - Auditing an existing prompt → read references/anti-patterns.md

2. **Ask one question at a time** to gather context:
   - What domain or purpose? (e.g. "backend API design", "security audit")
   - What triggers it? (user phrases or conditions)
   - What tools does it need? (Read, Write, Bash, Grep, Glob, etc.)
   - What model? (opus = orchestration/complex, sonnet = most tasks, haiku = fast/simple)

3. **Generate the complete file** using the format from the reference.

4. **Write it to the correct path:**
   - Agent → `.rstack/agents/specialists/[backend|frontend|devops|security|data|qa|product|docs|crypto]/[name].md`
   - Skill → `.rstack/skills/[name]/SKILL.md`
   - Plugin agent → `.rstack/plugins/[plugin]/agents/[name].md`
   - Hook → `.rstack/hooks/scripts/[name].py`

5. **Verify the frontmatter is valid YAML:**
   ```bash
   python3 -c "
   import yaml
   content = open('[path/to/file.md]').read()
   yaml.safe_load(content.split('---')[1])
   print('VALID')
   "
   ```

## References
- See references/agent-format.md for the complete agent spec with good/bad examples
- See references/skill-format.md for skill structure, progressive disclosure, reference patterns
- See references/plugin-format.md for plugin pack structure and how agents/skills inside differ
- See references/hook-format.md for hook frontmatter syntax and script docstring standard
- See references/anti-patterns.md for what NOT to do (knowledge dumps, missing workflow, etc.)

## Completion Protocol
STATUS: DONE | BLOCKED | NEEDS_CONTEXT
REASON: [if not DONE — what information is missing]
