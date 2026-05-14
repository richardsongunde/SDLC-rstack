#!/usr/bin/env python3
"""
Fix description and tools corruption from the broken frontmatter parser.
Uses PyYAML to correctly parse existing frontmatter, then rewrites properly.
"""
import yaml
import re
from pathlib import Path

BASE = Path("/Users/richardsongunde/projects/.claude/agents/specialists")

DOMAIN_TOOLS = {
    "backend":  ["Bash", "Read", "Write", "Edit", "Grep", "Glob"],
    "frontend": ["Bash", "Read", "Write", "Edit", "Grep", "Glob"],
    "devops":   ["Bash", "Read", "Write", "Edit", "Grep", "Glob"],
    "security": ["Bash", "Read", "Grep", "Glob"],
    "data":     ["Bash", "Read", "Write", "Edit", "Grep", "Glob"],
    "qa":       ["Bash", "Read", "Grep", "Glob"],
    "product":  ["Read", "Write", "WebSearch"],
    "docs":     ["Read", "Write", "Edit", "Grep", "Glob"],
    "crypto":   ["Bash", "Read", "WebSearch"],
}

DOMAIN_COLORS = {
    "backend": "blue", "frontend": "cyan", "devops": "green",
    "security": "red", "data": "magenta", "qa": "yellow",
    "product": "white", "docs": "cyan", "crypto": "yellow",
}

