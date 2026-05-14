#!/usr/bin/env bash
# sync-agents.sh — DISABLED.
#
# Previously: this script created flat symlinks at .claude/agents/*.md
# pointing at the nested files under core/, sdlc/, specialists/.
#
# Why it was disabled (2026-05-10):
#   Claude Code 2.x and the Agent SDK scan .claude/agents/ recursively.
#   Having both flat symlinks AND nested real files caused 195 duplicate
#   `name:` collisions, which prevented the agent team from loading.
#
# The nested directory structure (core/, sdlc/, specialists/<domain>/) is now
# the single source of truth and is loaded directly by the SDK.
#
# If you re-add the symlinks, the team load will break again.

echo "sync-agents.sh is disabled. The SDK loads .claude/agents/ recursively."
echo "No action taken."
exit 0
