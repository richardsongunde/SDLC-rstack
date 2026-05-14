#!/usr/bin/env python3
"""
Fix two problems:
1. SDLC agents (15 files) — add proper YAML frontmatter
2. Specialist agents (153 files) — replace generic placeholder workflow with domain-specific one
"""
import re
from pathlib import Path

BASE = Path("/Users/richardsongunde/projects/.claude/agents")

# ─────────────────────────────────────────────────────────────────────────────
# AGENT-SPECIFIC WORKFLOWS
# Each value is a tuple: (when_to_use_lines, workflow_steps, output_format)
# ─────────────────────────────────────────────────────────────────────────────

AGENT_DATA = {

    # ── BACKEND ──────────────────────────────────────────────────────────────

    "backend-developer": (
        ['- "Build an API endpoint for [resource]"',
         '- "Implement a service that [does X]"',
         '- "Add authentication / validation to [endpoint]"',
         '- "Create a backend for [feature]"',
         '- Whenever server-side logic, database access, or API contracts are needed'],
        '''1. **Read existing patterns** — understand how this project structures routes/handlers:
   ```bash
   find . -name "*.ts" -o -name "*.py" -o -name "*.go" | \\
     grep -E "(route|handler|controller|service|api)" | head -10
   ```
2. **Identify the framework** — using file patterns from Step 1:
   - `package.json` → check for express/fastify/nestjs
   - `pyproject.toml` → check for fastapi/django/flask
   - `go.mod` → Go (chi/gin/echo)
3. **Implement** — write handler, validation, business logic, error handling.
   Follow the conventions found in Step 1 exactly.
4. **Test** — run the project test suite against the new code:
   ```bash
   # Use the test runner found in package.json scripts or pyproject.toml
   npm test 2>/dev/null || pytest -x 2>/dev/null || go test ./... 2>/dev/null
   ```''',
        "Working implementation: route/handler file, type definitions, passing tests."
    ),

    "api-designer": (
        ['- "Design a REST API for [resource]"',
         '- "Create an OpenAPI spec for [service]"',
         '- "Review this API contract for [issues]"',
         '- "Design API versioning strategy for [service]"',
         '- Whenever API contracts, endpoint design, or breaking-change reviews are needed'],
        '''1. **Identify consumers and use cases** — who calls this API and how:
   ```bash
   grep -rn "fetch\\|axios\\|requests\\|http" --include="*.ts" --include="*.py" . | \\
     grep -v "node_modules\\|.git" | head -20
   ```
2. **Choose paradigm** — REST for resource-oriented CRUD; GraphQL for flexible graph queries.
   Use the consumer needs from Step 1 to guide the decision.
3. **Design the contract** — write the OpenAPI 3.1 spec or GraphQL schema first.
   Define: paths, request/response shapes, status codes, auth scheme, pagination.
4. **Validate** — check the spec for consistency:
   ```bash
   # Lint with spectral if available
   npx @stoplight/spectral-cli lint openapi.yaml 2>/dev/null || \\
     python3 -c "import yaml,json; yaml.safe_load(open('openapi.yaml'))" 2>/dev/null
   ```''',
        "OpenAPI 3.1 YAML or GraphQL schema + summary of key design decisions and rationale."
    ),

    "api-architect": (
        ['- "Design the service architecture for [system]"',
         '- "Review API boundaries between [service A] and [service B]"',
         '- "Plan inter-service communication for [feature]"',
         '- Whenever service boundaries, API gateway design, or contract ownership is in question'],
        '''1. **Map existing service boundaries** — read current service definitions:
   ```bash
   find . -name "openapi.yaml" -o -name "*.proto" -o -name "schema.graphql" | head -20
   ```
2. **Identify coupling hotspots** — using the service map from Step 1, find shared models
   or direct DB access across service boundaries.
3. **Design the contract** — define: REST/gRPC/event per boundary, versioning, auth delegation,
   and error propagation strategy. Draw the service interaction diagram.
4. **Document the ADR** — write an Architecture Decision Record covering:
   - Context, decision, trade-offs, rejected alternatives.''',
        "Service boundary diagram (Mermaid) + ADR markdown + API contract sketches per boundary."
    ),

    "api-builder": (
        ['- "Build the full REST API for [resource]"',
         '- "Implement CRUD endpoints with auth and validation"',
         '- "Generate API from the OpenAPI spec"',
         '- Whenever a complete, working API needs to be built end-to-end'],
        '''1. **Read the spec or requirements** — find any existing OpenAPI / requirements:
   ```bash
   find . -name "openapi.yaml" -o -name "openapi.json" -o -name "api-spec*" 2>/dev/null
   ```
2. **Scaffold the router/controller layer** — following the framework conventions found in
   the project (Express routers, FastAPI routers, etc.).
3. **Implement each endpoint** — handler → validation → business logic → response shaping.
   Add error handling for 400/401/403/404/500 cases on every endpoint.
4. **Wire auth middleware** — verify every non-public endpoint is protected.
5. **Test all endpoints** — verify happy path + error cases:
   ```bash
   npm test 2>/dev/null || pytest tests/api/ -v 2>/dev/null
   ```''',
        "All endpoints implemented, tested, and documented. Summary table: method, path, auth, status."
    ),

    "graphql-architect": (
        ['- "Design a GraphQL schema for [domain]"',
         '- "Set up Apollo/GraphQL federation for [services]"',
         '- "Review this GraphQL schema for [issues]"',
         '- Whenever GraphQL schema design, resolver patterns, or N+1 prevention is needed'],
        '''1. **Understand the domain model** — read existing types, DB schema, or REST resources:
   ```bash
   find . -name "*.prisma" -o -name "models.py" -o -name "*schema*" | head -10
   ```
2. **Design the schema** — model types, queries, mutations, subscriptions.
   Use the domain model from Step 1. Apply relay-style connections for lists.
3. **Plan resolver strategy** — identify N+1 risks and apply DataLoader batching.
   Map each field to its data source.
4. **Generate and validate** — write the schema SDL and validate it:
   ```bash
   npx graphql-inspector validate schema.graphql 2>/dev/null || \\
     python3 -c "from graphql import build_schema; build_schema(open('schema.graphql').read())"
   ```''',
        "GraphQL SDL schema + resolver map + DataLoader batching plan + N+1 risk list."
    ),

    "database-architect": (
        ['- "Design the database schema for [feature/system]"',
         '- "Choose between [SQL vs NoSQL] for [use case]"',
         '- "Model relationships for [domain entities]"',
         '- "Review this schema for normalization issues"',
         '- Whenever data modelling, schema design, or database technology selection is needed'],
        '''1. **Understand the access patterns** — how will this data be read and written:
   - List the top 5 queries by frequency
   - Identify write-heavy vs read-heavy operations
   - Note consistency requirements (ACID vs eventual)
2. **Choose the storage engine** — based on access patterns from Step 1:
   - Relational (Postgres/MySQL) → complex queries, joins, transactions
   - Document (MongoDB) → flexible schema, hierarchical data
   - Key-value (Redis) → caching, sessions, leaderboards
   - Time-series (TimescaleDB) → metrics, events, logs
3. **Design the schema** — draw entity relationships, define columns/fields,
   constraints, indexes, and foreign keys.
4. **Validate normalization** — check for: redundant data, update anomalies, missing indexes.
   Write the CREATE TABLE or schema file.''',
        "Entity-Relationship diagram (Mermaid) + CREATE TABLE SQL or schema file + index rationale."
    ),

    "database-designer": (
        ['- "Create the database schema for [tables/collections]"',
         '- "Add a [column/field] to [table/collection]"',
         '- "Write a migration for [schema change]"',
         '- Whenever specific table/collection design or migration writing is needed'],
        '''1. **Read the existing schema** — understand current tables and relationships:
   ```bash
   find . -name "*.sql" -o -name "migrations" -type d | head -10
   # Or check ORM models:
   find . -name "models.py" -o -name "*.prisma" -o -name "schema.rb" | head -5
   ```
2. **Design the change** — using the existing schema from Step 1, define:
   - New columns/tables with types and constraints
   - Foreign key relationships
   - Indexes for expected query patterns
3. **Write the migration** — create an up migration and a rollback down migration.
4. **Validate** — check for: missing NOT NULL defaults, missing indexes on FK columns,
   naming convention consistency.''',
        "Migration file (up + down) + updated schema diagram + index list with justification."
    ),

    "database-administrator": (
        ['- "The database is slow — diagnose and fix"',
         '- "Set up replication / HA for [database]"',
         '- "Optimize [slow query]"',
         '- "Configure connection pooling for [service]"',
         '- Whenever database performance, replication, backup, or operational tuning is needed'],
        '''1. **Identify the problem** — collect current performance metrics:
   ```bash
   # PostgreSQL: slow queries
   psql -c "SELECT query, mean_exec_time, calls FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;" 2>/dev/null
   # MySQL: process list
   mysql -e "SHOW PROCESSLIST;" 2>/dev/null
   ```
2. **Analyze execution plans** — using the slow queries from Step 1:
   ```bash
   psql -c "EXPLAIN ANALYZE <slow query here>;" 2>/dev/null
   ```
3. **Apply fixes** — based on the plan from Step 2:
   - Missing index → `CREATE INDEX CONCURRENTLY`
   - Full table scan → rewrite with selective WHERE clause
   - N+1 → batch with IN() or JOIN
4. **Verify improvement** — re-run the query and compare execution time.''',
        "Before/after execution plan + index changes applied + measured latency improvement."
    ),

    "microservices-architect": (
        ['- "Break up this monolith into services"',
         '- "Design service boundaries for [domain]"',
         '- "Plan the event-driven architecture for [feature]"',
         '- Whenever service decomposition, DDD bounded contexts, or inter-service communication is needed'],
        '''1. **Map the current system** — read the codebase structure and identify domains:
   ```bash
   find . -type d -not -path "*/node_modules/*" -not -path "*/.git/*" | head -30
   ```
2. **Identify bounded contexts** — using the structure from Step 1, group by:
   - Business capability (orders, inventory, payments, users)
   - Data ownership (which domain owns which tables)
   - Change frequency (stable core vs fast-changing features)
3. **Design inter-service communication** — for each service boundary:
   - Synchronous (REST/gRPC) for real-time queries
   - Asynchronous (events/queues) for state changes
   - Define the event schema and ownership
4. **Plan the migration path** — strangler fig or parallel-run, not big-bang.''',
        "Service boundary diagram + communication matrix (sync/async per boundary) + migration plan."
    ),

    "backend-architect": (
        ['- "Design the backend architecture for [system]"',
         '- "Review this backend design for scalability issues"',
         '- "Plan the tech stack for [project]"',
         '- Whenever backend system design, scalability planning, or technology selection is needed'],
        '''1. **Understand the requirements** — clarify:
   - Scale: requests/sec, data volume, concurrent users
   - Consistency needs: ACID vs eventual
   - Latency SLOs: p50/p99 targets
2. **Design the layers** — define: API layer, service layer, data layer, async workers.
   For each layer: technology choice + rationale + failure mode.
3. **Plan resilience** — specify circuit breakers, retry policies, timeouts,
   and graceful degradation for each external dependency.
4. **Document the architecture** — write the Architecture Decision Record (ADR)
   covering: context, decision, trade-offs, alternatives rejected.''',
        "System architecture diagram (Mermaid) + ADR + tech stack table with rationale + SLO targets."
    ),

    "code-architect": (
        ['- "Design the code architecture for [feature]"',
         '- "Review this code structure for design issues"',
         '- "Suggest a refactoring plan for [module]"',
         '- Whenever internal code design, design patterns, or structural refactoring is needed'],
        '''1. **Read the existing code structure** — understand current patterns:
   ```bash
   find . -type f -name "*.ts" -o -name "*.py" | grep -v node_modules | head -30
   ```
2. **Identify design issues** — using the structure from Step 1, look for:
   - God classes / functions > 200 lines
   - Circular dependencies
   - Missing abstractions or over-abstraction
   - Violated SOLID principles
3. **Design the solution** — propose: new module boundaries, interfaces/protocols,
   design patterns (Strategy, Factory, Repository, etc.) that resolve the issues.
4. **Write the refactoring plan** — incremental steps, each safe to ship independently.''',
        "Dependency graph before/after + refactoring plan with sequenced safe steps."
    ),

    "staff-engineer": (
        ['- "Review this technical decision at a staff level"',
         '- "Design the system architecture for [major feature]"',
         '- "Unblock this cross-team technical problem"',
         '- Whenever staff-level technical leadership, cross-team design, or strategic technical decisions are needed'],
        '''1. **Understand the full context** — read all relevant docs, ADRs, and current state:
   ```bash
   find . -name "ADR*.md" -o -name "ARCHITECTURE*" -o -name "DESIGN*" | head -10
   ```
2. **Identify the core trade-off** — name the fundamental tension:
   (consistency vs availability / simplicity vs capability / now vs later)
   Use the context from Step 1 to ground this in the actual system.
3. **Evaluate options** — 2-3 concrete approaches with: implementation cost,
   operational complexity, risk, and reversibility scores.
4. **Recommend + document** — write the decision with: context, options, recommendation,
   and "what would change this decision" criteria.''',
        "Technical design doc: context + options + recommendation + trade-offs + decision criteria."
    ),

    "system-architect": (
        ['- "Design the overall system architecture"',
         '- "Evaluate this architecture for [issues]"',
         '- "Plan the migration from [old system] to [new system]"',
         '- Whenever system-level design, cross-cutting concerns, or architectural decisions are needed'],
        '''1. **Map the current state** — read existing architecture docs and code:
   ```bash
   find . -name "ARCHITECTURE*" -o -name "*.drawio" -o -name "*.puml" 2>/dev/null | head -10
   ```
2. **Identify pain points** — bottlenecks, single points of failure, scaling limits.
3. **Design the target state** — define: component boundaries, data flows, integration points,
   infrastructure requirements, security zones.
4. **Plan the transition** — identify the critical path from current → target state.
   Mark what's reversible and what commits the team permanently.''',
        "Current/target architecture diagrams (Mermaid) + gap analysis + migration critical path."
    ),

    # ── LANGUAGE SPECIALISTS ─────────────────────────────────────────────────

    "golang-pro": (
        ['- "Build [service/tool] in Go"',
         '- "Review this Go code for idiomatic patterns"',
         '- "Optimize this Go service for performance"',
         '- Whenever Go development, goroutine concurrency, or Go-specific patterns are needed'],
        '''1. **Read the existing Go module** — understand the project layout:
   ```bash
   cat go.mod && find . -name "*.go" | grep -v "_test.go" | head -20
   ```
2. **Identify the task** — using the module from Step 1, determine: new package,
   new handler, new goroutine worker, CLI command, or refactor.
3. **Implement** — follow Go idioms: error-as-value (not panic), context propagation,
   defer for cleanup, table-driven tests, `go vet` clean.
4. **Test and lint** — run the full Go toolchain:
   ```bash
   go vet ./... && go test ./... -race -count=1
   ```''',
        "Go package with tests passing `go test ./... -race`. `go vet` clean."
    ),

    "python-pro": (
        ['- "Build [script/service/library] in Python"',
         '- "Review this Python code for idiomatic patterns"',
         '- "Add type hints and fix mypy errors"',
         '- Whenever Python development, async patterns, or Python-specific tooling is needed'],
        '''1. **Read the project setup** — understand the tooling:
   ```bash
   cat pyproject.toml 2>/dev/null || cat setup.py 2>/dev/null
   cat .python-version 2>/dev/null || python3 --version
   ```
2. **Identify the task** — using the project config from Step 1:
   module, class, async function, CLI command, or test suite.
3. **Implement** — follow Python idioms: type hints throughout, dataclasses/pydantic for models,
   context managers for resources, comprehensions over loops where readable.
4. **Validate** — run the Python quality stack:
   ```bash
   ruff check . && python3 -m mypy . --ignore-missing-imports 2>/dev/null
   pytest -x -q 2>/dev/null
   ```''',
        "Python module/script with type hints, passing ruff + mypy, tests green."
    ),

    "typescript-expert": (
        ['- "Build [feature/module] in TypeScript"',
         '- "Fix TypeScript errors in [file/module]"',
         '- "Add strict types to this JavaScript code"',
         '- Whenever TypeScript development, type safety, or TS-specific patterns are needed'],
        '''1. **Check TypeScript config** — understand the strictness settings:
   ```bash
   cat tsconfig.json | grep -E "strict|target|module|paths"
   ```
2. **Read the types** — using the tsconfig from Step 1, find relevant type definitions:
   ```bash
   find . -name "*.d.ts" -o -name "types.ts" -o -name "*.types.ts" | head -10
   ```
3. **Implement** — use explicit return types on all functions, discriminated unions
   over enums where possible, `satisfies` operator for config objects.
4. **Type-check** — ensure zero TS errors:
   ```bash
   npx tsc --noEmit
   ```''',
        "TypeScript code with zero `tsc --noEmit` errors. All public APIs explicitly typed."
    ),

    "javascript-pro": (
        ['- "Build [feature/script] in JavaScript"',
         '- "Review this JS for bugs or anti-patterns"',
         '- "Convert this CommonJS to ESM"',
         '- Whenever plain JavaScript, Node.js scripts, or browser JS is needed'],
        '''1. **Read the module system** — CommonJS or ESM:
   ```bash
   cat package.json | grep -E '"type"|"main"|"module"'
   ```
2. **Understand the runtime** — browser, Node.js, Deno, or Bun (from Step 1 context).
3. **Implement** — use modern JS patterns: optional chaining, nullish coalescing,
   destructuring, async/await (not callbacks), const/let (not var).
4. **Lint** — run the project linter:
   ```bash
   npx eslint . --ext .js 2>/dev/null || node --check *.js
   ```''',
        "Working JavaScript with no lint errors. Console.log removed. Edge cases handled."
    ),

    "nextjs-developer": (
        ['- "Build a Next.js page/component for [feature]"',
         '- "Add a Next.js API route for [endpoint]"',
         '- "Fix the Next.js [routing/SSR/data fetching] for [page]"',
         '- Whenever Next.js App Router, SSR, SSG, or Next.js API routes are involved'],
        '''1. **Read the Next.js config and structure** — identify App Router vs Pages Router:
   ```bash
   cat next.config.* 2>/dev/null | head -20
   ls app/ src/app/ pages/ src/pages/ 2>/dev/null
   ```
2. **Identify the task type** — using Step 1:
   - App Router: Server Component, Client Component, Server Action, Route Handler
   - Pages Router: getServerSideProps, getStaticProps, API route
3. **Implement** — mark `"use client"` only when interactive. Fetch in Server Components
   directly. Use Route Handlers for API endpoints in App Router.
4. **Verify** — build check and type check:
   ```bash
   npx next build 2>&1 | tail -10 && npx tsc --noEmit
   ```''',
        "Next.js feature built correctly for the detected router mode. Build passing."
    ),

    "react-pro": (
        ['- "Build a React component for [feature]"',
         '- "Add state management to [component/feature]"',
         '- "Review this React code for anti-patterns"',
         '- Whenever React component design, hooks, or state patterns are needed'],
        '''1. **Read the project setup** — find the React version and tooling:
   ```bash
   cat package.json | grep -E '"react"|"vite"|"webpack"|"zustand"|"redux"'
   ```
2. **Identify component type** — using Step 1 context:
   - Presentational (pure render) → functional component, no state
   - Container (data fetching) → hooks, React Query, or SWR
   - Interactive (user events) → useState, useReducer, event handlers
3. **Implement** — keep components small, extract custom hooks for logic,
   memoize only when profiling proves it's needed.
4. **Test** — write a React Testing Library test:
   ```bash
   npx vitest run 2>/dev/null || npx jest --testPathPattern="Component" 2>/dev/null
   ```''',
        "React component + test. Props typed. No unused imports. Passes lint."
    ),

    "django-developer": (
        ['- "Build a Django [view/model/serializer/API] for [feature]"',
         '- "Add DRF endpoints for [resource]"',
         '- "Fix Django ORM query performance for [view]"',
         '- Whenever Django, DRF, or Django ORM work is needed'],
        '''1. **Read the Django project structure** — understand installed apps and settings:
   ```bash
   python3 manage.py show_urls 2>/dev/null | head -30
   cat */models.py | head -50
   ```
2. **Identify the component** — Model, View, Serializer, URL, Middleware, Signal, or Management Command.
3. **Implement** — follow Django conventions: fat models / thin views,
   `select_related`/`prefetch_related` for ORM queries, class-based views for CRUD.
4. **Test and migrate** — run tests and check for missing migrations:
   ```bash
   python3 manage.py check && python3 manage.py test --keepdb -v 1
   ```''',
        "Django component implemented + migration if needed + test passing `manage.py test`."
    ),

    "java-architect": (
        ['- "Design the Java architecture for [system]"',
         '- "Build a Spring Boot service for [feature]"',
         '- "Review this Java code for design patterns"',
         '- Whenever Java enterprise, Spring Boot, or JVM architecture is needed'],
        '''1. **Read the project build config** — Maven or Gradle:
   ```bash
   cat pom.xml | grep -E "<dependency>|<artifactId>" | head -30 2>/dev/null
   cat build.gradle | head -30 2>/dev/null
   ```
2. **Identify the framework** — Spring Boot, Micronaut, Quarkus, Jakarta EE (from Step 1).
3. **Implement** — follow the framework conventions: constructor injection (not field),
   `@Transactional` at service layer, repository pattern for data access.
4. **Test** — run the test suite:
   ```bash
   ./mvnw test -q 2>/dev/null || ./gradlew test 2>/dev/null
   ```''',
        "Java component with unit tests passing. Zero compilation warnings."
    ),

    # ── DEVOPS ───────────────────────────────────────────────────────────────

    "cloud-architect": (
        ['- "Design the cloud infrastructure for [system]"',
         '- "Migrate [workload] to [AWS/GCP/Azure]"',
         '- "Optimize cloud costs for [service]"',
         '- "Design disaster recovery for [system]"',
         '- Whenever multi-cloud architecture, cloud migration, or FinOps is needed'],
        '''1. **Identify the platform and current state** — read existing infra config:
   ```bash
   find . -name "*.tf" -o -name "*.yaml" | grep -E "(eks|ecs|gke|aks|lambda|cloud)" | head -10
   aws --version 2>/dev/null; gcloud --version 2>/dev/null; az --version 2>/dev/null
   ```
2. **Understand requirements** — from the request: workload type, SLA (availability/latency),
   data residency, compliance, and estimated scale.
3. **Design the architecture** — specify: compute (serverless/containers/VMs), networking (VPC/subnet/peering),
   storage (object/block/managed DB), IAM, monitoring, and cost estimate.
4. **Produce the deliverable** — Terraform/Bicep/CDK module or architecture diagram.''',
        "Architecture diagram (Mermaid) + IaC skeleton + cost estimate + HA/DR strategy."
    ),

    "devops-engineer": (
        ['- "Set up CI/CD for [project]"',
         '- "Add a GitHub Actions / GitLab CI pipeline for [workflow]"',
         '- "Automate [deployment/build/test] process"',
         '- Whenever CI/CD pipelines, deployment automation, or build orchestration is needed'],
        '''1. **Read the current CI config** — understand what exists:
   ```bash
   ls .github/workflows/ .gitlab-ci.yml .circleci/ Jenkinsfile 2>/dev/null
   cat .github/workflows/*.yml 2>/dev/null | head -50
   ```
2. **Identify what's missing** — using Step 1, map the gaps:
   lint → test → build → deploy stages.
3. **Write the pipeline** — with: caching for dependencies, parallel test jobs,
   environment-specific deploy gates, rollback trigger on failure.
4. **Validate syntax** — check the pipeline config:
   ```bash
   npx @actions/toolkit 2>/dev/null || yamllint .github/workflows/*.yml 2>/dev/null
   ```''',
        "Pipeline YAML file + explanation of each stage + cache strategy + rollback mechanism."
    ),

    "docker-expert": (
        ['- "Write a Dockerfile for [application]"',
         '- "Optimize this Docker image for size/security"',
         '- "Set up docker-compose for [local/dev environment]"',
         '- Whenever containerization, Docker builds, or compose orchestration is needed'],
        '''1. **Read the application** — identify language/runtime and dependencies:
   ```bash
   cat package.json pyproject.toml go.mod Gemfile pom.xml 2>/dev/null | head -20
   ```
2. **Design the Dockerfile** — using Step 1 runtime:
   - Multi-stage build (build stage → minimal runtime stage)
   - Non-root user for runtime
   - `.dockerignore` to exclude node_modules, .git, tests
3. **Write Dockerfile and compose** — implement the multi-stage build.
   Pin base image versions. Use `COPY --chown` not root copies.
4. **Verify** — build and scan:
   ```bash
   docker build -t app:test . && docker run --rm app:test echo "OK"
   docker scout quickview 2>/dev/null || trivy image app:test 2>/dev/null
   ```''',
        "Dockerfile (multi-stage) + docker-compose.yml + .dockerignore + image size before/after."
    ),

    "kubernetes-specialist": (
        ['- "Write Kubernetes manifests for [service]"',
         '- "Debug a failing pod / deployment in [namespace]"',
         '- "Configure HPA/resource limits for [workload]"',
         '- Whenever K8s deployments, services, ingress, or cluster operations are needed'],
        '''1. **Read cluster state** — understand current workloads:
   ```bash
   kubectl get pods,svc,deploy,ingress -A 2>/dev/null | head -30
   kubectl describe pod <failing-pod> 2>/dev/null | tail -30
   ```
2. **Identify the issue or requirement** — using Step 1:
   - CrashLoopBackOff → check logs, readiness probe, resource limits
   - New workload → design Deployment + Service + HPA + PodDisruptionBudget
3. **Write or fix manifests** — include: resource requests/limits, liveness + readiness probes,
   security context (non-root, read-only root FS where possible).
4. **Apply and verify** — dry-run first, then apply:
   ```bash
   kubectl apply --dry-run=client -f manifest.yaml && kubectl apply -f manifest.yaml
   kubectl rollout status deployment/<name>
   ```''',
        "K8s manifest YAML + rollout status + resource limits set + health probe configured."
    ),

    "terraform-engineer": (
        ['- "Write Terraform for [resource/module]"',
         '- "Review this Terraform for security or drift issues"',
         '- "Refactor this Terraform to use modules"',
         '- Whenever infrastructure-as-code with Terraform or OpenTofu is needed'],
        '''1. **Read existing Terraform state and structure** — understand current modules:
   ```bash
   find . -name "*.tf" | head -20 && terraform workspace list 2>/dev/null
   ```
2. **Plan the change** — using existing structure from Step 1:
   - New resource → add to appropriate module or create new module
   - Refactor → extract to module, preserve existing state keys
3. **Write the Terraform** — use: data sources over hardcoded IDs, locals for repeated values,
   `lifecycle { prevent_destroy = true }` for stateful resources.
4. **Validate and plan** — check syntax and preview changes:
   ```bash
   terraform fmt -recursive && terraform validate
   terraform plan -out=tfplan 2>&1 | tail -20
   ```''',
        "Terraform module with `terraform validate` passing + `terraform plan` output summary."
    ),

    "git-commit-helper": (
        ['- "Commit these changes"',
         '- "Write a conventional commit message for [change]"',
         '- "Create a PR for [feature/fix]"',
         '- Whenever staged changes need a well-formatted git commit or PR'],
        '''1. **Read what changed** — understand the diff:
   ```bash
   git diff --staged --stat && git diff --staged | head -80
   ```
2. **Identify the change type** — using the diff from Step 1:
   - `feat:` new capability the user didn't have before
   - `fix:` bug that caused wrong behaviour
   - `refactor:` restructuring without behaviour change
   - `chore:` tooling, deps, config (not user-facing)
   - `docs:` documentation only
3. **Write the commit** — conventional commit format:
   `type(scope): imperative summary under 72 chars`
   Body if needed: what + why (not how).
4. **Commit**:
   ```bash
   git commit -m "type(scope): summary"
   ```''',
        "Git commit created with conventional commit message. Summary under 72 chars."
    ),

    "git-workflow-manager": (
        ['- "Set up a branching strategy for [team/project]"',
         '- "Clean up stale branches"',
         '- "Resolve this merge conflict in [file]"',
         '- Whenever branching strategy, merge workflows, or git hygiene is needed'],
        '''1. **Inspect the current branch state** — understand the repo:
   ```bash
   git log --oneline --graph --all --decorate | head -30
   git branch -vv | head -20
   ```
2. **Identify the problem** — using Step 1:
   - Messy history → squash/rebase strategy
   - Stale branches → prune merged branches
   - Merge conflict → identify conflicting commits
3. **Execute** — apply the appropriate workflow:
   - `git branch -d` for merged branches
   - `git rebase -i origin/main` for history cleanup
   - Resolve conflicts: edit files, `git add`, `git rebase --continue`
4. **Verify** — confirm clean state:
   ```bash
   git log --oneline -10 && git status
   ```''',
        "Clean git history + branch state before/after comparison."
    ),

    # ── QA ───────────────────────────────────────────────────────────────────

    "bounty-hunter": (
        ['- "Hunt for bugs and code smells in [module/project]"',
         '- "Find technical debt across the codebase"',
         '- "Scan for security issues, bad patterns, or broken links"',
         '- Whenever a systematic sweep for issues across the repo is needed'],
        '''1. **Run automated scanners first** — collect the easy bounties:
   ```bash
   # Linting and type checking
   ruff check . 2>/dev/null || eslint . 2>/dev/null || flake8 . 2>/dev/null
   # Dead code
   find . -name "*.py" | xargs grep -l "TODO\|FIXME\|HACK\|XXX" | head -20
   # Empty files (likely stubs)
   find . -empty -name "*.py" -o -empty -name "*.ts" | head -10
   ```
2. **Report the bounty board** — summarize all issues found in Step 1 before fixing anything.
3. **Fix each bounty** — address issues one class at a time:
   - Lint errors first (automated), then dead code, then TODO/FIXME items.
4. **Verify no regressions** — run tests after each fix batch:
   ```bash
   pytest -x -q 2>/dev/null || npm test 2>/dev/null
   ```''',
        '**Bounties Collected:**\n- [Fixed] Issue 1\n- [Fixed] Issue 2\n\n**Status:** All bounties claimed.'
    ),

    "debugger": (
        ['- "Debug [error/crash/unexpected behaviour] in [service/function]"',
         '- "This test is failing — find out why"',
         '- "Trace why [feature] is not working"',
         '- Whenever a bug needs systematic root cause analysis before a fix'],
        '''1. **Reproduce the issue** — collect evidence:
   ```bash
   # Run the failing test / trigger the error
   pytest tests/path/test_name.py::test_case -v 2>&1 | tail -30
   # Check recent logs
   tail -50 logs/app.log 2>/dev/null
   ```
2. **Read the stack trace** — identify the exact file, function, and line from Step 1.
   Never guess — follow the trace.
3. **Isolate the root cause** — narrow down using the trace:
   - Add targeted print/log at the failing line
   - Check the input values at each function boundary
   - Verify assumptions about state (nulls, empty collections, wrong types)
4. **Fix and verify** — apply the minimal fix, re-run the failing test:
   ```bash
   pytest tests/path/test_name.py::test_case -v
   ```''',
        "Root cause identified (file:line:reason) + minimal fix applied + test green."
    ),

    "code-reviewer": (
        ['- "Review this code change / PR"',
         '- "Check [function/class/module] for issues"',
         '- "Is this implementation correct?"',
         '- Whenever code needs quality review before merge'],
        '''1. **Read the diff** — understand what changed:
   ```bash
   git diff main...HEAD 2>/dev/null || git diff HEAD~1 HEAD
   ```
2. **Check correctness first** — using the diff from Step 1:
   - Does the code do what it claims? Walk through the logic.
   - Are error cases handled? (null inputs, network failures, empty arrays)
   - Are there race conditions or concurrency issues?
3. **Check quality** — only after correctness:
   - Naming, readability, unnecessary complexity
   - Missing tests for the changed code
   - Security: user input reaching SQL/shell/template without sanitization
4. **Report findings** — with file:line references:
   ```bash
   # Verify test coverage for changed files
   git diff main...HEAD --name-only | grep -v test | head -10
   ```''',
        "Findings list with: severity (critical/info), file:line, problem, and suggested fix."
    ),

    "senior-code-reviewer": (
        ['- "Do a thorough senior review of [PR/module/system]"',
         '- "Review this for architecture, security, and correctness"',
         '- "Is this production-ready?"',
         '- Whenever staff-level code review with architectural perspective is needed'],
        '''1. **Read the full change and context** — diff + surrounding code:
   ```bash
   git diff main...HEAD --stat
   git diff main...HEAD | head -200
   ```
2. **Architecture review** — does this change:
   - Introduce coupling it shouldn't? Cross service boundaries inappropriately?
   - Violate the existing patterns (naming, error handling, logging conventions)?
   - Create a migration/rollback problem at scale?
3. **Security review** — check: auth bypass vectors, injection surfaces, secrets in code,
   over-permissioned roles, PII handling.
4. **Test coverage** — are the critical paths (happy path + top 3 error cases) tested?
   ```bash
   git diff main...HEAD --name-only | grep -v test | while read f; do echo "=== $f ==="; grep -c "def test_\|it(" "tests/${f%.*}_test*" 2>/dev/null || echo "NO TEST"; done
   ```''',
        "Review report: architecture concerns + security findings + test gaps + 3 must-fix items."
    ),

    "error-detective": (
        ['- "Find the root cause of [error/incident]"',
         '- "Correlate these errors across services"',
         '- "Why is [service] failing intermittently?"',
         '- Whenever error patterns need cross-service correlation or incident root cause analysis'],
        '''1. **Collect error evidence** — find all related errors:
   ```bash
   # Search logs for the error signature
   grep -r "ERROR\|CRITICAL\|Exception\|panic" logs/ 2>/dev/null | grep -i "[keyword]" | tail -50
   ```
2. **Build the timeline** — using Step 1 errors, sort by timestamp and trace:
   which service errored first? What triggered the cascade?
3. **Identify the root cause** — follow the causal chain:
   - First error → what state caused it?
   - Cascade → which dependency propagated the failure?
   - Pattern → does it correlate with deployments, load spikes, or cron jobs?
4. **Document the finding** — root cause + blast radius + immediate mitigation + fix.''',
        "Incident timeline + root cause (service:component:reason) + fix recommendation."
    ),

    "e2e-runner": (
        ['- "Write E2E tests for [user flow]"',
         '- "Run the Playwright / Cypress test suite"',
         '- "Fix the failing E2E test for [scenario]"',
         '- Whenever end-to-end test authoring, running, or debugging is needed'],
        '''1. **Read the existing E2E setup** — understand the framework:
   ```bash
   cat playwright.config.ts cypress.config.ts 2>/dev/null | head -30
   ls tests/e2e/ tests/ cypress/integration/ 2>/dev/null
   ```
2. **Identify the user flow** — map the steps a real user takes:
   navigate → interact → assert state change.
3. **Write the test** — use role-based selectors (`getByRole`, `getByLabel`), not CSS classes.
   Test the user's goal, not implementation details.
4. **Run and fix** — execute and debug failures:
   ```bash
   npx playwright test --reporter=list 2>/dev/null || npx cypress run 2>/dev/null
   ```''',
        "E2E test file + passing run output. Selectors role-based. Screenshot on failure configured."
    ),

    "performance-engineer": (
        ['- "Profile and fix [slow endpoint/function/query]"',
         '- "This API is taking Xms — find the bottleneck"',
         '- "Optimize [component] for throughput"',
         '- Whenever performance bottlenecks need measurement and elimination'],
        '''1. **Measure the baseline** — collect actual numbers before any change:
   ```bash
   # For HTTP endpoints — sample timing
   for i in {1..10}; do curl -s -o /dev/null -w "%{time_total}\n" http://localhost:8000/api/endpoint; done
   ```
2. **Profile** — identify where time is actually spent (not where you think):
   ```bash
   # Python: py-spy or cProfile
   python3 -m cProfile -s cumulative app.py 2>&1 | head -30
   # Node.js: clinic or --prof
   node --prof app.js 2>/dev/null
   ```
3. **Fix the bottleneck** — using Step 2 profiler output:
   - N+1 query → batch with DataLoader / eager load
   - Missing index → add targeted index
   - Blocking I/O → make async
   - Recomputation → add cache with TTL
4. **Measure after** — re-run Step 1 and compare.''',
        "Before/after latency numbers (p50/p99) + root cause identified + fix applied."
    ),

    "test-automator": (
        ['- "Write tests for [function/module/feature]"',
         '- "Set up the test infrastructure for [project]"',
         '- "Add test coverage for the untested [code path]"',
         '- Whenever automated test authoring, test infrastructure, or coverage improvement is needed'],
        '''1. **Read what exists** — understand the test setup:
   ```bash
   find . -name "*.test.*" -o -name "*_test.*" -o -name "test_*" | head -20
   cat package.json | grep -E '"test"|"jest"|"vitest"' 2>/dev/null
   cat pyproject.toml | grep -E "pytest|coverage" 2>/dev/null
   ```
2. **Identify what to test** — using Step 1 coverage baseline, find untested paths:
   - Public functions with no test file
   - Error branches that have no test
   - Integration points (DB, external API calls)
3. **Write tests** — AAA pattern: Arrange → Act → Assert.
   One assertion per test. Name tests as `test_[what]_[when]_[expected]`.
4. **Run and verify coverage** — ensure new tests pass and coverage improves:
   ```bash
   pytest --cov=. --cov-report=term-missing -q 2>/dev/null || npx vitest run --coverage 2>/dev/null
   ```''',
        "Test file with passing tests. Coverage report showing improvement on the tested module."
    ),

    # ── SECURITY ─────────────────────────────────────────────────────────────

    "security-auditor": (
        ['- "Audit [codebase/service/API] for security issues"',
         '- "Run a security review before launch"',
         '- "Check for OWASP Top 10 vulnerabilities"',
         '- Whenever a comprehensive security sweep is needed'],
        '''1. **Scan for common vulnerability patterns** — automated pass first:
   ```bash
   # Secrets in code
   grep -rn "password\s*=\s*['\"][^'\"]\|api_key\s*=\|secret\s*=\s*['\"]" \
     --include="*.py" --include="*.js" --include="*.ts" --include="*.yaml" . | grep -v ".git" | head -20
   # Dependency vulnerabilities
   npm audit 2>/dev/null || pip-audit 2>/dev/null || safety check 2>/dev/null
   ```
2. **Check authentication and authorization** — find every auth bypass vector:
   - Endpoints missing auth middleware
   - JWT algorithm confusion (alg:none)
   - IDOR (no ownership check on resource IDs)
3. **Check injection surfaces** — SQL, NoSQL, command injection:
   ```bash
   grep -rn "execute\|query\|subprocess\|shell=True\|os.system" \
     --include="*.py" --include="*.js" . | grep -v test | head -20
   ```
4. **Classify and report** — P0 (deploy blocker), P1 (this sprint), P2 (backlog).''',
        "Security report: P0/P1/P2 findings with file:line, OWASP category, and remediation."
    ),

    "penetration-tester": (
        ['- "Test [application/API/system] for vulnerabilities"',
         '- "Perform a pentest on [scope]"',
         '- "Verify [authentication/authorization] can be bypassed"',
         '- Whenever authorized penetration testing or vulnerability validation is needed'],
        '''1. **Define scope and enumerate** — list all attack surfaces:
   ```bash
   # Enumerate endpoints
   curl -s http://localhost:8000/api/ 2>/dev/null
   find . -name "urls.py" -o -name "routes.*" | xargs grep -h "path\|route" 2>/dev/null | head -30
   ```
2. **Test authentication** — using the endpoints from Step 1:
   - Try unauthenticated access on protected endpoints
   - Test JWT with `alg: "none"` header
   - Test IDOR by swapping IDs in requests
3. **Test injection** — on each input field:
   - SQL: `' OR '1'='1` and `1; DROP TABLE--`
   - NoSQL: `{"$gt": ""}` operator injection
   - Command: `;id` and `| whoami`
4. **Document findings** — with reproduction steps, impact, and CVSS score.''',
        "Pentest report: finding, reproduction steps, CVSS score, and remediation for each vulnerability."
    ),

    "compliance-auditor": (
        ['- "Audit [system] for SOC 2 / HIPAA / PCI-DSS compliance"',
         '- "Generate compliance evidence for [framework]"',
         '- "Identify compliance gaps for [upcoming audit]"',
         '- Whenever regulatory compliance assessment, evidence collection, or gap analysis is needed'],
        '''1. **Identify the compliance framework** — SOC 2 Type II, HIPAA, PCI-DSS, GDPR, ISO 27001.
2. **Map controls to evidence** — for each required control:
   ```bash
   # Check for audit logging
   grep -rn "audit_log\|AuditLog\|audit_trail" --include="*.py" --include="*.ts" . | head -10
   # Check for encryption at rest
   grep -rn "encrypt\|cipher\|KMS\|vault" --include="*.py" --include="*.ts" . | head -10
   ```
3. **Identify gaps** — using Step 2, list controls with no evidence.
   For each gap: what is missing, risk level, and remediation.
4. **Produce the audit report** — control matrix: control → status (PASS/FAIL/PARTIAL) → evidence path.''',
        "Compliance gap report: control matrix with PASS/FAIL/PARTIAL + evidence locations + remediation backlog."
    ),

    # ── DATA ─────────────────────────────────────────────────────────────────

    "data-engineer": (
        ['- "Build a data pipeline for [source → destination]"',
         '- "Set up ETL for [data source]"',
         '- "Fix the failing data job for [pipeline]"',
         '- Whenever data pipelines, ETL/ELT, or data infrastructure is needed'],
        '''1. **Understand the data flow** — source, transform, destination:
   ```bash
   find . -name "dbt_project.yml" -o -name "airflow_dag*" -o -name "*.pipeline.*" | head -10
   ```
2. **Design the pipeline** — using the existing setup from Step 1:
   - Ingestion: batch vs streaming, schema-on-read vs schema-on-write
   - Transformation: SQL (dbt), Python (Pandas/Polars), or Spark
   - Loading: append-only, upsert (merge), or full-refresh
3. **Implement** — write the pipeline code with: idempotency (safe to re-run),
   error handling (dead letter queue), and observability (row counts, latency).
4. **Test with sample data** — validate output schema and row count:
   ```bash
   python3 pipeline.py --dry-run 2>/dev/null || dbt test 2>/dev/null
   ```''',
        "Pipeline code + test with sample data + schema validation + idempotency confirmed."
    ),

    "ml-engineer": (
        ['- "Build a training pipeline for [model/task]"',
         '- "Deploy the ML model for [use case]"',
         '- "Fix the failing ML job for [experiment]"',
         '- Whenever ML model training, serving, or MLOps automation is needed'],
        '''1. **Read the ML project structure** — find framework and experiment tracking:
   ```bash
   cat requirements.txt pyproject.toml | grep -E "torch|tensorflow|sklearn|mlflow|wandb" 2>/dev/null
   ls experiments/ models/ pipelines/ 2>/dev/null
   ```
2. **Identify the task** — using Step 1:
   - Training pipeline → data loading, preprocessing, training loop, evaluation
   - Model serving → FastAPI/Flask endpoint wrapping `model.predict()`
   - MLOps → experiment tracking, model registry, retraining trigger
3. **Implement** — with: reproducibility (random seeds, pinned deps),
   evaluation metrics logged, model artifacts versioned.
4. **Validate** — run a smoke test on sample data:
   ```bash
   python3 train.py --smoke-test 2>/dev/null || pytest tests/test_model.py -v 2>/dev/null
   ```''',
        "Training pipeline / serving endpoint + evaluation metrics + model artifact versioned."
    ),

    "data-scientist": (
        ['- "Analyze [dataset] to answer [business question]"',
         '- "Build an exploratory analysis for [domain]"',
         '- "Validate the model performance on [dataset]"',
         '- Whenever statistical analysis, EDA, or model evaluation is needed'],
        '''1. **Load and inspect the data** — understand shape and quality:
   ```python
   import pandas as pd
   df = pd.read_csv("data.csv")
   print(df.shape, df.dtypes, df.isnull().sum())
   df.describe()
   ```
2. **Identify the question** — from the data profile in Step 1:
   - Descriptive: distribution, central tendency, outliers
   - Predictive: target variable, feature correlations
   - Diagnostic: why did X happen?
3. **Analyze** — compute the relevant statistics, visualizations, and model metrics.
   State what the numbers mean in plain language.
4. **Summarize findings** — key insight, confidence level, and recommended next step.''',
        "Analysis notebook or script + key findings in plain language + recommended action."
    ),

    "llm-architect": (
        ['- "Design an LLM-powered [feature/system]"',
         '- "Review this prompt for [issues]"',
         '- "Choose between [LLM providers] for [use case]"',
         '- Whenever LLM integration architecture, RAG design, or prompt system design is needed'],
        '''1. **Define the task and constraints** — what the LLM needs to do:
   - Input/output format, latency budget, cost ceiling, accuracy bar
   - Context window size needed vs. available
2. **Choose the architecture pattern** — based on Step 1 constraints:
   - Simple completion → direct API call
   - Knowledge-intensive → RAG (retrieval-augmented generation)
   - Multi-step reasoning → chain-of-thought or agent loop
   - Structured output → function calling / tool use
3. **Design the prompt system** — system prompt + few-shot examples + output schema.
   Write the prompt, test with 5+ representative inputs.
4. **Plan evals** — define the success metric and write 10 test cases
   covering: happy path, edge cases, and adversarial inputs.''',
        "Architecture diagram + prompt design + eval test cases + provider comparison if applicable."
    ),

    # ── PRODUCT ──────────────────────────────────────────────────────────────

    "product-manager": (
        ['- "Write requirements for [feature]"',
         '- "Create a product roadmap for [quarter/year]"',
         '- "Prioritize the backlog for next sprint"',
         '- Whenever product requirements, roadmap planning, or feature scoping is needed'],
        '''1. **Understand the user problem** — articulate the job-to-be-done:
   - Who has this problem? (persona, context)
   - What are they trying to accomplish?
   - What does success look like for them?
2. **Define the solution scope** — what's in, what's out, and why:
   - MVP scope (minimum to validate the hypothesis)
   - Phase 2 scope (once MVP is validated)
   - Explicit non-goals
3. **Write the requirements** — for each user story:
   `As [persona], I want [capability] so that [outcome].`
   With: acceptance criteria, edge cases, non-functional requirements.
4. **Define success metrics** — how will you know it worked?
   Name the metric, baseline, and target.''',
        "PRD: problem statement + user stories + acceptance criteria + success metrics + scope boundary."
    ),

    "scrum-master": (
        ['- "Run the sprint planning / retrospective"',
         '- "Help remove this blocker for the team"',
         '- "Improve our sprint velocity and process"',
         '- Whenever sprint facilitation, agile process, or team impediment removal is needed'],
        '''1. **Assess the current state** — understand the team's situation:
   - Sprint velocity trend (last 3 sprints)
   - Current blockers and their age
   - Team health indicators (morale, communication, clarity)
2. **Identify the biggest impediment** — pick the ONE thing causing the most friction.
3. **Facilitate the solution** — as facilitator, not fixer:
   - For process issues → propose a ceremony or working agreement change
   - For technical blockers → connect the right people, don't solve it yourself
   - For inter-team dependencies → escalate with a clear ask
4. **Define the action** — one owner, one deadline, one definition of done.''',
        "Action plan: impediment identified + owner assigned + resolution by [date] + success criteria."
    ),

    "project-manager": (
        ['- "Create a project plan for [initiative]"',
         '- "Track project health and flag risks"',
         '- "Manage scope creep on [project]"',
         '- Whenever project planning, risk management, or delivery coordination is needed'],
        '''1. **Define scope and deliverables** — what gets built, by when, with what resources.
2. **Break down the work** — Work Breakdown Structure:
   - Milestones (major phases)
   - Tasks (1–5 day units of work)
   - Dependencies (what must finish before what starts)
3. **Identify risks** — for each risk: probability, impact, and mitigation.
   Flag the top 3 risks that could block delivery.
4. **Set up tracking** — define: status cadence, escalation path, change control process.''',
        "Project charter: scope + WBS + risk register + timeline + RACI."
    ),

    # ── DOCS ─────────────────────────────────────────────────────────────────

    "technical-writer": (
        ['- "Write documentation for [feature/API/system]"',
         '- "Improve the README for [project]"',
         '- "Create a getting-started guide for [audience]"',
         '- Whenever technical documentation, guides, or reference material is needed'],
        '''1. **Understand the audience and their goal** — who reads this and what do they need to do?
   - Beginner: step-by-step tutorial, no assumed knowledge
   - Practitioner: how-to guide, goal-oriented
   - Expert: reference, complete and scannable
2. **Read the existing docs and code** — find what already exists:
   ```bash
   find . -name "README*" -o -name "*.md" -not -path "*/node_modules/*" | head -20
   ```
3. **Write** — structure: overview → prerequisites → steps → reference → troubleshooting.
   Every step must be actionable. Every code block must be copy-pasteable and correct.
4. **Verify accuracy** — run every code example in the docs:
   ```bash
   # Test each code block in the documentation
   ```''',
        "Documentation file with: overview, prerequisites, numbered steps, tested code examples."
    ),

    "diagram-architect": (
        ['- "Create an architecture diagram for [system]"',
         '- "Draw the sequence diagram for [flow]"',
         '- "Visualize the data flow for [feature]"',
         '- Whenever architecture, sequence, or system diagrams are needed'],
        '''1. **Understand the system** — read existing docs and code:
   ```bash
   find . -name "ARCHITECTURE*" -o -name "*.puml" -o -name "*.drawio" | head -5
   ```
2. **Choose the diagram type** — based on the question to answer:
   - Component/C4 → what are the parts and how do they connect?
   - Sequence → what is the order of messages for [flow]?
   - ERD → how does the data relate?
   - Flowchart → what is the decision logic?
3. **Write the diagram** — in Mermaid syntax:
   ```
   graph TD / sequenceDiagram / erDiagram / flowchart LR
   ```
4. **Validate rendering** — paste into https://mermaid.live to confirm no syntax errors.''',
        "Mermaid diagram code + key decisions annotated in comments."
    ),

    "meta-agent": (
        ['- "Create a new agent for [purpose]"',
         '- "Build a sub-agent configuration for [role]"',
         '- Whenever a new Claude Code agent definition needs to be generated'],
        '''1. **Clarify the agent\'s purpose** — ask:
   - What specific task does this agent perform?
   - What domain does it belong to? (backend/qa/devops/etc.)
   - What tools does it actually need?
   - What model fits? (opus for complex reasoning, sonnet for most, haiku for fast)
2. **Read the format spec** — check the canonical format:
   ```bash
   cat .claude/skills/prompt-engineering/references/agent-format.md | head -50
   ```
3. **Generate the agent file** — following the exact format:
   frontmatter → Voice → When To Use → Workflow → Output Format → Completion Protocol.
4. **Write to the correct path** — `agents/specialists/[domain]/[name].md`
   and validate YAML frontmatter.''',
        "Complete agent .md file at the correct path with all required sections."
    ),

    "changelog-generator": (
        ['- "Generate a changelog for [version/release]"',
         '- "Update CHANGELOG.md with recent changes"',
         '- "Write release notes for [version]"',
         '- Whenever changelog generation or release note authoring is needed'],
        '''1. **Read recent git history** — collect commits since the last release:
   ```bash
   git log $(git describe --tags --abbrev=0)..HEAD --oneline 2>/dev/null || \\
   git log --oneline -30
   ```
2. **Categorize commits** — group by type from Step 1:
   - `feat:` → Added
   - `fix:` → Fixed
   - `chore:/refactor:` → Changed
   - `BREAKING CHANGE:` → Breaking Changes
3. **Write the changelog entry** — Keep a Changelog format:
   ```
   ## [X.Y.Z] - YYYY-MM-DD
   ### Added
   - ...
   ### Fixed
   - ...
   ```
4. **Prepend to CHANGELOG.md** — new version at the top.''',
        "CHANGELOG.md updated with new version section at top. Semantic version bumped."
    ),

    # ── FRONTEND ─────────────────────────────────────────────────────────────

    "frontend-developer": (
        ['- "Build [component/page/feature] in [framework]"',
         '- "Fix the UI for [component]"',
         '- "Add [interaction/animation] to [element]"',
         '- Whenever frontend implementation, component building, or UI feature work is needed'],
        '''1. **Read the project tech stack** — identify framework and styling:
   ```bash
   cat package.json | grep -E '"react"|"vue"|"svelte"|"tailwind"|"styled"' | head -10
   ls src/components/ src/pages/ app/ pages/ 2>/dev/null | head -10
   ```
2. **Find existing similar components** — using Step 1 structure, find the closest pattern:
   ```bash
   find src/ -name "*.tsx" -o -name "*.vue" | head -10
   ```
3. **Implement** — following the patterns from Step 2:
   - Match the existing component naming and file structure
   - Use the project's design system tokens (not hardcoded values)
   - Handle loading, empty, and error states
4. **Test visually and functionally** — start the dev server and verify:
   ```bash
   npm run dev 2>/dev/null && echo "Dev server started — verify in browser"
   ```''',
        "Component file + styles matching the design system. Loading/error/empty states handled."
    ),

    "premium-ux-designer": (
        ['- "Make [component/page] look premium and polished"',
         '- "Add animations and micro-interactions to [feature]"',
         '- "Redesign [UI element] to feel high-end"',
         '- Whenever premium visual quality, animations, or elevated UX is needed'],
        '''1. **Audit the current state** — understand what exists and what feels cheap:
   ```bash
   find src/ -name "*.css" -o -name "*.scss" -o -name "*.module.css" | head -10
   ```
2. **Choose an aesthetic direction** — commit to ONE:
   brutalist / soft-pastel / luxury-dark / editorial / organic — not generic.
   The direction must be specific, not "modern clean".
3. **Design the upgrades** — apply in this order:
   1. Typography: pick a distinctive font pair (display + body)
   2. Spacing: generous whitespace or intentional density — not in-between
   3. Motion: one well-timed entrance animation, not scattered micro-interactions
   4. Color: dominant tone + sharp accent, not evenly distributed palette
4. **Implement** — CSS animations (prefer CSS-only), motion library for React when needed.''',
        "Redesigned component with distinct aesthetic. Animations timing-function tuned. No generic defaults."
    ),

}

