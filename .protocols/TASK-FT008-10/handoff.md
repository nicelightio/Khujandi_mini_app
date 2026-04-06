---
description: Handoff notes for TASK-FT008-10.
status: active
---
# TASK-FT008-10 Handoff

## Expected outcome

- Repo contains an explicit checked-in rollout artifact for `ReviewDraft`.
- Expired-draft retention is explicit in docs/runbook and no longer implicit.

## Runtime handoff

- Apply `backend/prisma/migrations/20260406153000_add_review_draft_table/migration.sql` in each runtime PostgreSQL environment before or together with code deploy that expects durable `ReviewDraft` state.
- Keep Prisma client generation aligned with `backend/prisma/schema.prisma` in the deploy pipeline.
- Expired rows are intentionally delete-safe: operators may run `DELETE FROM "ReviewDraft" WHERE "expiresAt" <= NOW();` during maintenance without domain compensation steps.
- No further code follow-up is required for `TASK-FT008-10` unless the product owner wants a different TTL/retention cadence than the current `1 hour` policy.
