---
description: Implementation plan for TASK-FT016-16 polling consumer alignment.
status: active
---
# TASK-FT016-16 Plan

## Plan

1. Mark `TASK-FT016-16` as `in_progress` in backlog/run status and create task protocol artifacts.
2. Inspect current customer order-tracking polling parser/view-model/tests and admin operator polling/read-model/tests.
3. Patch only missing consumer behavior for `PICKED_UP`, `DELAYED`, operator/admin `COMPLETED`, closed terminal states, read-only customer UI, and opaque cursor handling.
4. Add focused frontend tests for customer and admin polling/read behavior.
5. Run focused frontend checks: `npm run test:order-tracking:frontend`, focused admin tests, `npm run build:frontend`, `git diff --check`, and markdown local link validation if links changed.
6. Update `.protocols/TASK-FT016-16/progress.md`, `.tasks/TASK-FT016-16/*`, backlog/status/changelog to `ready_for_verify`.

## Constraints

- No backend lifecycle/assignment/timeout/cancellation changes.
- No shared state-machine extraction.
- No commits or pushes.
