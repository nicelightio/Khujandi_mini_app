# API_GUIDELINES.md — REST + Events для NestJS

_Версия: 0.2  
Дата: 2026-02-03_

---

## 1. Базовые принципы

- **Базовый префикс**: `/api/v1`  
- **JSON-only**: `Content-Type: application/json; charset=utf-8`  
- **REST для команд**: создание/изменение/удаление только через REST-эндпоинты  
- **Polling для чтения**: `GET /events?since=<cursor>`  
- **Версионирование данных**: в ответах `updated_at` и `revision` (ETag/Last-Modified по желанию)
- **BigInt курсоры**: `revision` и `next_cursor` передаются строкой, так как `events.id` — BigInt (JSON не поддерживает BigInt).

---

## 2. Авторизация

1) `POST /auth/telegram` принимает `initData` от WebApp.  
2) Backend проверяет подпись и выдает JWT.  
3) Все последующие запросы: `Authorization: Bearer <token>`.
`initDataUnsafe` не используется для доверенных решений; `initData` валидируется через HMAC и проверку `auth_date`.

---

## 3. Формат ошибок

Единый формат ошибок через глобальный фильтр:

```json
{
  "error": {
    "code": "ORDER_NOT_FOUND",
    "message": "Order not found",
    "details": {"order_id": 42}
  },
  "trace_id": "req_8f1d2c"
}
```

| HTTP | Код | Ситуация |
|------|-----|----------|
| 400  | `VALIDATION_ERROR` | Ошибка данных |
| 401  | `AUTH_REQUIRED` | Не пройдена авторизация |
| 403  | `FORBIDDEN` | Недостаточно прав |
| 404  | `NOT_FOUND` | Ресурс не найден |
| 409  | `CONFLICT` | Конфликт состояния |
| 500  | `INTERNAL_ERROR` | Внутренняя ошибка |

---

## 4. Events polling

`GET /events?since=<cursor>` возвращает последовательные доменные события (cursor передаётся строкой).

```json
{
  "events": [
    {
      "type": "order.status_changed",
      "entity": "order",
      "entity_id": 42,
      "payload": {"status": "IN_PROGRESS"},
      "revision": "1024",
      "created_at": "2026-02-03T12:00:00Z"
    }
  ],
  "next_cursor": "1024"
}
```

---

## 5. Типовые эндпоинты

### Auth

- `POST /auth/telegram`

### Orders

- `GET /orders`  
- `POST /orders`  
- `GET /orders/{id}`  
- `PATCH /orders/{id}` (изменение статуса, назначение курьера)  
- `DELETE /orders/{id}` (soft-delete)

### Shops / Products

- `GET /shops`, `POST /shops`, `GET /shops/{id}`, `PATCH /shops/{id}`  
- `GET /products`, `POST /products`, `GET /products/{id}`, `PATCH /products/{id}`

### Reviews

- `GET /reviews?order_id=42`  
- `POST /reviews`

### Couriers (через бот)

- `POST /couriers/{id}/status`  тело `{ "status": "IN_PROGRESS" }`

---

## 6. Локализация

Язык ответа задаётся `Accept-Language` или параметром `lang` в query. Приоритет — заголовок.

---

## 7. OpenAPI

Swagger UI: `/docs`, JSON-схема: `/openapi.json`.

---

Конец документа.
