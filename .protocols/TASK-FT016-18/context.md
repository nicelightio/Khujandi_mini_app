---
description: Контекст verification/docs-only задачи TASK-FT016-18 для end-to-end operator delivery flow.
status: active
---
# TASK-FT016-18 Context

## Scope

- Mode: strict verification/docs-only.
- Task: end-to-end operator delivery flow verification after `TASK-FT016-17-FIX`.
- Review gate: `APPROVE` in `.protocols/AUTONOMOUS-RUN/review.md`.
- No production code, frontend/backend logic, schema, test, fixture or evidence repair is allowed.

## Required Flow

Verify existing repo evidence for:

1. paid order `CREATED`;
2. operator panel sees unassigned;
3. manual offer;
4. courier claim;
5. `ASSIGNED -> PICKED_UP -> IN_PROGRESS -> DELIVERED`;
6. operator closes `COMPLETED`;
7. polling visibility works;
8. old v1 active order remains readable.

## Micro-Check

- Owning capability slices: `delivery-assignment` for manual offers and courier claim into `ASSIGNED`; `delivery-tracking` for courier progress and operator/admin completion.
- Owning contours: backend, admin-web, telegram-bot, mini-app.
- Touched layers: verification/protocol docs only.
- Shared extraction: not justified; verification does not create or move shared code.

## Normative Inputs

- `.memory-bank/features/FT-004-courier-assignment.md`
- `.memory-bank/features/FT-005-order-tracking-and-events-polling.md`
- `.memory-bank/features/FT-014-customer-order-status-visibility-and-delivery-tracking-integration.md`
- `.memory-bank/features/FT-016-operator-orders-monitoring-and-courier-offer-flow.md`
- `.memory-bank/states/order-lifecycle.md`
- `.memory-bank/contracts/api-events-baseline.md`
- `.memory-bank/contracts/telegram-bot-contract.md`
- `.memory-bank/contracts/operator-delivery-ops-contract.md`

## Dependency Evidence

- `TASK-FT016-13-FIX`: `PASS`; customer parser accepts `order.delayed` with `newStatus`/`oldStatus`.
- `TASK-FT016-15-FIX`: `PASS`; mounted runtime normalizes admin-access `manager` into delivery-tracking `operator` for status command only.
- `TASK-FT016-17-FIX`: `PASS`; delivery-tracking runtime setup uses v2 offer plus claim and normal legacy `/assignment` remains disabled.

## Initial Worktree Note

The worktree contains broad pre-existing uncommitted FT-016 implementation and protocol changes. This task will not revert or patch them; it only records verification outcomes in allowed docs.
