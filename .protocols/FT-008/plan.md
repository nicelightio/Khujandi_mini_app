---
description: План декомпозиции FT-008 в implementation plan и execution-ready backlog.
status: active
---
# FT-008 Decomposition Plan

## Goal

- Разложить `FT-008` на атомарные implementation tasks для двусторонних bot-guided reviews, completed-order gate, duplicate-safe review submission и negative alert fan-out без смешения со scope `FT-007` admin auth/session.

## Inputs used

- [.memory-bank/features/FT-008-two-sided-reviews-and-negative-alerts.md](../../.memory-bank/features/FT-008-two-sided-reviews-and-negative-alerts.md): owning feature spec, acceptance criteria и edge cases.
- [.memory-bank/epics/EP-004-reviews-and-alerts.md](../../.memory-bank/epics/EP-004-reviews-and-alerts.md): parent epic и reviews/alerts outcome.
- [.memory-bank/requirements.md](../../.memory-bank/requirements.md): `REQ-013`, `REQ-014` и RTM.
- [.memory-bank/contracts/telegram-bot-contract.md](../../.memory-bank/contracts/telegram-bot-contract.md): bot review flow, payload baseline и fan-out contract.
- [.memory-bank/runbooks/manual-refund-and-negative-alerts.md](../../.memory-bank/runbooks/manual-refund-and-negative-alerts.md): negative alert operational response and abuse handling.
- [.memory-bank/architecture/events-polling-and-bot-runtime.md](../../.memory-bank/architecture/events-polling-and-bot-runtime.md): runtime ownership and duplicate-safe bot handling.
- [.memory-bank/architecture/data-boundaries-and-persistence.md](../../.memory-bank/architecture/data-boundaries-and-persistence.md): ownership `reviews` model и alert semantics.
- [.memory-bank/states/order-lifecycle.md](../../.memory-bank/states/order-lifecycle.md): `COMPLETED` prerequisite for feedback loop.
- [.memory-bank/testing/index.md](../../.memory-bank/testing/index.md): reviews-feedback verification baseline.

## Current repository state

- `FT-005` already closes order progression to `COMPLETED`, so `FT-008` can treat completed delivery as a stable upstream trigger.
- Existing Telegram bot files cover assignment and courier tracking only; review-specific slice/runtime code is still absent.
- `FT-007` is decomposed separately, therefore review alerts must avoid taking ownership of admin login/session behavior while still targeting active admins through a dedicated boundary.

## Decomposition strategy

1. W1: freeze docs-first review/alert boundary and add backend plus bot harness scaffolding.
2. W2: implement review persistence/idempotency, low-rating alert generation and bot-guided step flow.
3. W3: close with repo-local bot/e2e verification evidence and docs sync.

## Constraints

- Review flow starts only after `COMPLETED`.
- Both review directions are required already in MVP.
- `rating` and `reason_code` are required; `comment` is optional.
- Duplicate/replay bot deliveries must be safe and must not duplicate review or alert side effects.
- `review.negative` remains the only explicit fan-out exception to default actor-targeted bot delivery.

## Expected outputs

- `.memory-bank/tasks/plans/IMPL-FT-008.md`
- backlog section с `TASK-FT008-*`
- execution-ready W1 task для docs/spec freeze по review payload, duplicate protection и negative alert boundary
