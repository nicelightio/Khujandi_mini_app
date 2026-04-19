# Android Telegram Verification Notes

- Date: `2026-04-20`
- Environment: `pending real-device run`
- Launch method: `pending`
- Result: `PENDING`

## Required scenarios

- Checkout bottom CTA with keyboard open:
  - Result: `PENDING`
  - Notes: Confirm that the shell-owned bottom CTA remains reachable in Android Telegram when the keyboard is open.

- Degraded runtime fallback behavior:
  - Result: `PENDING`
  - Notes: Confirm that reduced Telegram runtime behavior still keeps the shell-owned bottom CTA path predictable and usable.

- No obvious shell regression on hardened customer-facing path:
  - Result: `PENDING`
  - Notes: Confirm safe-area, scroll, and basic checkout shell behavior remain normal after the policy correction.

## Summary

- Repo-local verification is complete.
- Fresh operator-confirmed Android Telegram notes still need to be recorded here for full task closure.
