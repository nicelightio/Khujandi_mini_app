---
description: Execution context for TASK-FT016-07.
status: active
---
# TASK-FT016-07 Context

## Loaded Inputs

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
- `.protocols/TASK-FT016-02/verification.md`
- `.memory-bank/tasks/plans/IMPL-FT-016-operator-delivery-migration.md`
- `.memory-bank/features/FT-004-courier-assignment.md`
- `.memory-bank/features/FT-016-operator-orders-monitoring-and-courier-offer-flow.md`
- `.memory-bank/states/order-lifecycle.md`
- `.memory-bank/contracts/telegram-bot-contract.md`

## Gate

- Review verdict for this task: `APPROVE`.
- Upstream verification: `TASK-FT016-02` is `PASS`; autonomous status records `TASK-FT016-06` as `done`.
- Backlog start state changed from `ready` to `in_progress`.

## Boundary Check

- Owning capability slice: `delivery-assignment`.
- Owning contour: backend application boundary for future `telegram-bot` consumption.
- Touched layers: `application`, `domain`, `infra`, focused backend tests.
- Shared extraction: not justified. Courier availability active/free rules are slice-owned delivery-assignment policy, not reusable shared business logic.

## Scope

- Add service/repository/domain methods for courier availability:
  - start work;
  - stop accepting after 5 minutes;
  - toggle auto-offer participation boolean;
  - query active/free state.
- Active/free is server-owned:
  - active means courier has explicitly started work and `acceptingOrdersUntil` has not passed;
  - free means no current order in `ASSIGNED`, `PICKED_UP`, `IN_PROGRESS`, or `DELIVERED`.
- Preserve `ratingScore` through availability operations.

## Hard Stops

- No offer creation.
- No courier claim.
- No bot menu UI/harness or callback parser.
- No admin UI toggle.
- No auto-offer fan-out.
- No timeout evaluator.
- No order status/history/audit/event side effects.
- Do not mark backlog `done`; verifier owns that transition.
