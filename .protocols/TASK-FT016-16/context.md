---
description: Execution context for TASK-FT016-16 polling consumer alignment.
status: active
---
# TASK-FT016-16 Context

## Task

- TASK-ID: `TASK-FT016-16`
- Title: Update polling consumers for `PICKED_UP`/`DELAYED`/operator completion
- Feature: `FT-016`
- REQs: `REQ-035`, `REQ-036`, `REQ-008`, `REQ-009`, `REQ-033`
- Gate: `.protocols/AUTONOMOUS-RUN/review.md` verdict `APPROVE`

## Required Specs Read

- `AGENTS.md`
- `.memory-bank/commands/autopilot.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `doc/ARCHITECTURE.md`
- `.memory-bank/tasks/backlog.md`
- `.memory-bank/tasks/plans/IMPL-FT-016-operator-delivery-migration.md`
- `.protocols/AUTONOMOUS-RUN/status.md`
- `.protocols/AUTONOMOUS-RUN/review.md`
- `.protocols/TASK-FT016-15-FIX/verification.md`
- `.memory-bank/features/FT-014-customer-order-status-visibility-and-delivery-tracking-integration.md`
- `.memory-bank/features/FT-005-order-tracking-and-events-polling.md`
- `.memory-bank/features/FT-016-operator-orders-monitoring-and-courier-offer-flow.md`
- `.memory-bank/states/order-lifecycle.md`
- `.memory-bank/contracts/api-events-baseline.md`
- `.memory-bank/contracts/operator-delivery-ops-contract.md`

## Micro-Check

- Owning capability slice: `delivery-tracking`.
- Owning contours: `mini-app` and `admin-web`.
- Touched layers: `ui/app` polling consumers, read view models, focused frontend tests, operational task docs.
- Shared extraction: not justified. Existing consumers should locally align with the `FT-005` event/polling contract; no shared business state machine or lifecycle module should be added.

## Scope

Implement polling consumer alignment only:

- Customer `mini-app` order tracking consumes/displays `PICKED_UP`, `DELAYED`, and operator/admin `COMPLETED`.
- Admin `admin-web` operator polling/read model consumes/displays those status events.
- Terminal states stay closed for `COMPLETED` and `CANCELLED_*`.
- Customer UI remains read-only and exposes no operator/admin/courier controls.
- Cursor handling remains string-only and opaque; consumers must not parse cursor values as status/lifecycle data.

## Out of Scope

- Backend transition logic.
- Offer/claim behavior.
- Timeout evaluator changes.
- Assignment rules.
- Cancellation/refund behavior.
- Legacy cleanup.
- Shared state-machine extraction.
- Broad UI rewrite.

## Current Notes

- Worktree already contains many uncommitted FT-016 changes from previous tasks. This task must preserve unrelated changes and only add the minimal consumer/test/doc deltas needed for `TASK-FT016-16`.
