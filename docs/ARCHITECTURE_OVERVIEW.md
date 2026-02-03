# Архитектура проекта *Khujandi Mini App*

*Версия документа: 0.1  
Дата: 2025-05-25*

---

## 1. Общая структура репозитория

**Backend** (FastAPI + SQLAlchemy + PostgreSQL)  
- Точка входа — [`main.py`](../main.py)  
- Роутеры: `routers/health_router.py`, `user_router.py`, `order_router.py`, `review_router.py`, `log_router.py`  
- Слой доступа к данным — директория `db/`  
  - модели — `models/`  
  - CRUD-функции — `db/*_crud.py`  
- Логирование / аудит  
  - конфиг [`logging_config.py`](../logging_config.py)  
  - таблица `event_logs`  
  - вспомогалка `utils/event_logger.py`  
- Интеграция Telegram (`aiobot/`) — уведомления об ошибках / служебные команды  

**Frontend** (SvelteKit 5 + TypeScript + Tailwind)  
- Исходники — `frontend-svelte5/src`  
- Магистральные страницы — `src/routes/[lang]/*`  
- Управление состоянием — `stores.{js,ts}`  
- API-обёртки — `src/lib/api.{js,ts}`  
- Тесты — `src/tests`  

---

## 2. Взаимодействие слоёв

```mermaid
graph TD
    FE[🌐 SvelteKit Frontend] -- REST JSON --> BE[⚙️ FastAPI Backend]
    BE --> DB[(PostgreSQL)]
    BE -- AsyncTask --> TG[🤖 Telegram Bot]
    BE -- Logs -->  EL[(event_log table)]
```

---

## 3. Основные потоки данных

1. Пользователь (клиент/Admin) инициирует действие на фронтенде → `fetch`/`axios` → REST-эндпоинт FastAPI  
2. В `main.py` срабатывает middleware-логирование (trace_id, user_id, role)  
3. CRUD-функция взаимодействует с PostgreSQL через `AsyncSession`  
4. Ответ возвращается фронтенду; параллельно событие пишется в таблицу `event_logs` и лог-файл  
5. При ошибке: запись уровня **ERROR** и Telegram-уведомление администраторам  

---

## 4. Точки внимания и рекомендации

- Разграничить **слой схем/валидации** (Pydantic V2) и **слой ORM** — сейчас смешаны модели и DTO  
- Добавить **unit-тесты роутеров** (TestClient) — покрытие сейчас есть только для order/shop сценариев  
- Настроить **CORS** и **rate-limiting** (если API публичный)  
- На фронтенде вынести повторяющиеся вызовы API в сервис-слой, унифицировать обработку 401/403  
- Рассмотреть **WebSocket**-канал для событий заказа в реальном времени  

---

## 5. План дальнейших шагов

1. Построить **ER-диаграмму** текущей схемы БД  
2. Проанализировать каждый роутер → выявить дублирование CRUD и возможности обобщения  
3. Детальный анализ фронтенда — stores, локализация, lazy-загрузка страниц  
4. Сформировать **backlog** улучшений, классифицировать по приоритету (P0/P1/P2)  

---

## 6. История изменений

---

## 7. Детализация схемы БД (ER-диаграмма)

```mermaid
erDiagram
    users {
        int id PK
        string role
        string name
        string phone
        string email
    }
    shops {
        int id PK
        int owner_id FK
        string name
        string description
        bool is_deleted
    }
    products {
        int id PK
        int shop_id FK
        string name
        float price
        bool is_available
        bool is_deleted
    }
    orders {
        int id PK
        int shop_id FK
        int client_id FK
        int courier_id FK
        enum status
        float purchase_price
        float delivery_price
        datetime created_at
        bool is_deleted
    }
    reviews {
        int id PK
        int order_id FK
        int rating
        string text
        datetime created_at
    }
    event_logs {
        int id PK
        string level
        string trace_id
        string user_id
        string role
        string action
        string endpoint
        string message
        datetime created_at
    }

    users ||--o{ shops : "owns"
    shops ||--o{ products : "contains"
    users ||--o{ orders : "places"
    users ||--o{ orders : "delivers"
    orders ||--o{ reviews : "has"
```

> Диаграмма синхронизирована с моделями в `db/*.py`. При изменениях схемы требуется обновлять данную секцию.

---

## 8. Жизненный цикл запроса (Backend)

1. **Приём запроса** — Uvicorn → FastAPI, создаётся `Request`  
2. **Middleware**  
   - Генерация `trace_id`, извлечение `x-user-id` / `x-role`  
   - Логирование запроса (`event_logger` + таблица `event_logs`)  
