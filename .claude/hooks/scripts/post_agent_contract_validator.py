#!/usr/bin/env python3
"""
Hook: post_agent_contract_validator
Fires: SessionEnd — when a validator agent session closes
Purpose: Validate that the agent produced a proper JSON contract file
         at outputs/team_state/[task]_validation.json with required fields:
         checks[], status (PASS/FAIL), issues[].
Input:  JSON from stdin with session metadata
Output: Exit 0 (contract valid) | Exit 1 (contract missing or malformed)
"""

"""
Post-agent hook: Validates output JSON contracts against expected structure.
Exit 0 = validation passed, Exit 2 = validation failed (feedback to agent).
"""

import json
import sys
import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent

AGENT_OUTPUTS = {
    "environment_agent": "outputs/environment_report.json",
    "transcript_agent": "outputs/transcripts/structured_meeting_output.json",
    "requirement_agent": "outputs/requirements/requirement_spec.json",
    "documentation_agent": "outputs/documents/documentation_output.json",
    "planning_agent": "outputs/planning/sprint_plan.json",
    "jira_agent": "outputs/jira/jira_tickets.json",
    "architecture_agent": "outputs/architecture/system_design.json",
    "code_agent": "outputs/code/code_output.json",
    "testing_agent": "outputs/qa/qa_results.json",
    "deployment_agent": "outputs/deployment/deployment_output.json",
    "summary_agent": "outputs/pipeline_final.json",
}

REQUIRED_FIELDS = ["contract_version", "produced_by", "timestamp"]


def find_latest_output():
    """Find the most recently modified output JSON file."""
    latest = None
    latest_time = 0
    for agent_id, path in AGENT_OUTPUTS.items():
        full_path = PROJECT_ROOT / path
        if full_path.exists():
            mtime = full_path.stat().st_mtime
            if mtime > latest_time:
                latest_time = mtime
                latest = (agent_id, full_path)
    return latest


CONTENT_FIELDS = {
    "transcript_agent": ["discussed_features", "client_pain_points"],
    "requirement_agent": ["functional_requirements"],
    "jira_agent": ["epics"],
    "architecture_agent": ["services"],
    "code_agent": ["files_created"],
    "testing_agent": ["artifacts_created"],
}


def validate_contract(agent_id, filepath):
    """Validate a contract JSON file."""
    errors = []

    try:
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        return [f"Invalid JSON: {e}"]
    except FileNotFoundError:
        return [f"File not found: {filepath}"]

    for field in REQUIRED_FIELDS:
        if field not in data:
            errors.append(f"Missing required field: {field}")

    if data.get("produced_by") != agent_id:
        errors.append(
            f"produced_by mismatch: expected '{agent_id}', got '{data.get('produced_by')}'"
        )

    if data.get("contract_version") != "1.0":
        errors.append(
            f"contract_version should be '1.0', got '{data.get('contract_version')}'"
        )

    # Check that key content arrays are not empty (warns of silent failure)
    if agent_id in CONTENT_FIELDS:
        for field in CONTENT_FIELDS[agent_id]:
            value = data.get(field)
            if isinstance(value, list) and len(value) == 0:
                errors.append(
                    f"WARNING: '{field}' is an empty array — agent may have produced no content"
                )
            elif isinstance(value, dict) and len(value) == 0:
                errors.append(
                    f"WARNING: '{field}' is an empty object — agent may have produced no content"
                )

    return errors


def main():
    result = find_latest_output()
    if not result:
        print("No output files found yet. Pipeline may not have started.")
        sys.exit(0)

    agent_id, filepath = result
    errors = validate_contract(agent_id, filepath)

    if errors:
        print(f"VALIDATION FAILED for {agent_id}:")
        for error in errors:
            print(f"  - {error}")
        sys.exit(2)
    else:
        print(f"VALIDATION PASSED: {agent_id} output is valid.")
        sys.exit(0)


if __name__ == "__main__":
    main()
