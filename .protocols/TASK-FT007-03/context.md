---
description: Context snapshot for TASK-FT007-03 admin login/protected shell scaffold.
status: active
---

# TASK-FT007-03 Context

- Scope: scaffold only for `frontend/src/admin` login route, protected shell, and frontend smoke coverage.
- Constraints: no backend auth runtime, no duplicated server-side policy in pages, no token storage logic.
- Existing admin assignment/cancellation pages stay slice-owned and are wrapped by one auth boundary.
