---
description: Focused FT-019 Staff TypeScript repair notes before TASK-FT019-08.
status: active
---
# TASK-FT019-07 Repair Notes

## Result

Focused Staff TypeScript repair completed before `TASK-FT019-08`.

Owning capability: `FT-019 Staff panel`.
Owning contour: `admin-web`.
Touched layers: backend runtime/presentation wiring, application type narrowing, infrastructure provider contracts, focused Staff tests.
Shared extraction: not justified.

## Scope Kept

- Repaired only Staff-related diagnostics classified as blocking by `.tasks/TASK-FT019-07/TASK-FT019-07-S-TRIAGE-final-report-code-02.md`.
- Did not change Staff product behavior, endpoint shape, RBAC, archive visibility, password handling or lifecycle statuses.
- Did not add `OrderStatus.FAILED`, hard delete or frontend command workflows.
- Did not repair catalog/public-path, staging harness, old frontend fixture or broad non-Staff runtime drift.

## Checks

- `npx tsc --noEmit -p tsconfig.jest.json`: still `FAIL`, but no remaining triage-blocking Staff diagnostics.
- `npx jest --config jest.config.cjs tests/slices/admin-access/admin-access-staff-runtime.spec.ts --runInBand`: `PASS`.
- `npx jest --config jest.config.cjs tests/slices/admin-access/admin-access-operator-staff.spec.ts --runInBand`: `PASS`.
- `npx jest --config jest.config.cjs tests/slices/delivery-assignment/delivery-assignment-courier-staff.spec.ts --runInBand`: `PASS`.
- `npm run test:admin-access -- --runInBand`: `PASS`.
- `npm run test:delivery-assignment -- --runInBand`: `PASS`.
- Focused ESLint for touched files: `PASS`.
- Focused forbidden-drift grep: no `OrderStatus.FAILED`; no hard-delete implementation; password/hash hits are expected hash-only route/repository/test references, not rendering.
- `git diff --check`: `PASS`.

## Remaining TypeScript Drift

Remaining `tsc` failures are classified as non-blocking for the Staff repair:

- catalog/public-path contract drift;
- mixed non-Staff `order-ops-runtime` delivery-assignment/order-cancellation/delivery-tracking adapter widening;
- staging/test-session AppError details arrays;
- non-Staff delivery-assignment detail-array and offer-timeout narrowing diagnostics;
- old frontend/catalog/checkout/delivery-assignment test fixture drift.

Detailed repair report: `.tasks/TASK-FT019-07/TASK-FT019-07-S-FIX-final-report-code-03.md`.
