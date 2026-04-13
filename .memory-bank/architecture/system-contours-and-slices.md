---
description: Архитектурный baseline MVP: system contours, vertical slices, allowed shared boundaries.
status: active
---
# System Contours And Slices

## Contours

Ниже зафиксирована целевая contour model MVP. В checked-in repo reality уже существуют customer-facing `mini-app` browse/shell, `admin-web`, и узкие seller/admin catalog surfaces, но канонический DB-backed catalog runtime baseline для этих surfaces еще не закрыт и вынесен в `FT-011`.

- `mini-app`: общий Telegram WebView storefront contour для customer browse/checkout/tracking и seller edit mode на тех же storefront-компонентах.
- `seller-web`: отдельная узкая админка магазина для легких catalog-owned функций seller-а; canonical route family для первой версии: `/seller/*`.
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

- `FT-009` описывает cross-slice frontend shell baseline `mini-app` contour, а не отдельный domain slice.
- Owner boundary для `FT-009`: `mini-app` presentation/shared-ui shell, который обслуживает прежде всего `catalog` и `checkout-payment`, включая shared storefront для customer и seller modes, но не переносит доменные правила из этих slices в shared.
- Прямой доступ к `Telegram.WebApp.*` допускается только из shell/runtime adapter слоя.

## Boundary rules

- Основная единица поставки ценности: vertical slice, а не технический модуль.
- Внутри slice действуют зависимости `presentation -> application -> domain -> infrastructure`.
- Shared допустим только для технических primitives: auth helpers, db bootstrap, error primitives, event transport, UI basics.
- В `mini-app` shared дополнительно допустимы только runtime-enabling primitives: Telegram bootstrap, theme/safe-area/viewport/lifecycle adapters, feature detection, storage-policy helpers и shell-level navigation policies.
- Если change затрагивает несколько UI contour-ов, каждый contour реализует только свой presentation-layer одного и того же owning slice.
- Seller management остается внутри owning slice `catalog`, даже если использует одновременно shared storefront в `mini-app` и отдельный `seller-web` contour.
- Public `mini-app`, shared seller storefront, narrow `seller-web`, and admin-side catalog provisioning MUST share one canonical DB-backed `catalog` runtime path; contour-specific in-memory state MUST NOT становиться отдельным source of truth.
- `seller-web` baseline не должен втягивать reporting/analytics или другой cross-slice behavior без отдельного explicit spec change.
- Бизнес-правила и state machine остаются внутри owning slice.

## Related guide

- [.memory-bank/guides/slice-implementation-playbook.md](../guides/slice-implementation-playbook.md): HOW-правила раскладки кода, shared extraction и multi-contour delivery по slices.

## Source artifacts

- [doc/ARCHITECTURE.md](../../doc/ARCHITECTURE.md): каноническая архитектурная модель и boundary rules.
- [doc/PRD.md](../../doc/PRD.md): product scope и capability slices.
- [doc/BRIEF_EXT.md](../../doc/BRIEF_EXT.md): уточнения по repo packaging и runtime contours.
