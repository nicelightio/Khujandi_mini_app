---
description: Execution plan for TASK-FT013-04.
status: active
---
# TASK-FT013-04 Plan

## Plan
1. Inspect current checkout-payment backend module, dev-runtime mounting and frontend checkout API wiring.
2. Identify the narrow runtime gap between existing FT-002 auth/payment logic and customer-facing `/api/v1` routes.
3. Mount or rewire only the missing customer-facing auth/payment endpoints using existing `checkout-payment` boundaries.
4. Add focused runtime/frontend tests for mounted `POST /auth/telegram` and checkout/payment endpoint behavior, including missing auth recovery with no anonymous order creation.
5. Run focused checkout-payment gates plus lint/build where practical.
6. Sync Memory Bank/backlog/changelog and write verification/handoff artifacts.

## Constraints
- Do not move payment provider trust, replay or session transport rules out of `checkout-payment`.
- Do not trust `initDataUnsafe` or JS-readable persisted session identifiers.
- Do not introduce a shared checkout/cart/payment business module.
- Do not create paid orders in this task unless existing mounted boundary already does so; persistence of paid `CREATED` from revalidated composition remains `TASK-FT013-05`.

## Fallback basis
No separate task-card file exists; execution uses backlog richer fields plus `FT-013`, `FT-002`, `EP-001`, contracts, state and testing docs.
