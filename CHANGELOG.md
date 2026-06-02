# Changelog

<!-- owner: RStack developed by Richardson Gunde -->

All notable changes to RStack are documented here. Entries are user-focused:
what you can now do that you couldn't before.

## [1.3.0] - 2026-06-02

### Added
- **Notifications on five channels.** Your SDLC events — run started, task
  validated, execution reports, approvals — can now reach **Slack, Microsoft
  Teams, Discord, Telegram, and WhatsApp**, all at once. Configure any mix of
  channels via environment variables or `.rstack/notifications.json`; one
  event fans out to every channel you've set up.
- **`npx rstack-agents notify --test`.** Verify your webhook setup in seconds:
  sends a test message to every configured channel and reports per-channel
  success or failure.
- A failing webhook never fails a run — channel errors are reported, never
  thrown.

## [1.2.0] - 2026-06-02

### Added
- **One-command setup: `npx rstack-agents init`.** You can now drop RStack into
  any project in under two minutes. It auto-detects your host framework
  (Pi, Claude Code, Operator — or custom), creates the `.rstack/` state
  directory, registers the project with the Business Hub, writes
  framework-specific scaffolding, and prints exactly what to do next.
  Running it twice is safe — it never overwrites your files.
- **Per-framework integration guides** under `docs/integrations/` — including
  the full adapter contract for plugging RStack into any agent framework.
- **`RSTACK_REGISTRY_DIR`** environment override for the global project
  registry, so CI and tests never touch your real `~/.rstack`.

## [1.1.0] - 2026-06-02

### Added
- **Run Analytics page in the Business Hub.** You can now see every run as a
  wall-clock Gantt timeline — each task attempt drawn start-to-finish, colored
  by pass/fail/running — plus per-run KPIs for duration, tool calls, pass/fail
  counts, average quality score, and cost.
- **Stage duration insights.** Average time spent in each of the 15 SDLC stages,
  aggregated across every run you've ever recorded — historical runs included,
  no re-instrumentation needed.
- **Run-over-run trends.** Compare your last 30 runs side by side: duration,
  tool calls, pass/fail, quality, and cost — click any row to drill into the run.
- **Richer run drill-down.** The run drawer now shows duration and quality KPIs
  and the task Gantt alongside the per-minute activity feed.
- **Duration column** in the Run Sessions table.

### Fixed
- **Stage metrics are now correct.** Stage-completion events used to be recorded
  against plan task ids instead of canonical SDLC stages, so per-stage timing
  was attributed to stages that don't exist. New runs record correctly, and the
  dashboard transparently remaps old runs so history stays accurate.
- **Stage checkpoints actually save now.** Checkpoints silently failed for every
  plan task, which meant `sdlc_rollback` had nothing to restore. Each canonical
  stage a task produces is now checkpointed on validation pass.
- **`metrics.json` is now populated.** Per-stage elapsed time and status are
  written on every validation pass instead of staying empty.
- **Less wasted work when Slack isn't configured.** Validation no longer builds
  full notification reports (or dumps payloads to the console) when no webhook
  is set.

## [1.0.3] - 2026-06-01

Baseline release: Business Hub multi-run dashboard, SDLC layer folder
structure (`src/core`, `src/observability`, `src/integrations`), Pi and
Operator adapters with compatibility shims, and green CI.
