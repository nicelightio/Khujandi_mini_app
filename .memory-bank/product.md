---
description: Product brief (C4 L1): что это, для кого, core value, ограничения.
status: active
---
# Product

## What this is

Khujandi Mini App (`Худжанди`) — Telegram-first продукт для заказа готовой еды и доставки по городу, покрывающий MVP-цикл `seller provisioning -> storefront editing -> public browse -> checkout + оплата -> назначение курьера -> доставка -> завершение -> двусторонний отзыв`.

Целевая MVP-модель включает четыре рабочих контура:
- общий `mini-app` storefront для клиентского browse/checkout/tracking и seller edit mode на тех же storefront-компонентах;
- отдельную `seller-web` админку магазина для узких catalog-owned функций;
- отдельную `admin-web` веб-админку для операционного управления и provisioning;
- Telegram-бота как обязательный канал уведомлений и review-сценариев.

Checked-in runtime сегодня монтирует customer-facing `mini-app` browse/shell, repo-local checkout/auth/order creation path, authenticated customer `GET /api/v1/events` status polling, `admin-web`, и часть seller/admin catalog surfaces. Repo-local checkout/status closure больше не блокируется fresh real `Android Telegram` evidence; Android Telegram smoke остается advisory pre-release risk check, а repo-local `FT-014` events mount and checkout cursor compatibility repair are complete.

## Core value

- Снизить ручную координацию в чатах за счет прозрачного жизненного цикла заказа и обязательных уведомлений.
- Дать клиенту законченный путь заказа и доставки внутри Telegram-экосистемы без выхода в сторонние каналы.
- Дать seller-у простой способ запустить и поддерживать storefront без отдельного тяжелого builder/editor.
- Дать операционной команде управляемый и наблюдаемый delivery flow с RBAC, аудитом и контролируемыми статусами.

## Audience

- `client`: выбирает товары, проходит checkout, оплачивает заказ, отслеживает статус, оставляет отзыв.
- `courier`: получает назначение, подтверждает заказ, меняет статусы доставки, оставляет отзыв о клиенте.
- `seller`: управляет своими магазинами, меню и товарами внутри `catalog` scope через shared storefront и узкую админку магазина.
- `admin`: назначает курьеров, контролирует статусы, отменяет заказы по правилам и provision-ит магазины/привязку seller-ов.
- `manager`: управляет клиентами и курьерами по бизнес-правилам.
- `boss`: имеет полный доступ и provisioning админ-аккаунтов веб-админки.

## Target primary user flow

Ниже описан целевой MVP flow, а не утверждение о том, что весь этот путь уже смонтирован в checked-in runtime.

1. Администратор создает запись магазина, привязывает Telegram-аккаунт seller-а и система автоматически поднимает skeleton storefront с базовыми страницами меню и товарами.
2. Seller открывает общий storefront contour, получает edit mode только для своих магазинов и редактирует shop/menu/product контент без отдельного визуально другого builder-а.
3. Seller использует узкую админку магазина для легких catalog-owned функций, включая переключение статуса `WORKING/NOT_WORKING`.
4. Клиент открывает Mini App, при первом запуске выбирает язык (`ru/en/tj`) и просматривает только `WORKING` витрину без отдельной авторизации.
5. При checkout backend валидирует Telegram `initData`, инициирует онлайн-оплату и создает заказ только после успешной оплаты.
6. Администратор получает событие нового заказа и вручную назначает курьера.
7. Курьер через Telegram-бота принимает заказ и ведет статусы `ASSIGNED -> IN_PROGRESS -> DELIVERED -> COMPLETED`.
8. Клиентские и операционные интерфейсы получают изменения через polling `GET /events?since=<cursor>` с целевым SLA p95 <= 10 сек.
9. После `COMPLETED` клиент и курьер оставляют отзывы через Telegram-бота; low rating с любой стороны формирует негативный alert.

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
-   Нет отдельного heavy seller builder/editor.
-   Нет UI-функционала `delete` для shops, menu pages и products.

## Product constraints and invariants

- Заказ MUST создаваться только после подтвержденной успешной оплаты.
- Клиент MUST NOT иметь возможность отменить заказ.
- Все write-операции MUST проходить через auth + RBAC.
- Все значимые write-операции MUST порождать событие и, где нужно, запись аудита.
- Seller management MUST оставаться внутри `catalog`, даже если доставляется через shared storefront и отдельный `seller-web` contour.
- Catalog MVP MUST NOT вводить отдельный тяжелый seller builder или destructive `delete` UI.
- Polling/event-контракт MUST оставаться совместимым для будущего перехода на SSE/WS.

## Source artifacts

- [doc/PRD.md](../doc/PRD.md): основной продуктовый scope и MVP acceptance.
- [doc/ARCHITECTURE.md](../doc/ARCHITECTURE.md): архитектурная модель layered monolith + vertical slices.
- [doc/API_GUIDELINES.md](../doc/API_GUIDELINES.md): API, events и auth контуры.
- [doc/TESTING_STRATEGY.md](../doc/TESTING_STRATEGY.md): quality gates и slice-based testing.
- [doc/PROJECT_SPECIFICATION.md](../doc/PROJECT_SPECIFICATION.md): повествовательное ТЗ и user flows.
- [doc/DATA_MODEL.md](../doc/DATA_MODEL.md): концептуальные сущности и поля MVP.
