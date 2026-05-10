---
description: Implementation plan for TASK-FT016-14 v2 delivery tracking state machine.
status: active
---
# TASK-FT016-14 Plan

## Steps

1. Mark active run state for `TASK-FT016-14`.
2. Inspect existing `delivery-tracking` domain/application/infra/tests and Telegram bot tracking harness.
3. Update slice-owned transition/action mapping to support `ASSIGNED -> PICKED_UP -> IN_PROGRESS -> DELIVERED`.
4. Preserve legacy compatibility for orders already in `IN_PROGRESS` and `DELIVERED`; reject skip/replay/regression with `409`.
5. Update Telegram tracking harness labels/callback parser/available actions to expose pickup/progress/delivered only.
6. Add focused backend and bot tests.
7. Run focused tests plus `git diff --check`.
8. Update Memory Bank/protocol/task report and set task `ready_for_verify`.

## Guardrails

- Do not touch assignment offer/claim/timeout behavior unless compilation requires a local import/type alignment.
- Do not add operator completion UI/route.
- Do not rewrite existing orders or migrations for status backfill.
- Do not extract shared state machine abstractions.
