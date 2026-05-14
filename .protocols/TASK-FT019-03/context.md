---
description: Context for TASK-FT019-03 courier staff roster commands.
status: active
---
# TASK-FT019-03 Context

## Scope

- TASK: `TASK-FT019-03`
- Feature: `FT-019 Staff panel`
- Owning capability slice: `delivery-assignment`
- Owning contour: `admin-web`
- Touched layers: `domain`, `application`, `infrastructure`, focused backend tests.
- Shared extraction: not justified. Courier staff roster commands are specific to courier `User(COURIER)` records, existing delivery-assignment availability fields and courier staff lifecycle/rating adjustment persistence.

## Required context read

- `AGENTS.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `doc/ARCHITECTURE.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/tasks/backlog.md` TASK-FT019-03 card
- `.memory-bank/tasks/plans/IMPL-FT-019.md`
- `.protocols/FT-019/plan.md`
- `.protocols/FT-019/decision-log.md`
- `.protocols/TASK-FT019-01/handoff.md`
- `.protocols/TASK-FT019-01/verification.md`
- `.protocols/TASK-FT019-02/handoff.md`
- `.protocols/TASK-FT019-02/verification.md`
- `.memory-bank/features/FT-019-staff-panel.md`
- `.memory-bank/contracts/staff-panel-contract.md`
- `.memory-bank/architecture/data-boundaries-and-persistence.md`
- `.memory-bank/features/FT-016-operator-orders-monitoring-and-courier-offer-flow.md`
- `.memory-bank/epics/EP-002-delivery-operations.md`
- `.memory-bank/epics/EP-003-admin-access-and-security.md`
- `.memory-bank/states/order-lifecycle.md`

## Boundary notes

- Implement only courier staff profile commands over `User(COURIER)`.
- Admin/boss create courier staff by Telegram user id and nickname; no web password is created.
- Soft delete/deactivation uses explicit staff lifecycle metadata and lifecycle events, not hard delete.
- Reactivation is boss-only.
- Manual rating adjustment persists `+1` or `-1` with actor/timestamp metadata and does not mutate review averages.
- Do not add dev-runtime routes, frontend UI, operator account commands, metrics read models, cards, `OrderStatus.FAILED`, or courier offer/claim lifecycle changes.
