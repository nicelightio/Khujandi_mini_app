---
description: Final repair report for TASK-FT015-FIX showcase curation bugs.
status: final
---
# TASK-FT015-FIX Final Report

## Verdict

PASS.

## Fixed

- Storefront admin long-press/context-menu product curation now opens a stable add-to-showcase action that survives pointer release.
- Curation mutations now expose controlled pending/success/error feedback and refresh/reconcile state after success/failure.
- Storefront admin menu now supports favorite/unfavorite for the current shop.
- Dev-runtime `OPTIONS` preflight now advertises `DELETE` for FT-015 curation endpoints.

## Gates

- `npx jest --config jest.config.cjs frontend/src/tests/slices/catalog/catalog-route.spec.tsx frontend/src/tests/slices/catalog/catalog-page.storefront-events.spec.tsx --runInBand`: PASS.
- `npm run test:catalog:runtime -- --runInBand`: PASS.
- `npm run test:catalog -- --runInBand`: PASS.
- `npm run build:frontend`: PASS.
- `npm run lint`: PASS.
- `git diff --check`: PASS with LF/CRLF warnings only.

## Accepted Debt

- Atomic favorite-shop cap under concurrent multi-admin writes.
- Dedicated curation audit/event enrichment.
- Full browser/Telegram smoke beyond focused repo-local regressions.
