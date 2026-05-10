---
description: План выполнения TASK-FT017-02 mounted checkout mock success integration.
status: active
---
# TASK-FT017-02 Plan

1. Inspect the existing mounted checkout route, guarded payment provider runtime and checkout-payment runtime tests.
2. Add focused mounted runtime coverage for:
   - valid composition + Mini App session + `PAYMENT_PROVIDER=mock` creates exactly one paid `CREATED` order with customer-safe cursor/revision;
   - duplicate submit/idempotency preserves one order;
   - direct checkout, stale composition and no auth/session create no order;
   - production-like mock mode remains refused.
3. Make the smallest backend/runtime adjustment needed to route mock success through the existing composition revalidation and payment finalization seam.
4. Run focused checkout-payment tests and `git diff --check`.
5. Update `.protocols/TASK-FT017-02/progress.md` and write `.tasks/TASK-FT017-02/TASK-FT017-02-S-IMPL-final-report-code-01.md`.

## Constraints

- No frontend UI affordance in this task.
- No failed/timeout/pending mock outcomes.
- No delivery lifecycle, catalog/cart ownership changes or shared abstraction.
- Do not mark backlog task done; verifier owns closure.
