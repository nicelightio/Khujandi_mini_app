# Архитектура проекта *Khujandi Mini App*

_Версия: 0.2  
Дата: 2026-02-03_

---

## 1. Общая картина

Проект строится как модульный монолит на NestJS. Основные потоки — REST-команды и polling чтение событий. Telegram-бот — модуль внутри того же backend-приложения.

**Стек**: NestJS + TypeScript + Prisma + PostgreSQL, Docker/Compose для окружения.

---

## 2. Целевая структура репозитория

```
backend/
  src/
    modules/
      auth/
      users/
      shops/
      products/
      orders/
      reviews/
      events/
      bot/
    shared/
      prisma/
      http/
      errors/
      utils/
frontend/
  src/...
```

**Принцип модульности**: каждый use-case в отдельной папке, файлы до 300 строк. Контроллеры, DTO, сервисы и мапперы дробятся по назначению.

---

## 3. Взаимодействие слоёв

```mermaid
graph TD
    FE[🌐 React + Vite Frontend] -- REST JSON --> BE[⚙️ NestJS API]
    BE --> DB[(PostgreSQL)]
    BE -- Notifications --> TG[🤖 Telegram Bot Module]
    BE -- Domain Events --> EV[(events table)]
```

---

## 4. Поток запроса (упрощённо)

1. Контроллер принимает запрос, проверяет JWT и права.  
2. Use-case сервис выполняет бизнес-логику и транзакции Prisma.  
3. При изменениях создаётся доменное событие в `events`.  
4. В ответе возвращаются `updated_at`/`revision`.

---

## 5. Polling событий

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant BE as NestJS
    FE->>BE: GET /api/v1/events?since=cursor
    BE-->>FE: { events[], next_cursor }
```

Формат событий ориентирован на будущий перенос на SSE/WS без пересмотра данных.

---

## 6. Роли и доступ

- **худБосс** — полный доступ, включая CRUD админов.  
- **худМанагер** — CRUD клиентов и курьеров.  
- **худАдмин** — назначение курьеров, остальное read-only.  
- **худПрод** — управление своим магазином и товарами.  
- **худКур** — обновление статусов доставки.  
- **худПотр** — просмотр витрины, оформление заказов.

---

## 7. Переменные окружения

| Переменная | Описание | Пример |
|-----------|----------|--------|
| `DATABASE_URL` | Подключение к PostgreSQL | `postgresql://user:pass@localhost:5432/khujandi` |
| `JWT_SECRET` | Секрет для подписи JWT | `supersecret` |
| `TELEGRAM_BOT_TOKEN` | Токен бота | `123456:ABC...` |
| `ADMIN_IDS` | ID админов для алёртов | `12345,98765` |
| `CORS_ORIGINS` | Разрешённые источники | `http://localhost:5173` |

---

## 8. Данные (кратко)

- `users` + профили ролей (client/courier/admin/seller)  
- `shops`, `products`, `orders`, `order_status_history`, `reviews`, `events`

---

Конец документа.
