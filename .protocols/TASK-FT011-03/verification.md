---
description: Verification log for TASK-FT011-03.
status: active
---
# TASK-FT011-03 Verification

## Commands

- `npm run test:catalog:unit -- --runInBand tests/slices/catalog/catalog.unit.spec.ts`
- `npm run test:catalog:integration -- --runInBand tests/slices/catalog/catalog.provisioning.integration.spec.ts`
- `npm run test:catalog`
- `npx eslint "backend/src/slices/catalog/application/catalog.service.ts" "tests/slices/catalog/catalog.unit.spec.ts" "tests/slices/catalog/catalog.provisioning.integration.spec.ts"`

## Result

- Verdict: `PASS`
- Basis: repeated provisioning for the same `sellerId + telegramId + shop name` fails closed before repository writes, while the transactional repository path preserves full rollback semantics for starter bootstrap failures.

## Evidence summary

- Unit coverage proves the service rejects duplicate provisioning targets without calling `repository.provisionSellerShop(...)`.
- Provisioning integration coverage proves the first request commits the full starter bundle and the repeated identical request returns a controlled `SHOP_PROVISIONING_CONFLICT` without extra rows.
- Existing rollback coverage still proves `shop + binding + starter menu pages + starter products` roll back together when starter product creation fails.

## Out-of-scope note

- Fresh rerun on `2026-04-13` of `npm run test:catalog` did **not** complete cleanly because `frontend/src/tests/admin/admin-auth-runtime.spec.tsx` currently fails with `TypeError: fetch failed` / `bad port` inside `backend/src/dev-runtime/dev-api-server.ts`.
- This failure is outside `TASK-FT011-03` scope and does not invalidate the task-specific `REQ-028` evidence above, but it means the broader repo-local `catalog` regression command is not fully green in the current workspace state.
