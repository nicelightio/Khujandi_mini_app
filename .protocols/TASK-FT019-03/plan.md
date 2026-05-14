---
description: Plan for TASK-FT019-03 courier staff roster commands.
status: active
---
# TASK-FT019-03 Plan

## Steps

1. Extend delivery-assignment domain types with courier staff actor, command input/result types and repository methods.
2. Add application command methods for create, deactivate, boss-only reactivate and manual rating adjustment with controlled errors.
3. Implement Prisma repository methods against `User`, `CourierStaffLifecycleEvent` and `CourierStaffRatingAdjustment`.
4. Add focused service/repository tests for create conflicts, no password, soft delete metadata, boss-only reactivation and rating adjustment history.
5. Run focused delivery-assignment tests, focused eslint for touched files and `git diff --check`.

## Constraints

- Keep changes additive and local to `delivery-assignment`.
- Do not alter availability, offer, claim, bot runtime or order lifecycle semantics.
- Do not self-verify final PASS; leave verifier verdict to reviewer/orchestrator.
