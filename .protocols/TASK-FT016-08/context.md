---
description: Execution context for TASK-FT016-08 Telegram courier menu harness.
status: active
---
# TASK-FT016-08 Context

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
- `.protocols/TASK-FT016-07-FIX/verification.md`
- `.memory-bank/tasks/plans/IMPL-FT-016-operator-delivery-migration.md`
- `.memory-bank/features/FT-016-operator-orders-monitoring-and-courier-offer-flow.md`
- `.memory-bank/contracts/telegram-bot-contract.md`

## Review Gate

- Verdict: `APPROVE` for `TASK-FT016-08` only.
- Dependency: `TASK-FT016-07-FIX` verified `PASS`.

## Boundary Check

- Owning capability slice: `delivery-assignment`.
- Owning contour: `telegram-bot`.
- Touched layers: Telegram transport/harness adapter and focused tests.
- Shared extraction: not justified; courier availability semantics remain in the existing `delivery-assignment` application/service boundary.

## Scope

- Add transport-only `Курьер` menu harness/buttons.
- Parse callback payloads into service intents for start work, stop-after-5-min, and auto-offer ON/OFF.
- No full webhook runtime, no direct Prisma writes, no offers/claims/status progression/history/audit/event side effects.
