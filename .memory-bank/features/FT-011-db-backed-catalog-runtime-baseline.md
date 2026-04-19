---
description: Feature C4 L3 для DB-backed catalog runtime, durable provisioning и restart-safe storefront resolution.
status: active
---
# FT-011 DB-Backed Catalog Runtime Baseline

## REQs

- `REQ-027`, `REQ-028`

## Current implementation state

- Checked-in `catalog` slice already has Prisma persistence primitives and `PrismaCatalogRepository`.
- `TASK-FT011-01` switched the checked-in repo-local mounted `catalog` runtime off the default `InMemoryCatalogRepository` path and onto the Prisma-backed module surface, so the mounted server now exercises the same repository boundary as the owning slice.
- `TASK-FT011-02` replaced the hidden process-local demo seed arrays with an explicit checked-in seed baseline plus a SQLite-backed runtime state store, so repo-local startup/restart now reuses persisted catalog bootstrap state instead of fabricating it from in-memory constants.
- `TASK-FT011-03` hardened admin provisioning so repeated identical `sellerId + telegramId + shop name` requests now fail closed before repo writes, while the transactional `shop + binding + starter catalog bootstrap` rollback path remains covered by integration tests.
- `TASK-FT011-07` moved the remaining duplicate/conflict guarantee onto the persistence boundary: catalog provisioning now relies on a canonical durable `sellerId + shop name` uniqueness key, so concurrent identical retries collapse to one persisted starter bundle instead of racing past the service-layer precheck.
- `TASK-FT011-08` closes that follow-up: seller rename writes now map the same durable `sellerId + shop name` uniqueness invariant to an explicit controlled `SHOP_RENAME_CONFLICT` contract, and the mounted repo-local runtime mirrors that behavior instead of leaking raw persistence failures or silently allowing duplicate owned shop names.
- `TASK-FT011-04` closes the remaining mounted seller/storefront read-path drift inside the checked-in runtime shell: seller capability checks and `GET /api/v1/seller/shops/:shopId` now resolve through repository-backed catalog reads rather than direct `catalogState` access, and restart coverage proves seller storefront data survives runtime restart on the same persisted DB path.
- `TASK-FT011-05` closes the automated regression follow-up for the mounted repo-local path: runtime coverage now proves persisted provisioning success survives restart and repeated identical provisioning still fails through the controlled conflict contract after restart on the same DB path, without creating duplicate or partial starter bundles.
- `TASK-FT011-06` closes the feature: final automated gates were rerun and manual restart-smoke evidence now shows a newly provisioned working shop plus a later seller edit surviving runtime restart on the same DB path, with public browse inputs and seller storefront payloads still resolving from persisted catalog state.
- `FT-010` continues to own seller storefront/store-admin behavior and ownership semantics; `FT-011` now owns the durable DB-backed runtime baseline for those same catalog surfaces.
- Legacy demo or in-memory catalog state is not a compatibility target for this feature; a clean DB-backed baseline is acceptable.

## Use cases

- Администратор provision-ит новый магазин, привязывает seller-а, а стартовые menu pages/products сохраняются как обычные durable catalog данные.
- После runtime restart/reset тот же магазин остается доступным для admin, seller и public storefront resolution.
- Shared storefront и узкая `seller-web` админка читают и пишут каноничные catalog данные из DB-backed runtime, а не из route-local process memory.
- Repo-local seed/start path поднимает persistent catalog baseline вместо скрытого process-local demo state.

## Acceptance criteria

- Канонический backend runtime path для `catalog` provisioning, seller reads/writes и public storefront resolution является DB-backed.
- Успешный admin provisioning durably persist-ит `shop`, seller binding, starter menu pages и starter products как обычные catalog записи.
- Успешно созданные через provisioning или later seller edits catalog данные переживают runtime restart/reset.
- `/shops/:shopId`, public browse и seller-protected shop reads резолвятся из canonical persisted catalog state, а не из synthetic или route-local in-memory state.
- Provisioning остается атомарным: `shop`, seller binding и starter catalog bootstrap либо commit-ятся вместе, либо целиком roll back.
- Duplicate/conflicting provisioning requests возвращают controlled error и не создают partial или duplicate catalog state.
- Concurrent identical provisioning retries also collapse to one durable starter bundle because the canonical conflict check now lives at the repository/DB boundary.
- In-memory/demo adapters, если они остаются для tests или bounded tooling, являются non-normative и MUST NOT быть default runtime path для `catalog`.

