---
description: Execution plan for TASK-FT001-05.
status: active
---
# TASK-FT001-05 Plan

## Basis

- Richer inputs available from task card, feature doc, contract, and implementation plan.
- No dedicated task template exists, so this plan is created manually per `/execute` fallback.

## Steps

1. Inspect current `catalog` slice code and test harness for existing write boundaries.
2. Add domain/application support for seller-scoped shop writes.
3. Implement rename policy marker logic with first-free then manual-paid behavior.
4. Keep persistence changes scoped to `catalog` and avoid cross-slice snapshot mutations.
5. Add unit and integration evidence for ownership and rename behavior.
6. Run available quality gates and sync docs/artifacts.

## Expected outputs

- Seller-scoped shop write path with ownership enforcement.
- Rename marker behavior after the first free rename.
- Tests covering ownership and rename policy.
