<!-- owner: RStack developed by Richardson Gunde -->

# Contract Protocol Skill

## Purpose
This skill defines the JSON contract protocol for inter-agent communication.

## Mandatory Fields
All contracts must include: `contract_version`, `produced_by`, `timestamp`,
`next_agent`, `next_input_file`.

## Agent Identifiers
- `environment_agent` → Agent 00 (Setup)
- `transcript_agent` → Agent 01
- `requirement_agent` → Agent 02
- `documentation_agent` → Agent 03
- `planning_agent` → Agent 04
- `jira_agent` → Agent 05
- `architecture_agent` → Agent 06
- `code_agent` → Agent 07
- `testing_agent` → Agent 08
- `deployment_agent` → Agent 09
- `summary_agent` → Agent 10

## ID Formats
- Features: F-NNN (e.g., F-001)
- Functional Requirements: FR-NNN
- Non-Functional Requirements: NFR-NNN
- Risks: R-NNN
- Epics: EPIC-NNN
- User Stories: US-NNN
- Tasks: T-NNN
- Test Cases: TC-NNN

## Rules
1. Never modify previous agent outputs
2. Include all required fields
3. Use consistent ID formats throughout the pipeline
4. Propagate the `domain` field from Agent 01 through all contracts
5. Always include next_agent and next_input_file (except final agent)
