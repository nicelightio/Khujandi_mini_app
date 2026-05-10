---
description: Context protocol for TASK-FT016-17 legacy direct assignment isolation.
status: active
---
# TASK-FT016-17 Context

## Task

`TASK-FT016-17 - Isolate or remove legacy direct assignment path`

## Required Reading

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
- `.protocols/TASK-FT016-16/verification.md`
- `.memory-bank/features/FT-004-courier-assignment.md`
- `.memory-bank/features/FT-016-operator-orders-monitoring-and-courier-offer-flow.md`
- `.memory-bank/states/order-lifecycle.md`
- `.memory-bank/contracts/operator-delivery-ops-contract.md`
- `.memory-bank/contracts/api-events-baseline.md`

## Micro-Check

- Owning capability slice: `delivery-assignment`.
- Owning contours: `backend`, `admin-web`.
- Touched layers: `application`, `presentation`, `ui/app`, focused tests and operational docs.
- Shared extraction: not justified. This task isolates a legacy slice-local command and its admin-web entrypoint; no reusable cross-slice business primitive is needed.

## Normative Decisions

- Normal operator/admin assignment must create an `AssignmentOffer`; it must not directly transition `CREATED|DELAYED -> ASSIGNED`.
- `ASSIGNED` is reached only by successful courier claim in the normal v2 flow.
- Legacy v1 orders, audits, status history and events remain readable; no mass rewrite or migration is in scope.
- A direct assignment path may remain only as an explicit override requiring operator/admin confirmation and an audit-visible action distinct from normal offer/claim behavior.

## Initial Worktree Note

The worktree already contains a large uncommitted FT-016 implementation set from previous tasks, including touched backend/frontend delivery files. Treat those as existing context and do not revert unrelated drift.
