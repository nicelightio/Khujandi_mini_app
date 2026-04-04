---
description: Верификация TASK-FT005-07 по acceptance criteria и evidence.
status: active
---
# TASK-FT005-07 Verification

## Basis
- Task: `TASK-FT005-07`
- Feature: `FT-005`
- Verification targets: `PATCH /orders/{id}/status`, `GET /events?since=<cursor>`, explicit non-closure of `REQ-010`
- REQs in scope: `REQ-008`, `REQ-009`, `REQ-018`
- Out of scope: `REQ-010` polling SLA evidence, `FT-006` cancellation/refund semantics

## Checks

### AC1 / REQ-008
- Requirement: courier-only adjacent transitions `ASSIGNED -> IN_PROGRESS -> DELIVERED -> COMPLETED`; invalid transitions return `409 CONFLICT` with no write side effects.
- What was checked:
  - Reviewed feature/spec contract in `.memory-bank/features/FT-005-order-tracking-and-events-polling.md`, `.memory-bank/states/order-lifecycle.md`, `.memory-bank/contracts/api-events-baseline.md`.
  - Reviewed backend integration evidence in `tests/slices/delivery-tracking/delivery-tracking.integration.spec.ts` covering the full valid chain and dedicated invalid-transition/ownership scenarios.
  - Re-ran `npm run test:delivery-tracking:integration` and `npm run test:delivery-tracking:unit`.
- Evidence:
  - `tests/slices/delivery-tracking/delivery-tracking.integration.spec.ts:18`
  - `tests/slices/delivery-tracking/delivery-tracking.integration.spec.ts:377`
  - `tests/slices/delivery-tracking/delivery-tracking.unit.spec.ts`
- Result: PASS

### AC2 / REQ-018
- Requirement: each valid transition writes history/event after commit, successful command returns polling-friendly `updatedAt` and string `revision`, and lifecycle errors stay on the standard contract path.
- What was checked:
  - Reviewed backend integration assertions for `order_status_history`, `order.status_changed`, ordered commit sequence, and string `revision` metadata.
  - Re-ran `npm run test:delivery-tracking:integration`.
- Evidence:
  - `tests/slices/delivery-tracking/delivery-tracking.integration.spec.ts:45`
  - `tests/slices/delivery-tracking/delivery-tracking.integration.spec.ts:118`
  - `tests/slices/delivery-tracking/delivery-tracking.integration.spec.ts:212`
  - `tests/slices/delivery-tracking/delivery-tracking.integration.spec.ts:239`
- Result: PASS

### AC3 / REQ-009
- Requirement: `GET /events?since=<cursor>` returns ascending ordered events, string `revision`/`next_cursor`, stable empty-window behavior, and duplicate-safe reads.
- What was checked:
  - Reviewed backend integration assertions for ordered event payloads, string cursor handling, and empty-window behavior.
  - Reviewed frontend route smoke covering duplicate-safe polling resume after command-confirmed revisions through `COMPLETED`.
  - Re-ran `npm run test:delivery-tracking:integration` and `npm run test:order-tracking:frontend`.
- Evidence:
  - `tests/slices/delivery-tracking/delivery-tracking.integration.spec.ts:288`
  - `frontend/src/tests/slices/order-tracking/order-tracking-route.spec.tsx:94`
  - `frontend/src/tests/slices/order-tracking/order-tracking-route.spec.tsx:164`
  - `frontend/src/tests/slices/order-tracking/order-tracking-route.spec.tsx:229`
- Result: PASS

### Quality gates
- Commands run:
  - `npm run test:delivery-tracking:unit`
  - `npm run test:delivery-tracking:integration`
  - `npm run test:order-tracking:frontend`
  - `npx tsc -p tsconfig.jest.json --noEmit`
  - `npm run lint`
- Result: PASS

## Scope note
- `REQ-010` remains `planned` by design. `TASK-FT005-07` does not include polling latency/SLA evidence; that closure belongs to `TASK-FT005-08` per `FT-005` and `.memory-bank/testing/index.md`.

## Verdict
- VERDICT: PASS
