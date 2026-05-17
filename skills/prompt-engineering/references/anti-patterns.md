<!-- owner: RStack developed by Richardson Gunde -->

# Anti-Patterns — What NOT To Do

A catalogue of the most common prompt quality failures, with fixes.

---

## 1. The Knowledge Dump (most common failure)

**BAD:**
```markdown
## Capabilities
- REST APIs: resource modeling, HTTP methods, status codes, versioning strategies
- GraphQL APIs: schema design, resolvers, mutations, subscriptions, DataLoader patterns
- Microservices: service boundaries, DDD, bounded contexts, service decomposition
- Service communication: synchronous REST/gRPC, asynchronous message queues
[200 more bullet points across 10 categories]
```

**Why it fails:** Claude already knows all of this. Repeating it wastes context tokens
and gives no actionable direction. The agent behaves identically with or without it.

**Fix:** Replace with a 3-step Workflow and a concrete Output Format.

---

## 2. Comma-Separated Tools in Frontmatter

**BAD:**
```yaml
tools: Read, Write, Edit, Bash, Glob, Grep
```

This is not valid YAML for Claude Code's agent format.

**GOOD:**
```yaml
tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
```

---

## 3. Quoted Description Instead of Block Scalar

**BAD:**
```yaml
description: "Use this agent when building server-side APIs and microservices..."
```

Quoted strings lose line breaks and can't span multiple lines cleanly.

**GOOD:**
```yaml
description: |
  Builds production-ready server-side APIs and backend services.
  Trigger: "build an API", "implement a service", "add an endpoint". (backend)
```

---

## 4. Shell Variable State Between Bash Blocks

**BAD:**
```markdown
1. Detect framework:
   ```bash
   FRAMEWORK=$(ls package.json 2>/dev/null && echo "node" || echo "unknown")
   ```
2. Install deps:
   ```bash
   # FRAMEWORK is undefined here — new shell context, variable is gone
   if [ "$FRAMEWORK" = "node" ]; then npm install; fi
   ```
```

**GOOD:**
```markdown
1. Detect framework:
   ```bash
   ls package.json pyproject.toml go.mod 2>/dev/null
   ```
2. Using the output from Step 1, install the right dependencies:
   - If `package.json` found → `npm install`
   - If `pyproject.toml` found → `uv sync`
   - If `go.mod` found → `go mod download`
```

---

## 5. Missing Completion Protocol

Every agent and skill must end with this — without it, the orchestrator has no
machine-readable signal that the agent finished:

```markdown
## Completion Protocol
STATUS: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
REASON: [1–2 sentences if not DONE]
ATTEMPTED: [what was tried, if BLOCKED]
```

---

## 6. Wrong Model for the Task

| Mistake | Fix |
|---------|-----|
| `opus` for a simple file reader | Use `sonnet` — opus is for orchestration |
| `haiku` for architecture design | Use `opus` — haiku lacks reasoning depth |
| `inherit` when model matters | Be explicit — inherit is unpredictable |

Default: `sonnet` for 90% of specialist agents.

---

## 7. Missing `color:` in Frontmatter

Agents without `color:` are invisible in team view. Always set one.

Domain conventions:
- `backend` → `blue`
- `frontend` → `cyan`
- `security` → `red`
- `qa` → `yellow`
- `devops` → `green`
- `data` → `magenta`
- `product` → `white`
- `docs` → `cyan`
- `crypto` → `yellow`

---

## 8. "You Are A Senior [Role]" Opening

**BAD:**
```markdown
You are a senior backend developer specializing in server-side applications
with deep expertise in Node.js 18+, Python 3.11+, and Go 1.21+...
```

**Why it fails:** Adds no information. Claude already knows what a senior backend
developer knows. Use that token budget for workflow steps instead.

**Fix:** Start directly with `## Voice` and `## Workflow`.

---

## 9. No `## When To Use` Section

Without trigger conditions, Claude has no guidance on when to proactively suggest
or auto-invoke the agent. Always include 3–6 concrete trigger phrases.

---

## 10. Deeply Nested Bash Logic

**BAD:**
```bash
if [ -f "package.json" ]; then
  if grep -q "next" package.json; then
    echo "Next.js"
  elif grep -q "react" package.json; then
    echo "React"
  else
    echo "Node"
  fi
elif [ -f "pyproject.toml" ]; then
  echo "Python"
fi
```

**GOOD** (English conditionals):
```
1. Check what's present:
   ```bash
   ls package.json pyproject.toml go.mod 2>/dev/null
   ```
2. If `package.json` exists → check for Next.js (`grep "next" package.json`),
   React (`grep "react"`), or plain Node.
   If `pyproject.toml` → Python project.
   If `go.mod` → Go project.
```

Conditionals in English are easier to read and don't break across shell contexts.
