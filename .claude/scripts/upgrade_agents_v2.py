#!/usr/bin/env python3
"""
Upgrade all 195 agents to the rstack gstack-style format:
1. Add ## Skills Access section (exact skill paths per domain)
2. Add ## AskUserQuestion Format section
3. Add rstack preamble reference
4. Upgrade Voice to Richardson's persona pattern
"""
from pathlib import Path
import re
import yaml

BASE = Path("/Users/richardsongunde/projects/.claude")
AGENTS_DIR = BASE / "agents"

# ─── DOMAIN → SKILL PATHS ────────────────────────────────────────────────────
DOMAIN_SKILLS = {
    "backend": {
        "core": [
            ("investigate",      "skills/investigate/SKILL.md",        "debugging, root cause — Iron Law: no fix without root cause"),
            ("code-review-pr",   "skills/code-review-pr/SKILL.md",     "pre-landing PR review, diff analysis"),
            ("careful",          "skills/careful/SKILL.md",            "before rm -rf, DROP TABLE, force-push, or any destructive op"),
            ("ship",             "skills/ship/SKILL.md",               "test + review + bump version + push + create PR"),
            ("security-owasp",   "skills/security-owasp/SKILL.md",     "OWASP Top 10, STRIDE, secrets archaeology"),
        ],
        "domain": [
            ("plan-eng-review",  "skills/plan-eng-review/SKILL.md",    "lock in architecture, data flow, edge cases, test coverage"),
            ("bounty-hunting",   "skills/bounty-hunting/SKILL.md",     "find and fix code smells, debt, misconfigurations"),
            ("benchmark",        "skills/benchmark/SKILL.md",          "performance regression detection"),
        ],
        "plugins": [
            ("backend-development", "plugins/backend-development/", "API patterns, event sourcing, CQRS, temporal workflows"),
        ],
    },
    "frontend": {
        "core": [
            ("frontend-design",  "skills/frontend-design/SKILL.md",    "distinctive, production-grade UI — avoid generic AI aesthetics"),
            ("design-review",    "skills/design-review/SKILL.md",      "visual inconsistency, spacing, hierarchy, slow interactions"),
            ("webapp-testing",   "skills/webapp-testing/SKILL.md",     "Playwright browser testing, UI verification"),
            ("browse",           "skills/browse/SKILL.md",             "headless Chromium — real clicks, ~100ms/command"),
            ("careful",          "skills/careful/SKILL.md",            "before any destructive operation"),
        ],
        "domain": [
            ("design-consultation", "skills/design-consultation/SKILL.md", "build a complete design system from scratch"),
            ("design-shotgun",   "skills/design-shotgun/SKILL.md",     "multiple design variants, comparison board"),
            ("plan-design-review", "skills/plan-design-review/SKILL.md", "designer's eye on a plan — rates each dimension 0-10"),
        ],
        "plugins": [
            ("ui-design", "plugins/ui-design/", "responsive design, mobile, design system patterns, accessibility"),
        ],
    },
    "devops": {
        "core": [
            ("ship",             "skills/ship/SKILL.md",               "test + review + bump version + push + create PR"),
            ("land-and-deploy",  "skills/land-and-deploy/SKILL.md",    "merge + wait for CI/deploy + verify production health"),
            ("canary",           "skills/canary/SKILL.md",             "post-deploy monitoring — console errors, performance, page failures"),
            ("careful",          "skills/careful/SKILL.md",            "before rm -rf, kubectl delete, force-push, DROP TABLE"),
            ("guard",            "skills/guard/SKILL.md",              "careful + freeze combined — maximum safety for prod work"),
        ],
        "domain": [
            ("setup-deploy",     "skills/setup-deploy/SKILL.md",       "configure deployment platform — Fly.io, Render, Vercel, GitHub Actions"),
            ("freeze",           "skills/freeze/SKILL.md",             "lock edits to one directory to prevent scope creep while debugging"),
            ("security-owasp",   "skills/security-owasp/SKILL.md",     "CI/CD pipeline security, secrets, supply chain"),
            ("benchmark",        "skills/benchmark/SKILL.md",          "performance regression, Core Web Vitals, load time baselines"),
        ],
        "plugins": [],
    },
    "security": {
        "core": [
            ("security-owasp",   "skills/security-owasp/SKILL.md",     "OWASP Top 10, STRIDE, secrets archaeology, supply chain, CI/CD"),
            ("code-review-pr",   "skills/code-review-pr/SKILL.md",     "pre-landing review with SQL safety, LLM trust boundary, auth checks"),
            ("investigate",      "skills/investigate/SKILL.md",        "trace an exploit path before reporting it — no finding without root cause"),
            ("careful",          "skills/careful/SKILL.md",            "before any command that modifies security-critical config"),
        ],
        "domain": [
            ("bounty-hunting",   "skills/bounty-hunting/SKILL.md",     "systematic code smell + security smell sweep"),
        ],
        "plugins": [],
    },
    "data": {
        "core": [
            ("investigate",      "skills/investigate/SKILL.md",        "trace pipeline failures, model output anomalies, data quality issues"),
            ("code-review-pr",   "skills/code-review-pr/SKILL.md",     "review ML code for data leakage, evaluation methodology, reproducibility"),
            ("careful",          "skills/careful/SKILL.md",            "before any operation that modifies training data or model artifacts"),
            ("benchmark",        "skills/benchmark/SKILL.md",          "track model performance metrics, inference latency regression"),
        ],
        "domain": [
            ("security-owasp",   "skills/security-owasp/SKILL.md",     "LLM/AI security — prompt injection, model supply chain, output trust"),
            ("plan-eng-review",  "skills/plan-eng-review/SKILL.md",    "review data architecture, pipeline design, evaluation strategy"),
        ],
        "plugins": [
            ("machine-learning-ops", "plugins/machine-learning-ops/", "ML pipeline patterns, MLOps, training workflow"),
        ],
    },
    "qa": {
        "core": [
            ("investigate",      "skills/investigate/SKILL.md",        "root cause before any fix — never patch without understanding why"),
            ("qa-testing",       "skills/qa-testing/SKILL.md",         "browser QA with real Chromium — find bugs, fix them, re-verify"),
            ("qa-only",          "skills/qa-only/SKILL.md",            "report-only QA — no code changes, just findings"),
            ("webapp-testing",   "skills/webapp-testing/SKILL.md",     "Playwright browser testing, UI behavior verification"),
            ("bounty-hunting",   "skills/bounty-hunting/SKILL.md",     "systematic sweep — code smells, debt, security holes, broken patterns"),
        ],
        "domain": [
            ("browse",           "skills/browse/SKILL.md",             "headless Chromium for browser-level QA and verification"),
            ("code-review-pr",   "skills/code-review-pr/SKILL.md",     "pre-landing review — catches what tests don't"),
            ("benchmark",        "skills/benchmark/SKILL.md",          "performance regression detection — page load, Core Web Vitals"),
        ],
        "plugins": [
            ("incident-response", "plugins/incident-response/", "incident patterns, runbook templates, postmortem writing"),
        ],
    },
    "product": {
        "core": [
            ("office-hours",     "skills/office-hours/SKILL.md",       "YC office hours — six forcing questions before writing a line of code"),
            ("plan-ceo-review",  "skills/plan-ceo-review/SKILL.md",    "CEO-mode: find the 10-star product, challenge premises, expand scope"),
            ("plan-eng-review",  "skills/plan-eng-review/SKILL.md",    "eng-mode: lock architecture, data flow, edge cases, test coverage"),
            ("retro",            "skills/retro/SKILL.md",              "weekly retrospective with shipping streaks, per-person breakdown"),
        ],
        "domain": [
            ("autoplan",         "skills/autoplan/SKILL.md",           "auto-run CEO + design + eng review pipeline with AskUserQuestion gates"),
            ("document-release", "skills/document-release/SKILL.md",   "update all docs after ship — README, CHANGELOG, ARCHITECTURE"),
            ("plan-design-review", "skills/plan-design-review/SKILL.md", "designer's eye — rate each UI dimension 0-10"),
        ],
        "plugins": [],
    },
    "docs": {
        "core": [
            ("document-release", "skills/document-release/SKILL.md",   "update README, CHANGELOG, ARCHITECTURE, CLAUDE.md after any ship"),
            ("retro",            "skills/retro/SKILL.md",              "weekly retro — history, trends, per-person shipping streaks"),
            ("ship",             "skills/ship/SKILL.md",               "test + review + bump VERSION + update CHANGELOG + push + PR"),
        ],
        "domain": [
            ("code-review-pr",   "skills/code-review-pr/SKILL.md",     "review docs PRs for scope drift, missing requirements, accuracy"),
            ("investigate",      "skills/investigate/SKILL.md",        "when docs contradict behavior — trace the actual execution path"),
        ],
        "plugins": [],
    },
    "crypto": {
        "core": [
            ("investigate",      "skills/investigate/SKILL.md",        "trace why a price signal or data feed is behaving unexpectedly"),
            ("careful",          "skills/careful/SKILL.md",            "before any automated trade execution or wallet interaction"),
        ],
        "domain": [
            ("benchmark",        "skills/benchmark/SKILL.md",          "track latency and throughput of market data ingestion pipelines"),
        ],
        "plugins": [],
    },
}