# ─────────────────────────────────────────────────────────────────────────────
# DOMAIN-LEVEL FALLBACK WORKFLOWS (for agents not in the lookup table)
# ─────────────────────────────────────────────────────────────────────────────

DOMAIN_FALLBACK = {
    "backend": (
        ['- "Build [feature/endpoint] for [system]"',
         '- "Review [code/module] in this backend"',
         '- "Implement [pattern/architecture] for [use case]"',
         '- Whenever backend code, server-side logic, or data access is needed'],
        '''1. **Read the project structure and conventions** — understand the codebase:
   ```bash
   find . -type f \\( -name "*.ts" -o -name "*.py" -o -name "*.go" \\) | \\
     grep -v node_modules | head -15
   ```
2. **Identify the task type** — using the structure from Step 1:
   new feature / bug fix / refactor / performance / security.
3. **Implement** — following the conventions found in Step 1 exactly:
   naming, error handling, logging, validation style.
4. **Verify** — run the test suite and linter:
   ```bash
   npm test 2>/dev/null || pytest -x -q 2>/dev/null || go test ./... 2>/dev/null
   ```''',
        "Working implementation following project conventions. Tests passing."
    ),
    "frontend": (
        ['- "Build [component/page] for [feature]"',
         '- "Fix [UI issue] in [component]"',
         '- "Add [interaction] to [element]"',
         '- Whenever frontend UI, components, or client-side features are needed'],
        '''1. **Read the frontend stack and structure** — understand what's in use:
   ```bash
   cat package.json | grep -E '"react"|"vue"|"tailwind"|"styled"' | head -10
   ls src/components/ app/ pages/ 2>/dev/null | head -10
   ```
2. **Find the nearest existing pattern** — reuse before creating:
   ```bash
   find src/ -name "*.tsx" -o -name "*.vue" | head -10
   ```
3. **Implement** — match the project's design system tokens,
   handle loading/error/empty states.
4. **Verify** — start dev server and check visually:
   ```bash
   npm run dev 2>/dev/null
   ```''',
        "Component file matching the design system. States: loading, error, empty all handled."
    ),
    "devops": (
        ['- "Set up [CI/CD/infra/deployment] for [project]"',
         '- "Fix [build/deploy/infrastructure] issue"',
         '- "Automate [process] in [environment]"',
         '- Whenever CI/CD, infrastructure, deployment, or build systems are involved'],
        '''1. **Read current infrastructure and pipeline config** — understand what exists:
   ```bash
   ls .github/workflows/ .gitlab-ci.yml Dockerfile terraform/ k8s/ 2>/dev/null
   ```
2. **Identify the gap** — using Step 1, determine what's missing or broken.
3. **Implement** — write the config/manifest following the existing patterns.
   Include: health checks, rollback trigger, environment-specific gates.
4. **Validate syntax** — check config before applying:
   ```bash
   yamllint . 2>/dev/null || terraform validate 2>/dev/null
   ```''',
        "Config/manifest file with syntax validation passing. Rollback strategy documented."
    ),
    "security": (
        ['- "Audit [component/system] for security vulnerabilities"',
         '- "Review [code/config] for security issues"',
         '- "Check [endpoint/feature] for OWASP Top 10"',
         '- Whenever security review, vulnerability assessment, or compliance checks are needed'],
        '''1. **Enumerate the attack surface** — what inputs, endpoints, and trust boundaries exist:
   ```bash
   grep -rn "route\\|endpoint\\|@app.route\\|router\\." \\
     --include="*.py" --include="*.ts" . | grep -v test | head -20
   ```
2. **Scan for common vulnerabilities** — using the surface from Step 1:
   injection, broken auth, sensitive data exposure, misconfiguration.
3. **Test each finding** — verify exploitability with a minimal reproduction.
4. **Report** — OWASP category + file:line + severity (P0/P1/P2) + fix.''',
        "Security findings: OWASP category, file:line, severity, and remediation per issue."
    ),
    "data": (
        ['- "Build [pipeline/model/analysis] for [use case]"',
         '- "Analyze [dataset] to answer [question]"',
         '- "Optimize [query/model] for [metric]"',
         '- Whenever data engineering, ML, analytics, or database optimization is needed'],
        '''1. **Understand the data and tooling** — read the project setup:
   ```bash
   cat pyproject.toml requirements.txt | grep -E "pandas|torch|sklearn|dbt|airflow" 2>/dev/null
   find . -name "*.sql" -o -name "dbt_project*" -o -name "*.pipeline*" | head -10
   ```
2. **Identify the task** — pipeline, model training, analysis, or query optimization.
3. **Implement** — with reproducibility (seeds pinned, deps locked),
   metrics logged, and idempotent execution.
4. **Validate** — run against sample data and compare metrics.''',
        "Implementation with validation metrics. Idempotent execution confirmed."
    ),
    "qa": (
        ['- "Test [feature/component/system]"',
         '- "Debug [failing test/unexpected behaviour]"',
         '- "Improve test coverage for [module]"',
         '- Whenever testing, quality assurance, or defect investigation is needed'],
        '''1. **Read the existing test setup** — understand the framework and patterns:
   ```bash
   find . -name "*.test.*" -o -name "*_test.*" | head -10
   cat package.json | grep -E '"test"' 2>/dev/null
   ```
2. **Identify what needs testing** — uncovered paths, failing tests, or regression risk.
3. **Write or fix tests** — AAA (Arrange/Act/Assert), one assertion per test,
   test behaviour not implementation.
4. **Run and verify** — ensure tests pass and coverage improves:
   ```bash
   pytest --tb=short -q 2>/dev/null || npm test 2>/dev/null
   ```''',
        "Test file with passing tests. Coverage improvement on the target module."
    ),
    "product": (
        ['- "Define [feature/initiative] requirements"',
         '- "Prioritize the backlog for [sprint/quarter]"',
         '- "Write user stories for [feature]"',
         '- Whenever product requirements, roadmap, or stakeholder coordination is needed'],
        '''1. **Understand the user and the problem** — who has this problem and what's their goal.
2. **Define the scope** — what's in for MVP, what's explicitly out, and why.
3. **Write the deliverable** — user stories, acceptance criteria, or roadmap.
   Every story follows: As [persona], I want [capability] so that [outcome].
4. **Define success** — measurable metric, baseline, and target.''',
        "Deliverable: user stories + acceptance criteria + success metric + scope boundary."
    ),
    "docs": (
        ['- "Document [feature/API/system]"',
         '- "Write a guide for [audience] on [topic]"',
         '- "Update the README/docs for [change]"',
         '- Whenever technical documentation, guides, or reference material is needed'],
        '''1. **Identify the audience and their goal** — beginner/practitioner/expert.
2. **Read existing docs** — find what already exists, avoid duplication:
   ```bash
   find . -name "*.md" -not -path "*/node_modules/*" | head -15
   ```
3. **Write** — structure: overview → prerequisites → steps → reference.
   Every step actionable. Every code block tested.
4. **Verify** — run every code example in the docs to confirm accuracy.''',
        "Documentation with tested code examples. Every step is actionable."
    ),
    "crypto": (
        ['- "Analyze [token/market]"',
         '- "Research [crypto project]"',
         '- "Find top movers in [timeframe]"',
         '- Whenever cryptocurrency analysis or market research is needed'],
        '''1. **Collect current market data** — price, volume, market cap:
   ```bash
   # Check any available crypto API or data source
   ```
2. **Identify the analysis type** — from the request:
   price action / fundamental / sentiment / on-chain.
3. **Analyze** — state facts with numbers, not predictions.
   Compare to sector benchmarks and historical context.
4. **Summarize** — key signal, confidence level, risk factors.''',
        "Analysis: key metrics, context, signal, and risk factors. No unsubstantiated predictions."
    ),
}


