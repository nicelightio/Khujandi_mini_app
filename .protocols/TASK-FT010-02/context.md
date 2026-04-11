# TASK-FT010-02 Context

## Task
- `TASK-FT010-02`
- Goal: scaffold shared storefront, `/seller/*`, and admin provisioning route boundaries for `FT-010` without introducing a second storefront implementation.

## Loaded normative inputs
- `.memory-bank/tasks/backlog.md`
- `.memory-bank/features/FT-010-seller-storefront-editing-and-store-admin.md`
- `.memory-bank/tasks/plans/IMPL-FT-010.md`
- `.memory-bank/contracts/catalog-seller-provisioning-and-visibility.md`
- `.memory-bank/contracts/catalog-seller-access-and-session.md`
- `.memory-bank/contracts/seller-catalog-write-policy.md`
- `.memory-bank/architecture/system-contours-and-slices.md`
- `.memory-bank/architecture/data-boundaries-and-persistence.md`
- `.memory-bank/testing/index.md`
- `.memory-bank/epics/EP-001-customer-ordering-experience.md`
- `.memory-bank/requirements.md`

## Richer inputs found
- Backlog task card with `Touched files`, `Tests`, `Verify`, and `Constraints` fields.
- Implementation plan `IMPL-FT-010` with contour-specific current state, invariants, and non-goals for the scaffold wave.

## Fallback usage
- No dedicated task template exists, so the protocol uses the minimal manual structure already used by neighboring `FT-010` tasks.
- Feature + contracts + architecture/testing docs are used as fallback context around the richer backlog card.

## Key constraints and invariants
- Shared storefront seller edit mode must stay on the same `mini-app` storefront tree as customer browse.
- `/seller/*` is a narrow `seller-web` contour for light catalog-owned controls, not a second storefront.
- Seller access remains Telegram-linked and must not introduce a separate seller credential flow.
- Baseline seller/admin surfaces remain delete-free.

## Initial code reality observed
- `frontend/src/app/root-router.tsx` currently distinguishes only `/admin/*` vs customer app.
- `frontend/src/app/router.tsx` resolves exact customer paths only and has no shared storefront route family.
- `frontend/src/admin/**/*` exists for assignment/cancellation, but no admin provisioning page/route is present.
- `frontend/src/seller/**/*` and seller-specific tests are absent.
