# TASK-FT010-03 Context

## Task
- `TASK-FT010-03` — Implement admin provisioning command and skeleton shop bootstrap.

## Loaded inputs
- Richer inputs found in `.memory-bank/tasks/backlog.md`:
  - Verification Targets: admin provisioning command path, skeleton shop creation, Telegram-linked seller binding.
  - Invariants: no partial shop/binding state on conflict/error; starter pages/products are created together with the first shop; canonical seller ownership between `Shop.sellerId` and Telegram-linked binding must stay explicit and non-divergent.
- Feature spec: `.memory-bank/features/FT-010-seller-storefront-editing-and-store-admin.md`.
- Parent epic: `.memory-bank/epics/EP-001-customer-ordering-experience.md`.
- Requirements: `.memory-bank/requirements.md` (`REQ-025`).
- Normative contracts:
  - `.memory-bank/contracts/catalog-seller-provisioning-and-visibility.md`
  - `.memory-bank/contracts/catalog-seller-access-and-session.md`
- Architecture:
  - `.memory-bank/architecture/system-contours-and-slices.md`
  - `.memory-bank/architecture/data-boundaries-and-persistence.md`
- Verification basis: `.memory-bank/testing/index.md`.

## Fallback usage
- No separate task-local impl spec/report existed yet, so execution uses the backlog card plus FT-010/REQ/contract docs as the fallback normative basis.

## Current code reality
- `catalog` currently has repository-level primitives for shop, binding, menu page, and product creation, but no atomic provisioning command.
- `catalog.controller.ts` exposes public browse and seller CRUD only.
- `dev-api-server.ts` mounts only demo public catalog reads plus admin auth runtime.
- Existing catalog tests cover repository primitives and seller writes, but not end-to-end provisioning orchestration.

## Implementation intent
- Keep ownership inside `catalog`.
- Add one service/controller command that provisions shop + seller binding + starter catalog data atomically.
- Mount a minimal repo-local dev runtime path for later admin UI wiring without pulling unrelated auth scope into this task.
