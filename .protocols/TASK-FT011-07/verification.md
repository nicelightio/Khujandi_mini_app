---
description: Verification log for TASK-FT011-07.
status: active
---
# TASK-FT011-07 Verification

## Commands

- `npm run test:catalog:integration -- --runInBand tests/slices/catalog/catalog.provisioning.integration.spec.ts`
- `npm run test:catalog:integration -- --runInBand --testNamePattern "keeps identical mounted provisioning requests fail-closed with one durable starter bundle" tests/slices/catalog/catalog.runtime.integration.spec.ts`
- `npx eslint "backend/src/dev-runtime/dev-api-server.ts" "tests/slices/catalog/catalog.provisioning.integration.spec.ts" "tests/slices/catalog/catalog.runtime.integration.spec.ts"`
- `npm run test:catalog`
- `npm run test:catalog -- --runInBand tests/slices/admin-access/admin-auth-http.integration.spec.ts`

## Result

- Verdict: `PASS`
- Basis: `REQ-028`, the `FT-011` duplicate/conflict acceptance criteria, and the task-card verify target are satisfied: the authoritative conflict check now lives on a durable persistence boundary, and repeated/concurrent identical provisioning leaves exactly one starter bundle.

## Evidence summary

- Static evidence:
  - `backend/prisma/schema.prisma:86` defines durable `@@unique([sellerId, name])` on `Shop`.
  - `backend/prisma/migrations/20260413120000_add_shop_identity_uniqueness/migration.sql:1` adds the DB uniqueness constraint.
  - `backend/src/slices/catalog/application/catalog.service.ts:141` still keeps the fast-fail precheck, but `catalog.service.ts:157` now maps persistence-boundary unique violations to controlled `SHOP_PROVISIONING_CONFLICT` `409` responses.
  - `backend/src/dev-runtime/dev-api-server.ts:340` mirrors the same uniqueness rule in the in-memory/runtime helper so mounted behavior stays aligned.
- Dynamic evidence:
  - `tests/slices/catalog/catalog.provisioning.integration.spec.ts:341` passed and proves two concurrent identical provisioning attempts produce exactly one success, one controlled conflict, and one persisted `shop + binding + menuPages + products` bundle.
  - `tests/slices/catalog/catalog.runtime.integration.spec.ts:297` passed and proves the mounted runtime returns statuses `[201, 409]` for identical concurrent provisioning while runtime state still contains exactly one starter bundle.
  - Focused ESLint on the touched runtime/test files passed with no reported findings.

## Gate notes

- `npm run test:catalog` was not fully clean in this verify session: one unrelated `admin-access` spec (`tests/slices/admin-access/admin-auth-http.integration.spec.ts`) failed under the full parallel suite with `TypeError: fetch failed` / `bad port` from `createRuntimeCookieSessionClient(...)` in `backend/src/dev-runtime/dev-api-server.ts:1530`.
- The same failing spec passed immediately when re-run in isolation with `--runInBand`, so this looks like an existing broader-suite instability outside the `TASK-FT011-07` scope, not a catalog provisioning regression.
