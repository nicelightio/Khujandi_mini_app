---
description: Implementation plan for TASK-FT016-07-FIX.
status: active
---
# TASK-FT016-07-FIX Plan

## Steps

1. Mark `TASK-FT016-07-FIX` as `in_progress` in backlog/run status.
2. Remove only the courier availability methods and related type import from `delivery-assignment.controller.ts`.
3. Update verification/bug evidence to record that the presentation scope leak is repaired.
4. Run required checks: `npm run test:delivery-assignment`, `git diff --check`, and changed markdown local link validation.
5. Write final implementation report under `.tasks/TASK-FT016-07-FIX/`.

## Non-goals

- No broad rollback of `TASK-FT016-07`.
- No changes to allowed application/domain/infra availability behavior unless tests expose a direct regression.
- No new transport/runtime/menu/admin/order side effects.
