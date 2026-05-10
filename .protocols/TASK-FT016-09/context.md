---
description: Execution context for TASK-FT016-09 manual targeted offer creation.
status: active
---
# TASK-FT016-09 Context

## Scope

- TASK: `TASK-FT016-09 - Implement manual targeted offer creation`
- Feature: `FT-016`
- REQs: `REQ-036`, `REQ-007`, `REQ-018`
- Review gate: `.protocols/AUTONOMOUS-RUN/review.md` verdict `APPROVE`

## Normative Inputs Read

- `AGENTS.md`
- `.memory-bank/commands/autopilot.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `doc/ARCHITECTURE.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/tasks/backlog.md`
- `.memory-bank/tasks/plans/IMPL-FT-016-operator-delivery-migration.md`
- `.protocols/AUTONOMOUS-RUN/status.md`
- `.protocols/AUTONOMOUS-RUN/review.md`
- `.memory-bank/epics/EP-002-delivery-operations.md`
- `.memory-bank/features/FT-004-courier-assignment.md`
- `.memory-bank/features/FT-005-order-tracking-and-events-polling.md`
- `.memory-bank/features/FT-016-operator-orders-monitoring-and-courier-offer-flow.md`
- `.memory-bank/features/FT-014-customer-order-status-visibility-and-delivery-tracking-integration.md`
- `.memory-bank/states/order-lifecycle.md`
- `.memory-bank/contracts/api-events-baseline.md`
- `.memory-bank/contracts/telegram-bot-contract.md`
- `.memory-bank/contracts/operator-delivery-ops-contract.md`

## Ownership Micro-check

- Owning capability slice: `delivery-assignment`.
- Consumed slices: `delivery-tracking` read semantics for order status/events; `admin-access` auth/RBAC boundary via existing admin runtime.
- Contours: `backend`, `admin-web`, `telegram-bot`.
- Touched layers: `application`, `domain`, `infra`, `presentation/runtime route`, focused `admin-web` app/UI/API, Telegram notification adapter/harness, tests.
- Shared extraction: not justified. Manual offer creation is assignment-specific business behavior; use existing shared DB/error/auth/event primitives only.

## Invariants

- Manual targeted offer creates only a pending `AssignmentOffer`.
- Allowed order statuses: `CREATED`, `DELAYED`.
- Target courier must be active/available/free through the existing availability boundary from `TASK-FT016-07-FIX`.
- Order status remains unchanged.
- Do not set `courierId`, `assignedAt`, `ASSIGNED`, or publish `order.assigned`.
- Record/publish `order.offer_created` only after successful persistence/commit where the local event mechanism supports it.
- Telegram bot may notify through existing boundary only; bot code must not own assignment state or write directly to Prisma.
- Legacy direct assignment may remain only as hidden/explicit override; no cleanup in this task.

## Current Worktree Note

The worktree already contains many modified/untracked FT-016 files from previous tasks. Treat them as existing baseline for this worker; do not revert unrelated drift.
