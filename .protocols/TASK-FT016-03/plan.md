---
description: Implementation plan for TASK-FT016-03.
status: active
---
# TASK-FT016-03 Plan

## Steps

1. Inspect current admin order operations runtime, persistence adapters, and existing delivery tests.
2. Add a narrow read-only operator delivery read model endpoint under the existing admin-protected route boundary.
3. Include rows for today plus previous 3 calendar days with status, courier marker, assigned/claimed timestamp where known, severity, history rows, and controlled latest-message placeholders.
4. Preserve existing assignment/cancellation/refund routes unchanged except for non-breaking shared route wiring if needed.
5. Add focused runtime tests for the new endpoint and regressions for existing assignment/cancellation/refund operations.
6. Run focused delivery-tracking checks, delivery-assignment checks if touched, and `git diff --check`.
7. Write final implementation report in `.tasks/TASK-FT016-03/`.

## Richer Inputs

- Task card includes Source, Constraints, Tests, Verify, and likely touched files.
- Implementation plan includes explicit Phase 1/2 migration boundaries.
- Contract/state docs define severity and read model fields.

## Fallback

- No fallback needed; richer inputs are present.
