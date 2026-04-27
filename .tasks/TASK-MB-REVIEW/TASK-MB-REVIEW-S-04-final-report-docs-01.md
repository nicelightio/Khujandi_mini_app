---
description: Security review for FT-012/FT-013/FT-014 closure readiness.
status: active
---
# TASK-MB-REVIEW S-04 Security Report

## VERDICT

REJECT

## Scope

- Reviewed auth/payment/session/security evidence for `FT-013` checkout and downstream `FT-014` status visibility.
- Checked for obvious client-side trusted-auth or sensitive-storage regressions in the reviewed surfaces.

## Findings

### P0 - Telegram-sensitive checkout security closure lacks required real-client evidence

- Evidence: `.memory-bank/requirements.md:33-35` requires trusted payment/webhook replay protection and Telegram-specific verification for checkout-payment flows.
- Evidence: `.memory-bank/runbooks/telegram-mini-app-verification.md:40-51` makes real `Android Telegram` operator notes the current blocking baseline.
- Evidence: `.tasks/TASK-FT013-07/TASK-FT013-07-S-VERIFY-final-report-docs-01.md:30-35` explicitly fails closure because fresh Android Telegram evidence is missing.
- Evidence: `.tasks/TASK-FT013-07/android-notes.md:3-24` leaves all required scenarios `PENDING`.
- Security impact: repo-local tests are not enough to close Mini App auth/payment/session behavior under the project DoD; `FT-013` remains a security/evidence blocker.

### P1 - Status polling endpoint absence creates an unverified authorization boundary for customer order visibility

- Evidence: `frontend/src/slices/order-tracking/api/order-tracking-api.ts:175-186` polls a generic `/api/v1/events?since=<cursor>` endpoint.
- Evidence: no corresponding route exists in `backend/src/dev-runtime/dev-api-server.ts`; therefore there is no checked-in mounted authorization/filtering behavior for customer-visible events.
- Spec impact: `.memory-bank/features/FT-014-customer-order-status-visibility-and-delivery-tracking-integration.md:37-44` requires customer status to be tied to the created order identity and not expose another user's order or operational controls.
- Security risk: when the endpoint is added, it must be order/customer scoped or otherwise prove that customer sessions cannot read unrelated order events. Current repo state has no mounted evidence for that boundary.

## Non-Blocking Observations

- The reviewed frontend grep found `sessionStorage` usage for checkout composition handoff, not session tokens or raw `initData`; this matches `.memory-bank/contracts/customer-order-composition-contract.md:41-46` for non-sensitive draft persistence.
- No direct `initDataUnsafe` trusted-auth usage was found in the reviewed frontend surfaces.

## Recommendation

- Do not close `FT-013` until Android Telegram evidence is recorded.
- Treat the future `/api/v1/events` mount as security-sensitive: require customer/order scoping tests and negative checks for unrelated order visibility.
