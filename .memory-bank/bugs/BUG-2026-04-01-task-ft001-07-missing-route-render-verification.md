---
description: Verification failure for TASK-FT001-07 due to missing route/page-level public catalog smoke coverage.
status: active
---
# BUG-2026-04-01 TASK-FT001-07 Missing Route Render Verification

## Summary

`TASK-FT001-07` implemented public catalog wiring, but formal verification failed because the repo-local evidence does not cover the task's declared verify target: customer-facing route/page rendering of shops/products plus loading and error handling.

## Detection

- Date: `2026-04-01`
- Command: `npx jest --config jest.config.cjs "frontend/src/tests/slices/catalog/catalog-page.spec.tsx"`
- Command: `npx jest --config jest.config.cjs "frontend/src/tests/slices/catalog/catalog-route.spec.tsx"`

## Evidence

- Both commands returned `No tests found` because `jest.config.cjs` matches only `*.spec.ts`, not existing `*.spec.tsx` route/page tests.
- Current passing frontend coverage only verifies `catalog-api.spec.ts` and `catalog-view-model.spec.ts`.
- The task card for `TASK-FT001-07` requires `UI/integration smoke for public browse rendering and loading/error states` and verifies that the `catalog route` shows shops/products without auth.

## Impact

- `TASK-FT001-07` cannot be considered formally verified.
- Dependent `TASK-FT001-08` must stay blocked until route/page-level coverage or equivalent deterministic verification evidence is added.

## Suggested fix

- Extend the repo-local frontend harness to include `*.spec.tsx` route/page tests or add another deterministic rendering verification path.
- Add route/page smoke tests that assert visible shop/product rendering and loading/error states through the customer-facing `catalog` route.
