# DATA_MODEL.md — Схемы таблиц PostgreSQL

_Версия: 0.1  
Дата: 2025-05-25_

---

## Нотация

| Обозначение | Тип            |
|-------------|----------------|
| `PK`        | Primary Key    |
| `FK`        | Foreign Key    |
| `bool`      | Boolean        |
| `int`       | Integer        |
| `txt`       | TEXT / VARCHAR |
| `ts`        | TIMESTAMP WITH TZ |

---

## Таблица `clients`

| Поле                     | Тип | Описание |
|--------------------------|-----|----------|
| `id` **PK**              | int | surrogate key |
| `telegram_id`            | txt | идентификатор в TG |
| `name`                   | txt | Имя |
| `username`               | txt | @ник |
| `photo_url`              | txt | url аватара |
| `language`               | txt | ru/en/tj |
| `registered_at`          | ts  | дата регистрации |
| `is_vip`                 | bool| VIP-статус |
| `reputation`             | int | 1–10 |
| `purchase_count`         | int | кол-во покупок |
| `cancelled_count`        | int | отменённые заказы |
| `last_purchase_at`       | ts  | время последней покупки |
| `last_purchase_price`    | numeric(10,2) | сумма |
| `last_shop_id` **FK** → shops.id | int | |
| `total_spent`            | numeric(12,2) | всего потрачено |
| `current_order_status`   | txt | если есть активный заказ |
| `negative_feedback_count`| int | кол-во плохих отзывов |
| `last_negative_feedback` | txt | текст |
| `last_negative_feedback_date` | ts | |

---

## Таблица `couriers`

_(поля по аналогии; добавляется `is_available` и `total_earned`)_

---

## Таблица `admins`

| Поле           | Тип | Описание |
|----------------|-----|----------|
| `telegram_id` **PK** | txt | |
| `name`, `username`, `photo_url` | txt | |
| `is_available`        | bool | |
| `language`            | txt  | |
| `registered_at`       | ts   | |
| `reputation`          | int  | |
| `role`                | enum('boss','manager','admin') |
| `can_edit`            | bool | право правки |
| `negative_feedback`   | txt  | |
| `negative_feedback_reason` | txt | |
| `negative_feedback_date`   | ts  | |

---

## Таблица `shops`

| Поле     | Тип | Описание |
|----------|-----|----------|
| `id` **PK**       | int |
| `owner_id` **FK** → admins.telegram_id | txt |
| `name`            | txt |
| `is_vip`          | bool |
| `created_at`      | ts  |
| `is_deleted`      | bool default false |

---

## Таблица `products`

| Поле            | Тип | Описание |
|-----------------|-----|----------|
| `id` **PK**     | int |
| `shop_id` **FK** → shops.id | int |
| `name`          | txt |
| `description`   | txt |
| `price`         | numeric(10,2) |
| `is_available`  | bool |
| `is_deleted`    | bool |
| `created_at`    | ts  |

---

## Таблица `orders`

| Поле                 | Тип | Описание |
|----------------------|-----|----------|
| `id` **PK**          | int |
| `shop_id` **FK**     | int |
| `shop_name`          | txt (денорм) |
| `seller_id` **FK** → admins.telegram_id | txt |
| `courier_id` **FK** → couriers.id | int |
| `client_id` **FK** → clients.id | int |
| `status`             | enum ... |
| `purchase_price`     | numeric |
| `delivery_price`     | numeric |
| VIP-флаги            | bool x4 |
| оценки, комментарии  | см. ТЗ |
| `created_at`, `updated_at` | ts |

---

## Таблица `order_status_history`

| id PK | order_id FK | old_status | new_status | changed_by | changed_at ts |

---

## Таблица `event_logs`

_(описана в `ARCHITECTURE_OVERVIEW.md`)_

---

## ER-диаграмма

См. раздел 7 в `ARCHITECTURE_OVERVIEW.md`.