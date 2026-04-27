---
description: Handoff for TASK-FT014-03 opaque-cursor customer polling consumer.
status: active
---
# TASK-FT014-03 Handoff

Status: implemented and verified.

## Summary
- `frontend/src/slices/order-tracking/api/order-tracking-api.ts` now calls `/api/v1/events?since=<encoded opaque cursor>` and normalizes contract/runtime event field variants into the local consumer model.
- `frontend/src/tests/slices/order-tracking/order-tracking-view-model.spec.ts` now covers opaque cursor semantics, empty windows, ordered event application, duplicate revisions and API response parsing.

## Next
- `TASK-FT014-04` should render customer-safe lifecycle/waiting/cancellation copy on top of the now-wired polling consumer.
