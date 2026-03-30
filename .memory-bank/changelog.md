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
