#!/usr/bin/env python3
"""
Fix skill preambles:
1. Skills with gstack preamble → replace with rstack preamble
2. Skills with no preamble → add rstack preamble after frontmatter
3. Clean up gstack path references in preamble blocks
"""
from pathlib import Path
import re

SKILLS_DIR = Path("/Users/richardsongunde/projects/.claude/skills")

RSTACK_PREAMBLE = '''
## Preamble (run first)

```bash
# rstack preamble — session tracking, branch, repo mode, learnings
mkdir -p ~/.rstack/sessions
touch ~/.rstack/sessions/"$PPID"
find ~/.rstack/sessions -mmin +120 -type f -exec rm {} + 2>/dev/null || true

_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
echo "BRANCH: $_BRANCH"

source <(~/.claude/bin/rstack-repo-mode 2>/dev/null) || true
REPO_MODE=${REPO_MODE:-unknown}
echo "REPO_MODE: $REPO_MODE"

eval "$(~/.claude/bin/rstack-slug 2>/dev/null)" 2>/dev/null || true
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
~/.claude/bin/rstack-learnings-search --limit 5 2>/dev/null || true
```

'''

GSTACK_PREAMBLE_MARKERS = [
    "gstack-update-check",
    "gstack/bin/gstack-config",
    "gstack-repo-mode",
    "gstack-slug",
    "GSTACK_HOME",
    "gstack/analytics",
    "~/.gstack/sessions",
]

def has_gstack_preamble(content: str) -> bool:
    return any(marker in content for marker in GSTACK_PREAMBLE_MARKERS)

def has_rstack_preamble(content: str) -> bool:
    return "rstack-repo-mode" in content or "~/.rstack/sessions" in content

def has_any_preamble(content: str) -> bool:
    return "## Preamble" in content

def remove_gstack_preamble_block(content: str) -> str:
    """Remove the gstack preamble bash block and surrounding conditional text."""
    # Remove the ## Preamble (run first) section and the gstack-specific conditionals
    # that follow it up until ## Voice or next ## section

    # Pattern: ## Preamble block with bash + gstack conditionals
    # We replace everything from ## Preamble up to the next non-gstack ## section

    # Find ## Preamble
    preamble_idx = content.find("## Preamble (run first)")
    if preamble_idx == -1:
        preamble_idx = content.find("## Preamble")
    if preamble_idx == -1:
        return content

    # Find the next ## section that's NOT part of the gstack preamble
    # Gstack preamble sections: Voice, AskUserQuestion Format, Completeness Principle,
    # Repo Ownership, Search Before Building, Contributor Mode, Completion Status Protocol,
    # Escalation, Telemetry, Plan Status Footer
    gstack_shared_sections = [
        "## Voice",
        "## AskUserQuestion Format",
        "## Completeness Principle",
        "## Repo Ownership",
        "## Search Before Building",
        "## Contributor Mode",
        "## Completion Status Protocol",
        "## Escalation",
        "## Telemetry",
        "## Plan Status Footer",
        "## User-invocable",
        "## Arguments",
        "## Mode",
        "## Instructions",
        "## Phase",
        "## Important",
        "## Setup",
        "## Step",
        "## Prior",
        "## Capture",
        "/",  # skill-specific content often starts with /skill-name
    ]

    # Find where the gstack preamble boilerplate ends
    # Look for the first skill-specific section
    remaining = content[preamble_idx:]

    # Find "# /skill-name" or the actual skill workflow content
    # The gstack preamble ends when we hit "## Voice" or the skill-specific section
    voice_idx = remaining.find("## Voice")
    userinvoc_idx = remaining.find("## User-invocable")
    instructions_idx = remaining.find("## Instructions")
    phase_idx = remaining.find("## Phase")
    setup_idx = remaining.find("## Setup")

    # Find the earliest skill-specific section
    candidates = [i for i in [voice_idx, userinvoc_idx, instructions_idx, phase_idx, setup_idx] if i > 0]

    if not candidates:
        # Can't find a clean break — just remove up to first non-preamble ##
        all_sections = [(m.start(), m.group()) for m in re.finditer(r'^## ', remaining, re.MULTILINE)]
        if len(all_sections) > 1:
            end_idx = all_sections[1][0]  # Second ## section
        else:
            return content
    else:
        end_idx = min(candidates)

    # Replace the gstack preamble block with nothing
    new_content = content[:preamble_idx] + content[preamble_idx + end_idx:]
    return new_content

fixed_gstack = 0
fixed_none = 0
skipped = 0

for skill_md in sorted(SKILLS_DIR.glob("*/SKILL.md")):
    content = skill_md.read_text()

    # Parse frontmatter
    if not content.startswith("---"):
        continue
    parts = content.split("---", 2)
    if len(parts) < 3:
        continue

    fm_text = parts[1]
    body = parts[2]

    # Skip template-skill
    if "template-skill" in str(skill_md) or "skill-template" in str(skill_md):
        skipped += 1
        continue

    if has_rstack_preamble(content):
        skipped += 1
        continue

    if has_gstack_preamble(content):
        # Replace gstack preamble with rstack preamble
        # Remove the old preamble section from the body
        clean_body = remove_gstack_preamble_block(body)

        # Add rstack preamble at start of body
        new_content = "---" + fm_text + "---" + RSTACK_PREAMBLE + clean_body.lstrip()
        skill_md.write_text(new_content)
        fixed_gstack += 1
        print(f"REPLACED gstack preamble: {skill_md.parent.name}/SKILL.md")

    elif not has_any_preamble(content):
        # No preamble at all — add rstack preamble after frontmatter
        new_content = "---" + fm_text + "---" + RSTACK_PREAMBLE + body.lstrip()
        skill_md.write_text(new_content)
        fixed_none += 1
        print(f"ADDED preamble: {skill_md.parent.name}/SKILL.md")
    else:
        skipped += 1

print(f"\nReplaced gstack preamble: {fixed_gstack}")
print(f"Added rstack preamble: {fixed_none}")
print(f"Skipped (already correct or template): {skipped}")

# Verify
total = len(list(SKILLS_DIR.glob("*/SKILL.md")))
with_rstack = sum(1 for s in SKILLS_DIR.glob("*/SKILL.md") if "rstack-repo-mode" in s.read_text() or "~/.rstack/sessions" in s.read_text())
print(f"\nSkills with rstack preamble: {with_rstack}/{total}")