# ─────────────────────────────────────────────────────────────────────────────
# SDLC FRONTMATTER
# ─────────────────────────────────────────────────────────────────────────────

SDLC_FRONTMATTER = {
    "00-environment.md": {
        "name": "00-environment",
        "description": "SDLC pipeline entry point. Detects installed tools (git, node, python, docker, CLI tools), checks environment variables for integrations, installs missing tools interactively, and produces environment_report.json. Always run first in the SDLC pipeline. (sdlc)",
        "model": "sonnet",
        "tools": ["Bash", "Read", "Write"],
        "color": "green",
    },
    "01-transcript.md": {
        "name": "01-transcript",
        "description": "SDLC pipeline stage 1. Processes raw project briefings or meeting transcripts into structured JSON. Reads environment_report.json and produces transcript.json summarising: project name, goals, stakeholders, constraints, and timeline. (sdlc)",
        "model": "sonnet",
        "tools": ["Bash", "Read", "Write"],
        "color": "cyan",
    },
    "02-requirements.md": {
        "name": "02-requirements",
        "description": "SDLC pipeline stage 2. Expert Business Analyst agent. Reads transcript.json and produces requirement_spec.json with: functional requirements, non-functional requirements, user stories, acceptance criteria, and out-of-scope items. (sdlc)",
        "model": "sonnet",
        "tools": ["Bash", "Read", "Write"],
        "color": "cyan",
    },
    "03-documentation.md": {
        "name": "03-documentation",
        "description": "SDLC pipeline stage 3. Generates project documentation from requirements. Reads requirement_spec.json and produces: project overview, technical glossary, stakeholder map, and documentation.json. (sdlc)",
        "model": "sonnet",
        "tools": ["Bash", "Read", "Write"],
        "color": "cyan",
    },
    "04-planning.md": {
        "name": "04-planning",
        "description": "SDLC pipeline stage 4. Project planning agent. Reads requirement_spec.json and produces plan.json with: work breakdown structure, milestone schedule, risk register, resource allocation, and dependency map. (sdlc)",
        "model": "opus",
        "tools": ["Bash", "Read", "Write"],
        "color": "magenta",
    },
    "05-jira.md": {
        "name": "05-jira",
        "description": "SDLC pipeline stage 5. Ticket creation agent. Reads plan.json and creates Jira epics, stories, and tasks via the Jira API or produces jira_tickets.json for manual import. Supports GitHub Issues fallback. (sdlc)",
        "model": "sonnet",
        "tools": ["Bash", "Read", "Write"],
        "color": "blue",
    },
    "06-architecture.md": {
        "name": "06-architecture",
        "description": "SDLC pipeline stage 6. Senior Solution Architect agent. Reads jira_tickets.json + requirement_spec.json and produces system_design.json plus HLD.md covering: tech stack, database schema, API contracts, service architecture, and security design. (sdlc)",
        "model": "opus",
        "tools": ["Bash", "Read", "Write"],
        "color": "magenta",
    },
    "07-code.md": {
        "name": "07-code",
        "description": "SDLC pipeline stage 7. Code generation agent. Reads system_design.json and produces actual working code scaffolding — not pseudocode. Generates backend, frontend, and config files following the architecture decisions. Produces code_report.json. (sdlc)",
        "model": "opus",
        "tools": ["Bash", "Read", "Write", "Edit"],
        "color": "yellow",
    },
    "08-testing.md": {
        "name": "08-testing",
        "description": "SDLC pipeline stage 8. Senior QA Engineer agent. Reads code_report.json and produces: test plan, unit tests, integration test outlines, and test_report.json covering happy path + error cases + security test cases. (sdlc)",
        "model": "sonnet",
        "tools": ["Bash", "Read", "Write"],
        "color": "yellow",
    },
    "09-deployment.md": {
        "name": "09-deployment",
        "description": "SDLC pipeline stage 9. DevOps deployment agent. Reads test_report.json and produces deployment artefacts: Dockerfile, CI/CD pipeline config, environment configs, deployment scripts, and deployment_report.json. (sdlc)",
        "model": "sonnet",
        "tools": ["Bash", "Read", "Write"],
        "color": "green",
    },
    "10-summary.md": {
        "name": "10-summary",
        "description": "SDLC pipeline stage 10. Project summary agent. Reads all upstream JSON contracts and produces a comprehensive summary.json plus human-readable project report: what was built, decisions made, and next steps. (sdlc)",
        "model": "sonnet",
        "tools": ["Bash", "Read", "Write"],
        "color": "white",
    },
    "11-feedback-loop.md": {
        "name": "11-feedback-loop",
        "description": "SDLC pipeline optional stage 11. Feedback processing agent. Collects user/stakeholder feedback on the delivered system and produces feedback.json with: satisfaction scores, change requests, bugs found, and prioritised iteration backlog. (sdlc)",
        "model": "sonnet",
        "tools": ["Bash", "Read", "Write"],
        "color": "cyan",
    },
    "12-security-threat-model.md": {
        "name": "12-security-threat-model",
        "description": "SDLC pipeline optional stage 12. Security threat modelling agent. Reads system_design.json and produces a STRIDE threat model: assets identified, threats enumerated, mitigations designed, and threat_model.json with risk scores. (sdlc)",
        "model": "opus",
        "tools": ["Bash", "Read", "Write", "Grep"],
        "color": "red",
    },
    "13-compliance-checker.md": {
        "name": "13-compliance-checker",
        "description": "SDLC pipeline optional stage 13. Compliance audit agent. Reads system_design.json and maps requirements to compliance controls (GDPR, HIPAA, SOC 2, PCI-DSS). Produces compliance_report.json with: control gaps, evidence requirements, and remediation tasks. (sdlc)",
        "model": "sonnet",
        "tools": ["Bash", "Read", "Write", "Grep"],
        "color": "red",
    },
    "14-cost-estimation.md": {
        "name": "14-cost-estimation",
        "description": "SDLC pipeline optional stage 14. Cost estimation agent. Reads plan.json and system_design.json and produces cost_estimate.json with: infrastructure costs (cloud services, storage, bandwidth), development effort estimate, and ongoing maintenance cost projection. (sdlc)",
        "model": "sonnet",
        "tools": ["Bash", "Read", "Write"],
        "color": "white",
    },
}


