# ARCHITECTURE.md

## Цели архитектуры
- TBD: основные нефункциональные цели (скорость, надежность, масштабирование).

## Общая схема (TBD)
- Backend: NestJS + Prisma + PostgreSQL.
- Frontend: React + Vite.
- Telegram Bot: модуль внутри backend.
- Events: polling через `GET /events?since=<cursor>`.

## Модули backend (TBD)
- auth
- users
- shops
- products
- orders
- reviews
- events
- bot

## Потоки данных (TBD)
- Команды: REST.
- Чтение: polling событий.

## Наблюдения и ограничения (TBD)
- Telegram WebApp auth требует строгой валидации initData.
- `events.id` — BigInt, курсоры передаются строкой.
