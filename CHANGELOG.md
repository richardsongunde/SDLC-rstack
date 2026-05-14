# Changelog

## [1.0.0] - 2026-05-14

### Added
- Pi-first RStack SDLC extension with `sdlc_start`, `sdlc_clarify`, `sdlc_plan`, `sdlc_build_next`, `sdlc_validate`, `sdlc_status`, and `sdlc_memory`.
- `.rstack/runs/<run_id>/` lifecycle state with task-level builder and validator contracts.
- Production operating standard for RStack agents covering evidence-first execution, context hygiene, user clarification, quality gates, and completion protocol.
- Public package metadata, README, license, and public Pi documentation.

### Changed
- Core and SDLC agents now prefer Pi-first `.rstack` state over legacy `outputs/team_state` handoffs.
- Builder and validator contracts now include explicit status, evidence, risks, and retry recommendations.

### Verified
- `npm test` passes.
- `npm pack --dry-run` includes only public package artifacts.
