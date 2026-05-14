#!/usr/bin/env python3
"""
Agent migration script: reads source .md files, rewrites frontmatter to standard format,
adds missing sections (Voice, When To Use, Workflow, Output Format, Completion Protocol),
writes to target domain directory.
"""
import os
import re
import shutil
from pathlib import Path

BASE = Path("/Users/richardsongunde/projects/.claude")

# Domain color map
DOMAIN_COLORS = {
    "backend": "blue",
    "frontend": "cyan",
    "devops": "green",
    "security": "red",
    "data": "magenta",
    "qa": "yellow",
    "product": "white",
    "docs": "cyan",
    "crypto": "yellow",
}

# Domain voice + tag defaults
DOMAIN_VOICE = {
    "backend": "Direct, concrete. Name the framework, the endpoint, the file. Show actual code — not 'you should implement X.' State trade-offs with real numbers.",
    "frontend": "Visual and concrete. Name the component, the CSS property, the file. Show actual JSX/CSS. State design decisions with rationale.",
    "devops": "Operational and precise. Name the service, the config file, the command. State failure modes and recovery steps. Give the actual config, not a description of it.",
    "security": "Precise and unambiguous. Name the CVE, the OWASP category, the exact vulnerable line. State the threat model and attack vector directly. No 'this might be a risk.'",
    "data": "Data-driven and specific. Name the table, the model, the metric. State trade-offs with numbers: 'adds 200ms latency', 'reduces memory by 40%'.",
    "qa": "Systematic and evidence-based. Cite specific files, line numbers, test names. Show the exact assertion that fails and why — never 'tests might fail'.",
    "product": "Strategic and user-focused. Connect every decision to user outcomes. Name the metric, the stakeholder, the constraint. State specific impact, not vague 'improvements'.",
    "docs": "Clear, scannable, audience-first. Every doc decision serves the reader. Name the target audience, the format, the specific section. Write for skimmability.",
    "crypto": "Fast and data-focused. Lead with the signal. Name the token, the exchange, the metric. No predictions — analysis only.",
}

DOMAIN_WHEN_TO_USE = {
    "backend": "- \"Build an API endpoint for [resource]\"\n- \"Implement a service that [does X]\"\n- \"Add [feature] to the backend\"\n- Whenever server-side logic, database access, or API design is needed",
    "frontend": "- \"Build a [component/page] with [framework]\"\n- \"Implement [UI feature] in React/Vue/etc\"\n- \"Fix the styling on [component]\"\n- Whenever UI, components, or frontend state management is needed",
    "devops": "- \"Set up CI/CD for [project]\"\n- \"Deploy [service] to [platform]\"\n- \"Configure [infrastructure tool]\"\n- Whenever deployment, infrastructure, or build systems are involved",
    "security": "- \"Audit [component] for security issues\"\n- \"Review for OWASP Top 10 vulnerabilities\"\n- \"Check [endpoint] for auth issues\"\n- Whenever security review, compliance checks, or threat modeling is needed",
    "data": "- \"Build a data pipeline for [use case]\"\n- \"Train a model to [predict/classify X]\"\n- \"Optimize [database/query] for [scenario]\"\n- Whenever ML, data engineering, analytics, or database optimization is needed",
    "qa": "- \"Write tests for [feature]\"\n- \"Debug [failing test/behaviour]\"\n- \"Review test coverage for [module]\"\n- Whenever testing strategy, debugging, or quality assurance is needed",
    "product": "- \"Prioritize [feature list] for next sprint\"\n- \"Write requirements for [feature]\"\n- \"Create a user story for [scenario]\"\n- Whenever product decisions, project management, or stakeholder coordination is needed",
    "docs": "- \"Document the [API/feature/system]\"\n- \"Write a README for [project]\"\n- \"Create a technical guide for [audience]\"\n- Whenever technical documentation, changelogs, or API reference is needed",
    "crypto": "- \"Analyze [token] price action\"\n- \"Research [crypto project]\"\n- \"Find top movers in [timeframe]\"\n- Whenever cryptocurrency analysis, market research, or investment research is needed",
}


