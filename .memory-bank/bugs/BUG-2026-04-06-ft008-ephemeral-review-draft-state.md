---
description: Archived FT-008 bug for process-local review draft state; drafts are now stored durably with explicit TTL and restart-safe semantics.
status: archived
---
# BUG-2026-04-06 FT-008 Ephemeral Review Draft State

## Summary

The original bot review wizard kept draft state only in an in-memory `Map` inside the process. A restart, redeploy, or multi-instance routing change could therefore drop the user's active draft and turn a valid next bot step into `missing_draft`.

## Detection

- Date: `2026-04-06`
- Detection mode: semantic verification of PR `#6` against `origin/main`
- Reviewed files:
  - `backend/src/integrations/telegram-bot/telegram-bot-reviews-feedback.flow.ts`
  - `.memory-bank/features/FT-008-two-sided-reviews-and-negative-alerts.md`
  - `.memory-bank/contracts/telegram-bot-contract.md`
- Evidence:
  - `TelegramBotReviewsFeedbackFlow` previously stored drafts in `private readonly drafts = new Map<string, PendingReviewDraft>()`.
  - No persistence, TTL policy, cleanup, or cross-instance coordination existed for review drafts.
  - `handleCallback()` and `handleComment()` returned `missing_draft` when the in-memory state was absent.

## Expected behavior

- Review-draft runtime guarantees must be explicit for MVP.
- Active drafts should survive restart/redeploy and cross-instance hops when instances share the primary database.
- Expired drafts may fail closed as `missing_draft`, but that fallback must be explicit and bounded by TTL.

## Actual behavior

- Draft state is now persisted in slice-owned `ReviewDraft` records keyed by `actor + order + direction`.
- Draft continuity is restart-safe and multi-instance-safe for deployments that share the same database.
- Drafts expire after `1 hour`; once expired, the next callback/comment fails closed as `missing_draft` and the actor must restart the review flow.

## Impact

- The original operational fragility is removed for restart/redeploy/shared-DB multi-instance runtime.
- The remaining bounded limitation is explicit: draft continuity is TTL-limited rather than indefinite.
- Docs and repo-local tests now align on the actual runtime guarantee.

## Execution notes

- Final submit semantics remain inside the owning `reviews-feedback` path.
- The implemented fix uses a narrowly scoped persistence-backed draft store rather than a broad bot-runtime refactor.
- `TASK-FT008-09` now closes this bug; no additional docs-only narrowing is needed.

## Suggested fix

- Completed in `TASK-FT008-09`.
- Draft state now lives in `ReviewDraft` persistence with explicit `1 hour` TTL and actor/order/direction ownership.
- Repo-local tests confirm bot flow continuity while preserving duplicate-safe final submit and `review.negative` semantics.

## Follow-up artifacts

- Backlog task: `TASK-FT008-09` (`done`)
- Implementation plan: `.memory-bank/tasks/plans/IMPL-FT-008-BUGFIX-review-draft-durability.md`
