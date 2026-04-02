---
description: ASCII-схема разрешенных зависимостей и мест размещения логики в backend и frontend slices.
status: active
---
# Slice Boundaries And Dependencies

## Why this matters

- Схема помогает агенту быстро решить, в каком слое должна жить новая логика.
- Она снижает риск shared drift и переноса бизнес-правил в shell/shared слои.

## Diagram

```text
Backend slice
-------------

presentation
    |
    v
application
    |
    v
domain
    |
    v
infrastructure

Allowed technical shared dependencies:
presentation/application/domain/infrastructure --> backend/src/shared/{db,errors,testing,...}

Forbidden drift:
cross-slice business logic --> shared/
shared/ --> owning slice domain semantics


Frontend slice
--------------

routes / components
        |
        v
hooks / view-model
        |
        v
slice api
        |
        v
backend contract

Allowed technical shared dependencies:
slice UI --> frontend/src/shared/{ui,styles,i18n,lib}
shell/runtime --> frontend/src/shared/{telegram,state}

Forbidden drift:
Telegram.WebApp direct calls --> slice components/hooks
domain rules --> frontend shared shell/runtime


Project-wide rule
-----------------

business rule ownership stays inside the owning slice
```

## Detailed Mini App frontend layer view

```text
LAYER VIEW

+--------------------------------------------------------------------------------+
| Mini App Frontend                                                              |
+--------------------------------------------------------------------------------+
| presentation                                                                   |
|--------------------------------------------------------------------------------|
| app/bootstrap                                                                  |
| app/router                                                                     |
| shared/ui                                                                      |
| slices/catalog/routes                                                          |
| slices/checkout-payment/routes                                                 |
| slices/delivery-tracking/routes                                                |
| slices/reviews-feedback/routes                                                 |
|                                                                                |
| uses                                                                           |
|   -> shared/state                                                              |
|   -> shared/i18n                                                               |
|   -> shared/telegram/mini-app-runtime-adapter                                  |
+--------------------------------------------------------------------------------+
| application                                                                    |
|--------------------------------------------------------------------------------|
| slices/*/hooks                                                                 |
| slices/*/api                                                                   |
| orchestration of UI flows                                                      |
|                                                                                |
| examples                                                                       |
|   - start checkout                                                             |
|   - request auth handoff                                                       |
|   - refresh order status after resume                                          |
|   - save selected language                                                     |
|                                                                                |
| uses                                                                           |
|   -> runtime primitives from adapter                                           |
|   -> backend API                                                               |
+--------------------------------------------------------------------------------+
| domain                                                                         |
|--------------------------------------------------------------------------------|
| slices/*/model                                                                 |
| frontend view-model rules and local invariants                                 |
|                                                                                |
| examples                                                                       |
|   - checkout step state                                                        |
|   - delivery status mapping                                                    |
|   - review form rules                                                          |
+--------------------------------------------------------------------------------+
| infrastructure                                                                 |
|--------------------------------------------------------------------------------|
| shared/telegram/mini-app-runtime-adapter                                       |
| shared/lib/storage                                                             |
| shared/lib/http                                                                |
|                                                                                |
| owns direct integration with                                                   |
|   - window.Telegram.WebApp                                                     |
|   - DeviceStorage / CloudStorage                                               |
|   - theme events                                                               |
|   - viewport events                                                            |
|   - safe-area events                                                           |
|   - lifecycle events                                                           |
|   - popup/confirm bridge                                                       |
+--------------------------------------------------------------------------------+
```

## Dependency direction

```text
presentation
  -> application
    -> domain
    -> infrastructure contracts
infrastructure
  -> Telegram WebApp API / browser APIs
```

## Important rule

```text
slices/* presentation/application/domain
  X do not call window.Telegram.WebApp directly

only
shared/telegram/mini-app-runtime-adapter
  -> calls Telegram WebApp API
```

## Placement guide

- HTTP/controller concerns идут в `presentation`.
- Use-case orchestration идет в `application`.
- Инварианты, ownership rules и state semantics идут в `domain`.
- Prisma, transport adapters и внешние интеграции идут в `infrastructure`.
- Во frontend Telegram-specific runtime code живет в `shared/telegram` и shell-level shared primitives, а не в доменных slice-компонентах.
- `shared/lib/storage` и `shared/lib/http` относятся к infrastructure/helpers и не должны становиться местом для slice-specific правил.

## Normative sources

- [.memory-bank/architecture/system-contours-and-slices.md](../architecture/system-contours-and-slices.md)
- [.memory-bank/architecture/frontend-presentation-and-webview.md](../architecture/frontend-presentation-and-webview.md)
- [.memory-bank/guides/slice-implementation-playbook.md](../guides/slice-implementation-playbook.md)
- [.memory-bank/guides/frontend-slices-and-webview.md](../guides/frontend-slices-and-webview.md)