## Edge cases & failure modes

- Duplicate provisioning для того же canonical seller binding или того же target shop identity MUST fail closed без partial rows, включая concurrent retries against the same `sellerId + shop name` identity.
- Ошибка на шаге starter bootstrap после создания shop MUST roll back всю provisioning operation.
- Runtime restart после успешного provisioning или seller edit MUST NOT делать магазин недоступным.
- Отсутствие DB-backed catalog данных может возвращать controlled not-found/error states, но runtime MUST NOT фабриковать success из process-local fallback state.
- Clean DB-backed baseline допустим; legacy in-memory backfill не требуется.

## Constraints / invariants

- Owning slice остается `catalog`.
- Для первой closure этого feature допустимо считать нормативным single-instance API topology; multi-instance rollout не обязателен.
- Feature не требует отдельного ADR или новой standalone runtime-boundary сущности; DB-backed norm выражается через этот feature и связанные contracts/architecture docs.
- Catalog events могут оставаться вне minimum closure criteria именно этого feature, но durable catalog data и transactional provisioning обязательны.
- Persistent seed/start-data path входит в scope; скрытый process-local demo bootstrap не считается достаточным baseline.

## Normative inputs

- [.memory-bank/features/FT-010-seller-storefront-editing-and-store-admin.md](FT-010-seller-storefront-editing-and-store-admin.md): seller storefront/store-admin behavior, который должен лечь на durable runtime baseline.
- [.memory-bank/contracts/catalog-public-api.md](../contracts/catalog-public-api.md): public storefront read boundary.
- [.memory-bank/contracts/catalog-seller-provisioning-and-visibility.md](../contracts/catalog-seller-provisioning-and-visibility.md): provisioning, seller binding и visibility rules.
- [.memory-bank/contracts/catalog-seller-access-and-session.md](../contracts/catalog-seller-access-and-session.md): seller access/session boundary поверх canonical catalog state.
- [.memory-bank/contracts/seller-catalog-write-policy.md](../contracts/seller-catalog-write-policy.md): seller write ownership и no-delete policy.
- [.memory-bank/architecture/data-boundaries-and-persistence.md](../architecture/data-boundaries-and-persistence.md): durable catalog persistence boundary.
- [.memory-bank/architecture/system-contours-and-slices.md](../architecture/system-contours-and-slices.md): contour rules и единый owner slice.
- [.memory-bank/testing/index.md](../testing/index.md): quality gates и manual durability smoke basis.

## Verification targets

- `POST /api/v1/admin/catalog/shops/provision`
- shared storefront route `/shops/:shopId`
- seller-protected shop reads and writes
- checked-in repo-local `catalog` runtime bootstrap

## Test strategy pointers

- integration: provisioning commit/rollback semantics для `shop + binding + starter catalog bootstrap`.
- integration/runtime: duplicate/conflict provisioning остается controlled и side-effect free.
- runtime/manual smoke: `provision shop -> runtime restart/reset -> open /shops/:shopId -> same storefront still resolves from persisted data`.
- verify: repo-local automated gates могут оставаться `lint/typecheck/unit/integration/e2e`, но final closure для `FT-011` дополнительно требует explicit manual durability smoke evidence.

## Verification closure

- `FT-011` is closed: `TASK-FT011-01`, `TASK-FT011-02`, `TASK-FT011-03`, `TASK-FT011-04`, `TASK-FT011-05`, `TASK-FT011-07`, and `TASK-FT011-08` established the DB-backed mounted runtime baseline, transactional/conflict-safe provisioning, persisted seller/public read paths, and restart-aware automated regressions; `TASK-FT011-06` then reran the final catalog gates and added explicit manual restart-smoke evidence that `provision -> seller edit -> restart -> public/seller storefront reads` stays on canonical persisted catalog state.
