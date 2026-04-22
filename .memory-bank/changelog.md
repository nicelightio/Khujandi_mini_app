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

## [2026-04-22] Shared storefront DEBUG mode now exposes diagnostics and a backend bypass on the same catalog path
- Added an explicit `REQ-030` / `FT-010` debug-runtime policy: when `DEBUG=TRUE`, the shared storefront may show copyable diagnostics and the mounted `/api/v1/seller/*` runtime may temporarily bypass owner-only shop access through the same canonical `catalog` boundary instead of a second debug API family.
- `scripts/dev-api.ts` now passes the debug flag into the runtime, seller storefront reads/writes emit structured debug logs for media/save/reload traces, and the storefront UI records copyable `load -> edit -> save -> reload` diagnostics to help debug embedded Telegram flows without browser devtools.

## [2026-04-21] Admin protected routes now refresh once before retrying expired access-cookie requests
- Fixed the checked-in `admin-web` drift where `/admin/catalog/shops/provision` and the other protected admin command surfaces could still show `AUTH_REQUIRED` after the page had already rendered an authenticated shell, because route-entry refresh happened only on initial protected navigation and not on later expired access-cookie requests.
- Added a shared frontend admin protected-request helper that performs one `POST /api/v1/admin/auth/refresh` retry before repeating the original protected request, and added focused Jest regression coverage for the provisioning flow so valid refresh-cookie sessions recover instead of failing closed until a manual reload.

## [2026-04-20] Fixed api container Prisma CLI schema discovery for checked-in migrate commands
- Added checked-in Prisma metadata and a pinned repo-local `prisma` dependency in `package.json`, so `docker compose run --rm api npx --yes prisma migrate status|deploy` now resolves `backend/prisma/schema.prisma` from `/app` and uses the repo-compatible CLI instead of a latest-network download.
- Synced the container deploy runbook and archived the active bug after repo-local verification showed Prisma CLI now gets past schema discovery and reaches normal runtime checks instead of failing with `Could not find Prisma Schema`.

## [2026-04-20] Opened deploy bug for missing Prisma schema inside the api container image
- Recorded an active deploy/runtime bug after VPS rollout evidence showed that `docker compose run --rm api npx --yes prisma migrate status|deploy` fails with `Could not find Prisma Schema`, because the checked-in `api` image starts the runtime but does not expose a canonical Prisma schema path for CLI operations.
- This keeps the issue visible in the Memory Bank as a container-image/runbook drift instead of losing it inside shell history while the admin provisioning payload investigation continues.

## [2026-04-20] Admin provisioning shop-list tests now enforce the canonical flat payload
- Tightened the `/admin/catalog/shops/provision` contract coverage so frontend API/route tests, catalog unit coverage, and mounted runtime regressions all require the flat admin-owned list payload with `shopId`, `shopName`, `status`, `sellerId`, `telegramId`, `primaryPublicPath`, and `secondaryPublicPath`.
- Added an explicit no-fallback frontend API test that rejects the older nested list shape, keeping the project on the new catalog payload end-to-end instead of silently tolerating legacy response forms.

## [2026-04-20] Admin contour styling now loads through the shared frontend bootstrap
- Fixed the current `/admin/*` visual regression by importing `frontend/src/admin/styles/admin-theme.css` through the real shared entrypoint `frontend/src/app/main.tsx`, because the old `frontend/src/admin/main.tsx` import path was no longer mounted by `index.html`.
- Kept one shared root-router/bootstrap architecture: `RootRouter` now marks `body[data-root-contour]` for the active contour, and the admin theme scopes its only global selectors to `admin-web` so customer/seller surfaces keep the existing runtime path unchanged.

## [2026-04-20] Catalog storefront routing now uses immutable public paths instead of technical shop ids
- Fixed the checked-in browse/runtime drift so public catalog fetches and storefront links now use persisted `publicPath` rather than raw `shop.id`, while seller-protected storefront resolution remains compatible with both immutable public aliases of the same shop.
- Synced the catalog spec layer around `/shops/:publicPath`, dual immutable public paths (`sellerId + N` plus vanity translit), and the explicit separation between technical `shop.id`, provisioning identity `sellerId + shop name`, and public routing identity; `npm run test:catalog` and `npm run lint` both pass after the update.

