---
name: "source-command-prime"
description: "Load context for a new agent session by analyzing codebase structure, documentation and README"
owner: RStack developed by Richardson Gunde
---

# source-command-prime

Use this skill when the user asks to run the migrated source command `prime`.

## Command Template

# Prime

Run the commands under the `Execute` section to gather information about the project, and then review the files listed under `Read` to understand the project's purpose and functionality then `Report` your findings.

## Execute
- `git ls-files`

## Read
- README.md
- ai_docs/cc_hooks_docs.md
- ai_docs/uv-single-file-scripts.md
- ai_docs/anthropic_custom_slash_commands.md
- ai_docs/anthropic_docs_subagents.md

## Report

- Provide a summary of your understanding of the project
