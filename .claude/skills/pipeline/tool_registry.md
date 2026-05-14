# Tool Registry — SDLC Automation Pipeline

## Purpose
This registry defines every external tool the pipeline may need, its free/open-source
alternatives, and the fallback strategy when a tool is unavailable.

## GOLDEN RULE: The Pipeline NEVER Stops
If a tool is missing:
1. Try to install a free/open-source alternative automatically
2. If that fails, use file-based fallback (generate the output as files instead)
3. If even that fails, log what the user needs to do manually, skip that step, and CONTINUE

---

## Tool Categories & Resolution Order

### 1. TICKETING TOOLS (Agent 05 — Jira Agent)

**Preferred (if available):**
| Tool | How to Detect | How to Use |
|------|--------------|-----------|
| Jira Cloud | Check for `JIRA_BASE_URL` + `JIRA_API_TOKEN` env vars | REST API via curl/fetch |
| Azure DevOps | Check for `AZURE_DEVOPS_ORG` + `AZURE_DEVOPS_PAT` env vars | REST API |
| ServiceNow | Check for `SERVICENOW_INSTANCE` + credentials env vars | REST API |
| Linear | Check for `LINEAR_API_KEY` env var | GraphQL API |

**Free Alternatives (auto-install):**
| Alternative | How to Get It | Notes |
|-------------|--------------|-------|
| GitHub Issues | Already available if project has a GitHub repo | Free, use `gh` CLI |
| GitLab Issues | Already available if project has a GitLab repo | Free |
| Plane (self-hosted) | `docker run` from plane.so | Free, open-source Jira alternative |
| Taiga | `docker-compose` from taiga.io | Free, open-source |
| OpenProject | `docker run` from openproject.org | Free community edition |

**File-Based Fallback (always works, no tool needed):**
- Generate `outputs/jira/jira_tickets.json` — structured JSON with all Epics/Stories/Tasks
- Generate `outputs/jira/jira_tickets_readable.md` — human-readable markdown
- Generate `outputs/jira/jira_import_csv.csv` — CSV importable into any ticketing tool later
- This fallback is ALWAYS available and the pipeline CONTINUES

### 2. VERSION CONTROL (Agent 07 — Code Agent)

**Preferred (if available):**
| Tool | How to Detect |
|------|--------------|
| Git + GitHub | `git --version` + `gh --version` |
| Git + GitLab | `git --version` + `glab --version` |
| Git + Bitbucket | `git --version` |

**Auto-Install:**
- Git: Download from https://git-scm.com/downloads (Windows installer)
- GitHub CLI: `winget install GitHub.cli` or download from https://cli.github.com

**File-Based Fallback:**
- Generate code files directly in `outputs/code/` without pushing to any repo
- Include a `SETUP_GIT.md` with instructions for manual git init later

### 3. CONTAINERIZATION & DEPLOYMENT (Agent 09 — Deployment Agent)

**Preferred (if available):**
| Tool | How to Detect |
|------|--------------|
| Docker Desktop | `docker --version` |
| Docker Compose | `docker compose version` or `docker-compose --version` |
| Podman | `podman --version` |
| kubectl | `kubectl version --client` |

**Auto-Install:**
- Docker Desktop: Download from https://www.docker.com/products/docker-desktop/
  (Note: requires license for large orgs — Podman is fully free)
- Podman: `winget install RedHat.Podman` — 100% free, Docker-compatible

**File-Based Fallback:**
- Generate Dockerfiles, docker-compose.yml, CI/CD configs as FILES
- Include `DEPLOYMENT_MANUAL.md` with step-by-step manual deployment instructions
- Include raw shell scripts for deployment without Docker

### 4. CI/CD PIPELINE (Agent 09)

**Preferred:**
| Tool | Notes |
|------|-------|
| GitHub Actions | Free for public repos, 2000 min/month for private |
| GitLab CI | Free tier available |
| Jenkins | Free, open-source, self-hosted |

**File-Based Fallback:**
- Generate `.github/workflows/ci.yml` regardless (it's just a YAML file)
- Generate `Jenkinsfile` as alternative
- Generate `scripts/deploy.sh` manual deployment script

### 5. DATABASE (Agent 07 — Code Agent)

**Preferred (if available):**
| Tool | How to Detect |
|------|--------------|
| PostgreSQL | `psql --version` |
| MySQL | `mysql --version` |
| MongoDB | `mongosh --version` |
| SQLite | `sqlite3 --version` |

**Auto-Install:**
- SQLite: Usually pre-installed. If not: `winget install SQLite.SQLite`
- PostgreSQL: `winget install PostgreSQL.PostgreSQL` or Docker: `docker run postgres`
- If Docker available: `docker run -d postgres:16` (instant, no install)

**File-Based Fallback:**
- Generate SQL migration files (works with any DB later)
- Use SQLite as default (zero-config, file-based, always works)
- Include `DATABASE_SETUP.md` with instructions for each DB option

### 6. NODE.js / NPM (Agent 07 — Code Agent)

**How to Detect:** `node --version` && `npm --version`

**Auto-Install:**
- Windows: `winget install OpenJS.NodeJS.LTS`
- Or download from https://nodejs.org

**Fallback:**
- Generate all code files. Include `SETUP_NODE.md`
- Code is still valid — user just needs Node.js to run it

### 7. PYTHON (Helpers)

**How to Detect:** `python --version` or `python3 --version` or `py --version`

**Auto-Install:**
- Windows: `winget install Python.Python.3.12`
- Or download from https://www.python.org

**Fallback:**
- Helpers are optional utilities, not pipeline-blocking
- Pipeline runs entirely inside Claude Code — Python helpers are bonus tools

### 8. NOTIFICATION TOOLS (Slack, Email)

**Preferred:** Slack webhook URL in env var `SLACK_WEBHOOK_URL`

**Free Alternatives:**
- Discord webhooks (free)
- Microsoft Teams incoming webhooks (free with Teams)
- Email via free SMTP (Gmail SMTP)

**Fallback:**
- Generate notification config files with placeholders
- Skip notification setup, document it in `NOTIFICATIONS_SETUP.md`

---

## Environment Variable Checklist

The pipeline checks these at startup. Missing ones trigger fallback, NOT failure:

```
# Ticketing (optional — falls back to file-based tickets)
JIRA_BASE_URL=
JIRA_API_TOKEN=
JIRA_PROJECT_KEY=

# Version Control (optional — falls back to local files)
GITHUB_TOKEN=
GITHUB_REPO=

# Deployment (optional — falls back to file-based configs)
DOCKER_AVAILABLE=    # auto-detected
KUBERNETES_CONTEXT=

# Notifications (optional — falls back to skip)
SLACK_WEBHOOK_URL=
DISCORD_WEBHOOK_URL=

# Database (optional — falls back to SQLite)
DATABASE_URL=
```

---

## Resolution Flow (For Every Agent)

```
1. Check if preferred tool is available (env var / CLI detection)
   ├── YES → Use it directly
   └── NO → Continue to step 2

2. Check if a free alternative can be auto-installed
   ├── YES → Attempt installation, then use it
   └── NO (or install failed) → Continue to step 3

3. Use file-based fallback (generate outputs as files)
   ├── ALWAYS WORKS → Pipeline continues
   └── Log what was skipped and what user can do manually

4. NEVER STOP. ALWAYS CONTINUE TO NEXT AGENT.
```