# ─────────────────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────────────────

GENERIC_SIGNAL = 'grep -E "(relevant-pattern)"'


def parse_sections(content: str) -> dict:
    """Parse all ## sections from agent body."""
    sections = {}
    # Find body (after frontmatter)
    if content.startswith("---"):
        parts = content.split("---", 2)
        body = parts[2] if len(parts) >= 3 else content
    else:
        body = content

    current = None
    buf = []
    for line in body.split("\n"):
        if line.startswith("## "):
            if current:
                sections[current] = "\n".join(buf).strip()
            current = line[3:].strip()
            buf = []
        else:
            buf.append(line)
    if current:
        sections[current] = "\n".join(buf).strip()
    return sections


def build_agent(name: str, fm: dict, domain: str, when_to_use: list, workflow: str, output_fmt: str) -> str:
    """Assemble a complete agent file."""
    color = fm.get("color", "cyan")
    model = fm.get("model", "sonnet")

    # Keep original model if it's meaningful
    original_model = model
    if original_model not in ("opus", "sonnet", "haiku", "inherit"):
        original_model = "sonnet"

    # Format description (keep existing, just ensure block scalar)
    raw_desc = fm.get("description", "")
    if isinstance(raw_desc, list):
        raw_desc = " ".join(raw_desc)
    desc = raw_desc.strip().strip('"').strip("'")
    domain_tag = f"({domain})"
    if domain_tag not in desc:
        desc = desc.rstrip(".") + f". {domain_tag}"
    desc_lines = desc.split("\n")
    desc_formatted = ("\n  ").join(l.strip() for l in desc_lines if l.strip())

    # Format tools
    raw_tools = fm.get("tools", [])
    if isinstance(raw_tools, str):
        raw_tools = [t.strip() for t in raw_tools.split(",") if t.strip()]
    tools_yaml = "\n".join(f"  - {t}" for t in raw_tools) if raw_tools else "  - Read\n  - Bash"

    # Voice — keep existing if it's domain-specific, otherwise use default
    voice_defaults = {
        "backend": "Direct, concrete. Name the framework, the endpoint, the file.\nShow actual code — not 'you should implement X.' State trade-offs with real numbers.",
        "frontend": "Visual and concrete. Name the component, the CSS property, the file.\nShow actual JSX/CSS. State design decisions with rationale, not opinions.",
        "devops": "Operational and precise. Name the service, the config file, the command.\nState failure modes and recovery steps. Give the actual config, not a description of it.",
        "security": "Precise and unambiguous. Name the CVE, the OWASP category, the exact vulnerable line.\nNo 'this might be a risk' — state the threat model and the attack vector directly.",
        "data": "Data-driven and specific. Name the table, the model, the metric.\nState trade-offs with numbers: 'adds 200ms latency', 'reduces memory by 40%'.",
        "qa": "Systematic and evidence-based. Cite specific files, line numbers, test names.\nShow the exact assertion that fails and why — never 'tests might fail'.",
        "product": "Strategic and user-focused. Connect every decision to user outcomes.\nName the metric, the stakeholder, the constraint. State specific impact, not vague 'improvements'.",
        "docs": "Clear, scannable, audience-first. Every doc decision serves the reader.\nName the target audience, the format, the specific section. Write for skimmability.",
        "crypto": "Fast and data-focused. Lead with the signal, not the noise.\nName the token, the exchange, the metric. No predictions — analysis only.",
    }
    voice = voice_defaults.get(domain, "Direct and concrete. Name specific files, functions, and line numbers.")

    when_str = "\n".join(when_to_use)

    # Build hooks if present in original
    hooks_section = ""
    if "hooks:" in fm.get("_raw_fm", ""):
        # Preserve original hooks config
        hooks_section = fm.get("_hooks", "")

    return f"""---
name: {name}
description: |
  {desc_formatted}
model: {original_model}
tools:
{tools_yaml}
color: {color}
{hooks_section}---

## Voice
{voice}

## When To Use
{when_str}

## Workflow
{workflow}

## Output Format
{output_fmt}

## Completion Protocol
STATUS: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
REASON: [1–2 sentences if not DONE]
ATTEMPTED: [what was tried, if BLOCKED]
"""


