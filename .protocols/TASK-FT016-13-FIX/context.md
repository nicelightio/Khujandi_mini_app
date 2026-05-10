---
description: Execution context for TASK-FT016-13-FIX customer order-tracking delayed event parser repair.
status: active
---
# TASK-FT016-13-FIX Context

## Task

- TASK-ID: `TASK-FT016-13-FIX`
- Source: `.protocols/TASK-FT016-13/verification.md`
- Goal: accept the real timeout-produced `order.delayed` polling event in the customer order-tracking parser and keep customer `DELAYED` copy read-only.

## Required Scope Check

- Owning capability slice: `delivery-tracking`.
- Owning contour: `mini-app`.
- Touched layers: frontend order-tracking read API/parser and focused frontend tests.
- Shared extraction: not justified. This is a slice-local parser compatibility repair for an existing event contract; no reusable primitive is needed.

## Specs Read

- `AGENTS.md`
- `.memory-bank/commands/autopilot.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `doc/ARCHITECTURE.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/tasks/backlog.md`
- `.protocols/AUTONOMOUS-RUN/status.md`
- `.protocols/AUTONOMOUS-RUN/review.md`
- `.protocols/TASK-FT016-13/verification.md`
- `.memory-bank/features/FT-014-customer-order-status-visibility-and-delivery-tracking-integration.md`
- `.memory-bank/features/FT-016-operator-orders-monitoring-and-courier-offer-flow.md`
- `.memory-bank/features/FT-005-order-tracking-and-events-polling.md`
- `.memory-bank/states/order-lifecycle.md`
- `.memory-bank/contracts/api-events-baseline.md`

## Constraints

- In scope: frontend customer order-tracking parser/read-copy repair only.
- In scope: accept `type=order.delayed` and normalize `payload.newStatus -> status`, `payload.oldStatus -> previousStatus`.
- In scope: focused parser/polling test proving an open customer tracking screen consumes `order.delayed` and surfaces `DELAYED`.
- Out of scope: backend producer, timeout evaluator, assignment/offer/claim, admin-web, customer mutation commands, lifecycle mutations, legacy cleanup.

## Drift Notes

- Worktree already contains broad FT-016 changes from earlier tasks, including modifications in the target frontend order-tracking files. This repair must be minimal and must not revert unrelated existing changes.
