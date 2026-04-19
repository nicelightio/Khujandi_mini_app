# TASK-FT011-06 Verification

## Verification basis
- `FT-011` acceptance criteria and backlog verify target require automated/runtime/manual evidence for `REQ-027` and `REQ-028`.
- Manual closure must prove `provision -> restart/reset -> /shops/:shopId` resolves from persisted catalog state instead of process-local fallback.

## Executed commands
- `npm run lint`
- `npm run test:catalog`
- `node --experimental-strip-types --experimental-transform-types --loader ./scripts/ts-extension-loader.mjs --input-type=module -e "...TASK-FT011-06 manual smoke..."`

## Results by target
- Final automated catalog gates: PASS.
  - What I checked: reran the repo-wide ESLint gate and the full catalog suite after the mounted runtime hardening/docs sync state was in place.
  - Evidence: `npm run lint` completed successfully; `npm run test:catalog` passed `46/46` suites with `309` passing tests.
- Admin provisioning remains durable and restart-safe: PASS.
  - What I checked: provisioned `Manual Smoke Bakery` through `POST /api/v1/admin/catalog/shops/provision`, restarted the runtime on the same SQLite DB path, then confirmed the shop still existed exactly once with its starter bundle.
  - Evidence: manual smoke summary recorded `provisionStatus: 201`, `shopCountAfterRestart: 1`, `menuPageCountAfterRestart: 2`, and `productCountAfterRestart: 2` in `.tasks/TASK-FT011-06/TASK-FT011-06-S-VERIFY-final-report-docs-01.md`.
- Shared storefront/public browse resolution after restart: PASS.
  - What I checked: after restart, verified the provisioned working shop appeared in `GET /api/v1/shops` and its updated starter product appeared in `GET /api/v1/shops/:shopId/products`, which are the mounted browse feeds used by `/shops/:shopId`.
  - Evidence: manual smoke summary recorded `publicShopVisible: true` and `publicProductVisible: true`.
- Seller-protected storefront resolution after restart: PASS.
  - What I checked: after restart, logged in as the bound seller and verified `GET /api/v1/seller/shops/:shopId` still returned the edited product payload from persisted state.
  - Evidence: manual smoke summary recorded `sellerStorefrontVisible: true` for the edited `Manual Smoke Product` payload.

## Verdict
- PASS