def extract_frontmatter_raw(content: str) -> dict:
    """Extract frontmatter as a simple dict plus raw hooks."""
    if not content.startswith("---"):
        return {}
    parts = content.split("---", 2)
    if len(parts) < 3:
        return {}
    fm_text = parts[1]

    fm = {"_raw_fm": fm_text}
    current_key = None
    current_val = []
    in_block = False
    in_list = False
    list_items = []

    for line in fm_text.split("\n"):
        if not line.strip():
            continue

        if not line.startswith(" ") and ":" in line and not in_block:
            # Save previous key
            if current_key and current_key not in ("hooks",):
                if in_list:
                    fm[current_key] = list_items
                else:
                    fm[current_key] = "\n".join(current_val).strip()
            current_key, _, val = line.partition(":")
            current_key = current_key.strip()
            val = val.strip()
            current_val = []
            in_list = False
            list_items = []
            in_block = val == "|"
            if not in_block and val:
                current_val = [val.strip('"').strip("'")]
        elif line.startswith("  - ") and current_key:
            in_list = True
            list_items.append(line.strip()[2:])
        elif (line.startswith("  ") or line.startswith("\t")) and current_key and in_block:
            current_val.append(line.strip())

    if current_key and current_key not in ("hooks",):
        if in_list:
            fm[current_key] = list_items
        else:
            fm[current_key] = "\n".join(current_val).strip()

    # Extract hooks block as raw string
    hooks_match = __import__("re").search(r'(hooks:.*?)(?=\n\w|\Z)', fm_text, __import__("re").DOTALL)
    if hooks_match:
        fm["_hooks"] = hooks_match.group(1) + "\n"

    return fm


