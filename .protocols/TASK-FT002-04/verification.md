---
description: Verification record for TASK-FT002-04.
status: active
---
# TASK-FT002-04 Verification

## Basis
- Priority basis used:
- 1. Task-card `Verify` target and `Verification Targets` from `.memory-bank/tasks/backlog.md`.
- 2. Verification targets and constraints from `.protocols/TASK-FT002-04/plan.md`.
- 3. Acceptance criteria and failure modes from `.memory-bank/features/FT-002-checkout-payment-and-order-creation.md`.
- 4. Normative auth/session policy from `.memory-bank/contracts/telegram-mini-app-auth-contract.md` and `.memory-bank/contracts/mini-app-runtime-contract.md`.
- 5. Evidence artifacts in `.tasks/TASK-FT002-04/`.

## Verification targets
- `POST /auth/telegram` accepts raw `initData`.
- Signature and `auth_date` are validated server-side.
- Replay is blocked.
- Session issuance follows the documented transport policy.

## Commands
- `npx jest --runInBand --config jest.config.cjs tests/slices/checkout-payment/checkout-payment.unit.spec.ts tests/slices/checkout-payment/checkout-payment.integration.spec.ts`
- workspace file reads for:
- `backend/src/slices/checkout-payment/domain/telegram-auth.ts`
- `backend/src/slices/checkout-payment/application/checkout-payment.service.ts`
- `backend/src/slices/checkout-payment/presentation/checkout-payment.controller.ts`
- `tests/slices/checkout-payment/checkout-payment.unit.spec.ts`
- `tests/slices/checkout-payment/checkout-payment.integration.spec.ts`

## Verification steps
- Read `.protocols/TASK-FT002-04/{context,plan,progress}.md` to confirm task scope is limited to Telegram auth validation and session issuance.
- Read the task card, `FT-002`, `requirements.md`, and auth/runtime contracts to confirm the verification target is `POST /auth/telegram`.
- Inspected `telegram-auth.ts` to verify HMAC derivation via `HMAC_SHA256(key="WebAppData", message=bot_token)`, canonical `data_check_string`, TTL helper, and replay hash logic.
- Inspected `checkout-payment.service.ts` to verify raw `initData` handling, signature validation, `auth_date` freshness checks, replay rejection, origin/referer gating, and HttpOnly cookie transport metadata without returning the session identifier in the response body.
- Ran task-targeted Jest unit/integration suites in-band to verify valid, invalid, expired, and replayed `initData` scenarios deterministically on Windows.

## AC / REQ evaluation
- Verification target: `POST /auth/telegram` accepts raw `initData`.
- PASS. `CheckoutPaymentController.authenticateTelegram()` accepts `AuthenticateTelegramInput` with raw `initData` and routes it directly into the owning service boundary.
- Verification target: signature and `auth_date` are validated server-side.
- PASS. `telegram-auth.ts` derives the Telegram secret via `WebAppData`, rebuilds `data_check_string`, verifies HMAC server-side, and `CheckoutPaymentService` rejects stale `auth_date` outside the 10 minute TTL.
- Verification target: replay is blocked.
- PASS. `CheckoutPaymentService` hashes raw `initData`, checks repository-backed replay markers, and rejects reused payloads still inside TTL with `401 AUTH_REQUIRED`.
- Verification target: session issuance follows the documented transport policy.
- PASS. The service returns HttpOnly cookie transport metadata with `SameSite=Lax`, `path=/`, `secure` flag support, and origin/referer enforcement when allowed origins are configured; the response metadata does not expose the raw session identifier as a JS-readable persistence policy bypass.
- `REQ-004` consistency:
- PASS. The implemented auth flow uses only raw `initData`, validates `auth_date`, rejects empty/invalid payloads, and blocks replay.
- `REQ-022` task-scoped consistency:
- PASS with scope note. The backend auth boundary follows the preferred HttpOnly cookie contour and origin/referer validation baseline for this task, while broader Mini App storage policy work remains split across `FT-003` and `FT-009` per RTM.

## Evidence
- `tests/slices/checkout-payment/checkout-payment.unit.spec.ts` covers HMAC validation helpers, TTL behavior, and successful auth/session issuance behavior.
- `tests/slices/checkout-payment/checkout-payment.integration.spec.ts` covers valid, invalid, expired, and replayed raw `initData` through the controller/module boundary.
- `npx jest --runInBand --config jest.config.cjs tests/slices/checkout-payment/checkout-payment.unit.spec.ts tests/slices/checkout-payment/checkout-payment.integration.spec.ts` passed with `2` suites and `11` tests.
- `.tasks/TASK-FT002-04/TASK-FT002-04-S-IMPL-final-report-code-01.md` records the implemented auth scope and known gaps.

## Notes
- This verification covers the backend auth/session slice only. Actual transport wiring for `Set-Cookie` headers remains a later integration concern and does not block this task’s scoped verify target.
- Telegram-specific client-matrix evidence remains outside this task and is still planned under `TASK-FT002-08` / `REQ-023`.

## Verdict
- PASS.
