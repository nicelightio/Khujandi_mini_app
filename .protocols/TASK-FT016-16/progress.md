---
description: Progress log for TASK-FT016-16 polling consumer alignment.
status: active
---
# TASK-FT016-16 Progress

## 2026-05-09

- Created task protocol directory and context/plan/progress docs.
- Recorded owning slice, contours, touched layers and shared justification before implementation edits.
- Updated customer order-tracking actions to the v2 courier-owned chain `PICKED_UP -> IN_PROGRESS -> DELIVERED`; customer completion remains polling/read-only through operator/admin events.
- Extended customer event parsing to accept status events with `oldStatus/newStatus` payload fields while keeping `revision` and `next_cursor` string-only.
- Added focused customer polling coverage for read-only `PICKED_UP -> IN_PROGRESS -> DELIVERED -> COMPLETED` updates without mutation controls.
- Added focused admin coverage proving terminal rows remain closed and confirmed `DELIVERED -> COMPLETED` disables further status control.
- Checks passed: `npm run test:order-tracking:frontend -- --runInBand`; focused admin assignment API/view-model/route Jest; `npm run build:frontend`; `git diff --check`.
- Changed markdown local link validation was not applicable because this task did not add markdown links.
