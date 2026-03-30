# TESTING_STRATEGY.md — Подход к тестированию

_Версия: 1.1_  
_Дата: 2026-03-27_

## 1. Принцип

Тестирование строится вокруг вертикальных capability slices, а не вокруг изолированных технических модулей.

Базовая цепочка проверки для каждого slice:
`acceptance scenario -> e2e -> integration -> unit`

- `acceptance scenario` подтверждает пользовательскую ценность.
- `e2e` проверяет слайс end-to-end через реальные контуры приложения.
- `integration` проверяет взаимодействие слоев и контрактов внутри slice.
- `unit` закрывает инварианты, политики и state machine.

Slice без acceptance-сценария и минимального тестового контура не считается завершенным.

## 2. Инструменты

| Контур | Инструмент |
|--------|------------|
| Backend unit/integration | Jest + `@nestjs/testing` |
| Backend e2e | Supertest + поднятое NestJS приложение |
| Frontend unit | Vitest |
| Frontend e2e / UI acceptance | Playwright |

## 3. Канонические capability slices MVP и их минимальный тестовый контур

| Slice | Acceptance | Минимум e2e | Критичные integration/unit |
|------|------------|-------------|-----------------------------|
| `catalog` | Клиент видит витрину без авторизации | список магазинов/товаров доступен | фильтры доступности, soft-delete, права продавца |
| `checkout-payment` | После успешной оплаты создается заказ | основной успешный сценарий оплаты и retry при ошибке | оркестрация оплаты, идемпотентность, событие `order.created` |
| `delivery-assignment` | Админ назначает курьера | назначение переводит заказ в `ASSIGNED` | RBAC, правила назначения, событие `order.assigned` |
| `delivery-tracking` | Курьер ведет заказ до `COMPLETED` | переходы статусов и polling обновлений | state machine, `409 CONFLICT`, запись в `order_status_history` |
| `order-cancellation` | Разрешенная роль отменяет заказ | отмена отражается в заказе и аудите | правила отмены, статус возврата, аудит и генерация событий |
| `reviews-feedback` | После `COMPLETED` собираются отзывы | клиентский и курьерский отзывы, негативный алерт | валидация `rating/reason_code`, событие `review.negative` |
| `admin-access` | Админ входит в веб-админку по login/password | login/refresh/logout | блокировки, время жизни сессий, аудит входов |

## 4. Общие обязательные проверки MVP

- RBAC для всех write-операций.
- Корректные переходы state machine заказа.
- Генерация доменных событий для каждого значимого изменения.
- Единый формат ошибок с `trace_id`.
- Проверка polling-контракта `GET /events?since=<cursor>`.

## 5. Организация тестов

```text
tests/
  slices/
    catalog/
    checkout-payment/
    delivery-assignment/
    delivery-tracking/
    order-cancellation/
    reviews-feedback/
    admin-access/
  shared/
    fixtures/
    helpers/
```

- Тесты группируются по slices, а не по техническим сущностям.
- Общие фикстуры и вспомогательные тестовые утилиты допустимы только в `shared/`.
- Для backend используется тестовая БД; для e2e поднимается приложение целиком.

## 6. Запуск

```bash
# Типовые команды
npm run test
npm run test:e2e
npm run test:ui
```

Точные имена скриптов зависят от фактической пакетной структуры, но логика запуска остается той же: unit/integration, backend e2e и UI e2e.

## 7. Покрытие и приоритеты

- Приоритет покрытия определяется критичностью slice, а не абстрактным CRUD.
- Цель MVP: полное acceptance/e2e покрытие всех семи канонических capability slices.
- Процентное покрытие полезно как индикатор, но не заменяет end-to-end проверку пользовательской ценности.
