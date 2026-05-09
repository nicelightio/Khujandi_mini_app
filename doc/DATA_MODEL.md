# DATA_MODEL.md — Концептуальная модель данных MVP

_Версия: 1.1_  
_Дата: 2026-03-27_  
_Источник требований: `doc/PRD.md`_

## 1. Принципы модели

- Модель отражает MVP-решения PRD и не является финальной Prisma-схемой.
- Доменные данные — явные колонки/таблицы; JSONB только там, где это оправдано.
- `events.id` хранится как `bigint`; в API отдается строкой.
- Soft-delete используется для магазинов, товаров и заказов (через `is_deleted`).
- Общая БД не отменяет vertical slices: слайсы разделяют модель данных, но ответственность за бизнес-правила остается внутри соответствующего слайса.

## 1.1 Канонические capability slices и покрытие данных

| Slice | Основные таблицы |
|------|------------------|
| `catalog` | `shops`, `products`, `users`, `sellers_profile` |
| `checkout-payment` | `orders`, `users`, `shops`, `products`, `events` |
| `delivery-assignment` | `orders`, `users`, `couriers_profile`, `events` |
| `delivery-tracking` | `orders`, `order_status_history`, `events` |
| `order-cancellation` | `orders`, `order_status_history`, `events` |
| `reviews-feedback` | `reviews`, `orders`, `users`, `events` |
| `admin-access` | `admin_credentials`, `admin_auth_sessions`, `admin_auth_audit`, `users` |

Эта таблица нужна для навигации по модели, а не как запрет на чтение смежных таблиц.

## 2. Роли и пользователи

### 2.1 `users`

| Поле | Тип | Описание |
|------|-----|----------|
| `id` PK | bigint | Внутренний идентификатор |
| `telegram_id` | text, unique, nullable | Telegram ID (для Mini App/бота) |
| `role` | enum | `boss`/`operator`/`admin`/`seller`/`courier`/`client` |
| `name` | text | Имя |
| `username` | text | Telegram username |
| `language` | text | `ru`/`en`/`tj` |
| `is_active` | bool | Активен ли пользователь |
| `created_at` | timestamptz | Создание |
| `updated_at` | timestamptz | Обновление |

### 2.2 Профили ролей (1:1)

- `clients_profile`
- `couriers_profile`
- `sellers_profile`
- `admins_profile`

`admins_profile` хранит операционные признаки роли и доступов, но каноническая роль в контрактах остается в `users.role`.

## 3. Контур веб-админки (login/password)

### 3.1 `admin_credentials`

| Поле | Тип | Описание |
|------|-----|----------|
| `user_id` PK/FK -> users.id | bigint | Только для ролей `boss/operator/admin` |
| `password_hash` | text | Хэш пароля |
| `password_updated_at` | timestamptz | Когда обновлен пароль |
| `failed_attempts` | int | Счетчик неудачных попыток |
| `failed_window_started_at` | timestamptz | Начало окна 15 минут |
| `locked_until` | timestamptz, nullable | Блокировка до времени |
| `created_by_user_id` | bigint | Кто создал учетку (обычно `boss`) |
| `created_at` | timestamptz | Создание |

### 3.2 `admin_auth_sessions`

| Поле | Тип | Описание |
|------|-----|----------|
| `id` PK | uuid | ID сессии |
| `user_id` FK -> users.id | bigint | Владелец сессии |
| `refresh_token_hash` | text | Хэш refresh token |
| `expires_at` | timestamptz | До 3 дней |
| `last_activity_at` | timestamptz | Для idle-timeout 30 минут |
| `revoked_at` | timestamptz, nullable | Отзыв сессии |

### 3.3 `admin_auth_audit`

| Поле | Тип | Описание |
|------|-----|----------|
| `id` PK | bigint | |
| `user_id` FK -> users.id | bigint, nullable | |
| `event_type` | text | `login_success`/`login_failed`/`locked`/`logout` |
| `ip` | text | IP источника |
| `user_agent` | text | User-Agent |
| `trace_id` | text | Сквозной идентификатор |
| `created_at` | timestamptz | |

## 4. Каталог

### 4.1 `shops`

