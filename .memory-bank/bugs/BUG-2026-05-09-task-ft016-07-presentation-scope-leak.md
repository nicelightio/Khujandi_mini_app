---
description: Verification blocker for TASK-FT016-07 presentation-layer scope leak.
status: active
---
# BUG-2026-05-09 TASK-FT016-07 Presentation Scope Leak

## Status

resolved

## Summary

`TASK-FT016-07` implemented the courier availability backend boundary and passed focused checks, but verification failed because the change also touched `backend/src/slices/delivery-assignment/presentation/delivery-assignment.controller.ts`.

The approved task scope was limited to `delivery-assignment` backend `application/domain/infra/tests` only. Exposing availability operations through the presentation controller belongs to a later transport/menu/runtime task, not this application-boundary task.

## Evidence

- `.protocols/TASK-FT016-07/verification.md`: FAIL verdict and check evidence.
- Changed file outside approved layers: `backend/src/slices/delivery-assignment/presentation/delivery-assignment.controller.ts`.
- Passing checks do not remove the scope violation:
  - `npm run test:delivery-assignment`
  - `git diff --check`
  - changed markdown local link validation
  - `DATABASE_URL=postgresql://user:pass@localhost:5432/khujandi npx prisma validate`

## Required Repair

Remove the presentation-layer exposure from `TASK-FT016-07` scope or defer it to the later Telegram/menu/runtime task. Keep the server-owned availability behavior in `application/domain/infra/tests` unchanged unless tests show a direct regression.

## Repair

`TASK-FT016-07-FIX` removed the out-of-scope courier availability methods from `backend/src/slices/delivery-assignment/presentation/delivery-assignment.controller.ts` and left the application/domain/infra availability boundary intact.

Repair verification evidence:

- `npm run test:delivery-assignment`: PASS, 3 suites / 23 tests.
- `git diff --check`: PASS.
- Changed/new markdown local link validation: PASS, 67 local links checked across 51 changed/new markdown files.

`TASK-FT016-07-FIX` is verified `PASS` and marked `done`. `TASK-FT016-07` remains historically failed with a repaired-by follow-up note in its verification evidence.
