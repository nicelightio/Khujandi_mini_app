---
description: Context protocol for TASK-FT016-10 atomic courier claim implementation.
status: active
---
# TASK-FT016-10 Context

## Task

- TASK-ID: `TASK-FT016-10`
- Scope: implement atomic pending-offer courier claim from Telegram bot callback / existing bot boundary.
- Review gate: `.protocols/AUTONOMOUS-RUN/review.md` verdict `APPROVE` for this task only.

## Spec Inputs Loaded

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
- `.protocols/TASK-FT016-09/verification.md`
- `.memory-bank/epics/EP-002-delivery-operations.md`
- `.memory-bank/features/FT-004-courier-assignment.md`
- `.memory-bank/features/FT-005-order-tracking-and-events-polling.md`
- `.memory-bank/features/FT-016-operator-orders-monitoring-and-courier-offer-flow.md`
- `.memory-bank/features/FT-014-customer-order-status-visibility-and-delivery-tracking-integration.md`
- `.memory-bank/states/order-lifecycle.md`
- `.memory-bank/contracts/api-events-baseline.md`
- `.memory-bank/contracts/telegram-bot-contract.md`
- `.memory-bank/contracts/operator-delivery-ops-contract.md`

## Ownership Micro-Check

- Owning capability slice: `delivery-assignment`.
- Owning contour: `telegram-bot` for the courier claim entrypoint, backed by a narrow backend application command.
- Touched layers: application, domain, infrastructure/persistence, Telegram bot adapter/harness, focused tests, task protocol/docs.
- Shared extraction: not justified. Existing shared error/runtime/event primitives are enough; claim rules are assignment-domain business logic and stay slice-local.

## Existing Implementation Notes

- `TASK-FT016-09` added manual targeted offer creation as pending-only with `order.offer_created`.
- Legacy direct assignment still exists through `assignCourier` and must remain explicit/legacy.
- `AssignmentOffer` is already representable; `Order.assignedAt` is not present in Prisma, so the claim will set `courierId` and status/history/audit/event without adding schema unless required by tests.
- Courier availability boundary already defines active/free and busy statuses.

## Drift / Constraints

- Current legacy `assignCourier` path still publishes `order.assigned` directly. This is accepted migration baseline and must not be cleaned up in this task.
- Normal v2 claim path must publish `order.assigned` only after successful atomic claim.
- Out of scope: timeout/DELAYED evaluator, auto-offer broadcast, pickup/completion progression, admin manual claim UI, queues/Redis/GPS/maps, broad admin panel rewrite.