# Known-good descriptions for key agents (to restore what was corrupted)
DESCRIPTIONS = {
    "backend-developer": "Builds production-ready server-side APIs, microservices, and backend services. Use for REST/GraphQL endpoint implementation, service design, database integration, auth systems, and backend testing. Trigger: \"build an API\", \"implement a service\", \"add an endpoint\", \"create a backend\". (backend)",
    "api-designer": "REST and GraphQL API design, OpenAPI spec authoring, and API contract review. Use when designing new APIs, reviewing service contracts, or choosing between REST and GraphQL. Trigger: \"design a REST API\", \"create an OpenAPI spec\", \"review this API contract\", \"API versioning strategy\". (backend)",
    "api-builder": "Builds complete, working REST/GraphQL APIs end-to-end from spec to tested endpoints. Use when a full API implementation is needed — not just design. Trigger: \"build the full API\", \"implement CRUD endpoints\", \"generate API from spec\". (backend)",
    "api-architect": "Designs service-level API architectures, defines inter-service contracts, and sets API governance standards. Use when setting service boundaries, reviewing API coupling, or designing API gateway patterns. Trigger: \"design the service architecture\", \"review API boundaries\", \"plan inter-service communication\". (backend)",
    "graphql-architect": "Designs GraphQL schemas, resolver strategies, and federation architectures. Prevents N+1 problems with DataLoader patterns. Trigger: \"design a GraphQL schema\", \"set up Apollo federation\", \"review this GraphQL schema\", \"N+1 in resolvers\". (backend)",
    "backend-architect": "Designs scalable backend system architectures: tech stack selection, layering, resilience patterns, and observability strategy. Trigger: \"design the backend architecture\", \"review this backend design\", \"plan the tech stack\". (backend)",
    "microservices-architect": "Decomposes monoliths and designs microservice boundaries using DDD bounded contexts. Defines inter-service communication (sync/async). Trigger: \"break up this monolith\", \"design service boundaries\", \"plan event-driven architecture\". (backend)",
    "database-architect": "Designs database schemas, selects storage engines, and plans data models. Understands access pattern trade-offs for SQL vs NoSQL. Trigger: \"design the database schema\", \"choose between SQL and NoSQL\", \"model relationships for [entities]\". (backend)",
    "database-designer": "Creates and modifies specific database tables, columns, and migrations. Writes up/down migration files. Trigger: \"create the schema for [tables]\", \"add a column to [table]\", \"write a migration for [change]\". (backend)",
    "database-administrator": "Diagnoses and fixes database performance issues, sets up replication and HA, configures connection pooling. Trigger: \"the database is slow\", \"set up replication\", \"optimize this query\", \"configure connection pooling\". (backend)",
    "code-architect": "Reviews internal code design for SOLID violations, circular dependencies, and missing abstractions. Proposes refactoring plans. Trigger: \"design the code architecture\", \"review this code structure\", \"suggest a refactoring plan\". (backend)",
    "staff-engineer": "Staff-level technical leadership: cross-team design decisions, architectural trade-off analysis, and technical strategy. Trigger: \"review this at a staff level\", \"design the architecture for [major feature]\", \"unblock this cross-team problem\". (backend)",
    "system-architect": "Designs overall system architectures: component boundaries, data flows, integration points, and migration paths. Trigger: \"design the overall system architecture\", \"evaluate this architecture\", \"plan the migration from [old] to [new]\". (backend)",
    # QA
    "bounty-hunter": "Systematically hunts down bugs, code smells, technical debt, and broken configurations across the project. Use proactively when the user wants to sweep for issues. Trigger: \"hunt for bugs\", \"find code smells\", \"scan for technical debt\", \"act like a bounty hunter\". (qa)",
    "debugger": "Systematic root cause analysis for bugs, crashes, and unexpected behaviour. Never guesses — follows the stack trace. Trigger: \"debug [error] in [service]\", \"this test is failing — find out why\", \"trace why [feature] is not working\". (qa)",
    "code-reviewer": "Code quality review covering correctness, error handling, security, and test coverage. Trigger: \"review this code change\", \"check [function/class] for issues\", \"is this implementation correct?\". (qa)",
    "senior-code-reviewer": "Staff-level code review: architecture concerns, security findings, test coverage gaps. Trigger: \"do a thorough senior review\", \"review for architecture and security\", \"is this production-ready?\". (qa)",
    "error-detective": "Cross-service error correlation and incident root cause analysis. Builds failure timelines from logs. Trigger: \"find the root cause of [error]\", \"correlate these errors across services\", \"why is [service] failing intermittently?\". (qa)",
    "e2e-runner": "End-to-end test authoring and execution with Playwright/Cypress. Uses role-based selectors. Trigger: \"write E2E tests for [user flow]\", \"run the Playwright test suite\", \"fix the failing E2E test\". (qa)",
    "performance-engineer": "Profiles and eliminates performance bottlenecks in APIs, databases, and services. Uses real measurements. Trigger: \"profile and fix [slow endpoint]\", \"this API is taking Xms — find the bottleneck\". (qa)",
    "test-automator": "Sets up test infrastructure and writes automated unit/integration tests. Improves coverage systematically. Trigger: \"write tests for [function/module]\", \"set up testing for [project]\", \"add test coverage for [code path]\". (qa)",
    # Security
    "security-auditor": "Comprehensive security sweeps covering OWASP Top 10, dependency vulnerabilities, secrets in code, and auth flaws. Trigger: \"audit [codebase] for security issues\", \"run a security review\", \"check for OWASP Top 10\". (security)",
    "penetration-tester": "Authorized penetration testing: tests auth bypass, injection, IDOR, and other exploit vectors. Trigger: \"test [application] for vulnerabilities\", \"perform a pentest\", \"verify [auth] can be bypassed\". (security)",
    "compliance-auditor": "Maps system controls to compliance frameworks (SOC 2, HIPAA, PCI-DSS, GDPR) and identifies gaps. Trigger: \"audit for SOC 2 compliance\", \"generate compliance evidence\", \"identify compliance gaps\". (security)",
    "engineering-security-engineer": "Application security engineering: threat modelling, vulnerability assessment, and secure architecture for modern web and cloud-native apps. Trigger: \"threat model [system]\", \"secure architecture review\", \"design security controls for [feature]\". (security)",
    # Data
    "ml-engineer": "Builds ML training pipelines, model serving infrastructure, and MLOps automation. Trigger: \"build a training pipeline\", \"deploy the ML model\", \"fix the failing ML job\", \"set up model monitoring\". (data)",
    "data-engineer": "Builds data pipelines (ETL/ELT), ingestion systems, and data infrastructure. Trigger: \"build a data pipeline for [source → destination]\", \"set up ETL\", \"fix the failing data job\". (data)",
    "data-scientist": "Statistical analysis, EDA, and model evaluation. Connects data findings to business decisions. Trigger: \"analyze [dataset] to answer [question]\", \"build an exploratory analysis\", \"validate model performance\". (data)",
    "llm-architect": "Designs LLM-powered systems: RAG, agent loops, prompt systems, tool calling, and eval frameworks. Trigger: \"design an LLM-powered [feature]\", \"review this prompt\", \"choose between LLM providers\". (data)",
    # DevOps
    "cloud-architect": "Designs multi-cloud infrastructure, plans cloud migrations, optimizes cloud costs, and implements disaster recovery. Trigger: \"design the cloud infrastructure\", \"migrate [workload] to [AWS/GCP/Azure]\", \"optimize cloud costs\". (devops)",
    "devops-engineer": "CI/CD pipelines, deployment automation, and build orchestration. Trigger: \"set up CI/CD\", \"add a GitHub Actions pipeline\", \"automate [deployment/build/test] process\". (devops)",
    "docker-expert": "Docker multi-stage builds, image optimization, and docker-compose orchestration. Trigger: \"write a Dockerfile\", \"optimize this Docker image\", \"set up docker-compose\". (devops)",
    "kubernetes-specialist": "Kubernetes manifests, workload configuration, HPA, and cluster debugging. Trigger: \"write K8s manifests for [service]\", \"debug a failing pod\", \"configure resource limits\". (devops)",
    "terraform-engineer": "Infrastructure-as-code with Terraform/OpenTofu. Writes, validates, and refactors Terraform modules. Trigger: \"write Terraform for [resource]\", \"review this Terraform\", \"refactor to use modules\". (devops)",
    "git-commit-helper": "Creates well-formatted conventional commits and PRs. Trigger: \"commit these changes\", \"write a commit message\", \"create a PR\". (devops)",
    # Docs
    "technical-writer": "Technical documentation, guides, READMEs, and getting-started content for developers. Trigger: \"write documentation for [feature]\", \"improve the README\", \"create a getting-started guide\". (docs)",
    "diagram-architect": "Architecture, sequence, ER, and flow diagrams in Mermaid format. Trigger: \"create an architecture diagram\", \"draw a sequence diagram\", \"visualize the data flow\". (docs)",
    "changelog-generator": "Generates Keep-a-Changelog formatted changelogs from git history. Trigger: \"generate a changelog\", \"update CHANGELOG.md\", \"write release notes\". (docs)",
    "meta-agent": "Creates new Claude Code agent definition files following the canonical format. Trigger: \"create a new agent for [purpose]\", \"build a sub-agent configuration\". (docs)",
    # Frontend
    "frontend-developer": "Frontend implementation: React/Vue/Angular components, pages, and UI features. Trigger: \"build [component/page/feature]\", \"fix the UI for [component]\", \"add [interaction] to [element]\". (frontend)",
    "premium-ux-designer": "Premium, polished UI with distinctive aesthetics, animations, and micro-interactions. Trigger: \"make [component] look premium\", \"add animations to [feature]\", \"redesign [UI] to feel high-end\". (frontend)",
    # Product
    "product-manager": "Product requirements, user stories, roadmaps, and feature scoping. Trigger: \"write requirements for [feature]\", \"create a product roadmap\", \"prioritize the backlog\". (product)",
    "scrum-master": "Sprint facilitation, impediment removal, and agile process improvement. Trigger: \"run the sprint planning/retrospective\", \"remove this blocker\", \"improve our sprint velocity\". (product)",
    "project-manager": "Project planning, WBS, risk management, and delivery coordination. Trigger: \"create a project plan\", \"track project health\", \"manage scope creep\". (product)",
}