3. **Маршрутизация** — попадаем в нужный роутер `routers/*.py`  
4. **Валидация данных** — Pydantic схемы (слой DTO)  
5. **CRUD-слой** (`db/*.py`) — работа c PostgreSQL через `AsyncSession`  
6. **Формирование ответа** — сериализация Pydantic, возврат клиенту  
7. **Обработка ошибок** — кастомные `exception_handler` → логирование + Telegram  

---

## 9. Архитектура фронтенда

| Слой            | Описание | Основные файлы |
|-----------------|----------|---------------|
| Pages / Routes  | Маршруты SvelteKit, одна страница – один файл | `src/routes/[lang]/**/+page.svelte` |
| Layouts         | Общие обёртки, меню, метаданные | `src/routes/+layout.svelte` |
| Stores          | Глобальное состояние (user, cart) | `src/lib/stores.{js,ts}` |
| Components      | Переиспользуемые UI-блоки | `src/lib/components/**` |
| Services        | Вызовы REST API, обработка ошибок | `src/lib/api.{js,ts}` |
| Utils           | Хелперы, i18n, форматы | `src/lib/**` |
| Tests           | Vitest + Playwright | `src/tests/**` |

**Паттерны**  
- Stores — Svelte `writable` с локальным кешем `localStorage`  
- API-слой — оборачивает `fetch`, автоматически добавляет токен и `lang`  
- Lazy-routes — динамический импорт тяжёлых страниц (`products`, `orders`)  

---

## 10. Тестовая и CI/CD стратегия

### Backend  
- Тесты `pytest` в `tests/`  
- Используется `pytest-asyncio` для асинхронных функций  
- В таблицах БД — транзакции откатываются фикстурой `session.rollback()`  

### Frontend  
- Юнит-тесты — `Vitest`  
- E2E — `Playwright` (планируется)  

### CI  
```yaml
name: khujandi-ci
on: [push]
jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: {python-version: "3.12"}
      - run: pip install -r requirements.txt
      - run: pytest
  frontend:
    runs-on: ubuntu-latest
    defaults: {run: {working-directory: frontend-svelte5}}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: {node-version: "20"}
      - run: npm ci
      - run: npm run test
```

---

## 11. Настройка окружения и переменных

| Переменная                    | Описание                          | Пример |
|-------------------------------|-----------------------------------|--------|
| `DATABASE_URL`                | Строка подключения к PostgreSQL   | `postgresql+asyncpg://user:pass@localhost:5432/khujandi` |
| `TELEGRAM_BOT_TOKEN`          | Токен Telegram-бота               | `123456:ABC...` |
| `ADMIN_IDS`                   | Список ID админов для уведомлений | `12345,98765` |
| `CORS_ORIGINS`                | Разрешённые источники             | `http://localhost:5173` |

---

## 12. Дорожная карта улучшений

| Приоритет | Задача                                   | Компонент | Спринт |
|-----------|------------------------------------------|-----------|--------|
| P0        | Разделение моделей ORM / DTO             | Backend   | S1     |
| P0        | Покрыть роутеры unit-тестами             | Backend   | S1     |
| P1        | Внедрить WebSocket уведомления заказа    | Full-stack| S2     |
| P1        | Рефакторинг API-сервиса на фронте        | Frontend  | S2     |
| P2        | Визуальный UI-kit / Storybook            | Frontend  | S3     |
| P2        | Миграция на Bun / Vitest coverage        | Frontend  | S3     |

---

## 13. История изменений (продолжение)

- **0.2** — добавлены ER-диаграмма, жизненный цикл запроса, фронтенд-архитектура, CI/CD, переменные окружения, дорожная карта
- **0.1** — первоначальная версия документа (структурный обзор репозитория и потоков данных)
---

## 14. Цель проекта  

Разработать асинхронное **мини-приложение Telegram “Худжанди”** (backend + frontend), автоматизирующее продажи еды и доставку по городу.  
Система покрывает полный цикл: управление пользователями (админы, продавцы, курьеры, клиенты), магазинами, товарами, заказами, оплатой, отзывами и уведомлениями через Telegram-бота.

---

## 15. Пользовательские роли и права

| Роль          | Telegram-метка | Права доступа                                                                    |
|---------------|---------------|----------------------------------------------------------------------------------|
| **худБосс**   | Admin Boss    | Полный CRUD всех сущностей, управление худАдмами                                  |
| **худМанагер**| Admin Manager | CRUD клиентов и курьеров, просмотр админов                                        |
| **худАдмин**  | Admin         | Назначение курьеров на заказ, остальное read-only                                 |
| **худПрод**   | Seller        | Управление собственным магазином и товарами                                       |
| **худКур**    | Courier       | Приём/отчёт статусов доставки, взаимодействие с ботом                             |
| **худПотр**   | Client        | Просмотр витрины, оформление и оплата заказов, отзывы                             |

---

