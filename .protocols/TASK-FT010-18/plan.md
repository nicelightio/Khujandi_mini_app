---
description: Execution plan for TASK-FT010-18.
status: active
---
# TASK-FT010-18 Plan

1. Inspect the current shared storefront frontend data flow and the checked-in seller runtime endpoints to find the smallest canonical integration path.
2. Replace synthetic/public-browse-derived seller detail state with canonical owner-visible seller storefront loading on `/shops/:shopId`.
3. Replace frontend-local save simulation with real submit calls to the checked-in seller write boundary while keeping the same storefront tree and browse-only fallback.
4. Add or update focused catalog frontend tests for canonical seller reads/writes and owner-visible `NOT_WORKING` behavior.
5. Run scoped quality gates and sync protocol + Memory Bank artifacts.
