---
description: Хэнд-офф по TASK-FT008-01.
status: active
---
# TASK-FT008-01 Handoff

## Done
- Docs-first boundary for `FT-008` is frozen across feature/plan/contract/runbook/testing docs.
- `TASK-FT008-01` is `done`; `TASK-FT008-02` and `TASK-FT008-03` are `ready`.

## Next tasks
- `TASK-FT008-02`: scaffold backend `reviews-feedback` slice, persistence baseline and test harness.
- `TASK-FT008-03`: scaffold Telegram bot review stepper and alert harness.

## Guardrails
- Keep review semantics and `review.negative` ownership inside `reviews-feedback`.
- Do not pull admin auth/session ownership into `FT-008`; alert recipient resolution should reuse existing active-admin boundary.
- Preserve duplicate-safe behavior for both review writes and negative alert fan-out.
