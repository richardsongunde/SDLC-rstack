#!/usr/bin/env python3
"""Copy SDLC agents from agents/team/sdlc/ to agents/sdlc/ with kebab-case names."""
import shutil
from pathlib import Path

BASE = Path("/Users/richardsongunde/projects/.claude")
SRC = BASE / "agents/team/sdlc"
DST = BASE / "agents/sdlc"
DST.mkdir(parents=True, exist_ok=True)

RENAME_MAP = {
    "00_environment_agent.md": "00-environment.md",
    "01_transcript_agent.md": "01-transcript.md",
    "02_requirement_agent.md": "02-requirements.md",
    "03_documentation_agent.md": "03-documentation.md",
    "04_planning_agent.md": "04-planning.md",
    "05_jira_agent.md": "05-jira.md",
    "06_architecture_agent.md": "06-architecture.md",
    "07_code_agent.md": "07-code.md",
    "08_testing_agent.md": "08-testing.md",
    "09_deployment_agent.md": "09-deployment.md",
    "10_summary_agent.md": "10-summary.md",
    "11_feedback_loop_agent.md": "11-feedback-loop.md",
    "12_security_threat_model_agent.md": "12-security-threat-model.md",
    "13_compliance_checker_agent.md": "13-compliance-checker.md",
    "14_cost_estimation_agent.md": "14-cost-estimation.md",
}

for old_name, new_name in RENAME_MAP.items():
    src_path = SRC / old_name
    dst_path = DST / new_name
    if src_path.exists():
        # Read content and add Completion Protocol if missing
        content = src_path.read_text()
        if "## Completion Protocol" not in content:
            content += "\n\n## Completion Protocol\nSTATUS: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT\nREASON: [1–2 sentences if not DONE]\nATTEMPTED: [what was tried, if BLOCKED]\n"
        dst_path.write_text(content)
        print(f"OK: {old_name} → {new_name}")
    else:
        print(f"MISSING: {src_path}")

print(f"\nTotal in agents/sdlc/: {len(list(DST.glob('*.md')))}")
