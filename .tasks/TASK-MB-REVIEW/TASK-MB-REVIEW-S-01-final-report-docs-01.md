---
description: Architect review for FT-012/FT-013/FT-014 closure readiness.
status: active
---
# TASK-MB-REVIEW S-01 Architect Report

## VERDICT

REJECT

## Scope

- Reviewed architecture and boundary alignment for `FT-012`, `FT-013`, and `FT-014`.
- Checked whether the current mounted runtime can support the EP-001 flow `composition -> checkout -> paid order -> customer status`.

## Findings

### P0 - `FT-014` customer status polling is not mounted in the repo-local runtime

- Evidence: `frontend/src/slices/order-tracking/api/order-tracking-api.ts:175-186` calls `GET /api/v1/events?since=<cursor>` for customer status polling.
- Evidence: `backend/src/dev-runtime/dev-api-server.ts:349-413` mounts `POST /api/v1/orders/checkout`, then falls through to catalog/admin/ops routes starting at `backend/src/dev-runtime/dev-api-server.ts:431`; no `GET /api/v1/events` route is mounted.
- Evidence: `backend/src/dev-runtime/order-ops-runtime.ts:361-368` returns only `deliveryAssignmentModule` and `orderCancellationModule`; there is no mounted `deliveryTrackingModule` exposing `getEventsSince`.
- Spec impact: `.memory-bank/features/FT-014-customer-order-status-visibility-and-delivery-tracking-integration.md:37-43` requires customer status to consume the existing `FT-005` polling contract and resume duplicate-safely.
- Closure impact: `FT-014` cannot proceed to final closure because the real customer runtime path cannot observe backend events through the claimed polling endpoint.

### P1 - Checkout success cursor is incompatible with the existing delivery-tracking repository cursor parser

- Evidence: `backend/src/dev-runtime/dev-api-server.ts:406-412` returns `revision: order.id` from checkout success.
- Evidence: `frontend/src/slices/checkout-payment/model/checkout-payment-view-model.ts:167-170` uses that `revision` as the `/tracking?...&cursor=...` initial cursor.
- Evidence: `backend/src/slices/delivery-tracking/infrastructure/prisma-delivery-tracking.repository.ts:124-130` normalizes any non-empty cursor with `BigInt(cursor)`.
- Risk: if `order.id` is a non-numeric runtime id, the first real polling request will fail before events are returned. This violates the Memory Bank claim that `since`/`revision` are opaque strings and blocks robust `FT-013 -> FT-014` integration.

## Positive Notes

- `FT-012` and `FT-013` slice ownership is architecturally coherent: `catalog` produces the composition contract and `checkout-payment` consumes/revalidates it.
- `FT-014` correctly keeps delivery operations outside the customer contour in spec wording.

## Recommendation

- Before final closure, mount the real event polling route in the checked-in runtime and make checkout/status cursor semantics compatible with the `FT-005` event contract.