def parse_frontmatter(content: str):
    """Extract YAML frontmatter and body from markdown content."""
    if not content.startswith("---"):
        return {}, content
    parts = content.split("---", 2)
    if len(parts) < 3:
        return {}, content
    fm_text = parts[1].strip()
    body = parts[2].strip()

    # Parse key fields from frontmatter text (simple extraction)
    fm = {}
    for line in fm_text.split("\n"):
        if ":" in line and not line.startswith(" "):
            key, _, val = line.partition(":")
            fm[key.strip()] = val.strip().strip('"')
    return fm, body


def get_model(fm: dict, domain: str) -> str:
    """Determine correct model."""
    model = fm.get("model", "sonnet").lower()
    if model in ("opus", "sonnet", "haiku", "inherit"):
        return model
    return "sonnet"


def get_tools(fm: dict, domain: str) -> list:
    """Get standard tools for domain."""
    domain_tools = {
        "backend": ["Bash", "Read", "Write", "Edit", "Grep", "Glob"],
        "frontend": ["Bash", "Read", "Write", "Edit", "Grep", "Glob"],
        "devops": ["Bash", "Read", "Write", "Edit", "Grep", "Glob"],
        "security": ["Bash", "Read", "Grep", "Glob"],
        "data": ["Bash", "Read", "Write", "Edit", "Grep", "Glob"],
        "qa": ["Bash", "Read", "Grep", "Glob"],
        "product": ["Read", "Write", "WebSearch"],
        "docs": ["Read", "Write", "Edit", "Grep", "Glob"],
        "crypto": ["Bash", "Read", "WebSearch"],
    }
    return domain_tools.get(domain, ["Bash", "Read", "Write", "Edit", "Grep", "Glob"])


def extract_name_from_filename(filename: str) -> str:
    """Convert filename to kebab-case name."""
    name = Path(filename).stem
    # Convert underscores to hyphens
    name = name.replace("_", "-")
    return name


def infer_description(name: str, body: str, domain: str) -> str:
    """Generate a description from the agent name and body content."""
    # Try to extract first meaningful sentence from body
    lines = [l.strip() for l in body.split("\n") if l.strip() and not l.startswith("#")]
    first_line = lines[0] if lines else ""

    # Clean up common patterns
    first_line = re.sub(r'^You are (a |an |the )', '', first_line)
    first_line = re.sub(r'^(A|An) ', '', first_line)

    # Build description
    readable_name = name.replace("-", " ").title()
    tag = f"({domain})"

    if first_line and len(first_line) > 20:
        desc = f"{first_line[:200]}\nTrigger: \"[task related to {name}]\". {tag}"
    else:
        desc = f"Specialist agent for {readable_name.lower()} tasks.\nTrigger: \"[task related to {name}]\". {tag}"

    return desc


def build_workflow_from_body(body: str, name: str) -> str:
    """Extract or generate a basic workflow from existing body content."""
    # Check if body already has numbered steps or workflow-like content
    has_steps = bool(re.search(r'^\d+\.', body, re.MULTILINE))

    if has_steps:
        # Try to extract the workflow section if it exists
        workflow_match = re.search(r'##\s*Workflow(.*?)(?=\n##|\Z)', body, re.DOTALL | re.IGNORECASE)
        if workflow_match:
            return workflow_match.group(1).strip()

    # Generate a basic workflow
    readable = name.replace("-", " ")
    return f"""1. **Understand the request** — read the relevant files and context:
   ```bash
   find . -type f | grep -E "(relevant-pattern)" | head -20
   ```
2. **Analyze** — identify what needs to be done based on the request and context found in Step 1.
3. **Execute** — implement the required changes or produce the requested output.
4. **Verify** — confirm the output meets the requirements."""


