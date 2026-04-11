---
description: План выполнения TASK-FT010-11.
---
# TASK-FT010-11 Plan

## Scope
- Rewire repo-local `POST /api/v1/auth/telegram` to the real checked-in `checkout-payment` module/repository boundary.
- Ensure seller-protected reads resolve sessions from the same persistent Mini App user/session state.
- Verify with focused runtime/catalog checks, then sync docs and task artifacts.

## Steps
1. Replace the route-local Mini App auth/session repository clone in `dev-runtime` with a shared in-memory Prisma-like provider for `checkout-payment`.
2. Point seller-protected session resolution at that same shared state so auth and reads use one session family.
3. Run targeted runtime/catalog tests and capture evidence.
4. Sync Memory Bank, protocol files, and task report.

## Notes
- The goal is shared runtime ownership, not a new seller auth model.
- Repo-local runtime may still use in-memory persistence, but auth issuance and protected reads must go through the same checked-in slice boundary.
