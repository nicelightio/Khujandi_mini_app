---
description: Execution context for TASK-FT002-04.
status: active
---
# TASK-FT002-04 Context

## Task
- TASK-ID: `TASK-FT002-04`
- Title: `Implement Telegram auth validation and session issuance`
- Feature: `FT-002`
- REQs: `REQ-004`, `REQ-022`

## Loaded sources
- `.memory-bank/tasks/backlog.md`: task card, touched files, verify target, verification endpoint.
- `.memory-bank/tasks/plans/IMPL-FT-002.md`: expected touched files, quality gates, and UAT expectations.
- `.memory-bank/features/FT-002-checkout-payment-and-order-creation.md`: acceptance criteria and failure modes.
- `.memory-bank/contracts/telegram-mini-app-auth-contract.md`: auth boundary, HMAC validation, TTL, replay guard, session transport policy.
- `.memory-bank/contracts/mini-app-runtime-contract.md`: session/storage boundary and JS-readable storage restrictions.
- `.memory-bank/architecture/system-contours-and-slices.md`: owning slice and shared-boundary rules.
- `.memory-bank/architecture/data-boundaries-and-persistence.md`: persistence and uniqueness expectations relevant to replay/session state.
- `.memory-bank/invariants.md`: no-auth-bypass and no-trusted-client-only-signal invariants.
- `.memory-bank/testing/index.md`: backend unit/integration and Telegram-sensitive verification baseline.

## Richer inputs found
- Task card fields present: `Touched files`, `Tests`, `Verify`, `Docs`, `Verification Targets`.
- IMPL plan provides explicit auth/session acceptance and backend ownership.
- Contract layer fixes server-side validation, replay guard, and cookie/storage policy before implementation.

## Fallback usage
- Fallback was not needed because task-card, plan, and contract docs provide direct guidance.

## Scope interpretation
- This task implements `POST /auth/telegram`, including HMAC validation, `auth_date` TTL, replay protection, and session issuance baseline.
- It must not implement trusted payment finalization or paid order creation yet.
- Session/storage decisions must remain consistent with the explicit transport/storage policy and must not leak identifiers to JS-readable persistent storage.
