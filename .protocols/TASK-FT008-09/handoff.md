---
description: Handoff по TASK-FT008-09.
status: active
---
# TASK-FT008-09 Handoff

## Delivered

- Durable `ReviewDraft` persistence model and slice API for bot review drafts.
- Flow runtime now survives restart/redeploy/shared-DB multi-instance hops within TTL `1 hour`.
- Updated repo-local tests and Memory Bank docs.

## Residual notes

- Post-TTL behavior remains intentionally fail-closed as `missing_draft`; actor should restart the review flow.
- DB schema changed via `backend/prisma/schema.prisma`, so the runtime environment still needs the corresponding Prisma migration/generate step outside this task if not already automated.
