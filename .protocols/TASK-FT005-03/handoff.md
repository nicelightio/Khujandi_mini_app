---
description: Handoff notes for TASK-FT005-03.
status: active
---
# TASK-FT005-03 Handoff

- Next backend/runtime tasks should replace the frontend scaffold API stubs with real `delivery-tracking` read/write wiring.
- `TASK-FT005-04` remains the owner of courier status command validation and `409 CONFLICT` semantics.
- `TASK-FT005-05` remains the owner of real ordered `/events?since=<cursor>` behavior.
- `TASK-FT005-06` should consume the new frontend/bot harnesses instead of reintroducing transport-level state-machine logic.
