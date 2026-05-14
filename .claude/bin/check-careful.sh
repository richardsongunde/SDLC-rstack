#!/usr/bin/env bash
# check-careful.sh — pre-tool-use hook for careful/freeze/guard skills
# Called by: careful/freeze/guard SKILL.md PreToolUse hooks on Bash tool
#
# Checks if the command is destructive and warns before execution.
# Exit 0 = allow | Exit 1 = block (with message to stderr)
#
# Destructive patterns checked:
#   rm -rf / rm -r --force    recursive delete
#   DROP TABLE / DROP DATABASE SQL data destruction
#   git push --force           force push (rewrites history)
#   git reset --hard           discards local changes
#   kubectl delete             k8s resource deletion
#   docker system prune        removes all unused docker data
#   truncate / > file          file truncation

set -euo pipefail

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('command',''))" 2>/dev/null || echo "")

[ -z "$COMMAND" ] && exit 0

LOWER=$(echo "$COMMAND" | tr '[:upper:]' '[:lower:]')

warn() {
  echo "⚠️  CAREFUL MODE: $1" >&2
  echo "    Command: $COMMAND" >&2
  echo "    Pausing for review. Approve to continue." >&2
  exit 1
}

# rm -rf and variants
echo "$LOWER" | grep -qE 'rm\s+.*-[a-z]*r[a-z]*f|rm\s+.*--recursive.*--force|rm\s+.*--force.*--recursive' && \
  warn "Recursive force delete detected (rm -rf)"

# DROP TABLE / DROP DATABASE
echo "$LOWER" | grep -qE 'drop\s+(table|database|schema)' && \
  warn "SQL DROP statement — permanent data destruction"

# git force push
echo "$LOWER" | grep -qE 'git\s+push.*--force|git\s+push.*-f\s' && \
  warn "Force push — rewrites remote history"

# git reset --hard
echo "$LOWER" | grep -qE 'git\s+reset\s+--hard' && \
  warn "git reset --hard — discards all local changes"

# kubectl delete
echo "$LOWER" | grep -qE 'kubectl\s+delete' && \
  warn "kubectl delete — removes Kubernetes resources"

# docker system prune
echo "$LOWER" | grep -qE 'docker\s+system\s+prune' && \
  warn "docker system prune — removes all unused Docker data"

# Check freeze boundary if FREEZE_DIR is set
FREEZE_DIR="${RSTACK_FREEZE_DIR:-}"
if [ -n "$FREEZE_DIR" ]; then
  # Extract file paths from write/edit commands and check they're inside FREEZE_DIR
  PATHS=$(echo "$COMMAND" | grep -oE '[/~][a-zA-Z0-9_./~-]+\.(py|ts|js|go|md|yaml|yml|json|sh|txt)' || true)
  for path in $PATHS; do
    # Resolve ~ to $HOME
    path="${path/#\~/$HOME}"
    # Check if outside freeze dir
    case "$path" in
      "$FREEZE_DIR"*) ;;  # inside freeze dir — OK
      *) warn "Freeze boundary: $path is outside the allowed directory ($FREEZE_DIR)" ;;
    esac
  done
fi

exit 0
