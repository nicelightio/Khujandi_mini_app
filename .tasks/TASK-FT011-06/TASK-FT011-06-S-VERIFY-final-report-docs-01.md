---
description: Manual restart-durability smoke notes for TASK-FT011-06.
status: active
---
# TASK-FT011-06 Manual Durability Smoke

## Scenario
- Started the checked-in repo-local runtime against a dedicated SQLite DB path.
- Logged in as admin and provisioned `Manual Smoke Bakery` for seller telegram `930`.
- Logged in as the seller, updated the starter product to `Manual Smoke Product` with persisted description/price.
- Stopped the runtime, restarted it on the same DB path, then checked the public catalog feeds and the seller-protected storefront payload.

## Evidence
```json
{
  "provisionStatus": 201,
  "publicShopVisible": true,
  "publicProductVisible": true,
  "sellerStorefrontVisible": true,
  "shopCountAfterRestart": 1,
  "menuPageCountAfterRestart": 2,
  "productCountAfterRestart": 2
}
```

## Conclusion
- The mounted repo-local `catalog` runtime persisted the provisioned shop, starter bundle, and later seller edit across restart on the same DB path.
- Public browse inputs and the seller storefront payload both resolved from persisted state after restart, so the manual closure target for `FT-011` passed.
