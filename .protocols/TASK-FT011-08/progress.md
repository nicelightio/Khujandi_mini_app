---
description: Progress log for TASK-FT011-08.
status: active
---
# TASK-FT011-08 Progress

## Timeline

- 2026-04-13: Loaded `/execute` instructions, task-scoped spec set, and the `TASK-FT011-07` follow-up basis for `TASK-FT011-08`.
- 2026-04-13: Created task protocol files and identified the current semantic gap: provisioning maps `P2002` to a controlled `409`, but seller rename currently does not.
- 2026-04-13: Implemented controlled seller rename conflict mapping in `CatalogService.updateSellerShop(...)` so repository/runtime uniqueness violations now surface as `SHOP_RENAME_CONFLICT` instead of raw persistence failures.
- 2026-04-13: Aligned both repo-local runtime helpers with the same durable `sellerId + shop name` invariant by adding rename-time uniqueness enforcement to the in-memory repository and the mounted runtime Prisma-like shop client.
- 2026-04-13: Added focused unit, integration, and mounted runtime regressions for rename collisions, then re-ran `npm run test:catalog` and `npm run lint` successfully.
- 2026-04-13: Synced Memory Bank and task artifacts; task is ready for handoff.

## Current status

- State: `done`
- Current focus: handoff to later `FT-011` runtime/durability tasks.
