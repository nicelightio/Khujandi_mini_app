---
description: Repo-local polling SLA evidence bundle for TASK-FT005-08.
status: active
---
# TASK-FT005-08 Polling SLA Evidence

## Profile
- Verification target: `REQ-010` / `FT-005` polling visibility latency.
- Profile: repo-local MVP polling cadence using the existing `order-tracking` route and current `delivery-tracking` ordered-event contract.
- Sampling method: 20 event-emission offsets spaced by 250 ms across one 5-second polling window.
- Backend/runtime scope: no `FT-006` cancellation/refund behavior included.

## Evidence basis
- `frontend/src/slices/order-tracking/hooks/use-order-tracking-view-model.ts` runs immediate poll plus `setInterval(..., 5000)` cadence.
- `frontend/src/tests/slices/order-tracking/order-tracking-sla.spec.tsx` measures visibility delay across 20 sampled offsets on the actual route/hook behavior.
- `tests/slices/delivery-tracking/delivery-tracking.integration.spec.ts` remains the ordered-event regression baseline for `GET /events?since=<cursor>`.

## Measured result
- Sample count: `20`
- Observed polling visibility p95: `4500 ms`
- Observed max visibility delay: `4750 ms`
- SLA target: `<= 10000 ms`
- Verdict: `PASS`

## Commands
- `npm run test:order-tracking:frontend`
- `npm run test:delivery-tracking:integration`
- `npx tsc -p tsconfig.jest.json --noEmit`
- `npm run lint`

## Conclusion
- Current repo-local polling cadence keeps `FT-005` visibility latency within the MVP SLA target.
- `REQ-010` can be marked `done` together with final `FT-005` docs sync.
