# API_GUIDELINES.md — REST + Events (MVP)

_Версия: 1.1_  
_Дата: 2026-03-27_  
_Источник требований: `doc/PRD.md`_

## 1. Базовые принципы

- Базовый префикс API: `/api/v1`.
- Формат: JSON (`application/json; charset=utf-8`).
- Команды/изменения: REST endpoint-ы.
- Чтение изменений: polling `GET /events?since=<cursor>`.
- `revision`/`next_cursor` передаются строкой (`events.id` = BigInt).
- Единый `trace_id` обязателен в ошибках и логах.
- Контракты проектируются вокруг capability slices, а не вокруг абстрактного глобального CRUD.

## 1.1 Канонические capability slices как источник контрактов

Канонические capability slices MVP:
- `catalog`
- `checkout-payment`
- `delivery-assignment`
- `delivery-tracking`
- `order-cancellation`
- `reviews-feedback`
- `admin-access`

Правила:
- endpoint должен принадлежать конкретному slice или явно обозначенному shared-platform контуру;
- события публикуются от имени slice и отражают бизнес-факт;
- новые write-контракты добавляются вместе с acceptance-сценарием и тестами slice.

## 2. Контуры авторизации

### 2.1 Mini App (Telegram)

1. `POST /auth/telegram` принимает `initData`.
2. Backend валидирует подпись (HMAC) и `auth_date`.
3. Выдается JWT для пользовательского контура.

Важно:
- `initDataUnsafe` не используется для доверенных решений.
- Все защищенные endpoint-ы требуют `Authorization: Bearer <token>`.

### 2.2 Веб-админка (отдельный auth-контур)

- Login/password (без 2FA в MVP).
- Админ-аккаунты создаются только вручную ролью `boss`.
- Self-signup отсутствует.
- Пароль: минимум 12 символов.
- Защита входа: 5 неудачных попыток за 15 минут -> блокировка 30 минут.
- Аудит входов/блокировок обязателен.

Рекомендуемые endpoint-ы:
- `POST /admin/auth/login`
- `POST /admin/auth/refresh`
- `POST /admin/auth/logout`

Сессии веб-админки:
- access token: 15 минут;
- refresh/session lifetime: 3 дня;
- auto-logout: 30 минут неактивности.

## 3. RBAC (канонические коды ролей)

Системные роли в контрактах:
`boss`, `manager`, `admin`, `seller`, `courier`, `client`.

Принципы:
- Проверка роли обязательна для всех write-операций.
- Ошибка прав: `403 FORBIDDEN`.
- Доступ к админским операциям отделен от клиентских.

## 4. Формат ошибок

```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Invalid status transition",
    "details": {"order_id": 42}
  },
  "trace_id": "req_8f1d2c"
}
```

| HTTP | Код | Когда |
|------|-----|-------|
| 400 | `VALIDATION_ERROR` | Неверные входные данные |
| 401 | `AUTH_REQUIRED` | Не пройдена авторизация |
| 403 | `FORBIDDEN` | Недостаточно прав |
| 404 | `NOT_FOUND` | Ресурс не найден |
| 409 | `CONFLICT` | Конфликт состояния/перехода |
| 429 | `TOO_MANY_REQUESTS` | Rate limit/временная блокировка |
| 500 | `INTERNAL_ERROR` | Внутренняя ошибка |

## 5. Ключевые бизнес-правила API (из PRD)

- Заказ создается только после подтвержденной успешной оплаты.
- При payment error/timeout заказ не создается; клиенту возвращается ошибка + retry.
- Клиент не может отменять заказ.
- Отмена доступна `admin` и `courier` (операционный кейс unavailable).
- Возврат средств в MVP фиксируется как ручной оператором.
- Успешным для KPI считается только заказ в `COMPLETED`.

## 6. Orders API (концепт MVP)

Orders API покрывает несколько slices: `checkout-payment`, `delivery-assignment`, `delivery-tracking`, `order-cancellation`.

Примерный набор endpoint-ов:
- `POST /orders/checkout` — checkout + оплата + создание заказа после успеха.
- `GET /orders`
- `GET /orders/{id}`
- `PATCH /orders/{id}/assign-courier`
- `PATCH /orders/{id}/status`
- `PATCH /orders/{id}/cancel`

Статусы заказа:
`CREATED -> ASSIGNED -> IN_PROGRESS -> DELIVERED -> COMPLETED`  
Отмена:
- `CANCELLED_BY_ADMIN`
- `CANCELLED_BY_COURIER_UNAVAILABLE`

Невалидный переход статуса должен возвращать `409 CONFLICT`.

## 7. Reviews API (двусторонние отзывы)

- `POST /reviews` — создание отзыва.
- `GET /reviews?order_id=<id>` — чтение отзывов заказа.

Клиентский отзыв в MVP формируется через Telegram-бота в 3 шага:
1) `rating` (1..5)
2) `reason_code` (enum)
3) `comment` (optional)

При `rating <= 2` создается событие негативного отзыва и отправляется алерт через Telegram-бота.

## 7.1 Группировка контрактов по slices

Рекомендуемая группировка контрактов по slices:
- `catalog`: `/shops`, `/products`
- `checkout-payment`: `/orders/checkout`
- `delivery-assignment`: `/orders/{id}/assign-courier`
- `delivery-tracking`: `/orders/{id}/status`, `/events`
- `order-cancellation`: `/orders/{id}/cancel`
- `reviews-feedback`: `/reviews`
- `admin-access`: `/admin/auth/*`

## 8. Events polling

`GET /events?since=<cursor>` возвращает доменные события в порядке возрастания revision.

Пример:

```json
{
  "events": [
    {
      "type": "order.status_changed",
      "entity": "order",
      "entity_id": 42,
      "payload": {"status": "IN_PROGRESS"},
      "revision": "1024",
      "created_at": "2026-02-10T12:00:00Z"
    }
  ],
  "next_cursor": "1024"
}
```

Требования:
- Формат событий должен оставаться совместимым для будущего SSE/WS.
- События должны покрывать все write-операции домена.
- Целевой SLA отображения обновлений в UI через polling: p95 <= 10 секунд.
- `events` является общим транспортом для нескольких slices, но семантика каждого события остается внутри соответствующего слайса.

## 9. Telegram-бот: обязательные уведомления (must-have)

1. Новый заказ.
2. Назначение курьера.
3. Каждая смена статуса заказа.
4. Негативный отзыв.

## 10. Локализация и API

- Язык ответа: `Accept-Language` (приоритетно) или `lang` в query.
- Поддерживаемые языки: `ru`, `en`, `tj` (fallback на `ru`).

## 11. OpenAPI

- Swagger UI: `/docs`
- OpenAPI JSON: `/openapi.json`
