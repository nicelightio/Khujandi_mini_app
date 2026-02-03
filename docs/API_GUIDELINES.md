# API_GUIDELINES.md — REST & WebApp API Design

_Версия: 0.1  
Дата: 2025-05-25_

---

## 1. Базовые принципы

| Правило | Пояснение |
|---------|-----------|
| **URI = ресурс** | `/orders`, `/orders/{id}/reviews`, `/shops/{id}/products` |
| **HTTP-методы** | GET = чтение, POST = создание, PUT/PATCH = изменение, DELETE = мягкое удаление |
| **Версионирование** | `/api/v1/…` — мажорная версия в URI |
| **JSON-only** | `Content-Type: application/json; charset=utf-8` |
| **Язык ответа** | Заголовок `Accept-Language` либо `lang` в пути (`/{lang}/…`) |
| **Стандартизированные ошибки** | JSON: `{ "detail": "Not Found", "code": "ORDER_404", "trace_id": "…" }` |

---

## 2. Соглашения по параметрам

| Тип        | Пример |
|------------|---------------------------------|
| Фильтрация | `GET /products?shop_id=1&is_available=true` |
| Сортировка | `sort_by=created_at&sort_order=desc` |
| Пагинация  | `limit=20&offset=40` |

---

## 3. Авторизация

Telegram передаёт токен (hash) в заголовке `X-Telegram-Auth`. Backend проверяет подпись, извлекает `telegram_id` и сопоставляет пользователя.

---

| HTTP Code | Код   | Ситуация               |
|-----------|-------|------------------------|
| 400       | *_400 | Валидация данных       |
| 401       | AUTH  | Не пройдена авторизация|
| 403       | PERM  | Недостаточно прав      |
| 404       | *_404 | Ресурс не найден       |
| 409       | *_409 | Конфликт состояния     |
| 500       | SRV   | Внутренняя ошибка      |

---

## 5. Типовые эндпоинты

### Заказы

| Метод | URI            | Описание            |
|-------|----------------|---------------------|
| GET   | `/orders`      | Список/фильтр       |
| POST  | `/orders`      | Создать заказ       |
| GET   | `/orders/{id}` | Детали заказа       |
| PUT   | `/orders/{id}` | Обновить (status)   |
| DELETE| `/orders/{id}` | Soft delete         |

### Отзывы

`GET /reviews?order_id=42` , `POST /reviews`

### Курьеры: статус через бот

`POST /couriers/{id}/status`  тело `{ "status": "IN_PROGRESS" }`

---

## 6. WebHooks / Bot-Callbacks

- `POST /webhook/tg/order_status` — курьер меняет статус через inline-команду  
- `POST /webhook/tg/error` — ловим ошибки Telegram-бота

---

## 7. OpenAPI

Swagger UI доступен по `/docs`, JSON-схема — `/openapi.json`.  
Сгенерированная схема nightly публикуется в `docs/openapi/`.