## 16. Ключевые бизнес-процессы

1. **Покупка**  
   1. Клиент выбирает товары, оплачивает.  
   2. В админ-панели появляется новый активный заказ.  
   3. Админ назначает курьера → бот присылает курьеру уведомление.  

2. **Доставка**  
   1. Курьер отчитывается бот-командами о статусах (IN_PROGRESS → DELIVERED → COMPLETED).  
   2. Статусы отображаются в админ-панели в реальном времени.  

3. **Отзывы / Алёрты**  
   • После доставки курьер и клиент оставляют оценку друг другу.  
   • При появлении **негативного** отзыва бот уведомляет всех доступных админов и даёт ссылку на интерфейс отзывов.  

---

## 17. UX-требования фронтенда

* Первый запуск показывает overlay с выбором языка **(Ru, En, Tj)**; выбор сохраняется.  
* Главная страница — витрина (магазины/товары) без авторизации.  
* Авторизация (Telegram WebAppData) инициируется при попытке оформить заказ.  
* Поддержка светлой/тёмной темы Telegram WebView.  
* Бизнес-логика вынесена в `lib/`; компоненты остаются «чистыми» UI.  
* Интернационализация через Paraglide.js, тексты хранятся в `src/languages/{lang}.ts`.  
* Адаптивность, крупные интерактивные элементы, явная обратная связь (toast/loader).  

---

## 18. Расширённая доменная модель

| Сущность | Ключевые атрибуты (дополнено) |
|----------|--------------------------------|
| **Client**  | VIP-статус, репутация, last_purchase\*, total_spent, negative_feedback\* |
| **Courier** | is_available, VIP, reputation, last_delivery\*, total_earned |
| **Admin**   | role (худБосс/худМанагер/худАдмин), can_edit, negative_feedback\* |
| **Shop**    | owner_id, is_vip, soft-delete флаг |
| **Product** | is_available, soft-delete |
| **Order**   | история статусов (separate table), VIP-flags всех сторон, soft-delete |

\* см. подробный список атрибутов в `project_config.md`.

---

## 19. Обновлённая дорожная карта (выжимка из ТЗ)

| Приор. | Задача                                                            | Компонент | Спринт |
|--------|-------------------------------------------------------------------|-----------|--------|
| P0     | Реализация ролей и прав (RBAC)                                    | Backend   | S1     |
| P0     | CRUD магазинов/товаров с VIP-флагами                              | Backend   | S1     |
| P0     | Overlay выбора языка + i18n                                       | Frontend  | S1     |
| P0     | Админ-панель: назначение курьеров, live-статусы                   | Frontend  | S1     |
| P1     | История статусов заказов (audit table)                            | Backend   | S2     |
| P1     | Auto-assignment курьера (алгоритм по репутации)                   | Full-stack| S2     |
| P2     | Автоматический пересчёт репутации и VIP-статусов                  | Backend   | S3     |
| P2     | UI-Kit / Storybook                                                | Frontend  | S3     |

---

## 20. История изменений (дополнение)

- **0.3** — добавлены разделы цели проекта, роли и права, бизнес-процессы, UX-требования, расширенная модель домена, обновлённая дорожная карта.
---

## 21. DO-слой (Domain Objects layer)

DO-слой — это «ядро» предметной области, где хранятся **чистые бизнес-сущности и инварианты**, полностью изолированные от инфраструктуры (FastAPI, SQLAlchemy, Redis, HTTP и т. д.).

| Слой | Содержимое | Зависит от фреймворков? |
|------|------------|-------------------------|
| **Routers / Transport** | HTTP-ручки, DTO ↔ JSON | Да |
| **Service Layer** | Use-case функции, orchestration | Частично (Depends) |
| **DO-слой** | Pydantic-модели, Enum-статусы, guard-clauses | **Нет** |
| **Data-access** | CRUD / ORM, SQL | Да |

Характеристики DO-слоя  
* Описывает «что такое заказ, отзыв, пользователь» и бизнес-правила (напр. `rating ∈ [1,5]`).  
* Не знает о БД, HTTP, Telegram-ботах — только чистая логика.  
* Используется сервис-слоем: сервис принимает/возвращает DO-объекты и обращается к CRUD лишь для сохранения.  
* Упрощает тестирование (не нужна БД), делает домен переносимым между фреймворками.

В коде проекта DO-слой представлен:  
* Pydantic-моделями `OrderUpdate`, `ReviewCreate`, `ReviewUpdate`, Enum `OrderStatus`.  
* Guard-clauses в `services/order_service.py`, `services/review_service.py`.  

Таким образом, разделение **DTO/DO ↔ ORM** (см. [реком. п. 4](#4.-точки-внимания-и-рекомендации)) обеспечивает чистую архитектуру и гибкость системы.