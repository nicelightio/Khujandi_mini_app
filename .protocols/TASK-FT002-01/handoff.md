---
description: Handoff notes for TASK-FT002-01.
status: active
---
# TASK-FT002-01 Handoff

## Completed
- Docs-first boundary for `FT-002` is frozen across feature, auth contract, payment contract, runtime/storage policy, backlog, and changelog.

## Ready follow-ups
- `TASK-FT002-02`: scaffold backend `checkout-payment` slice and persistence baseline.
- `TASK-FT002-03`: scaffold frontend `checkout-payment` slice and route shell.

## Guardrails for next task
- Reuse the Telegram runtime adapter boundary from `mini-app-runtime-contract`; do not introduce a parallel client integration path.
- Keep payment/order ownership inside `checkout-payment`; shared code may host only technical helpers.
- Preserve HttpOnly-cookie/session-storage baseline and Telegram-specific verification requirements in runtime scaffolding.
