#!/usr/bin/env python3
"""
Hook: pre_handoff_checker
Fires: Pre-handoff — before an agent hands off to another agent
Purpose: Validate that the handoff contract JSON exists and has required
         fields before the next agent in the pipeline starts.
Input:  JSON from stdin with handoff metadata and contract path
Output: Exit 0 (handoff valid) | Exit 1 (contract invalid — pipeline stops)
"""

"""
Pre-handoff hook: Verifies pipeline chain integrity before triggering next agent.
Exit 0 = chain intact, Exit 2 = chain broken (feedback to agent).
"""

import json
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent

CHAIN = [
    ("environment_agent", "outputs/environment_report.json", "transcript_agent"),
    ("transcript_agent", "outputs/transcripts/structured_meeting_output.json", "requirement_agent"),
    ("requirement_agent", "outputs/requirements/requirement_spec.json", "documentation_agent"),
    ("documentation_agent", "outputs/documents/documentation_output.json", "planning_agent"),
    ("planning_agent", "outputs/planning/sprint_plan.json", "jira_agent"),
    ("jira_agent", "outputs/jira/jira_tickets.json", "architecture_agent"),
    ("architecture_agent", "outputs/architecture/system_design.json", "code_agent"),
    ("code_agent", "outputs/code/code_output.json", "testing_agent"),
    ("testing_agent", "outputs/qa/qa_results.json", "deployment_agent"),
    ("deployment_agent", "outputs/deployment/deployment_output.json", "summary_agent"),
    ("summary_agent", "outputs/pipeline_final.json", None),
]


def check_chain():
    """Check the pipeline chain integrity."""
    errors = []

    for agent_id, output_path, expected_next in CHAIN:
        full_path = PROJECT_ROOT / output_path
        if not full_path.exists():
            break  # Pipeline hasn't reached this agent yet

        try:
            with open(full_path, "r", encoding="utf-8") as f:
                data = json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            errors.append(f"Cannot read {output_path}")
            break

        if data.get("produced_by") != agent_id:
            errors.append(
                f"{output_path}: produced_by is '{data.get('produced_by')}', expected '{agent_id}'"
            )

        if expected_next is None:
            if not data.get("pipeline_complete"):
                errors.append(f"Final agent missing pipeline_complete: true")
        else:
            if data.get("next_agent") != expected_next:
                errors.append(
                    f"{agent_id}: next_agent is '{data.get('next_agent')}', expected '{expected_next}'"
                )

    return errors


def check_id_consistency():
    """Check cross-contract ID references are consistent."""
    warnings = []

    # Check Feature IDs from transcript are referenced in requirements
    transcript_path = PROJECT_ROOT / "outputs/transcripts/structured_meeting_output.json"
    requirement_path = PROJECT_ROOT / "outputs/requirements/requirement_spec.json"

    if transcript_path.exists() and requirement_path.exists():
        try:
            with open(transcript_path, "r", encoding="utf-8") as f:
                transcript = json.load(f)
            with open(requirement_path, "r", encoding="utf-8") as f:
                requirements = json.load(f)

            # Extract feature IDs from transcript
            feature_ids = {
                f.get("feature_id")
                for f in transcript.get("discussed_features", [])
                if f.get("feature_id")
            }

            # Extract source_feature references from requirements
            referenced_features = set()
            for fr in requirements.get("functional_requirements", []):
                sf = fr.get("source_feature")
                if sf:
                    referenced_features.add(sf)

            # Check for unlinked features
            unlinked = feature_ids - referenced_features
            if unlinked:
                warnings.append(
                    f"Features not traced to any FR: {', '.join(sorted(unlinked))}"
                )

        except (json.JSONDecodeError, KeyError):
            pass  # Skip consistency check if files are malformed

    # Check domain propagation
    domain_files = [
        ("transcript", transcript_path),
        ("requirements", requirement_path),
    ]
    domains_seen = {}
    for label, path in domain_files:
        if path.exists():
            try:
                with open(path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                d = data.get("domain") or data.get("project", {}).get("domain")
                if d:
                    domains_seen[label] = d
            except (json.JSONDecodeError, KeyError):
                pass

    unique_domains = set(domains_seen.values())
    if len(unique_domains) > 1:
        warnings.append(
            f"Domain mismatch across contracts: {domains_seen}"
        )

    return warnings


def main():
    errors = check_chain()
    warnings = check_id_consistency()

    if warnings:
        print("CONSISTENCY WARNINGS:")
        for warning in warnings:
            print(f"  [!] {warning}")

    if errors:
        print("CHAIN INTEGRITY CHECK FAILED:")
        for error in errors:
            print(f"  - {error}")
        sys.exit(2)
    else:
        if warnings:
            print("Chain integrity: OK (with warnings above)")
        else:
            print("Chain integrity check passed.")
        sys.exit(0)


if __name__ == "__main__":
    main()
