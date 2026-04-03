---
description: Базовый контракт REST команд и event polling для MVP.
status: active
---
# API Events Baseline

## REST baseline

- Base path: `/api/v1`.
- JSON only.
- Commands идут через REST endpoints и возвращают актуальное состояние с `updated_at` и `revision`, где это нужно для downstream polling.

## Event polling

- `GET /events?since=<cursor>` возвращает события в порядке возрастания `revision`.
- `since`, `revision`, `next_cursor` сериализуются строкой и трактуются как opaque cursor values на API boundary.
- Polling response обязан возвращать string `next_cursor` даже для empty-window результата.
- Повторный запрос с тем же `since` обязан быть duplicate-safe: read path не создает domain side effects и не меняет ordering contract.

## Event shape

- `type`
- `entity`
- `entity_id`
- `payload`
- `revision`
- `created_at`

## Command-response baseline for write flows

- Успешная write-команда возвращает актуальное состояние ресурса с `updated_at` и `revision`, когда downstream polling зависит от дешевой синхронизации.
- Write-flow, который меняет lifecycle заказа, обязан публиковать доменное событие только после успешного persistence commit.
- Для `FT-004` событие `order.assigned` остается canonical publish point для перехода `CREATED -> ASSIGNED`; `revision` в event/response сериализуется строкой.
- Для `FT-005` успешный status-change command также возвращает `updated_at` и string `revision`, а невалидный lifecycle transition обязан завершаться `409 CONFLICT` без history/event side effects.

## Error shape

- `{ error: { code, message, details }, trace_id }`
- Невалидный lifecycle transition использует тот же error shape с HTTP `409 CONFLICT`.

## Source artifacts

- [doc/API_GUIDELINES.md](../../doc/API_GUIDELINES.md): baseline REST and polling contract.
- [doc/BRIEF_EXT.md](../../doc/BRIEF_EXT.md): response fields and event payload baseline.
