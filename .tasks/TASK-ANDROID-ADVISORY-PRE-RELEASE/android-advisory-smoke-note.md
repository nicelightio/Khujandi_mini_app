# Android Telegram Advisory Smoke Note

## Summary

- Date: `2026-04-27`
- Source: user-confirmed manual smoke
- Result: advisory only, not formal blocking evidence

## Operator Note

- Manual Android Telegram testing was performed by the user.
- The flow appears to work more or less.
- No detailed formal evidence bundle, screenshots, videos or step-by-step notes are available in the repo.

## Policy Decision

- Fresh real `Android Telegram` evidence is downgraded from blocking repo-local closure gate to advisory pre-release risk check.
- Repo-local closure may proceed from passing deterministic gates and task reports.
- Missing formal Android notes must remain visible as release risk for shell keyboard CTA, checkout, and checkout-to-status flows.

## Residual Risks

- Android Telegram WebView keyboard/safe-area behavior may still differ from browser/Jest assumptions.
- Checkout payment UX and retry/repair behavior were not formally recorded on a real Android Telegram client after `FT-013`.
- Paid-order-to-status navigation and polling were not formally recorded end-to-end on a real Android Telegram client after `FT-014` repair.

## Recommended Pre-Release Smoke

- Open Mini App from bot on Android Telegram.
- Add product from a public `WORKING` storefront and reach composition-backed checkout.
- Complete successful payment simulation and confirm order identity/status entry appears.
- Exercise failed/canceled payment and direct/stale checkout recovery.
- Open keyboard on checkout/status surfaces and confirm bottom CTA remains reachable.
- Confirm status screen observes `CREATED` and polling updates without exposing courier/admin controls.
