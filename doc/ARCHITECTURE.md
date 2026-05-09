# Архитектура проекта Khujandi Mini App (MVP)

_Версия: 1.2_  
_Дата: 2026-03-27_  
_Источник требований: `doc/PRD.md`_

## 1. Назначение архитектуры

- Удержать MVP простым, предсказуемым и удобным для AI-first разработки.
- Поставлять фичи как законченные end-to-end единицы ценности, а не как набор разрозненных технических модулей.
- Сохранить явные границы ответственности, чтобы локальные изменения внутри одного slice были безопасны для соседних частей системы.
- Избежать оверинжиниринга: без очередей, Redis, микросервисов и преждевременных общих абстракций в MVP.

## 2. Каноническая архитектурная модель

Проект реализуется как `layered monolith`, организованный вокруг `vertical slices`.

### 2.1 Что является основной единицей проектирования

Основная единица проектирования, планирования и поставки — вертикальный слайс (`vertical slice`).

Каждый вертикальный слайс:
- доставляет одну пользовательскую или операционную capability;
- проходит через все слои системы;
- имеет acceptance-сценарий и минимальный тестовый контур;
- дает быстрый demo-результат;
- по возможности изменяется локально, без расползания по всему проекту.

### 2.2 Что означает layered architecture

Внутри каждого слайса действуют слои:
- `presentation` — интерфейсы React, интерфейсы веб-админки, обработчики Telegram-бота, REST-контроллеры;
- `application` — прикладные сценарии, оркестрация и политики;
- `domain` — сущности, инварианты, state machine, бизнес-правила;
- `infrastructure` — Prisma-репозитории, платежный провайдер, транспорт Telegram-бота, auth-адаптеры.

Правило зависимостей:
- верхние слои могут зависеть от нижележащих контрактов только через допустимые интерфейсы;
- бизнес-правила не должны зависеть от деталей фреймворков и транспорта;
- shared-инфраструктура допустима, shared-бизнес-логика должна быть исключением, а не нормой.

## 3. Канонические capability slices MVP

Канонические capability slices проекта:

| Slice | Пользовательская ценность | Основные acceptance-сценарии |
|------|----------------------------|-------------------------------|
| `catalog` | Клиент видит витрину магазинов и товаров | просмотр витрины без авторизации |
| `checkout-payment` | Клиент оплачивает и создает заказ | успешная оплата создает заказ, ошибка оплаты не создает заказ |
| `delivery-assignment` | Operator/admin или auto-offer предлагает заказ курьерам | courier claim атомарно переводит заказ в `ASSIGNED`; pending offer не является assignment |
| `delivery-tracking` | Курьер, operator panel и интерфейсы видят жизненный цикл заказа | переходы `ASSIGNED -> PICKED_UP -> IN_PROGRESS -> DELIVERED -> COMPLETED`, polling обновлений |
| `order-cancellation` | Операторы корректно отменяют проблемный заказ | разрешенная роль отменяет заказ, действие аудируется |
| `reviews-feedback` | После завершения собираются отзывы и негативные алерты | двусторонние отзывы, alert при `rating <= 2` |
| `admin-access` | Веб-админка безопасно аутентифицирует админов | login/refresh/logout, блокировки и аудит |

## 4. Трассировка slices к пользовательским потокам

| User flow из PRD | Основной slice | Дополнительные slices |
|------------------|----------------|-----------------------|
| `UF-01` клиент оформляет и оплачивает заказ | `checkout-payment` | `catalog` |
| `UF-02` operator/admin предлагает заказ курьерам; courier claim закрепляет заказ | `delivery-assignment` | `delivery-tracking` |
| `UF-03` курьер ведет доставку, operator/admin закрывает `COMPLETED` | `delivery-tracking` | `delivery-assignment` |
| `UF-04` операционная отмена заказа | `order-cancellation` | `delivery-tracking` |
| `UF-05` отзывы после завершения | `reviews-feedback` | `delivery-tracking` |

Такая трассировка нужна, чтобы пользовательские потоки из `doc/PRD.md` оставались источником acceptance-сценариев, а архитектура сохраняла устойчивые capability-границы.

## 5. Контуры системы

### 5.1 Клиентский контур (Mini App)

- Telegram WebApp auth через `POST /auth/telegram`.
- Витрина, checkout и оплата через локального провайдера.
- Основные slices: `catalog`, `checkout-payment`, частично `delivery-tracking`.
- Session/auth boundary Mini App проектируется server-driven: frontend не принимает trusted auth decisions по `initDataUnsafe`, а session identifiers не хранятся в `localStorage` как baseline.

### 5.2 Операционный контур (веб-админка)

- Отдельный login/password auth-контур.
- Основные slices: `admin-access`, `delivery-assignment`, `delivery-tracking`, `order-cancellation`; operator panel живет в этом contour и потребляет эти slices без отдельного тяжелого CRM слоя.
- Политики безопасности MVP:
  - пароль >= 12 символов;
  - 5 неудачных попыток за 15 минут -> блокировка 30 минут;
  - access token 15 минут;
  - refresh/session lifetime 3 дня;
  - auto-logout 30 минут неактивности.

### 5.3 Telegram-бот

