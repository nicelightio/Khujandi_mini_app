---
description: Execution context for TASK-FT019-10 final FT-019 Staff panel verification and Memory Bank sync.
status: active
---
# TASK-FT019-10 Context

## Role

- `ROLE: SUBAGENT`
- `TYPE: tester`

## Task

Run final verification and Memory Bank sync for the completed `FT-019 Staff panel` implementation wave.

## Required Specs Read

- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `doc/ARCHITECTURE.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/features/FT-019-staff-panel.md`
- `.memory-bank/contracts/staff-panel-contract.md`
- `.memory-bank/tasks/plans/IMPL-FT-019.md`
- `.memory-bank/tasks/backlog.md`
- `.memory-bank/changelog.md`

## Prior Task Evidence Read

- `.tasks/TASK-FT019-01/**/*`
- `.tasks/TASK-FT019-02/**/*`, including focused repair and final verify
- `.tasks/TASK-FT019-03/**/*`
- `.tasks/TASK-FT019-04/**/*`
- `.tasks/TASK-FT019-05/**/*`
- `.tasks/TASK-FT019-06/**/*`
- `.tasks/TASK-FT019-07/**/*`, including triage, focused TypeScript repair and final verify
- `.tasks/TASK-FT019-08/**/*`
- `.tasks/TASK-FT019-09/**/*`

## Micro-Check

- Owning capability: `FT-019 Staff panel` staff management surface in `admin-web`.
- Owning contour: `admin-web`.
- Owning slices inspected: `admin-access`, `delivery-assignment`, `delivery-tracking`, `reviews-feedback`.
- Touched layers in this task: documentation/evidence only.
- Verified layers from completed tasks: backend persistence/domain/application/read-models/runtime routes; frontend admin-web API client, route state, presentation and tests.
- Shared extraction: not justified. FT-019 keeps explicit courier/operator resources and slice-owned readers/commands; no generic CRM/staff shared layer is needed.

## Scope Guard

- Do not edit source or tests.
- If code/spec mismatch is found, record `FAIL` and blockers instead of patching implementation.
- If verification passes, update only allowed docs/status artifacts.
- Preserve unrelated dirty worktree changes.
