# Архитектура проекта *Khujandi Mini App*

*Версия документа: 0.1  
Дата: 2025-05-25*

---

## 1. Общая структура репозитория

**Backend**   

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
    FE[🌐 SvelteKit Frontend] -- REST JSON --> BE[⚙️]
    BE --> DB[(PostgreSQL)]
    BE -- AsyncTask --> TG[🤖 Telegram Bot]
    BE -- Logs -->  EL[(event_log table)]
```


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


---

## 8. Жизненный цикл запроса (Backend)

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

## 11. Настройка окружения и переменных

| Переменная                    | Описание                          | Пример |
|-------------------------------|-----------------------------------|--------|
| `DATABASE_URL`                | Строка подключения к PostgreSQL   | `postgresql+asyncpg://user:pass@localhost:5432/khujandi` |
| `TELEGRAM_BOT_TOKEN`          | Токен Telegram-бота               | `123456:ABC...` |
| `ADMIN_IDS`                   | Список ID админов для уведомлений | `12345,98765` |
| `CORS_ORIGINS`                | Разрешённые источники             | `http://localhost:5173` |

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
