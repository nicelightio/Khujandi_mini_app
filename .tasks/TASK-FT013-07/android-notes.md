# Android Telegram Verification Notes

- Date: `2026-04-26`
- Environment: `pending real-device run`
- Launch method: `pending`
- Result: `PENDING`

## Required scenarios

- Public `WORKING` storefront -> add products -> checkout confirmation:
  - Result: `PENDING`
  - Notes: Confirm the real Telegram WebView reaches the composition-backed checkout screen without fake route data.

- Successful payment simulation -> order `CREATED`:
  - Result: `PENDING`
  - Notes: Confirm the customer-facing mounted runtime returns order identity plus `updated_at` and string `revision` after trusted server-side success.

- Failed/canceled payment retry:
  - Result: `PENDING`
  - Notes: Confirm no order is created and retry/repair UX remains explicit.

- Direct `/checkout` or stale composition recovery:
  - Result: `PENDING`
  - Notes: Confirm controlled recovery rather than anonymous/fake order creation.

## Summary

- Repo-local verification is complete.
- Fresh operator-confirmed Android Telegram notes are now advisory pre-release evidence rather than a blocking repo-local closure artifact.
- User-confirmed manual smoke on 2026-04-27 reported the Android Telegram flow appears to work more or less, but no detailed formal evidence bundle is available.
