---
description: Context and loaded sources for TASK-FT011-04.
status: active
---
# TASK-FT011-04 Context

## Task

- ID: `TASK-FT011-04`
- Title: `Move storefront and seller catalog resolution onto persisted runtime state`

## Loaded normative inputs

- `AGENTS.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/commands/execute.md`
- `.memory-bank/tasks/backlog.md`
- `.memory-bank/features/FT-011-db-backed-catalog-runtime-baseline.md`
- `.memory-bank/tasks/plans/IMPL-FT-011.md`
- `.memory-bank/epics/EP-001-customer-ordering-experience.md`
- `.memory-bank/contracts/catalog-public-api.md`
- `.memory-bank/contracts/catalog-seller-provisioning-and-visibility.md`
- `.memory-bank/contracts/catalog-seller-access-and-session.md`
- `.memory-bank/contracts/seller-catalog-write-policy.md`
- `.memory-bank/architecture/system-contours-and-slices.md`
- `.memory-bank/architecture/data-boundaries-and-persistence.md`
- `.memory-bank/testing/index.md`

## Richer inputs found

- Task card in `.memory-bank/tasks/backlog.md` with explicit `Touched files`, `Tests`, `Verify`, `Docs`, and `Invariants`.
- `FT-011` feature doc with acceptance criteria, edge cases, constraints, and verification targets.
- `IMPL-FT-011` with ordered steps, runtime invariants, quality gates, and UAT basis.
- Contract and architecture docs explicitly require public/shared-storefront/seller-web reads to use one canonical DB-backed `catalog` runtime path.

## Fallback usage

- No dedicated task-card file or protocol template exists for `TASK-FT011-04`.
- Used classic fallback: task card -> feature -> requirements -> contracts/architecture -> testing.

## Task invariants

- Mounted seller/public catalog reads must not depend on route-local `catalogState` as the runtime source of truth.
- Successful provisioning and later seller edits must remain visible after restart/reset.
- Missing persisted catalog data may return controlled not-found/error outcomes, but must not fabricate success.
- Existing `FT-010` ownership, visibility, rename, and no-delete semantics stay unchanged while the read path moves onto persisted runtime state.
