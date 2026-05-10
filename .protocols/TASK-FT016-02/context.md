---
description: Execution context for TASK-FT016-02 courier availability and assignment offer persistence compatibility.
status: active
---
# TASK-FT016-02 Context

## Loaded Sources

- `AGENTS.md`
- `.memory-bank/commands/execute.md`
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
- `.protocols/TASK-FT016-01/verification.md`
- `.memory-bank/tasks/plans/IMPL-FT-016-operator-delivery-migration.md`
- `.memory-bank/features/FT-004-courier-assignment.md`
- `.memory-bank/features/FT-016-operator-orders-monitoring-and-courier-offer-flow.md`
- `.memory-bank/states/order-lifecycle.md`
- `.memory-bank/contracts/operator-delivery-ops-contract.md`
- `.memory-bank/contracts/telegram-bot-contract.md`

## Gate

- Review verdict for `TASK-FT016-02`: `APPROVE`.
- Upstream `TASK-FT016-01` verification: `VERDICT: PASS`.

## Boundary Check

- Owning capability slice: `delivery-assignment`.
- Owning contour: `backend`; future consumers are `admin-web` and `telegram-bot`, but this task does not touch their behavior.
- Touched layers: `domain`, `infrastructure/persistence`, focused tests.
- Shared extraction: not justified. Courier availability and assignment offers are assignment-domain state, not shared primitives.

## Scope

- Additive schema/persistence compatibility for courier availability and assignment offers.
- Preserve existing direct assignment v1 reads and writes.
- No offer creation, claim, timeout, auto-offer broadcast, bot menu, operator panel, or lifecycle transition behavior.
