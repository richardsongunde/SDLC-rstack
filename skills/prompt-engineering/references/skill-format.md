<!-- owner: RStack developed by Richardson Gunde -->

# Skill Format Specification

## Frontmatter

```yaml
---
name: skill-name
description: |
  What this skill provides. When to trigger it. Specific use cases.
  All "when to use" info goes HERE — not in the body.
  (Body only loads after trigger — "When to Use" sections in body are useless.)
  Include example trigger phrases the user would actually type.
---
```

Only `name` and `description` are required. No other frontmatter fields needed.

## Body Rules

- **Under 500 lines** — enforce with `wc -l SKILL.md`
- **Imperative/infinitive form** — "Run X", "Check Y", "If Z, do W"
- **No "You should..."** — just "Do X"
- **Detailed material → `references/` subfolder**, loaded only when needed

## Progressive Disclosure — The Core Pattern

SKILL.md = navigation + essential workflow only
references/ = everything detailed

```
skills/my-skill/
├── SKILL.md              ← under 500 lines, links to references
└── references/
    ├── patterns.md       ← loaded when user needs specific patterns
    ├── examples.md       ← loaded when user wants examples
    └── api-reference.md  ← loaded when user needs full API
```

Reference link pattern in SKILL.md:
```markdown
## References
- See references/patterns.md when implementing [X type of pattern]
- See references/examples.md for [concrete examples and templates]
- See references/api-reference.md for [full API method list]
```

## When to Split Into References

Split when:
- SKILL.md body approaches 400 lines → move the largest section to references/
- Skill supports multiple variants (frameworks, providers) → one file per variant
- Content is reference material, not workflow → move to references/

Keep in SKILL.md:
- Core workflow steps
- Decision logic ("if X use Y")
- Links to references with clear "when to read" guidance

## Reference File Best Practices

- Add a table of contents at top if the file exceeds 100 lines
- Name files by content type: `patterns.md`, `examples.md`, `api.md`, `config.md`
- Never nest references more than one level deep from SKILL.md

## Completion Protocol

Every skill body ends with:
```markdown
## Completion Protocol
STATUS: DONE | BLOCKED | NEEDS_CONTEXT
REASON: [if not DONE]
```

## Good Example

```markdown
---
name: api-design-principles
description: |
  REST and GraphQL API design patterns, versioning strategies, and contract-first
  development workflow. Use when designing new APIs, reviewing API contracts,
  or choosing between REST and GraphQL. Trigger: "design an API", "API versioning",
  "REST vs GraphQL", "API contract", "OpenAPI spec".
---

## Workflow

1. **Understand the consumers** — who calls this API and how?
2. **Choose paradigm** — REST for resource-oriented CRUD, GraphQL for flexible queries.
   See references/rest-vs-graphql.md for the full decision matrix.
3. **Design the contract** — write the OpenAPI spec or GraphQL schema first.
   See references/openapi-patterns.md for schema templates.
4. **Validate** — run the spec through a linter before implementation.

## References
- See references/rest-vs-graphql.md for the REST vs GraphQL decision matrix
- See references/openapi-patterns.md for OpenAPI 3.1 schema templates and examples

## Completion Protocol
STATUS: DONE | BLOCKED | NEEDS_CONTEXT
```
