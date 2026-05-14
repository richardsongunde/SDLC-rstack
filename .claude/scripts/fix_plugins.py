#!/usr/bin/env python3
"""Fix frontmatter and add Completion Protocol to all plugin agents and skills."""
import re
from pathlib import Path

PLUGINS_DIR = Path("/Users/richardsongunde/projects/.claude/plugins")

DOMAIN_COLORS = {
    "backend-development": "blue",
    "ui-design": "cyan",
    "machine-learning-ops": "magenta",
    "payment-processing": "blue",
    "incident-response": "red",
    "developer-essentials": "green",
}


def fix_frontmatter(content: str, plugin_name: str, is_skill: bool = False) -> str:
    """Fix frontmatter: quoted description → block scalar, tools list → YAML list."""
    if "---" not in content:
        return content

    parts = content.split("---", 2)
    if len(parts) < 3:
        return content

    fm_text = parts[1]
    body = parts[2]

    # Fix description: quoted string → block scalar
    def fix_description(m):
        desc = m.group(1).strip().strip('"').strip("'")
        # Add domain tag if not present
        plugin_tag = f"({plugin_name})"
        if plugin_tag not in desc:
            desc = desc.rstrip(".") + f". {plugin_tag}"
        # Format as block scalar
        lines = desc.split(". ")
        if len(lines) > 1:
            formatted = lines[0] + ".\n  " + ".\n  ".join(lines[1:])
        else:
            formatted = desc
        return f"description: |\n  {formatted}\n"

    fm_text = re.sub(
        r'description:\s*["\']([^"\']+)["\']',
        fix_description,
        fm_text,
        flags=re.MULTILINE
    )

    # Fix tools: comma-separated → YAML list
    def fix_tools(m):
        tools_str = m.group(1)
        # Already a list (starts with newline + spaces)
        if "\n" in tools_str:
            return m.group(0)
        tools = [t.strip() for t in tools_str.split(",") if t.strip()]
        tools_yaml = "\n".join(f"  - {t}" for t in tools)
        return f"tools:\n{tools_yaml}\n"

    fm_text = re.sub(
        r'tools:\s*(.+?)(?=\n\w|\Z)',
        fix_tools,
        fm_text,
        flags=re.DOTALL
    )

    # Add color if missing (for agents only)
    if not is_skill and "color:" not in fm_text:
        color = DOMAIN_COLORS.get(plugin_name, "cyan")
        fm_text = fm_text.rstrip() + f"\ncolor: {color}\n"

    # Rebuild
    new_content = "---\n" + fm_text.strip() + "\n---\n" + body

    # Add Completion Protocol if missing
    if "## Completion Protocol" not in new_content:
        new_content = new_content.rstrip() + """

## Completion Protocol
STATUS: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
REASON: [1–2 sentences if not DONE]
ATTEMPTED: [what was tried, if BLOCKED]
"""

    return new_content


def process_directory(directory: Path, plugin_name: str, is_skill: bool = False):
    results = []
    for md_file in directory.glob("*.md"):
        content = md_file.read_text()
        new_content = fix_frontmatter(content, plugin_name, is_skill)
        if new_content != content:
            md_file.write_text(new_content)
            results.append(f"FIXED: {md_file.name}")
        else:
            results.append(f"OK (no change): {md_file.name}")
    return results


total_fixed = 0
for plugin_dir in sorted(PLUGINS_DIR.iterdir()):
    if not plugin_dir.is_dir() or plugin_dir.name.startswith("."):
        continue

    plugin_name = plugin_dir.name
    print(f"\n=== {plugin_name} ===")

    # Fix agents
    agents_dir = plugin_dir / "agents"
    if agents_dir.exists():
        results = process_directory(agents_dir, plugin_name, is_skill=False)
        for r in results:
            print(f"  agent: {r}")
            if r.startswith("FIXED"):
                total_fixed += 1

    # Fix skills SKILL.md files
    skills_dir = plugin_dir / "skills"
    if skills_dir.exists():
        for skill_dir in skills_dir.iterdir():
            if skill_dir.is_dir():
                skill_md = skill_dir / "SKILL.md"
                if skill_md.exists():
                    content = skill_md.read_text()
                    new_content = fix_frontmatter(content, plugin_name, is_skill=True)
                    if new_content != content:
                        skill_md.write_text(new_content)
                        print(f"  skill: FIXED: {skill_dir.name}/SKILL.md")
                        total_fixed += 1
                    else:
                        print(f"  skill: OK: {skill_dir.name}/SKILL.md")

print(f"\nTotal fixed: {total_fixed}")
