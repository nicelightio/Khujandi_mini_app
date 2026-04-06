---
description: Верификация выполнения TASK-FT008-10.
status: active
---
# TASK-FT008-10 Verification

## Scope

- Verify checked-in rollout artifact for `ReviewDraft`.
- Verify explicit retention/cleanup policy for expired review drafts.
- Verify no unrelated review-flow rewrite was introduced.

## Planned gates

- `npm run test:reviews-feedback`
- `npm run lint`
- `npx tsc --noEmit -p tsconfig.jest.json`

## Evidence

- `backend/prisma/migrations/20260406153000_add_review_draft_table/migration.sql` materializes `ReviewDraft` with the same unique/index baseline expected by `backend/prisma/schema.prisma`.
- `backend/prisma/migrations/migration_lock.toml` now anchors the checked-in Prisma migration directory as `postgresql`.
- `.memory-bank/features/FT-008-two-sided-reviews-and-negative-alerts.md` now records `TASK-FT008-10` as the operational closure for rollout/retention assumptions.
- `.memory-bank/runbooks/manual-refund-and-negative-alerts.md` now defines rollout and delete-safe cleanup policy for expired drafts via `expiresAt <= now()`.
- `.memory-bank/tasks/backlog.md`, `.memory-bank/changelog.md`, and `.memory-bank/index.md` are synced to `done` / closure state.
- Acceptance checks:
  - Verification target `checked-in runtime can materialize ReviewDraft`: confirmed by direct read of `migration_lock.toml` and `migration.sql`; table columns plus unique/index definitions match the required durable draft baseline.
  - Verification target `expired draft retention policy is explicit and maintainable`: confirmed by direct read of the negative-alert runbook; deploy step, TTL expiry behavior, and delete-safe cleanup command are explicit.
  - Constraint `do not rewrite review flow`: confirmed by task scope and changed-file set; only migration/docs/protocol artifacts were added in this follow-up task.
- Commands used for verify:
  - `npm run test:reviews-feedback`
  - `npm run lint`
  - `npx tsc --noEmit -p tsconfig.jest.json`
- Gate results:
  - `npm run test:reviews-feedback` -> PASS
  - `npm run lint` -> PASS
  - `npx tsc --noEmit -p tsconfig.jest.json` -> PASS

## Verdict

- `PASS`
