---
description: Adversarial semantic verification for TASK-FT010-11.
---
# TASK-FT010-11 Red Verification

## Semantic verdict
- `semantic-concern`

## Top substance risks
- `backend/src/dev-runtime/dev-api-server.ts` still issues the Mini App cookie through a route-local side channel: `pendingMiniAppSessionToken` is predicted outside the `checkout-payment` boundary and then injected into the HTTP response after `authenticateTelegram()` returns.
- This means the task removed the duplicate session store, but it did not fully remove transport-level drift risk between the checked-in auth boundary and the mounted runtime route.

## Hidden assumptions
- The runtime assumes `sessionTokenFactory()` will be called exactly once per request and that the predicted token remains the same token persisted into `miniAppSession.sessionTokenHash`.
- The runtime also assumes no future change in `checkout-payment` auth flow will add extra token generation, different cookie issuance semantics, or a shared HTTP helper that would bypass this local coupling.

## Cross-boundary impact
- `catalog` seller reads now share state with `checkout-payment`, which is substantively better.
- But `dev-runtime` still owns part of Mini App auth transport semantics instead of consuming one explicit HTTP/auth boundary, so future `FT-002` auth changes can still drift from `FT-010` mounted runtime behavior.

## Architectural concerns
- The task solved state duplication, but not boundary duplication at the final cookie issuance seam.
- The real architectural intent is one shared Mini App auth/runtime boundary; the current shape is closer to "one shared state + one route-local token handoff".

## State/data consistency concerns
- No direct persistence inconsistency was found in the current code path.
- The remaining concern is semantic consistency: persisted session rows and emitted cookies stay aligned only because of the implicit `pendingMiniAppSessionToken` convention.

## Operational concerns
- Current tests would likely miss a future regression where the controller/service still authenticates correctly, but the mounted route emits a stale or mismatched cookie token because the side channel diverged.

## Future maintenance cost
- Any future change to Mini App session issuance in `checkout-payment` now requires remembering the extra route-local coupling in `dev-runtime`.
- This raises the chance of reintroducing the same class of "looks shared, but drifts at runtime" bug that `TASK-FT010-11` was meant to close.

## How this could still be wrong
- A future refactor could keep all current tests green while silently changing token issuance timing or multiplicity, causing `POST /api/v1/auth/telegram` to set a cookie that no longer matches the persisted session hash.

## Counterproposal / escalation path
- Add a narrow follow-up task to remove `pendingMiniAppSessionToken` and expose one explicit Mini App auth HTTP helper/contract for cookie issuance, so `dev-runtime` consumes the same transport boundary rather than reconstructing it.