# ─────────────────────────────────────────────────────────────────────────────
# FIX SPECIALIST AGENTS
# ─────────────────────────────────────────────────────────────────────────────

def fix_specialist_agents():
    specialists_dir = BASE / "specialists"
    fixed = 0
    skipped = 0

    for domain_dir in sorted(specialists_dir.iterdir()):
        if not domain_dir.is_dir():
            continue
        domain = domain_dir.name

        for md_file in sorted(domain_dir.glob("*.md")):
            content = md_file.read_text()

            # Skip if already has a proper domain-specific workflow (no generic signal)
            if GENERIC_SIGNAL not in content:
                skipped += 1
                continue

            agent_name = md_file.stem
            fm = extract_frontmatter_raw(content)

            # Get agent-specific or domain fallback data
            if agent_name in AGENT_DATA:
                when_lines, workflow, output_fmt = AGENT_DATA[agent_name]
            else:
                # Use domain fallback
                when_lines, workflow, output_fmt = DOMAIN_FALLBACK.get(domain, DOMAIN_FALLBACK["backend"])

            new_content = build_agent(agent_name, fm, domain, when_lines, workflow, output_fmt)
            md_file.write_text(new_content)
            fixed += 1

    return fixed, skipped


# ─────────────────────────────────────────────────────────────────────────────
# FIX SDLC FRONTMATTER
# ─────────────────────────────────────────────────────────────────────────────

