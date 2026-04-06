---
description: Implementation plan for TASK-FT007-08.
status: active
---

# TASK-FT007-08 Plan

1. Add a minimal checked-in `admin-access` HTTP handler that exposes login, refresh, and logout through the real `/api/v1/admin/auth/*` runtime boundary.
2. Serialize and clear an admin cookie pair with mandatory `Secure`, `HttpOnly`, `SameSite=Lax`, and centralized `Origin/Referer` enforcement.
3. Add backend HTTP integration coverage for cookies, refresh rotation, logout clearing, and forbidden-origin rejection.
4. Add an admin frontend smoke that drives `AdminRouter` through the real backend runtime boundary with a test cookie jar.
5. Sync task artifacts and Memory Bank status after verification.