## [2026-04-20] Frontend debug mode now gates diagnostics and storefront title uses shop name
- Added a build-time `DEBUG` switch for the web container and a shared frontend debug panel so temporary diagnostics, keyboard test input, and shell/runtime hints appear only when debug mode is enabled.
- Shared storefront pages now use the shop name as the page title, hide the catalog browse count label inside storefront mode, and keep temporary Telegram auth diagnostics behind debug mode instead of showing them in normal production UI.

## [2026-04-20] Mounted storefront seller auth now uses runtime Telegram bot token
- Fixed mounted `dev-runtime` Telegram auth wiring so `POST /api/v1/auth/telegram` reads `TELEGRAM_BOT_TOKEN` from runtime environment instead of validating production Mini App `initData` against a hardcoded test token.
- `scripts/dev-api.ts` and `docker-compose.yml` now pass the bot token through to the runtime, unblocking seller session bootstrap for shared storefront owner access on deployed Mini App flows.

## [2026-04-20] Admin provisioning page now reloads provisioned shops from canonical catalog state
- Added a narrow `catalog`-owned admin read path for `/admin/catalog/shops/provision`, so the page now loads persisted provisioned shop summaries from backend runtime state on first render and after successful provisioning instead of relying only on route-local UI memory.
- Kept public/seller semantics unchanged: public browse still exposes only `WORKING`, while the admin-owned provisioning list intentionally includes both `WORKING` and `NOT_WORKING`; focused frontend, catalog integration, mounted runtime, `npm run test:catalog`, and `npm run lint` all pass.

## [2026-04-20] TASK-FT009-09 verify halted on missing Android Telegram closure evidence
- Repo-local hardening changes for the shell-owned bottom-action and degradation-policy subset now pass lint plus focused Jest coverage, but formal `/verify TASK-FT009-09` still fails because fresh real `Android Telegram` notes for keyboard-open CTA reachability and degraded fallback behavior are not yet recorded.
- Opened active bug `BUG-2026-04-20-task-ft009-09-missing-android-keyboard-evidence` and blocked follow-up `TASK-FT009-10` so the current `/autopilot` run halts on an explicit quality-gate blocker instead of overstating closure.

## [2026-04-20] Catalog Prisma repository split into spec-aligned infrastructure modules
- Refactored `backend/src/slices/catalog/infrastructure/prisma-catalog.repository.ts` into a thin facade over focused Prisma modules for public browse reads, seller reads, seller writes, provisioning, and shared Prisma mapping/event glue.
- Preserved the single `CatalogRepository` boundary and kept provisioning/event semantics inside the owning `catalog` slice, so future catalog work can change one spec-aligned capability module without reopening the whole repository file.

## [2026-04-20] TASK-FT009-09 reconciled degraded Telegram CTA fallback semantics
- Narrowed the shared Telegram bridge capability semantics so degraded Telegram runtime still keeps the shell-owned bottom CTA path on `keyboard-safe` layout while optional shell enhancements remain on the centralized `minimal` policy.
- Re-ran focused `FT-009` frontend gates (`npm run lint` plus targeted Jest coverage for app/shared/checkout shell paths) and synced backlog/feature/testing/bug docs; fresh Android Telegram operator notes still remain the only missing artifact for full closure.

## [2026-04-20] MB sync recorded red-verify concern for TASK-FT009-08
- Synced `FT-009`, backlog, and the root Memory Bank index after `/verify` `PASS` plus post-change `/red-verify` `semantic-concern` for `TASK-FT009-08`: centralized shell capability ownership is correct, but the current reduced-runtime fallback also drops the keyboard-safe bottom-action layout to `inline`.
- Kept the concern attached to the already-planned closure wave `TASK-FT009-09` instead of opening a new bug/task, because the remaining risk is the final reconciliation between repo-local degradation semantics and real Android Telegram evidence.

## [2026-04-20] TASK-FT009-08 centralized minimal shell capability and degradation policy
- Extended the shared Telegram bridge and shell state with one minimal capability snapshot plus one centralized enhanced-vs-minimal shell policy, so optional shell chrome and bottom-action affordances now degrade through one shared path instead of page-level assumptions.
- Added focused app/shared/checkout Jest coverage and re-ran `npm run lint`, while leaving final Android Telegram evidence and full closure of the hardening wave to `TASK-FT009-09`.