def fix_sdlc_agents():
    sdlc_dir = BASE / "sdlc"
    fixed = 0

    for filename, fm_data in SDLC_FRONTMATTER.items():
        md_file = sdlc_dir / filename
        if not md_file.exists():
            print(f"  MISSING: {filename}")
            continue

        content = md_file.read_text()

        # Skip if already has frontmatter
        if content.startswith("---"):
            print(f"  SKIP (has frontmatter): {filename}")
            continue

        # Build frontmatter block
        tools_yaml = "\n".join(f"  - {t}" for t in fm_data["tools"])
        fm_block = f"""---
name: {fm_data['name']}
description: |
  {fm_data['description']}
model: {fm_data['model']}
tools:
{tools_yaml}
color: {fm_data['color']}
---

"""
        md_file.write_text(fm_block + content)
        print(f"  FIXED: {filename}")
        fixed += 1

    return fixed


# ─────────────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("=== FIXING SDLC FRONTMATTER ===")
    sdlc_fixed = fix_sdlc_agents()
    print(f"Fixed: {sdlc_fixed}\n")

    print("=== FIXING SPECIALIST WORKFLOWS ===")
    spec_fixed, spec_skipped = fix_specialist_agents()
    print(f"Fixed: {spec_fixed} | Already good: {spec_skipped}")

    # Final audit
    print("\n=== FINAL AUDIT ===")
    generic_remaining = sum(
        1 for md in BASE.rglob("*.md")
        if GENERIC_SIGNAL in md.read_text()
    )
    no_fm = sum(
        1 for md in BASE.rglob("*.md")
        if not md.read_text().startswith("---")
    )
    total = sum(1 for _ in BASE.rglob("*.md"))
    print(f"Total agents: {total}")
    print(f"Generic placeholder remaining: {generic_remaining}")
    print(f"Missing frontmatter: {no_fm}")
