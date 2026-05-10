---
description: Final implementation report for TASK-FT016-16 polling consumer alignment.
status: active
---
# TASK-FT016-16 Final Report

## Scope

- Owning slice: `delivery-tracking`.
- Contours: `mini-app`, `admin-web`.
- Touched layers: frontend `ui/app` polling consumers, view models, focused tests, operational docs.
- Shared extraction: not justified and not added.

## Implementation Summary

- Customer order tracking now keeps courier-side action availability aligned with v2: `ASSIGNED -> PICKED_UP -> IN_PROGRESS -> DELIVERED`; `COMPLETED` is no longer exposed as a customer/courier action.
- Customer polling parser accepts `order.status_changed` payloads that use either `status/previousStatus` or `newStatus/oldStatus`, so operator/admin `DELIVERED -> COMPLETED` events are consumed without cursor parsing.
- Read-only customer polling coverage now applies `PICKED_UP`, `IN_PROGRESS`, `DELIVERED`, and operator/admin `COMPLETED` in event order while keeping all mutation controls absent.
- Admin operator read-model coverage now asserts `COMPLETED` and `CANCELLED_*` rows have no follow-up status control, and a confirmed `DELIVERED -> COMPLETED` local update closes the status control action.
- Opaque cursor behavior remains string-only; no consumer parses `since`, `revision`, or `next_cursor` as lifecycle data.

## Checks

- `npm run test:order-tracking:frontend -- --runInBand` - PASS.
- `npx jest --config jest.config.cjs frontend/src/tests/admin/admin-assignment-api.spec.ts frontend/src/tests/admin/admin-assignment-view-model.spec.ts frontend/src/tests/admin/admin-assignment-route.spec.tsx --runInBand` - PASS.
- `npm run build:frontend` - PASS.
- `git diff --check` - PASS.
- Changed markdown local link validation - not applicable; no markdown links were added.

## Out Of Scope Preserved

- No backend transition logic.
- No offer/claim/timeout/assignment-rule changes.
- No cancellation/refund behavior changes.
- No legacy direct assignment cleanup.
- No shared state-machine extraction.

## Residual Risks

- The admin panel still refreshes from the operator read model/local command result rather than a separate admin `/events` stream; this matches current checked-in admin architecture but should be verified against the separate verifier's interpretation of "admin polling consumer".
