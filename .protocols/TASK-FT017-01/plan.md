---
description: Implementation plan for TASK-FT017-01 guarded mock provider config/boundary.
status: active
---
# TASK-FT017-01 Plan

1. Inspect current checkout-payment runtime/payment provider path and focused tests.
2. Add explicit runtime/provider config that enables mock only through `PAYMENT_PROVIDER=mock`.
3. Enforce `NODE_ENV !== "production"` for mock provider and make production-like runtime refuse before payment trust.
4. Ensure `DEBUG=true` without `PAYMENT_PROVIDER=mock` cannot trigger trusted mock confirmation.
5. Add focused backend/runtime coverage for non-production accept, production refusal and DEBUG-negative behavior.
6. Run focused checkout-payment backend/runtime tests plus `git diff --check`.
7. Write `.tasks/TASK-FT017-01/TASK-FT017-01-S-IMPL-final-report-code-01.md` without marking the task done.
