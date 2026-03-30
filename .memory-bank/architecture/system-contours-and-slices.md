---
description: Архитектурный baseline MVP: system contours, vertical slices, allowed shared boundaries.
status: active
---
# System Contours And Slices

## Contours

- `mini-app`: клиентский Telegram WebView контур для каталога, checkout и user-facing tracking.
- `admin-web`: отдельный login/password контур операционного управления; в MVP может временно жить в том же репозитории до физического выделения.
- `telegram-bot`: presentation-канал для уведомлений, статусов и review flows.

## Capability slices

- `catalog`
- `checkout-payment`
- `delivery-assignment`
- `delivery-tracking`
- `order-cancellation`
- `reviews-feedback`
- `admin-access`

## Shell ownership

- `FT-009` описывает cross-slice frontend shell baseline клиентского контура, а не отдельный domain slice.
- Owner boundary для `FT-009`: `mini-app` presentation/shared-ui shell, который обслуживает прежде всего `catalog` и `checkout-payment`, а не переносит доменные правила из этих slices в shared.

## Boundary rules

- Основная единица поставки ценности: vertical slice, а не технический модуль.
- Внутри slice действуют зависимости `presentation -> application -> domain -> infrastructure`.
- Shared допустим только для технических primitives: auth helpers, db bootstrap, error primitives, event transport, UI basics.
- Бизнес-правила и state machine остаются внутри owning slice.

## Related guide

- [.memory-bank/guides/slice-implementation-playbook.md](../guides/slice-implementation-playbook.md): HOW-правила раскладки кода, shared extraction и multi-contour delivery по slices.

## Source artifacts

- [doc/ARCHITECTURE.md](../../doc/ARCHITECTURE.md): каноническая архитектурная модель и boundary rules.
- [doc/PRD.md](../../doc/PRD.md): product scope и capability slices.
- [doc/BRIEF_EXT.md](../../doc/BRIEF_EXT.md): уточнения по repo packaging и runtime contours.
