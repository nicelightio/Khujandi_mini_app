---
description: Context snapshot for TASK-FT007-04 backend admin login and lockout work.
status: active
---

# TASK-FT007-04 Context

- Scope: backend `POST /admin/auth/login` behavior inside the `admin-access` slice.
- Constraints: separate from Mini App auth, no self-signup, no refresh/logout scope, no token secrets in audit payloads.
- Existing scaffold already owns account/session/audit persistence and lockout/session constants.
