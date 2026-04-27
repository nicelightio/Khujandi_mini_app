# TASK-FT012-01 Handoff

## Summary
- `FT-012` execution boundary is frozen docs-first.
- Future implementation must keep composition state inside `frontend/src/slices/catalog/**/*` unless only generic UI primitives are reused.
- The only cross-slice artifact is `customer-order-composition-contract.md`.

## Follow-up task unlocked
- `TASK-FT012-02`

## Notes for next task
- Implement slice-local cart/composition state and payload mapping around canonical public storefront data.
- Do not create orders, start payment, reserve stock or publish lifecycle events.
- Preserve public routing via `shop_public_path`; keep `shop_id` internal payload data only.