def write_agent(target_path: Path, name: str, domain: str, fm: dict, body: str):
    """Write a properly formatted agent file."""
    color = DOMAIN_COLORS[domain]
    model = get_model(fm, domain)
    tools = get_tools(fm, domain)
    voice = DOMAIN_VOICE[domain]
    when_to_use = DOMAIN_WHEN_TO_USE[domain]

    # Get or generate description
    desc = fm.get("description", "").strip().strip('"')
    if not desc or len(desc) < 20:
        desc = infer_description(name, body, domain)
    # Ensure description ends with domain tag
    if f"({domain})" not in desc:
        desc = desc.rstrip(".") + f". ({domain})"

    # Format description as block scalar (indent continuation lines)
    desc_lines = desc.strip().split("\n")
    desc_formatted = "\n  ".join(desc_lines)

    # Format tools
    tools_yaml = "\n".join(f"  - {t}" for t in tools)

    # Strip existing section headers we're replacing
    clean_body = re.sub(r'^##\s*(Voice|When To Use|Workflow|Output Format|Completion Protocol).*?(?=\n##|\Z)', '', body, flags=re.DOTALL | re.MULTILINE).strip()

    # Extract any existing workflow content
    workflow_content = build_workflow_from_body(body, name)

    # Build the complete agent
    content = f"""---
name: {name}
description: |
  {desc_formatted}
model: {model}
tools:
{tools_yaml}
color: {color}
---

## Voice
{voice}

## When To Use
{when_to_use}

## Workflow
{workflow_content}

## Output Format
Concrete deliverable: working code, specific recommendations, or a clear action plan.
State what was done and what the next step is.

## Completion Protocol
STATUS: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
REASON: [1–2 sentences if not DONE]
ATTEMPTED: [what was tried, if BLOCKED]
"""

    target_path.write_text(content)


def migrate_file(src: Path, target_dir: Path, domain: str, rename_to: str = None):
    """Migrate a single agent file."""
    target_name = rename_to or src.name
    # Normalize filename: underscores to hyphens
    target_name = target_name.replace("_", "-")
    target_path = target_dir / target_name

    # Skip if already properly formatted (check for standard sections)
    if target_path.exists():
        existing = target_path.read_text()
        if "## Completion Protocol" in existing and "## Workflow" in existing:
            return "SKIP (already formatted)"

    content = src.read_text()
    fm, body = parse_frontmatter(content)
    name = extract_name_from_filename(target_name)

    write_agent(target_path, name, domain, fm, body)
    return f"OK: {target_path.name}"


