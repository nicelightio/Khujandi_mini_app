---
description: Execution plan for TASK-FT016-00 Phase 0 baseline inspection.
status: active
---
# TASK-FT016-00 Plan

## Objective

Produce a Phase 0 handoff report that confirms current implementation drift before any `FT-016` runtime/schema work.

## Steps

1. Read project operating guide, `/execute`, `/autopilot`, autonomous run gate files.
2. Confirm review gate permits `TASK-FT016-00` only.
3. Mark `TASK-FT016-00` in backlog as `in_progress`.
4. Load task card, implementation plan, migration plan and required specs/contracts/states.
5. Inspect current implementation areas only enough to map drift:
   - admin panel;
   - delivery assignment;
   - delivery tracking/state machine;
   - events/polling;
   - Telegram bot integration;
   - Prisma schema/data model;
   - tests around `FT-004`, `FT-005`, admin panel and customer order tracking.
6. Write `.tasks/TASK-FT016-00/TASK-FT016-00-S-00-final-report-docs-01.md`.
7. Update protocol progress as complete.
8. Run `git diff --check`.
9. Run markdown link validation for changed markdown docs.

## Non-goals

- No runtime code edits.
- No Prisma/schema edits.
- No implementation tasks appended to backlog.
- No commit or push.
- Do not mark backlog `done`; verifier owns final status transition.

## Verification Targets

- `git diff --check`
- Markdown link validation over changed markdown files.
