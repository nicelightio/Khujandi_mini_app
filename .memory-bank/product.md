---
description: Product brief (C4 L1): что это, для кого, core value, ограничения.
status: active
---
# Product

## What this is

Khujandi Mini App (`Худжанди`) — Telegram Mini App для заказа готовой еды и доставки по городу, покрывающий полный MVP-цикл `витрина -> checkout + оплата -> назначение курьера -> доставка -> завершение -> двусторонний отзыв`.

Продукт включает три рабочих контура:
- клиентский Mini App для каталога, checkout и просмотра статусов;
- отдельную веб-админку для операционного управления;
- Telegram-бота как обязательный канал уведомлений и review-сценариев.

## Core value

- Снизить ручную координацию в чатах за счет прозрачного жизненного цикла заказа и обязательных уведомлений.
- Дать клиенту законченный путь заказа и доставки внутри Telegram-экосистемы без выхода в сторонние каналы.
- Дать операционной команде управляемый и наблюдаемый delivery flow с RBAC, аудитом и контролируемыми статусами.

## Audience

- `client`: выбирает товары, проходит checkout, оплачивает заказ, отслеживает статус, оставляет отзыв.
- `courier`: получает назначение, подтверждает заказ, меняет статусы доставки, оставляет отзыв о клиенте.
- `seller`: управляет своими магазинами и товарами внутри `catalog` scope.
- `admin`: назначает курьеров, контролирует статусы, отменяет заказы по правилам.
- `manager`: управляет клиентами и курьерами по бизнес-правилам.
- `boss`: имеет полный доступ и provisioning админ-аккаунтов веб-админки.

## Primary user flow

1. Клиент открывает Mini App, при первом запуске выбирает язык (`ru/en/tj`) и просматривает витрину без авторизации.
2. При checkout backend валидирует Telegram `initData`, инициирует онлайн-оплату и создает заказ только после успешной оплаты.
3. Администратор получает событие нового заказа и вручную назначает курьера.
4. Курьер через Telegram-бота принимает заказ и ведет статусы `ASSIGNED -> IN_PROGRESS -> DELIVERED -> COMPLETED`.
5. Клиентские и операционные интерфейсы получают изменения через polling `GET /events?since=<cursor>` с целевым SLA p95 <= 10 сек.
6. После `COMPLETED` клиент и курьер оставляют отзывы через Telegram-бота; low rating с любой стороны формирует негативный alert.

## Constraints
- Tech stack:
-   Backend: NestJS + TypeScript + Prisma + PostgreSQL.
-   Frontend: React + Vite + TypeScript.
-   Архитектурная модель: `layered monolith` + `vertical slices`.
- Timeline:
-   MVP релизный план идет волнами `M1..M4`: customer ordering -> delivery ops -> admin security -> reviews/go-live.
- Non-goals:
-   Нет авто-назначения курьеров.
-   Нет Redis, очередей и автоматических retry уведомлений.
-   Нет автоматических refund-процедур.
-   Нет 2FA для веб-админки в MVP.
-   Нет продвинутой BI/аналитики и авто-пересчета VIP/репутации.

## Product constraints and invariants

- Заказ MUST создаваться только после подтвержденной успешной оплаты.
- Клиент MUST NOT иметь возможность отменить заказ.
- Все write-операции MUST проходить через auth + RBAC.
- Все значимые write-операции MUST порождать событие и, где нужно, запись аудита.
- Polling/event-контракт MUST оставаться совместимым для будущего перехода на SSE/WS.

## Source artifacts

- [doc/PRD.md](../doc/PRD.md): основной продуктовый scope и MVP acceptance.
- [doc/ARCHITECTURE.md](../doc/ARCHITECTURE.md): архитектурная модель layered monolith + vertical slices.
- [doc/API_GUIDELINES.md](../doc/API_GUIDELINES.md): API, events и auth контуры.
- [doc/TESTING_STRATEGY.md](../doc/TESTING_STRATEGY.md): quality gates и slice-based testing.
- [doc/PROJECT_SPECIFICATION.md](../doc/PROJECT_SPECIFICATION.md): повествовательное ТЗ и user flows.
- [doc/DATA_MODEL.md](../doc/DATA_MODEL.md): концептуальные сущности и поля MVP.