def has_corrupted_description(content: str) -> bool:
    """Check if description contains tool names (sign of corruption)."""
    lines = content.split("\n")
    in_desc = False
    for line in lines:
        if line.startswith("description:"):
            in_desc = True
            continue
        if in_desc and line.startswith("  ") and not line.startswith("  -"):
            # Check if the description content is just tool names
            words = line.strip().split()
            tool_names = {"Bash", "Read", "Write", "Edit", "Grep", "Glob", "WebSearch", "Agent"}
            if words and all(w.rstrip(".") in tool_names for w in words):
                return True
            return False  # Has real description content
        if in_desc and not line.startswith(" ") and line.strip():
            return True  # Empty description
    return False


def fix_agent_file(md_file: Path, domain: str):
    content = md_file.read_text()
    agent_name = md_file.stem

    # Parse frontmatter with PyYAML
    if not content.startswith("---"):
        return False

    parts = content.split("---", 2)
    if len(parts) < 3:
        return False

    try:
        fm = yaml.safe_load(parts[1]) or {}
    except Exception:
        fm = {}

    body = parts[2]

    # Get correct description
    current_desc = fm.get("description", "")
    if isinstance(current_desc, str):
        current_desc = current_desc.strip()

    # Check if description is corrupted (contains tool names) or from lookup table
    needs_desc_fix = (
        not current_desc or
        len(current_desc) < 30 or
        any(tool in current_desc.split() for tool in ["Bash", "Read", "Write", "Edit", "Grep", "Glob"]) or
        current_desc.startswith("Use this agent when") and len(current_desc) < 100
    )

    new_desc = current_desc
    if needs_desc_fix and agent_name in DESCRIPTIONS:
        new_desc = DESCRIPTIONS[agent_name]
    elif needs_desc_fix:
        # Generate a basic description from agent name
        readable = agent_name.replace("-", " ").title()
        new_desc = f"Specialist agent for {readable.lower()} tasks and workflows. " \
                   f"Trigger: any request involving {readable.lower()}. ({domain})"

    # Ensure domain tag
    if f"({domain})" not in new_desc:
        new_desc = new_desc.rstrip(". ") + f". ({domain})"

    # Correct tools for domain
    correct_tools = DOMAIN_TOOLS[domain]

    # Preserve original model
    model = fm.get("model", "sonnet")
    if model not in ("opus", "sonnet", "haiku", "inherit"):
        model = "sonnet"

    color = DOMAIN_COLORS[domain]

    # Format description — wrap at ~80 chars
    desc_lines = []
    words = new_desc.split()
    line = ""
    for word in words:
        if len(line) + len(word) + 1 > 80 and line:
            desc_lines.append(line)
            line = word
        else:
            line = (line + " " + word).strip()
    if line:
        desc_lines.append(line)
    desc_formatted = "\n  ".join(desc_lines)

    tools_yaml = "\n".join(f"  - {t}" for t in correct_tools)

    # Handle hooks preservation (builder/validator)
    hooks_block = ""
    original_fm_text = parts[1]
    if "hooks:" in original_fm_text:
        # Extract hooks section from original frontmatter text
        hooks_match = re.search(r'(hooks:.*?)(?=\n[a-z]|\Z)', original_fm_text, re.DOTALL)
        if hooks_match:
            hooks_block = hooks_match.group(1).rstrip() + "\n"

    # Handle disallowedTools
    disallowed = fm.get("disallowedTools", [])
    disallowed_block = ""
    if disallowed:
        items = "\n".join(f"  - {t}" for t in disallowed)
        disallowed_block = f"disallowedTools:\n{items}\n"

    new_fm = f"""---
name: {agent_name}
description: |
  {desc_formatted}
model: {model}
tools:
{tools_yaml}
color: {color}
{hooks_block}{disallowed_block}---"""

    new_content = new_fm + body
    md_file.write_text(new_content)
    return True


