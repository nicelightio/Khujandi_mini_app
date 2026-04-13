---
description: План декомпозиции FT-011 в implementation plan и execution-ready backlog.
status: active
---
# FT-011 Decomposition Plan

## Goal

- Разложить `FT-011` на атомарные implementation tasks для перевода checked-in `catalog` runtime с process-local in-memory wiring на canonical DB-backed baseline с durable provisioning, transactional starter bootstrap и restart-safe storefront resolution.

## Inputs used

- [.memory-bank/features/FT-011-db-backed-catalog-runtime-baseline.md](../../.memory-bank/features/FT-011-db-backed-catalog-runtime-baseline.md): owning feature spec, acceptance criteria и verification targets.
- [.memory-bank/epics/EP-001-customer-ordering-experience.md](../../.memory-bank/epics/EP-001-customer-ordering-experience.md): parent epic и customer/seller runtime outcome.
- [.memory-bank/requirements.md](../../.memory-bank/requirements.md): `REQ-027`, `REQ-028` и RTM.
- [.memory-bank/contracts/catalog-public-api.md](../../.memory-bank/contracts/catalog-public-api.md): public storefront read boundary from persisted state.
- [.memory-bank/contracts/catalog-seller-provisioning-and-visibility.md](../../.memory-bank/contracts/catalog-seller-provisioning-and-visibility.md): transactional provisioning, seller binding и visibility rules.
- [.memory-bank/contracts/catalog-seller-access-and-session.md](../../.memory-bank/contracts/catalog-seller-access-and-session.md): seller-protected reads/writes operate on canonical persisted state.
- [.memory-bank/contracts/seller-catalog-write-policy.md](../../.memory-bank/contracts/seller-catalog-write-policy.md): seller writes must land in durable persistence.
- [.memory-bank/architecture/system-contours-and-slices.md](../../.memory-bank/architecture/system-contours-and-slices.md): one owner slice and one canonical runtime path across contours.
- [.memory-bank/architecture/data-boundaries-and-persistence.md](../../.memory-bank/architecture/data-boundaries-and-persistence.md): durable catalog persistence boundary.
- [.memory-bank/testing/index.md](../../.memory-bank/testing/index.md): quality gates and mandatory manual durability smoke.

## Current repository state

- `backend/src/slices/catalog/presentation/catalog.module.ts` already exposes `createCatalogModule(...)` on top of `PrismaCatalogRepository`.
- `backend/src/dev-runtime/dev-api-server.ts` still mounts `CatalogController(new CatalogService(new InMemoryCatalogRepository(catalogState)))` as the repo-local default runtime path.
- The same `dev-runtime` file seeds catalog data through process-local `seededShops` and `seededProducts`, so restart/reset wipes runtime-created catalog state.
- `tests/slices/catalog/catalog.runtime.integration.spec.ts` currently verifies the mounted runtime against the in-memory runtime server path instead of a DB-backed baseline.
- `FT-010` already closed seller contour behavior on top of the checked-in runtime surfaces, so `FT-011` can stay narrowly focused on runtime durability, provisioning atomicity and canonical persisted reads.

## Decomposition strategy

1. W1: switch the repo-local `catalog` runtime/bootstrap and test harness away from default in-memory state toward the checked-in Prisma-backed module.
2. W2: harden the actual runtime semantics: transactional admin provisioning plus canonical persisted seller/public reads and writes after restart/reset.
3. W3: close the feature with automated durability regressions, explicit manual restart smoke evidence and final RTM/docs sync.

## Constraints

- Owner slice remains `catalog`; no new standalone runtime capability or second data source is introduced.
- In-memory adapters may remain only as non-normative test/tooling helpers and must not stay the default repo-local runtime path.
- Clean DB-backed baseline is acceptable; no legacy in-memory backfill is required.
- Seller/admin/public contours must share one canonical persisted catalog state.
- Final closure requires manual `provision -> restart/reset -> /shops/:shopId` evidence in addition to repo-local automated gates.

## Expected outputs

- `.protocols/FT-011/plan.md`
- `.protocols/FT-011/decision-log.md`
- `.memory-bank/tasks/plans/IMPL-FT-011.md`
- backlog section with `TASK-FT011-01` ... `TASK-FT011-06`
- execution-ready W1 task for DB-backed runtime bootstrap and W2/W3 tasks for transactional provisioning, persisted storefront reads and durability verification
