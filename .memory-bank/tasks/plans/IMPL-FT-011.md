---
description: Implementation plan для FT-011 DB-backed catalog runtime, durable provisioning и restart-safe storefront resolution.
status: active
---
# IMPL-FT-011

## Goal

Доставить `FT-011` как runtime hardening для owner slice `catalog`: repo-local canonical runtime path, admin provisioning, seller-protected reads/writes и public storefront resolution должны работать поверх durable DB-backed persistence, переживать restart/reset и не зависеть от route-local in-memory/demo state.

## Current state

- `backend/src/slices/catalog/presentation/catalog.module.ts` уже собирает `CatalogController` через `PrismaCatalogRepository`, то есть DB-backed repository boundary в коде существует.
- `backend/src/dev-runtime/dev-api-server.ts` по-прежнему поднимает repo-local API c `new InMemoryCatalogRepository(catalogState)` и скрытым `seededShops/seededProducts` baseline, поэтому provisioning и seller writes не определяют canonical runtime result.
- `tests/slices/catalog/catalog.runtime.integration.spec.ts` опирается на текущий mounted runtime server path, который сегодня не доказывает durability после restart/reset.
- `FT-010` уже закрыл seller behavior/contour semantics, но текущая runtime wiring все еще допускает успех provisioning без restart-safe storefront resolution.
- `backend/src/slices/catalog/**/*` и Prisma baseline позволяют целиться в узкий runtime switch без создания нового slice или второго storefront implementation.

## REQs

- `REQ-027`
- `REQ-028`

## Verification targets

- `POST /api/v1/admin/catalog/shops/provision`
- repo-local `dev:api` / mounted backend catalog runtime bootstrap
- shared storefront route `/shops/:publicPath`
- seller-protected catalog reads and writes after restart/reset

## Normative inputs

- [.memory-bank/features/FT-011-db-backed-catalog-runtime-baseline.md](../../features/FT-011-db-backed-catalog-runtime-baseline.md): feature acceptance, edge cases и verification targets.
- [.memory-bank/epics/EP-001-customer-ordering-experience.md](../../epics/EP-001-customer-ordering-experience.md): parent epic success criteria.
- [.memory-bank/requirements.md](../../requirements.md): `REQ-027`, `REQ-028` и RTM.
- [.memory-bank/contracts/catalog-public-api.md](../../contracts/catalog-public-api.md): public storefront reads must use persisted catalog state.
- [.memory-bank/contracts/catalog-seller-provisioning-and-visibility.md](../../contracts/catalog-seller-provisioning-and-visibility.md): atomic provisioning, seller binding и visibility rules.
- [.memory-bank/contracts/catalog-seller-access-and-session.md](../../contracts/catalog-seller-access-and-session.md): seller reads/writes on canonical persisted state.
- [.memory-bank/contracts/seller-catalog-write-policy.md](../../contracts/seller-catalog-write-policy.md): seller writes must land in durable persistence.
- [.memory-bank/architecture/system-contours-and-slices.md](../../architecture/system-contours-and-slices.md): one canonical runtime path across contours.
- [.memory-bank/architecture/data-boundaries-and-persistence.md](../../architecture/data-boundaries-and-persistence.md): durable persistence boundary for catalog runtime.
- [.memory-bank/testing/index.md](../../testing/index.md): mandatory automated gates and manual restart smoke requirement.

## Constraints

- Owning slice остается `catalog`; runtime hardening не должен распылять catalog business rules в `shared`.
- In-memory/demo adapters могут оставаться только как bounded test/tooling helpers и MUST NOT быть default runtime path.
- Clean DB-backed baseline допустим; legacy in-memory data migration/backfill не требуется.
- Public `mini-app`, shared seller storefront, narrow `seller-web` и admin-side provisioning обязаны читать/писать один canonical persisted catalog state.
- Final feature closure требует explicit manual durability smoke evidence после runtime restart/reset.

## Invariants

- Successful provisioning persists `shop`, seller binding, starter menu pages и starter products atomically or rolls back entirely.
- Duplicate/conflicting provisioning fails closed and leaves no partial catalog state.
- Runtime restart/reset must not make previously successful catalog writes disappear.
- `/shops/:publicPath` and related catalog reads must not fabricate success from process-local fallback state.
- Seller-protected writes remain durable after restart/reset and continue to respect existing ownership/no-delete semantics from `FT-010`.

## Steps

1. Перевести repo-local mounted `catalog` runtime path и нужный bootstrap away from default `InMemoryCatalogRepository` to the checked-in Prisma-backed module.
2. Зафиксировать DB-backed local bootstrap/seed baseline, чтобы runtime start больше не зависел от hidden process-local seeded storefront state.
3. Довести admin provisioning до явно transactional persistence semantics с controlled duplicate/conflict failure и rollback coverage.
4. Перевести shared storefront и seller-protected catalog reads/writes на canonical persisted state, чтобы restart/reset не ломал public/seller storefront resolution.
5. Добавить automated runtime/integration regressions, которые доказывают durability и restart-safe behavior на mounted repo-local path.
6. Закрыть feature manual restart smoke evidence, RTM/docs sync и final verify narrative.

## Expected touched files

- `.protocols/FT-011/plan.md`
- `.protocols/FT-011/decision-log.md`
- `.memory-bank/index.md`
- `.memory-bank/changelog.md`
- `.memory-bank/tasks/backlog.md`
- `.memory-bank/tasks/plans/index.md`
- `.memory-bank/tasks/plans/IMPL-FT-011.md`
- `.memory-bank/features/FT-011-db-backed-catalog-runtime-baseline.md`
- `.memory-bank/requirements.md`
- `.memory-bank/testing/index.md`
- `.memory-bank/runbooks/*` if a dedicated durability smoke runbook is introduced during execution
- `backend/src/dev-runtime/**/*`
- `backend/src/shared/db/**/*`
- `backend/src/slices/catalog/**/*`
- `backend/prisma/schema.prisma` and Prisma rollout artifacts if durability gaps require schema alignment
- `tests/slices/catalog/**/*`
- `frontend/src/slices/catalog/**/*` only if restart-safe storefront resolution exposes UI-state drift that needs correction
- `.tasks/TASK-FT011-06/**/*`

## Tests

- `npm run test:catalog:unit`
- `npm run test:catalog:integration`
- targeted runtime/integration coverage for provisioning commit/rollback, duplicate/conflict failure, persisted storefront reads after restart/reset
- frontend storefront smoke only if canonical persisted runtime switch changes route behavior

## Quality gates

- `npm run lint`
- `npm run test:catalog`
- `npm run build:frontend` if frontend storefront wiring changes
- final manual `provision -> restart/reset -> /shops/:publicPath` smoke evidence

## UAT steps

1. Запустить repo-local DB-backed runtime baseline и убедиться, что public storefront читается из persisted catalog data, а не из hidden seeded memory state.
2. Через admin provisioning создать новый shop с seller binding и starter catalog bootstrap; подтвердить success response и наличие persisted rows.
3. Перезапустить runtime или явно сбросить process memory без очистки DB, затем открыть `/shops/:publicPath` и seller-protected shop reads для того же shop.
4. Подтвердить, что storefront, starter menu pages/products и later seller edits остались доступными после restart/reset.
5. Повторить provisioning с duplicate/conflicting identity/input и убедиться, что возвращается controlled error без partial state.
6. Проверить, что runtime при отсутствии persisted data возвращает controlled not-found/error states, а не synthetic success из process-local fallback.
