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
- `cursor`, `revision`, `next_cursor` сериализуются строкой.

## Event shape

- `type`
- `entity`
- `entity_id`
- `payload`
- `revision`
- `created_at`

## Error shape

- `{ error: { code, message, details }, trace_id }`

## Source artifacts

- [doc/API_GUIDELINES.md](../../doc/API_GUIDELINES.md): baseline REST and polling contract.
- [doc/BRIEF_EXT.md](../../doc/BRIEF_EXT.md): response fields and event payload baseline.
