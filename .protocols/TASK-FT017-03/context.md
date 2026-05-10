---
description: Контекст выполнения TASK-FT017-03 checkout-only debug/e2e affordance.
status: active
---
# TASK-FT017-03 Context

## Scope

- Task: `TASK-FT017-03`.
- Feature: `FT-017 Guarded E2E Mock Payment Mode`.
- Goal: показать checkout-only debug/e2e affordance только когда backend сообщает доступность guarded mock payment mode.

## Required Spec Inputs Read

- `AGENTS.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `doc/ARCHITECTURE.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.protocols/TASK-FT017-02/verification.md`
- `.memory-bank/epics/EP-001-customer-ordering-experience.md`
- `.memory-bank/features/FT-002-checkout-payment-and-order-creation.md`
- `.memory-bank/features/FT-013-customer-checkout-handoff-and-paid-order-creation-flow.md`
- `.memory-bank/features/FT-017-guarded-e2e-mock-payment-mode.md`
- `.memory-bank/contracts/payment-confirmation-contract.md`
- `.memory-bank/runbooks/e2e-mock-payment.md`
- `.memory-bank/testing/index.md`
- `.memory-bank/tasks/plans/IMPL-FT-017.md`
- `.memory-bank/tasks/backlog.md` FT-017 section

## Micro-Check

- Owning slice: `checkout-payment`.
- Owning contour: `mini-app`.
- Touched layers: frontend checkout presentation/view-model/API; backend dev-runtime route metadata only if needed for non-sensitive availability.
- Shared justification: no shared extraction is justified. The affordance is checkout-specific and mock provider availability is a guarded runtime detail of `checkout-payment`.

## Boundaries

- Backend from `TASK-FT017-01/02` remains the only payment trust source.
- `DEBUG=true` / `__APP_DEBUG__` can never create paid confirmation or make the UI claim mock mode is active without backend availability.
- Existing checkout submit button remains the only payment action.
- No catalog/cart UI, no shared UI abstraction, no failed/timeout/pending mock outcomes.
- Backend change, if present, is limited to non-sensitive `mockPaymentAvailable` style metadata.

## Current Code Findings

- Frontend checkout bootstrap is currently static in `frontend/src/slices/checkout-payment/api/checkout-payment-api.ts`.
- Mounted backend runtime already has guarded `checkoutPaymentProvider` in route context and checkout submit refuses when provider is disabled.
- No existing frontend mock availability field is present.
