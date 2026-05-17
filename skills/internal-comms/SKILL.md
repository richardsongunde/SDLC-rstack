---
name: internal-comms
description: A set of resources to help me write all kinds of internal communications, using the formats that my company likes to use. Codex should use this skill whenever asked to write some sort of internal communications (status reports, leadership updates, 3P updates, company newsletters, FAQs, incident reports, project updates, etc.).
license: Complete terms in LICENSE.txt
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

## When to use this skill
To write internal communications, use this skill for:
- 3P updates (Progress, Plans, Problems)
- Company newsletters
- FAQ responses
- Status reports
- Leadership updates
- Project updates
- Incident reports

## How to use this skill

To write any internal communication:

1. **Identify the communication type** from the request
2. **Load the appropriate guideline file** from the `examples/` directory:
    - `examples/3p-updates.md` - For Progress/Plans/Problems team updates
    - `examples/company-newsletter.md` - For company-wide newsletters
    - `examples/faq-answers.md` - For answering frequently asked questions
    - `examples/general-comms.md` - For anything else that doesn't explicitly match one of the above
3. **Follow the specific instructions** in that file for formatting, tone, and content gathering

If the communication type doesn't match any existing guideline, ask for clarification or more context about the desired format.

## Keywords
3P updates, company newsletter, company comms, weekly update, faqs, common questions, updates, internal comms
## Completion Protocol

STATUS: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT

DONE: workflow complete, deliverable produced.
DONE_WITH_CONCERNS: complete but with issues the user should review.
BLOCKED: state exactly what prevents completion.
NEEDS_CONTEXT: ask ONE specific question to unblock.