| Поле | Тип | Описание |
|------|-----|----------|
| `id` PK | bigint | |
| `owner_id` FK -> users.id | bigint | Продавец |
| `name` | text | Текущее имя |
| `description` | text | |
| `is_deleted` | bool | Soft-delete |
| `rename_free_used` | bool | Использована ли бесплатная попытка |
| `rename_paid_required` | bool | Нужен ли ручной учет платности |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### 4.2 `products`

| Поле | Тип | Описание |
|------|-----|----------|
| `id` PK | bigint | |
| `shop_id` FK -> shops.id | bigint | |
| `name` | text | |
| `description` | text | |
| `price` | numeric(12,2) | |
| `is_available` | bool | Доступность |
| `is_deleted` | bool | Soft-delete |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

## 5. Заказы, оплата, отмены

### 5.1 `orders`

| Поле | Тип | Описание |
|------|-----|----------|
| `id` PK | bigint | |
| `shop_id` FK -> shops.id | bigint | |
| `shop_name_snapshot` | text | Снимок имени магазина в момент заказа |
| `seller_id` FK -> users.id | bigint | |
| `courier_id` FK -> users.id, nullable | bigint | |
| `client_id` FK -> users.id | bigint | |
| `status` | enum | `CREATED/ASSIGNED/IN_PROGRESS/DELIVERED/COMPLETED/CANCELLED_*` |
| `items_total` | numeric(12,2) | Сумма товаров |
| `delivery_fee` | numeric(12,2) | Стоимость доставки |
| `total_amount` | numeric(12,2) | Итог |
| `payment_provider` | text | Локальный провайдер |
| `payment_provider_tx_id` | text | Идентификатор транзакции |
| `payment_status` | enum | `PAID` для созданных заказов MVP |
| `cancel_reason_code` | text, nullable | Причина отмены |
| `cancelled_by_user_id` FK -> users.id, nullable | bigint | Кто отменил |
| `refund_status` | enum | `NOT_REQUIRED/PENDING_MANUAL/DONE/REJECTED` |
| `refund_note` | text, nullable | Комментарий оператора |
| `is_deleted` | bool | Soft-delete |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

Примечание MVP:
- Заказ создается только после успешной оплаты.
- При payment error/timeout запись в `orders` не создается.

### 5.2 `order_status_history`

| Поле | Тип | Описание |
|------|-----|----------|
| `id` PK | bigint | |
| `order_id` FK -> orders.id | bigint | |
| `old_status` | enum | |
| `new_status` | enum | |
| `changed_by_user_id` FK -> users.id | bigint | |
| `changed_at` | timestamptz | |

## 6. Отзывы

### 6.1 `reviews`

| Поле | Тип | Описание |
|------|-----|----------|
| `id` PK | bigint | |
| `order_id` FK -> orders.id | bigint | |
| `author_id` FK -> users.id | bigint | Кто оставил отзыв |
| `target_user_id` FK -> users.id | bigint | Кому отзыв |
| `target_role` | enum | `client` или `courier` |
| `rating` | int | 1..5 |
| `reason_code` | text, nullable | Код причины |
| `comment` | text, nullable | Текст отзыва |
| `source` | enum | `miniapp`/`telegram_bot` |
| `created_at` | timestamptz | |

Ограничения MVP:
- Двусторонние отзывы обязательны.
- Клиентский сценарий идет через Telegram-бота в 3 шага: `rating -> reason_code -> comment`.
- При `rating <= 2` формируется негативный алерт.

## 7. События

### 7.1 `events`

| Поле | Тип | Описание |
|------|-----|----------|
| `id` PK | bigint | Курсор событий |
| `type` | text | Например `order.created`, `order.status_changed` |
| `entity` | text | `order`, `review`, `auth` |
| `entity_id` | text | ID сущности строкой |
| `payload` | jsonb | Полезная нагрузка события |
| `created_at` | timestamptz | |

## 8. Рекомендуемые индексы (MVP)

- `users(role)`
- `orders(client_id, created_at desc)`
- `orders(courier_id, status, updated_at desc)`
- `orders(status, updated_at desc)`
- `order_status_history(order_id, changed_at)`
- `reviews(order_id, created_at)`
- `events(id)`
- `events(entity, entity_id, id)`
- `admin_auth_sessions(user_id, expires_at)`
- `admin_auth_audit(user_id, created_at desc)`

## 9. Открытые уточнения после MVP

- Автоматизация refund-процесса через провайдера.
- Добавление 2FA для веб-админки.
- Расширение payment-таблиц под reconcile/ledger.
