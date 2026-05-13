---
description: Runbook для repo-local/e2e mock payment mode в customer checkout flow.
status: active
---
# E2E Mock Payment

## Purpose

Дать будущей implementation task безопасный KISS-контур для проверки customer checkout -> paid order -> status/delivery e2e без production payment provider.

## Boundary

- Owning slice: `checkout-payment`.
- Contour: `mini-app`.
- Future implementation layers: checkout presentation affordance plus application/infrastructure payment-provider boundary.
- Upstream `catalog` owns only product selection and `FT-012` composition. It MUST NOT own payment affordances or trust decisions.
- Shared extraction is not justified; this is a guarded runtime mode of the payment boundary.

## Required gates

- Canonical server-side gate: `PAYMENT_PROVIDER=mock`.
- The backend MUST also enforce an explicit runtime/test guard (`APP_ENV=staging|test|local` or `E2E_TEST_MODE=TRUE`) before accepting mock provider confirmation.
- `DEBUG=true` / `__APP_DEBUG__` MAY expose visible checkout debug affordance, but MUST NOT be the only server trust gate.
- Production runtime MUST reject or refuse to start with `PAYMENT_PROVIDER=mock`.

## Test-server container env

For a dedicated test server, set these non-secret values in `/srv/tgmeal/app/.env` and redeploy through the approved deploy script so both the web build arg and api runtime env are refreshed:

```bash
DEBUG=TRUE
PAYMENT_PROVIDER=mock
APP_ENV=staging
E2E_TEST_MODE=TRUE
```

Production-like defaults stay safe: `DEBUG=FALSE`, empty `PAYMENT_PROVIDER`, and `NODE_ENV=production`.

For `FT-018` staging UI QA, this mock payment mode is only one part of the staging guard set. The server staging profile must also use `APP_ENV=staging`, `E2E_TEST_MODE=TRUE`, isolated staging state/volumes, and the guarded fixed-persona test auth contract from [.memory-bank/contracts/staging-test-auth-harness-contract.md](../contracts/staging-test-auth-harness-contract.md).

## KISS first baseline

- Required mock outcome: `success/paid`.
- Planned/follow-up outcomes: `failed` and `timeout/pending`, unless a future implementation task explicitly scopes them in.
- Mock success still needs a canonical provider transaction/idempotency identity so duplicate submit/confirmation cannot create a second order.

## Required flow

1. Customer starts from a valid `FT-012` single-shop composition.
2. Checkout route consumes the composition and uses `checkout-payment` server-side revalidation.
3. Valid Mini App auth/session is present per `FT-002`.
4. Server-side mock provider returns guarded `success/paid`.
5. Order is created once in `CREATED` with paid payment state and customer-safe `updated_at`/string `revision` or cursor metadata.
6. Customer status flow can continue through `GET /events?since=<cursor>`.

## Forbidden cases

- No order from direct `/checkout` without valid composition.
- No order from stale/invalid composition.
- No order from missing/invalid Mini App auth/session.
- No order from frontend-only debug state, client-only payment events, `invoiceClosed`, or manually toggled UI state.
- No production use of mock payment provider.
- No catalog/cart ownership of payment trust controls.

## Verification targets

- Happy e2e: select product -> checkout -> mock success -> one paid `CREATED` order -> customer-safe tracking cursor.
- Negative: `DEBUG=true` without `PAYMENT_PROVIDER=mock` does not create trusted payment confirmation.
- Negative: direct checkout, stale composition and missing auth/session stay no-order.
- Idempotency: duplicate submit/confirmation reuses or preserves the same paid order and does not create a second order.
- Configuration: production-like runtime rejects `PAYMENT_PROVIDER=mock`.

## Current closure evidence

- `TASK-FT017-04` verified the guarded first baseline for repo-local scope: `PAYMENT_PROVIDER=mock` plus non-production guard, mock `success/paid`, no-order forbidden cases, duplicate-submit idempotency, checkout-only informational affordance, frontend build, lint and `git diff --check`.
- Closure report: [.tasks/TASK-FT017-04/TASK-FT017-04-S-VERIFY-final-report-docs-01.md](../../.tasks/TASK-FT017-04/TASK-FT017-04-S-VERIFY-final-report-docs-01.md).
- Mock failed/timeout/pending outcomes remain follow-up scope unless explicitly planned later.

## Source artifacts

- [.memory-bank/features/FT-002-checkout-payment-and-order-creation.md](../features/FT-002-checkout-payment-and-order-creation.md): payment trust ownership.
- [.memory-bank/features/FT-013-customer-checkout-handoff-and-paid-order-creation-flow.md](../features/FT-013-customer-checkout-handoff-and-paid-order-creation-flow.md): checkout route placement and composition handoff.
- [.memory-bank/contracts/payment-confirmation-contract.md](../contracts/payment-confirmation-contract.md): trusted payment confirmation boundary.
- [.memory-bank/contracts/customer-order-composition-contract.md](../contracts/customer-order-composition-contract.md): upstream composition payload.
- [.memory-bank/contracts/staging-test-auth-harness-contract.md](../contracts/staging-test-auth-harness-contract.md): staging-only fixed-persona session bootstrap for UI QA.
- [.memory-bank/testing/index.md](../testing/index.md): verification and anti-cheat baseline.
