---
description: Handoff notes for TASK-FT014-07.
status: active
---
# TASK-FT014-07 Handoff

## Result

- Repo-local repair complete.
- `GET /api/v1/events?since=<cursor>` is mounted in the checked-in dev runtime path used by the Mini App status consumer.
- Customer event visibility is authenticated and filtered to orders owned by the current Mini App session.
- Checkout status handoff now uses event-stream cursor metadata instead of `order.id`.
- Cursor/revision values remain strings at the API boundary; non-numeric opaque cursor inputs no longer crash the runtime path.

## Remaining Blocker

- Do not close `REQ-033` yet.
- `TASK-FT014-06` still requires upstream `TASK-FT013-08` fresh real `Android Telegram` checkout evidence.
