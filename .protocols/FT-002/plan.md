---
description: План декомпозиции FT-002 в implementation plan и execution-ready backlog.
status: active
---
# FT-002 Decomposition Plan

## Goal

- Разложить `FT-002` на атомарные implementation tasks для Telegram auth, trusted payment confirmation и создания заказа только после успешной оплаты.

## Inputs used

- [.memory-bank/features/FT-002-checkout-payment-and-order-creation.md](../../.memory-bank/features/FT-002-checkout-payment-and-order-creation.md): owning feature spec.
- [.memory-bank/epics/EP-001-customer-ordering-experience.md](../../.memory-bank/epics/EP-001-customer-ordering-experience.md): parent epic и customer-facing outcome.
- [.memory-bank/requirements.md](../../.memory-bank/requirements.md): `REQ-004`, `REQ-005`, `REQ-006`, `REQ-021`, `REQ-022`, `REQ-023` и RTM.
- [.memory-bank/contracts/telegram-mini-app-auth-contract.md](../../.memory-bank/contracts/telegram-mini-app-auth-contract.md): auth boundary и replay/TTL rules.
- [.memory-bank/contracts/payment-confirmation-contract.md](../../.memory-bank/contracts/payment-confirmation-contract.md): trusted payment confirmation и anti-replay.
- [.memory-bank/architecture/system-contours-and-slices.md](../../.memory-bank/architecture/system-contours-and-slices.md): slice boundaries.
- [.memory-bank/architecture/data-boundaries-and-persistence.md](../../.memory-bank/architecture/data-boundaries-and-persistence.md): payment identity persistence и DB uniqueness.
- [.memory-bank/testing/index.md](../../.memory-bank/testing/index.md): verification baseline.
- [.memory-bank/runbooks/telegram-mini-app-verification.md](../../.memory-bank/runbooks/telegram-mini-app-verification.md): Telegram-specific verify requirements.

## Current repository state

- В репозитории уже есть baseline `backend/`, `frontend/`, `tests/` и реализованный `catalog` slice.
- Отдельный `checkout-payment` runtime slice пока не зафиксирован в коде, поэтому foundation wave начинается с docs freeze и slice scaffolding.
- `frontend/src/shared/telegram/*` и shell-level primitives уже существуют, значит `FT-002` должен переиспользовать runtime adapters, а не вводить параллельный Telegram integration path.

## Decomposition strategy

1. W1: зафиксировать auth/session/payment boundaries и поднять backend/frontend skeleton для owning `checkout-payment` slice.
2. W2: реализовать Telegram auth, trusted payment confirmation, paid-only order creation и controlled failure semantics на backend.
3. W3: подключить Mini App checkout UX, verification suite и Telegram-specific evidence/docs sync.

## Constraints

- Нет заказа без trusted successful payment.
- `initDataUnsafe` не используется для доверенных auth decisions.
- Replay того же `initData` и duplicate payment callback не должны создавать повторный auth/order side effect.
- Session transport policy и CSRF baseline должны быть явно задокументированы до runtime implementation.
- Client-only payment signals не могут завершать order creation.

## Expected outputs

- `.memory-bank/tasks/plans/IMPL-FT-002.md`
- backlog section с `TASK-FT002-*`
- execution-ready foundation wave для старта `FT-002`
