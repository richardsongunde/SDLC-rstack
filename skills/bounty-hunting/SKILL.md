---
name: bounty-hunting
description: A comprehensive set of strategies, bash commands, and scripts for hunting down and fixing code smells, lint errors, performance bottlenecks, and configuration issues. Use when acting as a bounty hunter.
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

# Bounty Hunting Skill (Issue Elimination)

## Objective
To quickly and efficiently identify common project issues and apply automated or manual fixes.

## Strategies and Techniques

### 1. Identifying Misconfigurations
- **Linting & Formatting**: Run `ruff check .` or `eslint .` (if applicable) to find syntax and style issues.
- **Type Checking**: Run `ty .` or `mypy .` to sniff out typing errors.
- **Git State**: Check `git status` for untracked garbage or unintentional changes.

### 2. Hunting Down Missing Files & Empty Logic
- Look for files that should exist but don't (e.g., missing `__init__.py`, missing README sections).
- Use `find . -empty` to locate and review empty files that might be unfinished stubs.

### 3. Hunting via GitHub Issues
- **Find Open Bounties**: Interact with the GitHub issue tracker to find and fix reported bugs and enhancements.
- **Detailed Workflow**: See [references/github-issues.md](references/github-issues.md) for the complete guide on using the GitHub CLI (`gh`) to list and view issues.

### 4. Fixing (Claiming the Bounty)
- Make surgical fixes. Do not rewrite entire files unless absolutely necessary.
- Fix one class of problem at a time before moving on to the next.
- If applying automated fixes (like `ruff --fix`), always review the diff afterward to ensure nothing was broken.

## Execution Rules
- **No Collateral Damage**: Ensure fixes do not break existing functionality or tests.
- **Quick Status Reports**: Always indicate what specific file or line you are targeting.
- **Completion**: Once all targets are eliminated, state "Bounty Claimed."
## Completion Protocol

STATUS: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT

DONE: workflow complete, deliverable produced.
DONE_WITH_CONCERNS: complete but with issues the user should review.
BLOCKED: state exactly what prevents completion.
NEEDS_CONTEXT: ask ONE specific question to unblock.
