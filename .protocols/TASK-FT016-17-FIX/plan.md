---
description: Plan for TASK-FT016-17-FIX delivery-tracking runtime setup repair.
status: active
---
# TASK-FT016-17-FIX Plan

## Steps

1. Mark the task `in_progress` in backlog/run status and create task protocol artifacts.
2. Replace stale normal legacy assignment setup in `tests/slices/delivery-tracking/delivery-tracking.runtime.spec.ts` with minimal v2 manual offer + claim setup.
3. Keep assertions aligned with successful claim semantics and customer event filtering.
4. Update task docs/backlog/status/changelog to `ready_for_verify`.
5. Run required checks:
   - `npm run test:delivery-tracking -- --runInBand`
   - `npm run test:delivery-assignment -- --runInBand`
   - `git diff --check`

## Non-goals

- Production behavior changes.
- Legacy endpoint re-enable.
- Flow semantic changes for offer, claim, timeout, auto-offer, tracking, cancellation or refund.
