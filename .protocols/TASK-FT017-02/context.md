---
description: Контекст выполнения TASK-FT017-02 mounted checkout mock success integration.
status: active
---
# TASK-FT017-02 Context

## Scope

- Task: `TASK-FT017-02` mounted checkout mock success integration.
- Feature: `FT-017` guarded e2e mock payment mode.
- Depends on: `TASK-FT017-01` verified `PASS`.

## Mandatory Inputs Read

- `AGENTS.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `doc/ARCHITECTURE.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.protocols/TASK-FT017-01/verification.md`
- `.memory-bank/epics/EP-001-customer-ordering-experience.md`
- `.memory-bank/features/FT-017-guarded-e2e-mock-payment-mode.md`
- `.memory-bank/tasks/plans/IMPL-FT-017.md`
- `.memory-bank/features/FT-013-customer-checkout-handoff-and-paid-order-creation-flow.md`
- `.memory-bank/contracts/payment-confirmation-contract.md`
- `.memory-bank/contracts/customer-order-composition-contract.md`
- `.memory-bank/contracts/telegram-mini-app-auth-contract.md`
- `.memory-bank/contracts/api-events-baseline.md`
- `.memory-bank/states/order-lifecycle.md`
- `.memory-bank/runbooks/e2e-mock-payment.md`
- `.memory-bank/testing/index.md`
- `.memory-bank/tasks/backlog.md` FT-017 section

## Ownership

- Owning capability slice: `checkout-payment`.
- Owning contour: `mini-app`.
- Touched layers: backend dev-runtime route/config plus existing checkout-payment payment finalization seam through runtime tests.
- `shared` justification: none. Mock mode is a guarded provider variant inside the existing checkout-payment boundary, not a reusable cross-slice abstraction.

## Acceptance Focus

- `/api/v1/orders/checkout` with `PAYMENT_PROVIDER=mock` succeeds only for valid composition, valid Mini App session and server-side revalidation.
- Success creates exactly one paid order in `CREATED` with customer-safe `orderId`, `updated_at` and string `revision`/cursor metadata.
- Duplicate submit/confirmation does not create a second order.
- Direct checkout, stale composition and missing auth/session remain no-order.
- Production mock provider remains refused.
- No frontend UI affordance, no failed/timeout/pending outcomes, no delivery lifecycle/catalog/cart/shared changes.

## Drift Notes

- No spec/code drift recorded before implementation. Existing `TASK-FT017-01` provider boundary is the required baseline.
