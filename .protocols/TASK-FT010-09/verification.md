---
description: Верификация TASK-FT010-09.
---
# TASK-FT010-09 Verification

## Verification basis
- Task verify target from `.memory-bank/tasks/backlog.md`: mounted admin provisioning route reuses the checked-in admin session family and fails closed for anonymous/non-admin callers before any catalog write side effects.
- Feature/contract fallback basis: `REQ-025`, `.memory-bank/features/FT-010-seller-storefront-editing-and-store-admin.md`, `.memory-bank/contracts/catalog-seller-provisioning-and-visibility.md`, `.memory-bank/contracts/catalog-seller-access-and-session.md`.

## Planned checks
- Targeted runtime integration test for anonymous caller -> `401 AUTH_REQUIRED` with no catalog writes.
- Targeted runtime integration test for authenticated non-admin caller -> `403 FORBIDDEN` with no catalog writes.
- Targeted runtime integration test for authenticated admin/boss caller -> `201` success and duplicate-conflict regression coverage.

## Executed checks
- Anonymous runtime request to `POST /api/v1/admin/catalog/shops/provision` returns `401 AUTH_REQUIRED`; evidence is covered by `tests/slices/catalog/catalog.runtime.integration.spec.ts` and the passing path-based Jest run.
- Authenticated `manager` runtime request to the same route returns `403 FORBIDDEN`; evidence is covered by `tests/slices/catalog/catalog.runtime.integration.spec.ts` and proves RBAC denial without catalog writes.
- Authenticated `boss` login through `/api/v1/admin/auth/login` obtains the existing admin cookie/session family, then provisioning returns `201`, and duplicate replay returns controlled `409`; evidence is covered by `tests/slices/catalog/catalog.runtime.integration.spec.ts` plus the full catalog suite.
- Updated runtime/test files pass targeted ESLint verification.

## Evidence
- `npx eslint backend/src/dev-runtime/dev-api-server.ts tests/slices/catalog/catalog.runtime.integration.spec.ts` -> PASS
- `npx jest --config jest.config.cjs --runTestsByPath tests/slices/catalog/catalog.runtime.integration.spec.ts` -> PASS
- `npx jest --config jest.config.cjs tests/slices/catalog` -> PASS (`8` suites, `41` tests)
- Implementation summary and changed-file list: `.tasks/TASK-FT010-09/TASK-FT010-09-S-IMPL-final-report-code-01.md`

## Verdict
- PASS
