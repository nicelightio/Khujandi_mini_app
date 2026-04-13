---
description: Handoff notes for TASK-FT011-07.
status: active
---
# TASK-FT011-07 Handoff

## Delivered

- Added a canonical durable uniqueness boundary for provisioning identity via `Shop(sellerId, name)` and checked in the matching Prisma migration.
- Aligned the in-memory/runtime catalog helper so mounted repo-local conflict semantics match the checked-in persistence rule instead of relying only on a service-layer precheck.
- Added hostile integration/runtime coverage proving repeated or concurrent identical provisioning leaves exactly one starter bundle and returns a controlled conflict for the loser.

## Follow-up

- `TASK-FT011-04` still owns moving broader storefront and seller-protected catalog reads fully onto canonical persisted runtime state.
- `TASK-FT011-05` still owns the wider durability regression suite across restart-safe mounted runtime behavior.
- `TASK-FT011-06` still owns final manual durability smoke evidence, RTM closure, and final `FT-011` docs sync.
