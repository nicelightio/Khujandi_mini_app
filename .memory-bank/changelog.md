---
description: Лог изменений Memory Bank.
status: active
---
# Changelog

## Archive

- [.memory-bank/changelog/archive/changelog-full-pre-compaction-2026-04-19.md](changelog/archive/changelog-full-pre-compaction-2026-04-19.md): Полная historical копия исходного `changelog.md` до compaction; canonical archive source.
- [.memory-bank/changelog/archive/index.md](changelog/archive/index.md): Роутер по архивам changelog.
- [.memory-bank/changelog/archive/2026-03-to-2026-04-02.md](changelog/archive/2026-03-to-2026-04-02.md): Summary/navigation archive для истории от initial setup до `2026-04-02`.
- [.memory-bank/changelog/archive/2026-04-03-to-2026-04-12.md](changelog/archive/2026-04-03-to-2026-04-12.md): Summary/navigation archive для execution/verify/review waves от `2026-04-03` до `2026-04-12`.

> `/mb-sync` продолжает писать новые записи именно в этот файл. Старые записи периодически переносятся в archive layer без смены canonical path.

## Recent entries

## [2026-04-19] Container deploy now persists DB-backed catalog runtime across api container recreate
- Updated `docker-compose.yml` so the checked-in `api` container now mounts a named Docker volume and passes explicit `CATALOG_DB_PATH=/var/lib/khujandi/catalog-runtime.sqlite`, preventing admin provisioning and seller catalog writes from living only inside one container filesystem.
- Synced `.memory-bank/runbooks/telegram-mini-app-container-deploy.md` with the same durable catalog runtime requirement plus post-rollout verification commands for the mounted SQLite path/volume.

## [2026-04-19] Restored full historical archive sources after compaction mistake
- Added canonical full-archive copies for pre-compaction `tasks/backlog.md` and `changelog.md`, so no historical lines remain stranded only in summary archives.
- Reclassified the feature-group/date-range archive files as summary/navigation layer and updated active routers to point to the new full historical source files.

## [2026-04-19] MB garden maintenance completed
- Ran `/mb-garden` quick check: no TBD/TODO gaps found, no lint script available.
- MB-SYNC: duo docs (architecture ↔ guides) links verified, RTM aligned, backlog status synced.
- Lint passes. No drift or cleanup needed.

## [2026-04-19] MB sync aligned container deploy runbook routing
- Renamed the checked-in container deploy runbook file to `.memory-bank/runbooks/telegram-mini-app-container-deploy.md` so the runbooks router, architecture docs, guides, and root Memory Bank index all resolve to the actual canonical file again.
- Preserved the current runbook content while closing the navigation drift introduced by the temporary `deploy_kzServ_docker.md` filename.

## [2026-04-17] TASK-FT011-06 FT-011 verified with manual restart-durability closure
- Re-ran the final repo-local quality gates with `npm run lint` and `npm run test:catalog`, then captured explicit manual restart-smoke evidence for `admin provisioning -> seller edit -> runtime restart -> public/seller storefront reads` on the same SQLite DB path.
- Promoted `REQ-027` and `REQ-028` from `implemented` to `verified`, marked `TASK-FT011-06` done, and updated the `FT-011` feature/index/testing docs so the DB-backed `catalog` runtime baseline is now the canonical verified closure.

## [2026-04-17] TASK-FT011-05 mounted durability regressions now cover restart-safe conflict behavior
- Added a focused mounted runtime regression proving that repeated identical admin provisioning still returns the controlled `SHOP_PROVISIONING_CONFLICT` contract after runtime restart on the same persisted catalog DB path and leaves exactly one durable starter bundle.
- Added `npm run test:catalog:runtime` as an explicit rerunnable gate for repo-local mounted `catalog` runtime regressions, then re-ran that suite plus the full `npm run test:catalog` command before marking the task done.

## [2026-04-17] TASK-FT011-04 mounted seller/storefront reads now use repository-backed persisted catalog state
- Replaced the remaining direct `catalogState` reads in the mounted catalog runtime shell for seller capability checks and seller storefront payload resolution, so `POST /api/v1/auth/telegram` and `GET /api/v1/seller/shops/:shopId` now go through the same repository-backed `catalog` read path as the owning slice.
- Added repository-backed seller menu-page/product reads plus a mounted runtime restart regression proving provisioned seller storefront data and later seller edits remain available after restarting against the same catalog DB path.
- Re-ran focused ESLint for the touched files and the full `npm run test:catalog` suite before marking the task done.

## [2026-04-13] TASK-FT011-08 seller rename conflict semantics on the durable shop identity key
- Reconciled seller rename writes with the durable `Shop(sellerId, name)` invariant: `CatalogService.updateSellerShop(...)` now maps uniqueness violations to controlled `SHOP_RENAME_CONFLICT` `409` semantics instead of leaking raw persistence failures.
- Aligned the repo-local in-memory/runtime helpers with the same rename-time uniqueness rule and added focused unit/integration/mounted-runtime regressions before re-running `npm run test:catalog` and `npm run lint`.

