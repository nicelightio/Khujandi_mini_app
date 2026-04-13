---
description: Handoff notes for TASK-FT011-08.
status: active
---
# TASK-FT011-08 Handoff

## Status

- Implementation complete.

## Notes for follow-up

- Mounted seller runtime now returns `SHOP_RENAME_CONFLICT` with HTTP `409` when a seller tries to rename one owned shop to another owned shop's name.
- Later `FT-011` tasks can assume the durable `sellerId + shop name` invariant is now reconciled for both provisioning and seller rename flows; remaining work stays on broader persisted read-path/restart closure.
