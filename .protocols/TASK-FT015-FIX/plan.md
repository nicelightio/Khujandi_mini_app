---
description: Plan for TASK-FT015-FIX showcase curation repair.
status: active
---
# TASK-FT015-FIX Plan

1. Frontend: make admin product curation long-press action stable after pointer release, keep customer/seller behavior intact.
2. Frontend: await curation writes and show minimal pending/error feedback; refresh or reconcile data after successful writes.
3. Backend runtime: make `OPTIONS` preflight advertise `DELETE` for admin curation endpoints.
4. Tests: add focused frontend positive curation coverage and runtime preflight coverage.
5. Gates: run focused catalog/frontend/backend tests, then broader catalog/build checks if feasible.