## [2026-04-13] TASK-FT011-07 red-verify follow-up for seller rename conflict semantics
- `red-verify` for `TASK-FT011-07` confirmed the original provisioning race is closed, but found a semantic concern: the new durable `Shop(sellerId, name)` uniqueness key also governs seller rename writes and is not yet reconciled with a controlled conflict contract on that path.
- Added `TASK-FT011-08` as a ready follow-up to keep the persistence-boundary hardening while aligning seller rename collisions with the project error contract and test surface.

## [2026-04-13] TASK-FT011-07 race-safe provisioning conflicts at the persistence boundary
- Added a canonical durable `sellerId + shop name` uniqueness key for `catalog` provisioning, so identical concurrent admin retries now fail closed at the repository/DB boundary instead of relying only on the application-layer precheck.
- Aligned the in-memory/runtime helper with the same uniqueness rule and added hostile integration/runtime coverage proving repeated or concurrent identical provisioning leaves exactly one starter `shop + binding + menu pages + products` bundle.
- Re-ran focused catalog integration/runtime checks, focused ESLint for the touched files, and the full `npm run test:catalog` suite before marking the task done.

## [2026-04-13] TASK-FT011-03 red-verify follow-up for race-safe duplicate provisioning
- `red-verify` for `TASK-FT011-03` found a semantic concern: the new duplicate guard blocks serialized identical replays, but it still lives above the persistence boundary and is not race-safe under concurrent retries.
- Added `TASK-FT011-07` as a ready follow-up to move duplicate/conflict enforcement onto a canonical repository/DB boundary so `REQ-028` stays fail-closed beyond narrow sequential tests.

## [2026-04-13] TASK-FT011-03 transactional provisioning duplicate guard
- Hardened `CatalogService.provisionSellerShop(...)` so repeated identical `sellerId + telegramId + shop name` requests now fail closed before repository writes instead of relying only on downstream uniqueness errors.
- Added focused unit/integration coverage proving identical repeated provisioning leaves the starter `shop + binding + menu pages + products` bundle unchanged, while the existing rollback regression still protects atomic failure behavior.
- Re-ran `npm run test:catalog` and focused ESLint on the touched catalog files before marking the task done.

## [2026-04-13] TASK-FT011-02 persistent catalog seed baseline replaces hidden demo bootstrap
- Replaced the mounted runtime's hidden `seededShops/seededProducts` bootstrap with the explicit checked-in seed file `backend/prisma/seeds/catalog-runtime-baseline.json`.
- Added a SQLite-backed catalog runtime state store and wired `scripts/dev-api.ts` to a stable repo-local DB path, so repo-local startup/restart now reuses persisted catalog state instead of fabricating storefront availability from process-local demo memory.
- Added a focused restart regression and re-ran the full catalog suite; broader canonical persisted read-path closure still remains with later `FT-011` tasks.

## [2026-04-13] TASK-FT011-01 mounted catalog runtime now uses the Prisma-backed module
- Replaced the default repo-local `dev:api` catalog mount from `InMemoryCatalogRepository` to the checked-in Prisma-backed `catalog` module surface, while keeping the in-memory adapter explicit for isolated tests only.
- Added runtime regression coverage proving the mounted server now boots with `PrismaCatalogRepository`; durable DB-backed seed/bootstrap and restart-safe closure still remain with later `FT-011` tasks.
- Synced `requirements.md` and `tasks/backlog.md` so `REQ-027/028` now reflect `implemented` lifecycle rather than `planned`, while final `verified` closure still remains with later `FT-011` durability work.

## [2026-04-13] FT-011 implementation plan and backlog decomposition
- Added `.protocols/FT-011/{plan,decision-log}.md`, `.memory-bank/tasks/plans/IMPL-FT-011.md`, and a dedicated `FT-011` backlog section with execution-ready task cards for DB-backed runtime switch, transactional provisioning, durability regressions, and final restart-smoke closure.
- Updated `tasks/plans/index.md`, `tasks/backlog.md`, and the root Memory Bank index so `FT-011` is now ready for `/execute` task-by-task delivery.

## [2026-04-13] FT-011 DB-backed catalog runtime re-baseline
- Added `.memory-bank/features/FT-011-db-backed-catalog-runtime-baseline.md` plus `REQ-027/028` to move `catalog` onto a normative DB-backed runtime baseline with durable provisioning, canonical persisted storefront resolution, and restart-safe behavior.
- Updated `EP-001`, `FT-001`, `FT-010`, `requirements`, catalog contracts, architecture, and testing docs so seller contour behavior remains with `FT-010`, while durable runtime closure is now tracked separately by `FT-011`.