- Бот является частью монолита, но работает как отдельный presentation-канал для слайсов.
- Webhook/update transport Telegram считается недоверенным до source verification, secret verification и idempotency checks.
- Must-have уведомления:
  1. Новый заказ.
  2. Назначение курьера.
  3. Каждая смена статуса.
  4. Негативный отзыв.

## 6. Потоки данных

### 6.1 Командный поток

1. Presentation-слой слайса принимает команду.
2. Проверяются auth и RBAC.
3. Application-слой выполняет прикладной сценарий.
4. Domain-слой валидирует инварианты и state machine.
5. Infrastructure сохраняет изменения транзакцией.
6. Пишется доменное событие в `events`.
7. Возвращается ответ с актуальным `revision` там, где это нужно.

### 6.2 Поток чтения изменений

1. Клиент, админка или другой интерфейс запрашивает `GET /events?since=<cursor>`.
2. Backend отдает события и `next_cursor`.
3. Presentation-слой соответствующего слайса обновляет локальное состояние.

Целевой SLA MVP: p95 задержка отображения обновлений <= 10 секунд.

## 7. Shared-части и границы повторного использования

### 7.1 Что разрешено в `shared`

- Prisma/db bootstrap;
- общие HTTP/error primitives;
- auth-примитивы и RBAC-хелперы;
- event transport contracts;
- базовые UI primitives;
- универсальные utils без бизнес-смысла.
- Telegram shell/runtime adapter: theme, safe-area, viewport, lifecycle, feature detection и storage-policy helpers.

### 7.2 Что не нужно выносить в `shared` заранее

- бизнес-правила конкретного слайса;
- прикладные сценарии и оркестрацию нескольких шагов;
- специфичную state machine или правила переходов;
- UI-компоненты, привязанные к одной capability.

Правило: сначала локальная реализация в slice, затем выделение в `shared` только после повторного использования и осознанного решения.

## 8. Рекомендуемая структура репозитория

```text
backend/
  src/
    slices/
      catalog/
      checkout-payment/
      delivery-assignment/
      delivery-tracking/
      order-cancellation/
      reviews-feedback/
      admin-access/
    shared/
      prisma/
      http/
      auth/
      events/
      errors/
      utils/
frontend/
  src/
    slices/
      catalog/
      checkout-payment/
      delivery-tracking/
      reviews-feedback/
    shared/
      ui/
      lib/
      state/
admin-web/
  src/
    slices/
      admin-access/
      delivery-assignment/
      delivery-tracking/
      order-cancellation/
```

Если `admin-web/` пока физически не выделен, допускается временная реализация в существующем фронтенд-приложении с отдельным пространством маршрутов и защитой доступа.

## 9. Ключевые доменные правила MVP

- Заказ создается только после успешной онлайн-оплаты через локального провайдера.
- При ошибке или таймауте оплаты заказ не создается; клиент получает retry-сценарий.
- Client-only payment events не считаются trusted payment confirmation.
- Клиент отменять заказ не может.
- Отмена доступна `operator`/`admin` и `courier` в разрешенном операционном кейсе unavailable.
- Refund при отмене выполняется вручную оператором.
- `ASSIGNED` означает successful courier claim, а не pending offer.
- `DELIVERED` требует operator/admin закрытия; успешным заказом для KPI считается только `COMPLETED`.
- Любая значимая write-операция порождает доменное событие.
- Формат событий стабилен для будущего перехода на SSE/WS.
- Telegram webhook/update replay не должен приводить к повторным domain side effects.

## 10. AI-first правила реализации

- Новая ценность сначала формулируется как slice с acceptance-сценарием.
- Изменения по умолчанию должны быть локальны внутри одного slice.
- Если нужен shared-код, он должен иметь явную пользу для двух и более slices.
- Документация, API, модель данных и тесты обновляются сквозным образом для одного и того же слайса.
- Каждый slice должен иметь понятный демо-результат, чтобы изменения можно было быстро проверить человеком или агентом.

## 11. Наблюдаемость и надежность

- Единый формат ошибок: `{ error: { code, message, details }, trace_id }`.
- Raw `initData`, payment secrets и полные sensitive Telegram/provider payloads не логируются.
- Аудит критичных действий:
  - входы и блокировки веб-админки;
  - смены статусов заказа;
  - отмены и ручные refund-действия;
  - отправка критичных уведомлений Telegram-бота.
- Поддержка деградации:
  - при проблемах оплаты заказ не создается;
  - при проблемах бота ошибки фиксируются, а операционный процесс имеет fallback.
  - для Telegram WebView используется graceful degradation через feature detection, а не предположение о наличии всех API у клиента.

## 12. Ограничения MVP и anti-overengineering rules

- Нет Redis и очередей; courier auto-offer реализуется KISS-механикой fan-out + atomic claim без отдельной queue architecture.
- Нет 2FA.
- Нет автоматических refund-процедур.
- Нет сложного авто-назначения по геолокации/маршрутам/сменам; только KISS auto-offer + atomic claim.
- Нет преждевременного выделения микросервисов.
- Нет общих бизнес-абстракций без подтвержденной повторяемости.
- Нет проектирования вокруг технических модулей, если ценность лучше выражается capability slice.
