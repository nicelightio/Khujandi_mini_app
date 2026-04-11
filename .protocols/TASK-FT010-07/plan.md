---
description: Execution plan for TASK-FT010-07.
status: active
---
# TASK-FT010-07 Plan

1. Inspect the existing admin/seller page shells, route wiring, runtime clients, and tests to find the smallest missing integration points.
2. Wire admin provisioning UI to the checked-in protected provisioning runtime with controlled success/error states.
3. Wire narrow `seller-web` status toggle to the checked-in seller runtime while preserving explicit unauthenticated/forbidden behavior and keeping the surface free of reporting/stats.
4. Add or update focused frontend smoke coverage for provisioning, seller toggle, and protected-state handling.
5. Run targeted verification, then sync task docs and Memory Bank.
