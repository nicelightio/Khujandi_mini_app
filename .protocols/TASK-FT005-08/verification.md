---
description: Верификация TASK-FT005-08 по acceptance criteria и evidence.
status: active
---
# TASK-FT005-08 Verification

## Basis
- Task: `TASK-FT005-08`
- Feature: `FT-005`
- Verification targets: polling SLA evidence for `REQ-010` plus final ordered-polling regression coherence
- REQs in scope: `REQ-010`, `REQ-018`
- Out of scope: `FT-006` cancellation/refund semantics

## Checks

### REQ-010 / polling SLA
- Requirement: polling visibility latency p95 must stay `<= 10 секунд` on the agreed repo-local MVP profile.
- What was checked:
  - Reviewed `frontend/src/slices/order-tracking/hooks/use-order-tracking-view-model.ts` to confirm the live route still polls immediately and then every `5000 ms`.
  - Added and ran `frontend/src/tests/slices/order-tracking/order-tracking-sla.spec.tsx`, which samples 20 event-emission offsets across one polling window on the actual route/hook behavior.
  - Recorded the resulting latency distribution in `.tasks/TASK-FT005-08/TASK-FT005-08-polling-sla-evidence.md`.
- Evidence:
  - `frontend/src/slices/order-tracking/hooks/use-order-tracking-view-model.ts:25`
  - `frontend/src/slices/order-tracking/hooks/use-order-tracking-view-model.ts:127`
  - `frontend/src/tests/slices/order-tracking/order-tracking-sla.spec.tsx`
  - `.tasks/TASK-FT005-08/TASK-FT005-08-polling-sla-evidence.md`
- Result: PASS (`p95 = 4500 ms`, `max = 4750 ms`)

### Ordered polling regression coherence
- Requirement: final SLA closure must not drift from the already verified ordered-event contract.
- What was checked:
  - Re-ran `npm run test:delivery-tracking:integration`.
  - Re-ran `npm run test:order-tracking:frontend` so the new SLA harness and existing route/view-model regressions pass together.
- Evidence:
  - `tests/slices/delivery-tracking/delivery-tracking.integration.spec.ts`
  - `frontend/src/tests/slices/order-tracking/order-tracking-route.spec.tsx`
  - `frontend/src/tests/slices/order-tracking/order-tracking-view-model.spec.ts`
- Result: PASS

### Quality gates
- Commands run:
  - `npm run test:order-tracking:frontend`
  - `npm run test:delivery-tracking:integration`
  - `npx tsc -p tsconfig.jest.json --noEmit`
  - `npm run lint`
- Independent verifier rerun in the current workspace confirmed all four gates still pass without evidence drift.
- Result: PASS

## Verdict
- VERDICT: PASS