def main():
    # Domain migration map: (source_dir, domain, [specific_files or None for all])
    migrations = [
        # BACKEND
        (BASE / "categories/01-core-development", "backend", [
            "api-designer.md", "backend-developer.md", "graphql-architect.md",
            "microservices-architect.md", "websocket-engineer.md", "electron-pro.md",
            "mobile-developer.md"
        ]),
        (BASE / "categories/02-language-specialists", "backend", None),  # all
        (BASE / "categories/06-developer-experience", "backend", [
            "powershell-module-architect.md", "powershell-ui-architect.md"
        ]),
        (BASE / "categories/07-specialized-domains", "backend", [
            "blockchain-developer.md", "fintech-engineer.md", "game-developer.md",
            "embedded-systems.md"
        ]),
        (BASE / "agents/specialists/architecture", "backend", None),
        (BASE / "agents/team/specialists", "backend", [
            "staff-engineer.md", "system-architect.md"
        ]),

        # FRONTEND
        (BASE / "categories/01-core-development", "frontend", [
            "frontend-developer.md", "fullstack-developer.md", "ui-designer.md"
        ]),
        (BASE / "agents/team/specialists", "frontend", [
            "premium-ux-designer.md", "shadcn-component-researcher.md",
            "shadcn-implementation-builder.md", "shadcn-quick-helper.md",
            "shadcn-requirements-analyzer.md"
        ]),
        (BASE / "plugins/ui-design/agents", "frontend", None),

        # DEVOPS
        (BASE / "categories/03-infrastructure", "devops", None),
        (BASE / "categories/06-developer-experience", "devops", [
            "build-engineer.md", "cli-developer.md", "dependency-manager.md",
            "dx-optimizer.md", "git-workflow-manager.md", "legacy-modernizer.md",
            "mcp-developer.md", "tooling-engineer.md"
        ]),
        (BASE / "categories/09-meta-orchestration", "devops", [
            "it-ops-orchestrator.md", "workflow-orchestrator.md", "task-distributor.md",
            "performance-monitor.md", "context-manager.md", "knowledge-synthesizer.md"
        ]),
        (BASE / "agents/specialists/devops", "devops", None),
        (BASE / "agents/specialists/performance", "devops", [
            "devops-troubleshooter.md", "monitoring-specialist.md"
        ]),
        (BASE / "agents/team/specialists", "devops", ["git-commit-helper.md"]),

        # SECURITY
        (BASE / "categories/04-quality-security", "security", [
            "ad-security-reviewer.md", "code-reviewer.md", "compliance-auditor.md",
            "penetration-tester.md", "powershell-security-hardening.md", "security-auditor.md"
        ]),
        (BASE / "agents/specialists/security", "security", None),
        (BASE / "categories/03-infrastructure", "security", ["security-engineer.md"]),

        # DATA
        (BASE / "categories/05-data-ai", "data", None),
        (BASE / "plugins/machine-learning-ops/agents", "data", None),

        # QA
        (BASE / "categories/04-quality-security", "qa", [
            "accessibility-tester.md", "architect-reviewer.md", "chaos-engineer.md",
            "debugger.md", "error-detective.md", "performance-engineer.md",
            "qa-expert.md", "test-automator.md"
        ]),
        (BASE / "agents/specialists/testing", "qa", None),
        (BASE / "agents/specialists/performance", "qa", [
            "performance-engineer.md", "performance-monitor.md", "performance-profiler.md"
        ]),
        (BASE / "agents/team/specialists", "qa", [
            "code-refactorer.md", "code-reviewer.md", "senior-code-reviewer.md"
        ]),

        # PRODUCT
        (BASE / "categories/08-business-product", "product", [
            "business-analyst.md", "customer-success-manager.md", "product-manager.md",
            "project-manager.md", "sales-engineer.md", "scrum-master.md", "ux-researcher.md"
        ]),
        (BASE / "categories/10-research-analysis", "product", None),
        (BASE / "agents/specialists/project-management", "product", None),
        (BASE / "agents/team/specialists", "product", ["product-strategy-advisor.md"]),

        # DOCS
        (BASE / "categories/06-developer-experience", "docs", [
            "documentation-engineer.md", "slack-expert.md"
        ]),
        (BASE / "categories/08-business-product", "docs", [
            "technical-writer.md", "content-marketer.md", "legal-advisor.md",
            "wordpress-master.md"
        ]),
        (BASE / "agents/specialists/documentation", "docs", None),
        (BASE / "agents/team/specialists", "docs", [
            "meta-agent.md", "work-completion-summary.md"
        ]),

        # CRYPTO
        (BASE / "categories/07-specialized-domains", "crypto", None),  # filtered below
    ]

    results = {}
    for domain in DOMAIN_COLORS:
        results[domain] = []

    for source_dir, domain, files in migrations:
        target_dir = BASE / "agents/specialists" / domain
        target_dir.mkdir(parents=True, exist_ok=True)

        if not source_dir.exists():
            results[domain].append(f"MISSING SOURCE: {source_dir}")
            continue

        if files is None:
            # All files in directory
            src_files = list(source_dir.glob("*.md"))
        else:
            src_files = [source_dir / f for f in files if (source_dir / f).exists()]

        for src in src_files:
            # Skip crypto non-crypto files from categories/07
            if domain == "crypto" and not src.name.startswith("crypto-"):
                continue
            # Skip crypto from non-crypto domains
            if domain != "crypto" and src.name.startswith("crypto-"):
                continue

            result = migrate_file(src, target_dir, domain)
            results[domain].append(result)

    # Handle bounty_hunter rename
    bounty_src = BASE / "agents/team/specialists/bounty_hunter.md"
    if bounty_src.exists():
        qa_dir = BASE / "agents/specialists/qa"
        result = migrate_file(bounty_src, qa_dir, "qa", rename_to="bounty-hunter.md")
        results["qa"].append(f"bounty_hunter → bounty-hunter: {result}")

    # Handle llm rename
    llm_src = BASE / "agents/team/specialists/llm-ai-agents-and-eng-research.md"
    if llm_src.exists():
        data_dir = BASE / "agents/specialists/data"
        result = migrate_file(llm_src, data_dir, "data", rename_to="llm-research-agent.md")
        results["data"].append(f"llm-ai-agents → llm-research-agent: {result}")

    # Print summary
    print("\n=== MIGRATION SUMMARY ===")
    total = 0
    for domain, msgs in results.items():
        count = len([m for m in msgs if m.startswith("OK")])
        total += count
        print(f"\n{domain.upper()}: {count} written")
        for m in msgs:
            if not m.startswith("OK"):
                print(f"  {m}")

    print(f"\nTOTAL: {total} files written")

    # Final count per domain
    print("\n=== FINAL COUNTS ===")
    for domain in DOMAIN_COLORS:
        d = BASE / "agents/specialists" / domain
        count = len(list(d.glob("*.md"))) if d.exists() else 0
        print(f"{domain}: {count}")


if __name__ == "__main__":
    main()
