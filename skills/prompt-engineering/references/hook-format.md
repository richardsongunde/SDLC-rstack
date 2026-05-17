<!-- owner: RStack developed by Richardson Gunde -->

# Hook Format Specification

## Hook Frontmatter in Agent Files

Hooks are declared inline in the agent YAML frontmatter. Only `builder.md` and
`validator.md` have hooks — do not add hooks to specialist agents.

```yaml
---
name: builder
description: |
  ...
model: opus
tools:
  - Bash
  - Read
hooks:
  PreToolUse:
    - hooks:
        - type: command
          command: uv run pre_tool_use.py
  PostToolUse:
    - matcher: "Write|Edit"
      hooks:
        - type: command
          command: uv run post_tool_use.py
        - type: command
          command: uv run ruff_validator.py
        - type: command
          command: uv run ty_validator.py
  SessionEnd:
    - hooks:
        - type: command
          command: uv run session_end.py
---
```

## Hook Types Reference

| Hook | When it fires | Common use |
|------|--------------|-----------|
| `PreToolUse` | Before any tool executes | Safety checks, dangerous command detection |
| `PostToolUse` | After a tool executes | Linting, formatting, validation |
| `SessionEnd` | When session closes | Cleanup, logging, state persistence |
| `SessionStart` | When session opens | Context loading, environment setup |

## PostToolUse Matcher

Use `matcher:` to filter which tools trigger the hook:
```yaml
PostToolUse:
  - matcher: "Write|Edit|MultiEdit"   # only fires on file-write tools
    hooks:
      - type: command
        command: ...
```

Without `matcher:`, the hook fires after every tool.

## $RSTACK_PROJECT_DIR

Resolves to the project root at runtime. Always use this variable rather than
hardcoding the path. The hooks run in the context of the active project directory.

## Hook Script Docstring Standard

Every hook script in `hooks/scripts/` starts with:

```python
#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# ///
"""
Hook: pre_tool_use
Fires: PreToolUse — before any tool executes
Purpose: Detect dangerous commands (rm -rf, DROP TABLE),
         block .env file access, validate tool inputs.
Input:  JSON from stdin — keys: tool_name, tool_input
Output: Exit 0 (allow) | Exit 1 (block, message to stderr)
"""
```

## Current Hooks in This Workspace

| Script | Fires On | Purpose |
|--------|----------|---------|
| `pre_tool_use.py` | PreToolUse (builder) | Dangerous command detection, .env protection |
| `post_tool_use.py` | PostToolUse Write/Edit (builder) | Post-write validation |
| `ruff_validator.py` | PostToolUse Write/Edit (builder) | Python linting |
| `ty_validator.py` | PostToolUse Write/Edit (builder) | Python type checking |
| `session_start.py` | SessionStart | Context loading, env setup |
| `session_end.py` | SessionEnd (builder) | Cleanup, state persistence |
| `post_agent_contract_validator.py` | SessionEnd (validator) | JSON contract validation |
| `pre_handoff_checker.py` | Pre-handoff | Agent handoff contract validation |

## Rules

- **Never add hooks to specialist agents** — they run as sub-agents, hooks add overhead
- **Never modify the hooks config** in builder.md or validator.md without explicit instruction
- When writing a new hook script, always add the docstring standard above before any code
