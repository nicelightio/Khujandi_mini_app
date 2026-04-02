---
description: Execution plan for TASK-FT003-05.
status: active
---
# TASK-FT003-05 Plan

## Goal
- Make catalog, checkout, and the first-run language overlay render baseline customer-facing copy in the currently selected language without changing the existing persistence/auth boundaries.

## Inputs
- Task card in `.memory-bank/tasks/backlog.md`
- `FT-003`
- `IMPL-FT-003`
- `mini-app-runtime-contract`
- `requirements.md`
- `EP-001`
- `testing/index.md`
- `frontend-presentation-and-webview`
- `frontend-slices-and-webview`
- `storage-and-state-implementation`

## Planned changes
1. Add a small shared i18n copy helper for language overlay, catalog, and checkout baseline strings.
2. Consume the current app language in `CatalogRoute` and `CheckoutPaymentRoute`, then localize their view-model factories with minimal signature changes.
3. Keep bootstrap/runtime ownership intact by localizing the frontend checkout baseline inside the existing route/model layer rather than expanding shell scope.
4. Update route/page/view-model smoke tests to assert localized catalog and checkout copy plus language-specific rendering.
5. Sync protocols, task artifact, and Memory Bank after verification.

## Verification targets
- Catalog route renders localized headline/status/loading-empty strings for the selected language.
- Checkout route renders localized baseline copy for ready, retry, loading, and success states for the selected language.
- The mandatory overlay still blocks the route, but now also exposes localized copy and language labels.

## Quality gates
- Focused Jest suites for `frontend/src/tests/app`, `frontend/src/tests/slices/catalog`, and `frontend/src/tests/slices/checkout-payment`.
- Repo-local combined Jest rerun for touched frontend app/catalog/checkout areas.

## Non-goals
- No shell safe-area/theme/lifecycle work from `FT-009`.
- No new backend localization endpoint or broader profile-management slice.
- No translation of domain data returned from the backend; only baseline UI copy in current customer-facing routes.
