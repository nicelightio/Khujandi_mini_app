---
description: План выполнения TASK-FT010-12.
---
# TASK-FT010-12 Plan

## Scope
- Eliminate the route-local Mini App cookie issuance side channel in `dev-runtime`.
- Expose cookie transport data from the shared `checkout-payment` auth boundary.
- Verify the mounted runtime and slice tests stay aligned with one Mini App auth/session transport path.

## Steps
1. Extend the shared `checkout-payment` auth result so cookie issuance metadata includes the raw cookie value produced by the slice-owned session issuance path.
2. Remove `pendingMiniAppSessionToken` from `backend/src/dev-runtime/dev-api-server.ts` and serialize the cookie directly from the shared auth result.
3. Add focused slice/runtime regression coverage for the new shared boundary and the removal of the old deterministic route-local token convention.
4. Run targeted tests and sync Memory Bank/protocol artifacts.

## Notes
- The goal is one explicit transport boundary, not a new auth model or a second HTTP handler stack.
- Session identifiers still stay out of JS-readable persistent storage; the raw cookie value is only used for server-side response construction.
