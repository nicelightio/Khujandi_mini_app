---
description: Request for 7-angle architecture/code review of FT-015 showcase changes.
status: active
---
# TASK-FT015-ARCH-REVIEW

## Scope

Review current uncommitted FT-015 start showcase changes for:
- architecture compliance with `doc/ARCHITECTURE.md` and `.memory-bank` source of truth;
- catalog slice boundaries and contour separation;
- deeper code risks across backend, frontend, persistence, security, tests, and rollout.

## Rules

- Review only; do not modify implementation or specs.
- Each reviewer writes one report under `.tasks/TASK-FT015-ARCH-REVIEW/`.
- Verdict format: `APPROVE` or `REJECT`.
- Findings first, with file/line references where possible.
