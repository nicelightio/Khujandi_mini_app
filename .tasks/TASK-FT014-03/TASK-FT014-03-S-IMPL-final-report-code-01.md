---
description: Implementation report for TASK-FT014-03 opaque-cursor customer polling consumer.
status: active
---
# TASK-FT014-03 Implementation Report

## Result
- Implemented customer polling API wiring for `GET /api/v1/events?since=<cursor>` in `frontend/src/slices/order-tracking/api/order-tracking-api.ts`.
- Added parser coverage for `next_cursor`/`nextCursor`, `entity_id`/`entityId`, `created_at`/`createdAt`, string-only cursor/revision validation and encoded opaque `since` requests.
- Preserved read-only customer status behavior and did not add courier/admin lifecycle commands.

## Gates
- `npm run test:order-tracking:frontend -- frontend/src/tests/slices/order-tracking/order-tracking-view-model.spec.ts` -> PASS.
- `npm run lint` -> PASS.
- `npm run build:frontend` -> PASS.
