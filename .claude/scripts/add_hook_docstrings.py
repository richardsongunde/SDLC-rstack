#!/usr/bin/env python3
"""Add module docstrings to hook scripts that don't have them."""
from pathlib import Path

HOOKS_DIR = Path("/Users/richardsongunde/projects/.claude/hooks/scripts")

DOCSTRINGS = {
    "pre_tool_use.py": """
Hook: pre_tool_use
Fires: PreToolUse — before any tool executes (builder agent only)
Purpose: Detect dangerous commands (rm -rf, DROP TABLE, force push),
         block .env file access, validate tool inputs before execution.
Input:  JSON from stdin — keys: tool_name, tool_input
Output: Exit 0 (allow) | Exit 1 (block — message to stderr shown to user)
""",
    "post_tool_use.py": """
Hook: post_tool_use
Fires: PostToolUse on Write|Edit tools (builder agent only)
Purpose: Post-write validation — checks that files written are well-formed
         and meet project quality standards.
Input:  JSON from stdin — keys: tool_name, tool_input, tool_result
Output: Exit 0 (continue) | Exit 1 (flag issue — message to stderr)
""",
    "session_start.py": """
Hook: session_start
Fires: SessionStart — when a new Claude Code session begins
Purpose: Log session start event, load environment context,
         initialize state tracking for the session.
Input:  JSON from stdin with session metadata
Output: Exit 0 always — session start hooks are informational only
""",
    "session_end.py": """
Hook: session_end
Fires: SessionEnd — when a session closes (builder agent)
Purpose: Cleanup session state, persist logs, finalize any
         in-progress tracking. Runs even on abnormal termination.
Input:  JSON from stdin with session metadata
Output: Exit 0 always — session end hooks are informational only
""",
    "post_agent_contract_validator.py": """
Hook: post_agent_contract_validator
Fires: SessionEnd — when a validator agent session closes
Purpose: Validate that the agent produced a proper JSON contract file
         at outputs/team_state/[task]_validation.json with required fields:
         checks[], status (PASS/FAIL), issues[].
Input:  JSON from stdin with session metadata
Output: Exit 0 (contract valid) | Exit 1 (contract missing or malformed)
""",
    "pre_handoff_checker.py": """
Hook: pre_handoff_checker
Fires: Pre-handoff — before an agent hands off to another agent
Purpose: Validate that the handoff contract JSON exists and has required
         fields before the next agent in the pipeline starts.
Input:  JSON from stdin with handoff metadata and contract path
Output: Exit 0 (handoff valid) | Exit 1 (contract invalid — pipeline stops)
""",
    "subagent_start.py": """
Hook: subagent_start
Fires: When a sub-agent session begins
Purpose: Log sub-agent start event for observability.
         Tracks which sub-agents are spawned and when.
Input:  JSON from stdin with sub-agent metadata
Output: Exit 0 always — informational only
""",
    "subagent_stop.py": """
Hook: subagent_stop
Fires: When a sub-agent session ends
Purpose: Log sub-agent completion event. Records duration and outcome
         for sub-agent performance monitoring.
Input:  JSON from stdin with sub-agent metadata and outcome
Output: Exit 0 always — informational only
""",
    "notification.py": """
Hook: notification
Fires: When Claude Code sends a notification
Purpose: Route notifications to the appropriate channel
         (terminal, system notification, status line, etc.)
Input:  JSON from stdin with notification type and message
Output: Exit 0 always — notification routing is best-effort
""",
    "permission_request.py": """
Hook: permission_request
Fires: When a tool requires user permission
Purpose: Handle permission requests — can auto-approve safe operations
         or escalate sensitive ones for explicit user approval.
Input:  JSON from stdin with tool_name and permission context
Output: Exit 0 (granted) | Exit 1 (denied — user must approve manually)
""",
    "post_tool_use_failure.py": """
Hook: post_tool_use_failure
Fires: PostToolUse when a tool execution fails
Purpose: Handle tool failures — log the failure, potentially retry,
         or surface a helpful error message to the user.
Input:  JSON from stdin with tool_name, tool_input, error details
Output: Exit 0 (handled) | Exit 1 (escalate to user)
""",
    "pre_compact.py": """
Hook: pre_compact
Fires: Before context compaction occurs
Purpose: Preserve critical context that should survive compaction —
         save important state to files before context is trimmed.
Input:  JSON from stdin with compaction metadata
Output: Exit 0 always — pre-compact hooks are informational
""",
    "status_line.py": """
Hook: status_line
Fires: When the status line is updated
Purpose: Format and update the Claude Code status line display
         with current agent name, task progress, and key metrics.
Input:  JSON from stdin with status update data
Output: Exit 0 always — status line is display-only
""",
    "stop.py": """
Hook: stop
Fires: When the session is explicitly stopped
Purpose: Clean termination — flush any pending logs, save state,
         ensure outputs/team_state/ is in a consistent state.
Input:  JSON from stdin with stop reason
Output: Exit 0 always — stop hooks run after the decision to stop is made
""",
    "user_prompt_submit.py": """
Hook: user_prompt_submit
Fires: When the user submits a prompt (before Claude processes it)
Purpose: Pre-process user input — can inject context, validate the prompt,
         or block disallowed content before it reaches the model.
Input:  JSON from stdin with the user's prompt text
Output: Exit 0 (allow) | Exit 1 (block with message to user)
""",
    "setup.py": """
Hook: setup
Purpose: One-time setup script for the hooks system.
         Installs dependencies and validates the hook environment.
Input:  None — run directly, not via hook system
Output: Exit 0 (setup complete) | Exit 1 (setup failed with error)
""",
}

for filename, docstring in DOCSTRINGS.items():
    path = HOOKS_DIR / filename
    if not path.exists():
        print(f"SKIP (not found): {filename}")
        continue

    content = path.read_text()

    # Check if docstring already exists
    if '"""' in content[:500] and "Hook:" in content[:500]:
        print(f"SKIP (already has docstring): {filename}")
        continue

    # Find insertion point: after shebang + script block comment, before imports
    lines = content.split("\n")
    insert_after = 0

    # Skip shebang
    if lines and lines[0].startswith("#!"):
        insert_after = 1

    # Skip script block comment (# /// ... ///)
    if insert_after < len(lines) and lines[insert_after].startswith("# ///"):
        i = insert_after + 1
        while i < len(lines) and not lines[i].startswith("# ///"):
            i += 1
        insert_after = i + 1  # after closing # ///

    # Skip any blank lines
    while insert_after < len(lines) and not lines[insert_after].strip():
        insert_after += 1

    # Format docstring
    formatted = f'"""{docstring}"""\n'

    # Insert
    lines.insert(insert_after, formatted)
    path.write_text("\n".join(lines))
    print(f"OK: {filename}")

print("\nDone.")