# Process all specialist agents
fixed = 0
ok = 0

for domain_dir in sorted(BASE.iterdir()):
    if not domain_dir.is_dir():
        continue
    domain = domain_dir.name
    if domain not in DOMAIN_TOOLS:
        continue

    for md_file in sorted(domain_dir.glob("*.md")):
        content = md_file.read_text()

        # Check if description is corrupted
        if has_corrupted_description(content):
            if fix_agent_file(md_file, domain):
                fixed += 1
                print(f"FIXED: {domain}/{md_file.name}")
        else:
            # Still fix if description is not in lookup but tools are wrong
            parts = content.split("---", 2)
            if len(parts) >= 3:
                try:
                    fm = yaml.safe_load(parts[1]) or {}
                    tools = fm.get("tools", [])
                    if isinstance(tools, str):
                        tools = [t.strip() for t in tools.split(",")]
                    correct = DOMAIN_TOOLS[domain]
                    if sorted(tools) != sorted(correct):
                        fix_agent_file(md_file, domain)
                        fixed += 1
                        print(f"FIXED tools: {domain}/{md_file.name}")
                    else:
                        ok += 1
                except Exception:
                    ok += 1

print(f"\nFixed: {fixed} | Already OK: {ok}")

# Final verification
print("\n=== VERIFICATION SAMPLE ===")
samples = [
    BASE / "backend/backend-developer.md",
    BASE / "qa/bounty-hunter.md",
    BASE / "security/engineering-security-engineer.md",
    BASE / "devops/cloud-architect.md",
]
for p in samples:
    if p.exists():
        content = p.read_text()
        parts = content.split("---", 2)
        if len(parts) >= 3:
            fm = yaml.safe_load(parts[1]) or {}
            print(f"\n{p.parent.name}/{p.name}:")
            print(f"  description: {str(fm.get('description',''))[:80]}...")
            print(f"  tools: {fm.get('tools', [])}")
            print(f"  color: {fm.get('color', 'MISSING')}")
