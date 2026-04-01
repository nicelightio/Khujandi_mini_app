---
description: Execution plan for TASK-FT001-01.
status: active
---
# TASK-FT001-01 Plan

## Inputs strategy
- Use richer task-card inputs as primary source.
- Validate new contract docs against `FT-001`, `REQ-001`, `REQ-002`, `REQ-020`.
- Keep changes minimal and limited to Memory Bank contract/feature/navigation layer.

## Planned steps
1. Add `catalog` public API contract for unauthenticated browse and soft-delete behavior.
2. Add seller write-policy contract for ownership and rename policy markers.
3. Update `FT-001` to point to contract layer explicitly.
4. Update `IMPL-FT-001`, `contracts/index.md`, and top-level navigation.
5. Sync backlog/changelog/protocol evidence and verify traceability.

## Constraints
- Do not introduce a separate seller capability outside `catalog`.
- Keep `shop_name_snapshot` immutable for existing orders.
- Treat post-first rename as manual paid-accounting path, not online charge.

## Verification targets
- Public read rules are explicit and unauthenticated.
- Seller ownership boundary is explicit for write paths.
- Rename policy and snapshot invariant are explicit.
- Docs do not conflict with RTM or feature acceptance criteria.
