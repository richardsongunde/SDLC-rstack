# RStack Product Overview

RStack is an agentic software delivery system for Pi and other coding agents. It is designed to make an AI assistant operate more like a productive software team than a single chat bot.

## Product promise

Give a coding agent a complete SDLC operating system:

- Product manager behavior for clarifying goals
- Architect behavior for selecting a design
- Builder behavior for scoped implementation
- Validator behavior for read-only review
- QA behavior for test coverage and runtime checks
- Security behavior for common risk review
- Docs/release behavior for handoff
- Memory behavior for learning from failures

## Why this matters

One-shot coding agents often fail because they skip process. They may code before requirements are clear, over-edit unrelated files, pass work without testing, or forget previous mistakes. RStack fixes that by making the agent follow an explicit lifecycle with contracts and validation.

## Core concept

```text
User as product owner
  ↓
RStack orchestrator
  ↓
Builder team produces scoped work
  ↓
Validator team checks the work
  ↓
Run state and learnings are saved
```

## Design principles

1. **Small tool surface.** Expose lifecycle tools, not hundreds of specialist tools.
2. **Clean state.** Store every run under `.rstack/runs/`.
3. **Contracts over vibes.** Builders and validators write JSON contracts.
4. **Specialist reuse.** Existing specialist prompts are indexed and reused when present.
5. **Human approval.** The user stays product owner and release approver.
6. **Package boundary.** Public packages ship curated runtime artifacts, not private workspace files.

## Initial target

Pi is the first supported host because it has native extensions and lifecycle events. RStack intentionally starts as a Pi extension rather than an MCP server to reduce startup context overhead.

## End state

RStack should become a full productive team of agents that can take an application from idea to shipped software:

```text
idea → requirements → architecture → code → tests → security → docs → release → memory
```
