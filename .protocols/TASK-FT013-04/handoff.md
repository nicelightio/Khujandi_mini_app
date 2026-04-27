---
description: Handoff notes for TASK-FT013-04.
status: active
---
# TASK-FT013-04 Handoff

## Status
- Implemented and repo-locally verified.

## Summary
- Frontend checkout API now calls mounted runtime endpoints instead of local stub responses.
- Dev runtime exposes authenticated language sync and checkout submit routes under `/api/v1`.
- Checkout submit requires the Mini App HttpOnly session and deliberately stops before order creation with controlled `PAYMENT_CONFIRMATION_REQUIRED`; paid order persistence remains `TASK-FT013-05`.

## Downstream
- `TASK-FT013-05` depends on this mounted runtime before persisting paid `CREATED` orders from revalidated composition.