## [2026-04-20] MB sync recorded red-verify concern for TASK-FT009-07
- Synced `FT-009` and the root Memory Bank index so they no longer overstate `TASK-FT009-07` as fully risk-closed: the shell-owned bottom action primitive landed, but post-change `red-verify` still flags missing explicit Telegram keyboard-open evidence and the narrow validation scope of the new page-level scroll model.

## [2026-04-20] TASK-FT009-07 added a shell-owned bottom action path for checkout
- Extended `frontend/src/shared/ui/page-shell.tsx` with a shared shell-owned bottom action slot plus keyboard-safe footer styling in `webview-shell.css`, keeping the customer-facing CTA layout path inside the shell boundary instead of page-local placement.
- Moved the checkout primary CTA onto that shell-owned footer primitive and added focused shared/check-out frontend tests proving the CTA now renders through the centralized shell layout path.

## [2026-04-20] FT-011 identical provisioning now keys conflicts only by sellerId plus shop name
- Removed the stale service-level duplicate guard that still reasoned through Telegram bindings instead of the canonical `sellerId + shop name` shop identity, so controlled provisioning conflicts now consistently come from the repository/persistence boundary.
- Added focused unit, integration, and mounted-runtime coverage proving that the same seller cannot be provisioned the same shop name twice even when `telegramId` differs, while multi-shop admin provisioning still works when shop names differ.

## [2026-04-20] TASK-FT011-09 removed mounted single-shop-per-seller drift
- Narrowed the repo-local mounted `catalog` runtime parity fix to `backend/src/dev-runtime/catalog-runtime-prisma.ts`, so `SellerShopBinding` creation no longer rejects a second admin-provisioned shop only because the same seller or Telegram identity already owns another shop.
- Added focused integration and mounted runtime regressions proving one seller identity can own multiple admin-provisioned shops when shop names differ, while identical `sellerId + shop name` provisioning still returns the controlled `SHOP_PROVISIONING_CONFLICT` behavior.

## [2026-04-20] Spec layer clarified multi-shop admin provisioning policy for catalog
- Clarified `REQ-028`, the catalog provisioning contract, `FT-011`, and testing guidance so one seller/Telegram identity may own multiple shops when those shops are created through admin provisioning, while the canonical conflict key remains `sellerId + shop name`.
- Added active backlog card `TASK-FT011-09` to fix the mounted runtime/test drift where the repo-local provisioning path can still behave like single-shop-per-seller despite the spec baseline.

## [2026-04-19] Dev runtime server refactored into focused runtime modules without contract drift
- Split `backend/src/dev-runtime/dev-api-server.ts` into focused `catalog-runtime`, `admin-access-runtime`, `checkout-payment-runtime`, and `http-runtime` modules while keeping `dev-api-server.ts` as the composition root and preserving the existing exported test/runtime helpers.
- Re-ran the mounted `catalog` runtime regression suite and the full `admin-access` suite to confirm the repo-local auth/catalog routes, durable runtime behavior, and helper exports remained behaviorally unchanged.

## [2026-04-19] Container deploy now persists DB-backed catalog runtime across api container recreate
- Updated `docker-compose.yml` so the checked-in `api` container now mounts a named Docker volume and passes explicit `CATALOG_DB_PATH=/var/lib/khujandi/catalog-runtime.sqlite`, preventing admin provisioning and seller catalog writes from living only inside one container filesystem.
- Synced `.memory-bank/runbooks/telegram-mini-app-container-deploy.md` with the same durable catalog runtime requirement plus post-rollout verification commands for the mounted SQLite path/volume.

## [2026-04-19] Admin auth runtime sessions now survive api restart on the same persisted DB path
- Replaced the checked-in `dev-runtime` in-memory `admin-access` state with a persisted SQLite-backed runtime store behind explicit `ADMIN_DB_PATH`, so deploy/restart no longer invalidates otherwise valid admin cookie sessions only because the container forgot its `adminSession` records.
- Updated the container deploy runbook and compose env surface to mount `ADMIN_DB_PATH=/var/lib/khujandi/admin-access-runtime.sqlite`, and added a restart regression for admin login/refresh continuity on the same DB path.

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
