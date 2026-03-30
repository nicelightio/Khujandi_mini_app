---
description: ADR по выбору polling `GET /events` как механизма доставки изменений в MVP.
status: active
---
# ADR-002 Events Polling For MVP

## Decision

В MVP чтение изменений выполняется через polling `GET /events?since=<cursor>`.

## Why

- Polling проще и дешевле для MVP, чем SSE/WS.
- Cursor-based transport дает управляемую инкрементальную выдачу.
- Формат событий можно сохранить для будущей миграции на SSE/WS.

## Consequences

- Нужно контролировать polling SLA p95 <= 10 секунд.
- Command responses возвращают `updated_at` и `revision` для дешевого sync.

## Sources

- `doc/PRD.md`
- `doc/API_GUIDELINES.md`
- `doc/BRIEF_EXT.md`