# ─── AskUserQuestion format (shared across all agents) ─────────────────────
ASK_USER_FORMAT = """
## AskUserQuestion Format

Every AskUserQuestion from this agent follows this structure:

1. **Re-ground:** Project + current branch + what's happening now. (1-2 sentences)
2. **Simplify:** The problem in plain language — what it DOES, not what it's called.
3. **Recommend:** `RECOMMENDATION: Choose [X] because [one-line reason]`. Include `Completeness: X/10` per option.
4. **Options:** `A) ... B) ...` with effort shown as `(human: ~X / rstack: ~Y)`
"""

# ─── rstack ethos reference (injected into Voice section) ──────────────────
ETHOS_NOTE = """
**rstack standard (from ETHOS.md):**
Done means structurally sound — not "working for now." Before declaring complete:
can someone else pick this up cold? Does it degrade gracefully when it breaks?
Name the conditions under which this fails.
"""

def build_skills_section(domain: str) -> str:
    mapping = DOMAIN_SKILLS.get(domain, {})
    if not mapping:
        return ""

    lines = ["", "## Skills Access", ""]
    lines.append("Load these before executing domain work. Use `cat .claude/[path] | head -40` to read.")
    lines.append("")

    core = mapping.get("core", [])
    if core:
        lines.append("### Core (always available)")
        for name, path, when in core:
            lines.append(f"- `{path}` — {when}")
        lines.append("")

    domain_skills = mapping.get("domain", [])
    if domain_skills:
        lines.append("### Domain-specific")
        for name, path, when in domain_skills:
            lines.append(f"- `{path}` — {when}")
        lines.append("")

    plugins = mapping.get("plugins", [])
    if plugins:
        lines.append("### Plugin packs")
        for name, path, desc in plugins:
            lines.append(f"- `{path}` — {desc}")
        lines.append("")

    return "\n".join(lines)


