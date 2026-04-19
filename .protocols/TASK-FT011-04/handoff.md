---
description: Handoff notes for TASK-FT011-04.
status: active
---
# TASK-FT011-04 Handoff

## Status

- Implementation complete.

## Notes for follow-up

- Mounted `POST /api/v1/auth/telegram` seller capability checks and `GET /api/v1/seller/shops/:shopId` storefront payload resolution now go through repository-backed `catalog` reads instead of direct `catalogState` access in the dev runtime shell.
- `TASK-FT011-05` and `TASK-FT011-06` can build on this narrower closure for wider durability regression coverage and final manual `restart -> /shops/:shopId` evidence sync.
