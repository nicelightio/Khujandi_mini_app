---
description: Protocol plan for decomposing FT-014 into implementation tasks.
status: active
---
# FT-014 Protocol Plan

## Scope

- Feature: `FT-014` customer order status visibility and delivery tracking integration.
- Owning slice: `delivery-tracking` for customer-facing read/status visibility.
- Contour: `mini-app`.
- Touched layers: `presentation` + `application read/polling consumer`.
- Shared justification: no new shared business module; customer UI consumes the existing `FT-005` polling/event contract locally.

## Inputs Read

- `.memory-bank/features/FT-014-customer-order-status-visibility-and-delivery-tracking-integration.md`
- `.memory-bank/epics/EP-001-customer-ordering-experience.md`
- `.memory-bank/features/FT-013-customer-checkout-handoff-and-paid-order-creation-flow.md`
- `.memory-bank/features/FT-005-order-tracking-and-events-polling.md`
- `.memory-bank/features/FT-009-mini-app-shell-and-webview-ux.md`
- `.memory-bank/contracts/api-events-baseline.md`
- `.memory-bank/contracts/customer-order-composition-contract.md`
- `.memory-bank/states/order-lifecycle.md`
- `.memory-bank/testing/index.md`
- `doc/ARCHITECTURE.md`

## Decomposition Strategy

- Wave 1 freezes the customer-status read boundary and creates the status entry surface fed by paid-order metadata from `FT-013`.
- Wave 2 wires the ordered polling consumer and customer-safe status UI without adding customer mutation commands.
- Wave 3 hardens duplicate/resume/terminal behavior and closes cross-slice e2e verification/docs.

## Gate

- Acceptance criteria from `FT-014` are covered by `TASK-FT014-01` through `TASK-FT014-06` in `.memory-bank/tasks/backlog.md`.
- Execution starts with `TASK-FT014-01`; downstream runtime tasks stay `planned` until their dependencies, including the required upstream `FT-013` paid-order metadata tasks, are complete.
