---
description: Handoff notes for TASK-FT010-07.
status: active
---
# TASK-FT010-07 Handoff

- `admin-web` `/admin/catalog/shops/provision` now exposes a real form wired to the mounted protected provisioning command and reports starter bootstrap counts through controlled success/error feedback.
- `seller-web` `/seller/shops/status` now loads owned shops through the Telegram-linked seller runtime, handles explicit unauthenticated/provision-missing failures, and persists `WORKING/NOT_WORKING` through the mounted seller shop update path.
- The backend seller shop update path now accepts `status` without consuming rename allowance, and focused runtime coverage proves public browse hides `NOT_WORKING` while owner-only seller reads remain available.
