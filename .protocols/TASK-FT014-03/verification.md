---
description: Verification log for TASK-FT014-03 opaque-cursor customer polling consumer.
status: active
---
# TASK-FT014-03 Verification

VERDICT: PASS

## Scope
- Проверена задача `TASK-FT014-03`, а не финальное закрытие всего `FT-014`.
- Owning slice: `delivery-tracking` через физический frontend surface `order-tracking`.
- Contour: `mini-app` customer read surface.
- Touched layers: presentation + application read/polling consumer.
- Shared extraction: не требуется; consumer локально использует existing `FT-005` / `api-events-baseline` polling contract.

## Evidence
- `frontend/src/slices/order-tracking/api/order-tracking-api.ts`: `pollEvents(cursor)` calls `GET /api/v1/events?since=<encoded opaque cursor>` and parses `next_cursor`/`nextCursor`, `entity_id`/`entityId`, `created_at`/`createdAt` without numeric cursor coercion.
- `frontend/src/slices/order-tracking/model/order-tracking-view-model.ts`: polling result application filters other orders, suppresses duplicate revisions, advances cursor from `nextCursor`, and preserves read-only customer mode without lifecycle commands.
- `frontend/src/tests/slices/order-tracking/order-tracking-view-model.spec.ts`: covers empty windows, duplicate revisions, ordered opaque revisions, snake-case payload parsing, non-string cursor rejection, and encoded `since` requests.

## Gates
- `npm run test:order-tracking:frontend -- frontend/src/tests/slices/order-tracking/order-tracking-view-model.spec.ts` -> PASS (`3` suites, `13` tests), rerun 2026-04-26.
- `npm run lint` -> PASS, rerun 2026-04-26.
- `npm run build:frontend` -> PASS, rerun 2026-04-26.

## Acceptance Check
- Customer status consumes existing polling contract through `GET /api/v1/events?since=<cursor>`.
- `since`, `revision`, and `next_cursor`/`nextCursor` are treated as strings; non-string `next_cursor` is rejected instead of coerced.
- Empty windows keep the current state and cursor stable.
- Duplicate revisions are suppressed without read-side lifecycle side effects.
- No courier/admin mutation controls were added to the customer read-only path.

## Artifacts Updated
- `.protocols/TASK-FT014-03/verification.md`: refreshed explicit verification verdict, scope, evidence and rerun gates after the previous empty-result report.
