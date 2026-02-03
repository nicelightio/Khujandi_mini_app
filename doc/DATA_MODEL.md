# DATA_MODEL.md — Схемы PostgreSQL (общий обзор)

_Версия: 0.2  
Дата: 2026-02-03_

---

## Нотация

| Обозначение | Тип |
|-------------|-----|
| `PK` | Primary Key |
| `FK` | Foreign Key |
| `bool` | Boolean |
| `int` | Integer |
| `txt` | TEXT / VARCHAR |
| `ts` | TIMESTAMP WITH TZ |
| `json` | JSONB |

---

## Примечания по JSON/Prisma

- JSONB используем только для `events.payload` и технических снимков.
- Для данных с фильтрацией, индексами и строгими контрактами используем явные поля/таблицы.
- Расширяемые структуры выносим в отдельные таблицы, а не в `Json`.

---

## Таблица `users`

| Поле | Тип | Описание |
|------|-----|----------|
| `telegram_id` **PK** | txt | ID пользователя в Telegram |
| `role` | enum(`client`,`courier`,`seller`,`admin`) | базовая роль |
| `name` | txt | имя |
| `username` | txt | @ник |
| `photo_url` | txt | url аватара |
| `language` | txt | ru/en/tj |
| `registered_at` | ts | дата регистрации |

---

## Таблица `clients_profile`

| Поле | Тип | Описание |
|------|-----|----------|
| `telegram_id` **PK/FK** → users.telegram_id | txt | связь 1:1 |
| `is_vip` | bool | VIP-статус |
| `reputation` | int | 1–10 |
| `purchase_count` | int | кол-во покупок |
| `cancelled_count` | int | отменённые заказы |
| `last_purchase_at` | ts | время последней покупки |
| `last_purchase_price` | numeric(10,2) | сумма |
| `total_spent` | numeric(12,2) | всего потрачено |
| `negative_feedback_count` | int | кол-во плохих отзывов |
| `last_negative_feedback` | txt | текст |
| `last_negative_feedback_date` | ts | дата |

---

## Таблица `couriers_profile`

| Поле | Тип | Описание |
|------|-----|----------|
| `telegram_id` **PK/FK** → users.telegram_id | txt | связь 1:1 |
| `is_available` | bool | доступен ли |
| `is_vip` | bool | VIP-статус |
| `reputation` | int | 1–10 |
| `delivery_count` | int | кол-во доставок |
| `total_earned` | numeric(12,2) | всего заработано |

---

## Таблица `admins_profile`

| Поле | Тип | Описание |
|------|-----|----------|
| `telegram_id` **PK/FK** → users.telegram_id | txt | связь 1:1 |
| `role` | enum(`boss`,`manager`,`admin`) | уровень админа |
| `can_edit` | bool | право правки |
| `negative_feedback` | txt | последний негативный отзыв |
| `negative_feedback_reason` | txt | причина |
| `negative_feedback_date` | ts | дата |

---

## Таблица `sellers_profile`

| Поле | Тип | Описание |
|------|-----|----------|
| `telegram_id` **PK/FK** → users.telegram_id | txt | связь 1:1 |
| `is_vip` | bool | VIP-статус |

---

## Таблица `shops`

| Поле | Тип | Описание |
|------|-----|----------|
| `id` **PK** | int | |
| `owner_id` **FK** → users.telegram_id | txt | продавец |
| `name` | txt | название |
| `description` | txt | описание |
| `is_vip` | bool | VIP |
| `is_deleted` | bool | soft-delete |
| `created_at` | ts | |

---

## Таблица `products`

| Поле | Тип | Описание |
|------|-----|----------|
| `id` **PK** | int | |
| `shop_id` **FK** → shops.id | int | |
| `name` | txt | |
| `description` | txt | |
| `price` | numeric(10,2) | |
| `is_available` | bool | |
| `is_deleted` | bool | soft-delete |
| `created_at` | ts | |

---

## Таблица `orders`

| Поле | Тип | Описание |
|------|-----|----------|
| `id` **PK** | int | |
| `shop_id` **FK** → shops.id | int | |
| `shop_name` | txt | денормализация |
| `seller_id` **FK** → users.telegram_id | txt | |
| `courier_id` **FK** → users.telegram_id | txt | |
| `client_id` **FK** → users.telegram_id | txt | |
| `status` | enum | текущий статус |
| `purchase_price` | numeric(10,2) | |
| `delivery_price` | numeric(10,2) | |
| `vip_flags` | bool x4 | VIP статусы участников |
| `ratings` | int x2 | оценки сторон |
| `comments` | txt x2 | отзывы |
| `created_at` | ts | |
| `updated_at` | ts | |
| `is_deleted` | bool | soft-delete |

---

## Таблица `order_status_history`

| Поле | Тип | Описание |
|------|-----|----------|
| `id` **PK** | int | |
| `order_id` **FK** → orders.id | int | |
| `old_status` | enum | |
| `new_status` | enum | |
| `changed_by` **FK** → users.telegram_id | txt | |
| `changed_at` | ts | |

---

## Таблица `reviews`

| Поле | Тип | Описание |
|------|-----|----------|
| `id` **PK** | int | |
| `order_id` **FK** → orders.id | int | |
| `author_id` **FK** → users.telegram_id | txt | |
| `target_role` | enum | client/courier |
| `rating` | int | 1–5 |
| `text` | txt | |
| `created_at` | ts | |

---

## Таблица `events`

| Поле | Тип | Описание |
|------|-----|----------|
| `id` **PK** | bigint | курсор событий |
| `type` | txt | например `order.status_changed` |
| `entity` | txt | `order`, `review` |
| `entity_id` | txt/int | идентификатор сущности |
| `payload` | json | полезная нагрузка |
| `created_at` | ts | |

---

Конец документа.
