---
description: Глобальные инварианты и запреты проекта (MUST/NEVER).
status: active
---
# Invariants

## MUST
- Заказ создается только после подтвержденной успешной оплаты.
- Trusted payment confirmation требует server-side provider verification и anti-replay.
- `auth_date` для Telegram Mini App auth не старше 10 минут.
- Все write-операции проходят через соответствующий auth-контур и RBAC.
- Все значимые доменные изменения создают событие в `events`.
- Seller shop/menu page/product writes внутри `catalog` не являются исключением: они MUST оставлять explicit persisted event artifacts.
- Валидные смены статуса заказа пишутся в `order_status_history`.
- `revision` / `cursor` на API-границе сериализуются строкой.
- Негативный отзыв (`rating <= 2`) с любой стороны вызывает Telegram alert.
- Ручной refund при отмене должен отражаться явным refund-состоянием и аудитом.
- Веб-админка должна аудировать успешные/неуспешные входы и блокировки.
- Первый запуск Mini App должен включать обязательный выбор языка `ru/en/tj`.
- Seller management остается внутри `catalog`, даже если доставляется через shared storefront и отдельный seller-facing web contour.

## NEVER
- Не создавать заказ при payment error или timeout.
- Не создавать заказ по client-only сигналу об оплате без trusted provider confirmation.
- Не позволять клиенту отменять заказ.
- Не доверять `initDataUnsafe` для авторизации или иных доверенных решений.
- Не обходить серверную state machine переходов заказа.
- Не вводить Redis, очереди, 2FA или авто-refund как часть MVP without explicit scope change.
- Не использовать broad broadcast как дефолт для bot notifications, если достаточно actor-targeted доставки.
- Не вводить отдельный heavy seller builder/editor или UI-функционал `delete` для catalog MVP без отдельного explicit scope change.

## Notes
- Источники: `doc/PRD.md`, `doc/ARCHITECTURE.md`, `doc/API_GUIDELINES.md`, `doc/DATA_MODEL.md`.
