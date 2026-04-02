---
description: Decision log для декомпозиции FT-002 в waves и task cards.
status: active
---
# FT-002 Decision Log

## Decisions

- 2026-04-01: `FT-002` декомпозируется внутри owning `checkout-payment` slice без выноса payment или auth business rules в `shared`.
- 2026-04-01: Первая wave начинается с docs freeze для session transport policy, Telegram auth boundary и trusted payment confirmation, потому что acceptance criteria требуют explicit documentation до реализации.
- 2026-04-01: Для детерминированной навигации используются feature-scoped task IDs вида `TASK-FT002-0X`.
- 2026-04-01: Verification baseline для `FT-002` включает не только repo-local unit/integration/e2e, но и Telegram-specific evidence по runbook `telegram-mini-app-verification`.
- 2026-04-01: В W2 разделены `auth/session`, `payment finalization`, и `failure/retry` задачи, чтобы security/payment invariants верифицировались независимо.

## Open questions

- Конкретный payment provider transport и webhook/status-confirmation contour в runtime-коде пока не выбран; task cards поэтому фиксируют trusted boundary и anti-replay requirements без выдумывания provider-specific API.

## Notes

- `REQ-022` и `REQ-023` включены в decomposition scope как cross-cutting constraints для auth/payment implementation и verify evidence, хотя RTM primary mapping остается у `FT-002` через auth/payment flow.
