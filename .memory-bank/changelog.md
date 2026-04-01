---
description: Лог изменений Memory Bank.
status: active
---
# Changelog

## [2026-03-29] Initial setup
- Created Memory Bank skeleton
- Seeded core docs (product, requirements, testing, backlog)

## [2026-03-30] TASK-FT001-01 docs-first freeze
- Added `catalog-public-api` and `seller-catalog-write-policy` contracts for `FT-001`.
- Linked new contract layer from `FT-001`, `IMPL-FT-001`, and Memory Bank navigation.
- Marked `TASK-FT001-01` done in backlog.

## [2026-03-30] TASK-FT001-02 verification failure
- Verified that `TASK-FT001-02` has no backend scaffold, Prisma baseline, or test harness yet.
- Added bug record and verification artifact for the missing implementation state.
- Marked `TASK-FT001-02` as `failed` and downstream dependent catalog tasks as `blocked`.

## [2026-03-30] TASK-FT001-02 backend scaffold
- Added baseline `backend/prisma/schema.prisma` for `catalog` entities.
- Added layered backend `catalog` slice scaffold and technical `shared` helpers.
- Added backend integration/unit test skeleton files and restored catalog backlog flow after scaffold completion.

## [2026-03-30] TASK-FT001-03 frontend scaffold
- Added `frontend/src/app/router.tsx` public route shell for `catalog`.
- Added frontend `catalog` slice scaffold, shell/runtime-only shared helpers, and frontend test skeleton files.
- Marked `TASK-FT001-03` done and promoted next backend runtime tasks for `FT-001` to `ready`.

## [2026-03-30] TASK-FT001-04 public catalog reads
- Implemented backend public read queries for `shops` and `products` in the owning `catalog` slice.
- Enforced soft-delete filtering for shops, products, and products under deleted shops.
- Added deterministic verification evidence for browse-safe payloads and updated Memory Bank navigation/status notes.

## [2026-03-30] TASK-FT001-04 verification failure
- `/verify TASK-FT001-04` found that repo-level Jest configuration is missing, so task-declared `.spec.ts` tests cannot run through the project harness.
- Added active bug record and follow-up backlog task `TASK-FT001-09` for test runner setup.
- Marked `TASK-FT001-04` as `failed` and blocked dependent `TASK-FT001-07` and `TASK-FT001-08` until re-verification.

## [2026-03-30] TASK-FT001-05 seller shop writes
- Implemented seller-only shop update flow with ownership guard and controlled authorization error.
- Added first-free then manual-paid rename marker logic without touching cross-slice snapshot boundaries.
- Added deterministic runtime evidence and recorded formal verification failure due to missing repo-level Jest config.

## [2026-03-30] TASK-FT001-09 repo-local catalog test runner
- Added root `package.json`, `jest.config.cjs`, and `tsconfig.jest.json` to run existing backend catalog specs from the repository.
- Verified `catalog.unit.spec.ts` and `catalog.integration.spec.ts` through checked-in npm scripts.
- Marked `TASK-FT001-09` done and unblocked `/verify TASK-FT001-04` and `/verify TASK-FT001-05` reruns.

## [2026-03-30] TASK-FT001-04 re-verification pass
- Re-ran `/verify TASK-FT001-04` after `TASK-FT001-09` added repo-local Jest harness.
- `npm run test:catalog:integration` and `npm run test:catalog` now pass.
- Marked `TASK-FT001-04` done and unblocked `TASK-FT001-07`.

## [2026-03-30] TASK-FT001-05 re-verification pass
- Re-ran `/verify TASK-FT001-05` after `TASK-FT001-09` added repo-local Jest harness.
- `npm run test:catalog:unit` and `npm run test:catalog:integration` now pass.
- Marked `TASK-FT001-05` done and unblocked `TASK-FT001-08` from the previous harness blocker.

## [2026-03-30] TASK-FT001-06 seller product writes
- Implemented seller-scoped product create/update flow with owner-only mutation rules inside `catalog`.
- Added target shop linkage validation so seller cannot attach products to foreign shops.
- Verified the task with repo-local unit/integration catalog suites and marked `TASK-FT001-06` done.

## [2026-03-30] TASK-FT001-06 verification pass
- Re-ran `/verify TASK-FT001-06` against the repo-local harness.
- Typecheck, `npm run test:catalog:unit`, `npm run test:catalog:integration`, and `npm run test:catalog` all pass.
- Task remains `done` with formal verification evidence stored in `.tasks/TASK-FT001-06/`.

## [2026-04-01] TASK-FT001-07 public catalog UI wiring
- Wired the frontend `catalog` route to backend public browse reads for shops and per-shop products.
- Added explicit `loading`, `empty`, and `error` view-model states and rendered browse-safe catalog sections without auth assumptions.
- Extended the repo-local catalog Jest harness with frontend API/view-model smoke specs and verified `npm run test:catalog` end-to-end for the current catalog task set.

## [2026-04-01] TASK-FT001-07 verification failure
- `/verify TASK-FT001-07` found that task-level evidence does not cover customer-facing route/page rendering.
- Direct Jest runs for existing `catalog-page.spec.tsx` and `catalog-route.spec.tsx` returned `No tests found` because the repo-local harness matches only `*.spec.ts` files.
- Marked `TASK-FT001-07` as `failed`, created an active bug record, and blocked dependent `TASK-FT001-08` until route/page verification is added.

## [2026-04-01] TASK-FT001-07 verification pass after route/page smoke fix
- Extended the repo-local catalog Jest harness to execute frontend `*.spec.tsx` route/page smoke tests.
- Added deterministic public browse rendering coverage for `CatalogPage` and `CatalogRoute`, including loading, empty, error, and ready states.
- Re-ran `npm run test:catalog` and route/page smoke specs successfully, archived the verification bug, and restored `TASK-FT001-07` to `done`.

## [2026-04-01] TASK-FT001-08 final catalog verification and RTM sync
- Re-ran repo-local typecheck, unit, integration, and combined catalog verification gates for `FT-001`.
- Synced `REQ-001`, `REQ-002`, and `REQ-020` to `done` based on route/page smoke, seller ownership integration, and rename/snapshot-scope evidence.
- Marked `TASK-FT001-08` done and closed the remaining feature-wide verification/docs sync for the current repo scope.