def upgrade_agent(path: Path, domain: str):
    content = path.read_text()

    # Already upgraded?
    if "## Skills Access" in content:
        return False

    # Parse frontmatter + body
    if not content.startswith("---"):
        return False
    parts = content.split("---", 2)
    if len(parts) < 3:
        return False

    fm_text = parts[1]
    body = parts[2]

    # --- 1. Upgrade Voice section ---
    # Add ethos note if Voice exists and doesn't already have it
    if "## Voice" in body and "rstack standard" not in body:
        body = body.replace(
            "## Voice",
            f"## Voice{ETHOS_NOTE}\n##__VOICE_ORIGINAL__",
            1
        ).replace("##__VOICE_ORIGINAL__", "## Voice (original)", 1)

    # --- 2. Add Skills Access section after Voice ---
    skills_section = build_skills_section(domain)

    # --- 3. Add AskUserQuestion Format if not present ---
    ask_section = ""
    if "AskUserQuestion" not in body:
        ask_section = ASK_USER_FORMAT

    # --- 4. Insert Skills Access before Workflow ---
    if "## Workflow" in body:
        body = body.replace("## Workflow", skills_section + "\n## Workflow", 1)
    elif "## When To Use" in body:
        # Insert after When To Use
        body = body.replace(
            "## When To Use",
            "## When To Use",
            1
        )
        # Find end of When To Use section
        wtu_match = re.search(r'(## When To Use.*?)(##)', body, re.DOTALL)
        if wtu_match:
            body = body[:wtu_match.end(1)] + skills_section + "\n" + body[wtu_match.end(1):]
    else:
        # Append at end before Completion Protocol
        body = body.replace(
            "## Completion Protocol",
            skills_section + "\n## Completion Protocol",
            1
        )

    # Insert AskUserQuestion Format before Completion Protocol
    if ask_section and "## Completion Protocol" in body:
        body = body.replace(
            "## Completion Protocol",
            ask_section + "\n## Completion Protocol",
            1
        )

    new_content = "---" + fm_text + "---" + body
    path.write_text(new_content)
    return True


