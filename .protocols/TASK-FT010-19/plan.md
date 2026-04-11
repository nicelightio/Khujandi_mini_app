---
description: Execution plan for TASK-FT010-19.
status: active
---
# TASK-FT010-19 Plan

1. Inspect the canonical seller storefront read-model introduced by `TASK-FT010-18` and identify where legacy products without explicit `menuPageId` are dropped.
2. Implement the smallest backend-side reconciliation so owner-visible seller reads still return canonical storefront data for both provisioned skeleton shops and older unpaged product shapes.
3. Add focused hostile runtime/integration coverage for `menuPageId = null` or missing menu pages without changing public browse semantics.
4. Run scoped quality gates, then sync protocol and Memory Bank docs with the verified outcome.
