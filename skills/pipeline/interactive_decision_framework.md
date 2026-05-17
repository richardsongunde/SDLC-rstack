<!-- owner: RStack developed by Richardson Gunde -->

# Interactive Decision Framework — SDLC Pipeline

## Purpose
This framework defines how pipeline agents present choices to users instead of
silently falling back to default approaches. It ensures the user always knows
what options are available and can make informed decisions.

## Core Principle
**Ask, Don't Assume.** When multiple implementation paths exist, present all
feasible options with clear trade-offs and let the user decide.

## Decision Point Template

Every interactive decision follows this structure:

```
[EMOJI] [CATEGORY] — [QUESTION]

[Brief context: what we're deciding and why it matters]

Available options:
  1. ★ [Recommended option] — [brief description]
     ✅ [Pro]
     ⚠️ [Prerequisite or limitation]
     [STATUS: available ✓ / not available / requires credentials]

  2. [Alternative option] — [brief description]
     ✅ [Pro]
     ⚠️ [Prerequisite]
     [STATUS: ...]

  N. [Fallback option — always works]
     ✅ No prerequisites
     📁 [What files will be generated]

Which option would you prefer? (1/2/.../N)
```

## Decision Categories

### Category 1: Tool Installation
When a tool is not installed but could be.
- Always offer to install it
- Always offer to skip (with fallback)
- Show install command and estimated time
- Never install without asking

### Category 2: Credential-Based Integration
When a tool requires authentication/credentials.
- List exactly what credentials are needed
- Offer to test connectivity after credentials are provided
- Always offer file-based alternative
- Never store credentials in output files

### Category 3: Platform Selection
When multiple platforms could serve the same purpose (e.g., Jira vs GitHub Issues).
- List all compatible platforms
- Show which are already available/configured
- Recommend based on the project's domain and scale
- Offer "generate for all platforms" where feasible

### Category 4: Technical Architecture
When multiple valid technical approaches exist (e.g., PostgreSQL vs MongoDB).
- Explain trade-offs in context of THIS project's requirements
- Recommend based on domain (e.g., PostgreSQL for compliance)
- Let user override with their preference
- Note downstream impacts of the choice

## Decision Propagation Rules

1. **Record every decision** in the output contract's `user_preferences` field
2. **Check previous decisions** before asking — read all prior contracts
3. **Never re-ask** a decision that was already made in an earlier agent
4. **Respect overrides** — if user said "PostgreSQL" in Agent 00, Agent 07 uses PostgreSQL
5. **Log the decision** with timestamp and options that were presented

## Combining Decisions (Multi-Choice Questions)

When an agent has multiple independent decisions:
- Present them all at once in a single message
- Let user respond with comma-separated choices: "1, 3, 2, 1"
- Confirm the combined choice before proceeding

## Timeout / No Response Handling

If the user doesn't respond or says "just decide" / "go with defaults":
- Use the ★ recommended option for everything
- Log that defaults were used
- Continue the pipeline without further questions

## Error Recovery

If a chosen option fails (e.g., Jira credentials invalid):
1. Explain the specific error
2. Offer to retry with corrected input
3. Offer to fall back to the next best option
4. NEVER stop the pipeline — always have a fallback path

## Pipeline Modes

### Full Interactive Mode (default)
All decision points pause and ask the user. Best for first-time runs.

### Express Mode
User can say "run in express mode" at the start. This means:
- Use all recommended (★) options without asking
- Only pause if a recommended option is UNAVAILABLE
- Log all auto-decisions for review

### Replay Mode
User can provide a `user_preferences.json` file at the start:
- All decisions are pre-loaded from this file
- Pipeline runs without any pauses
- Useful for re-running the pipeline on a new transcript with same tool choices