def main():
    upgraded = 0
    skipped = 0
    errors = []

    specialists_dir = AGENTS_DIR / "specialists"
    for domain_dir in sorted(specialists_dir.iterdir()):
        if not domain_dir.is_dir():
            continue
        domain = domain_dir.name
        if domain not in DOMAIN_SKILLS:
            continue

        for md in sorted(domain_dir.glob("*.md")):
            try:
                if upgrade_agent(md, domain):
                    upgraded += 1
                else:
                    skipped += 1
            except Exception as e:
                errors.append(f"{md.name}: {e}")

    # Also upgrade core agents
    core_dir = AGENTS_DIR / "core"
    for md in sorted(core_dir.glob("*.md")):
        try:
            if upgrade_agent(md, "backend"):
                upgraded += 1
        except Exception as e:
            errors.append(f"core/{md.name}: {e}")

    # Upgrade SDLC agents (no specific domain skills needed — they ref skills internally)
    # Just add AskUserQuestion format
    sdlc_dir = AGENTS_DIR / "sdlc"
    for md in sorted(sdlc_dir.glob("*.md")):
        content = md.read_text()
        if "AskUserQuestion" not in content and "## Completion Protocol" in content:
            content = content.replace(
                "## Completion Protocol",
                ASK_USER_FORMAT + "\n## Completion Protocol",
                1
            )
            md.write_text(content)
            upgraded += 1

    print(f"Upgraded: {upgraded}")
    print(f"Skipped (already done): {skipped}")
    if errors:
        print("Errors:")
        for e in errors[:10]:
            print(f"  {e}")

    # Spot check
    sample = AGENTS_DIR / "specialists/backend/backend-developer.md"
    if sample.exists():
        content = sample.read_text()
        has_skills = "## Skills Access" in content
        has_ask = "AskUserQuestion" in content
        print(f"\nSpot check backend-developer.md: skills={has_skills} ask_format={has_ask}")

    sample2 = AGENTS_DIR / "specialists/qa/bounty-hunter.md"
    if sample2.exists():
        content = sample2.read_text()
        has_skills = "## Skills Access" in content
        print(f"Spot check bounty-hunter.md: skills={has_skills}")


if __name__ == "__main__":
    main()
