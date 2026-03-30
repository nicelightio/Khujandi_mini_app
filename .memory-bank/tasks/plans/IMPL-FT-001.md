---
description: Implementation plan для FT-001 catalog browse and seller management.
status: active
---
# IMPL-FT-001

## Goal

Доставить `FT-001` как owning `catalog` slice: публичная витрина shops/products без auth, seller-scoped catalog writes и rename policy без нарушения snapshot invariant.

## Current state

- `TASK-FT001-01` completed the contract/docs freeze for `catalog` public reads and seller write policy.
- `TASK-FT001-02` created baseline runtime directories for `backend/` and backend-side `tests/`.
- `TASK-FT001-03` created baseline runtime directories for `frontend/` and frontend-side tests.
- План включает scaffold шаги, которые подготовят реальную реализацию без speculative shared abstractions.

## REQs

- `REQ-001`
- `REQ-002`
- `REQ-020`

## Normative inputs

- [.memory-bank/features/FT-001-catalog-browse-and-seller-management.md](../../features/FT-001-catalog-browse-and-seller-management.md): acceptance criteria и edge cases.
- [.memory-bank/contracts/catalog-public-api.md](../../contracts/catalog-public-api.md): public browse boundary for shops/products.
- [.memory-bank/contracts/seller-catalog-write-policy.md](../../contracts/seller-catalog-write-policy.md): seller ownership and rename policy boundary.
- [.memory-bank/epics/EP-001-customer-ordering-experience.md](../../epics/EP-001-customer-ordering-experience.md): parent epic context.
- [.memory-bank/architecture/system-contours-and-slices.md](../../architecture/system-contours-and-slices.md): slice/layer boundaries.
- [.memory-bank/architecture/data-boundaries-and-persistence.md](../../architecture/data-boundaries-and-persistence.md): persistence ownership и snapshot rules.
- [.memory-bank/guides/slice-implementation-playbook.md](../../guides/slice-implementation-playbook.md): practical slice implementation rules.
- [.memory-bank/guides/storage-and-state-implementation.md](../../guides/storage-and-state-implementation.md): soft-delete, snapshots и state boundaries.
- [.memory-bank/testing/index.md](../../testing/index.md): quality gates и minimum verification.

## Constraints

- Нет отдельного seller slice вне `catalog`.
- Public browse читается без auth.
- Seller ownership enforcement обязателен для write flows.
- `shop_name_snapshot` в заказах не должен меняться при rename магазина.
- После первой бесплатной попытки rename помечается как paid/manual accounting path без отдельного online charge.

## Steps

1. Freeze catalog-facing API/data contract и уточнить docs-first boundary для shops/products/rename policy.
2. Scaffold backend `catalog` slice, Prisma baseline и test directories.
3. Scaffold frontend `catalog` slice и public route shell.
4. Реализовать public read path для shops/products с soft-delete filtering.
5. Реализовать seller-scoped shop/product writes с ownership guards.
6. Реализовать rename policy и guard против cross-table side effects.
7. Подключить public catalog UI к backend read path.
8. Добавить integration/unit/e2e coverage и выполнить docs sync.

## Expected touched files

- `.memory-bank/contracts/catalog-public-api.md`
- `.memory-bank/contracts/seller-catalog-write-policy.md`
- `backend/prisma/schema.prisma`
- `backend/src/slices/catalog/**/*`
- `backend/src/shared/**/*`
- `tests/slices/catalog/**/*`
- `frontend/src/slices/catalog/**/*`
- `frontend/src/app/router.tsx`
- `frontend/src/shared/**/*`
- `frontend/src/tests/slices/catalog/**/*`

## Tests

- backend integration: public catalog browse + soft-delete filtering
- backend integration: seller ownership for shop/product writes
- backend unit: rename pricing flag and no cross-table mutation side effects
- frontend e2e/UI smoke: unauthenticated browse of catalog

## Quality gates

- lint / typecheck
- unit tests
- integration tests
- e2e smoke for `catalog`

## UAT steps

1. Открыть Mini App без auth и убедиться, что список shops/products доступен.
2. Проверить, что soft-deleted shop/product не попадает в customer-facing browse.
3. Под seller context изменить свою shop/product entity и убедиться, что чужие сущности недоступны для write.
4. Переименовать магазин один раз бесплатно, затем повторно и увидеть paid/manual flag path.
5. Убедиться, что rename не пытается менять historical order snapshot data.
