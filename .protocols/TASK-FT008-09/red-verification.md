---
description: Adversarial semantic verification for TASK-FT008-09.
status: active
---
# TASK-FT008-09 Red Verification

## Semantic Verdict

- `semantic-concern`

## Top Substance Risks

1. Runtime correctness now depends on a database schema change, but the repo does not contain a checked-in Prisma migration artifact for `ReviewDraft`.
2. TTL is enforced only on read; there is no explicit cleanup path for expired drafts, so hidden storage/maintenance cost can accumulate over time.
3. Memory Bank still contains a small doc drift: `.memory-bank/bugs/index.md` describes `BUG-2026-04-06-ft008-ephemeral-review-draft-state` as active even though the bug card itself is archived.

## Hidden Assumptions

- Shared-DB multi-instance safety is only true after successful schema rollout in every runtime environment.
- Operationally acceptable draft retention assumes that expired rows can accumulate without becoming a practical burden.
- The chosen TTL (`1 hour`) is treated as product-valid without dedicated operator/runtime evidence beyond repo-local tests.

## Cross-Boundary Impact

- Positive: the fix keeps final submit ownership inside `reviews-feedback` and does not leak domain rules into the bot transport layer.
- Risk: because the solution moves correctness into DB-backed state, release/ops now own schema rollout and table lifecycle, not just application deploy.

## Architectural Concerns

- The solution is still minimal and slice-owned, which is directionally correct.
- `ReviewDraft.direction` and `expectedStage` are stored as plain strings rather than constrained DB enums, so data-shape correctness relies fully on application discipline.

## State / Data Consistency Concerns

- Duplicate final submit remains substantively safe because `submitReview()` is already idempotent on the unique review pair.
- Expired drafts are ignored logically, but they are not deleted or archived, so state remains semantically stale in storage even after runtime expiration.

## Operational Concerns

- No checked-in migration means the task is not fully self-contained as a deployable runtime change.
- No cleanup/runbook detail exists for expired `ReviewDraft` rows.
- The new persistence path increases dependency on DB availability for intermediate bot steps; this is acceptable, but it is now part of the runtime critical path.

## Future Maintenance Cost

- Low-to-moderate if a migration artifact and cleanup policy are added soon.
- Moderate if the project keeps adding runtime-persistence tables without explicit retention/runbook ownership.

## How This Could Still Be Wrong

- The fix may look “restart-safe” in repo-local tests but still fail in environments where Prisma schema rollout lags behind code deploy.
- The `1 hour` TTL may be too short or too long in real Telegram usage, and there is no operator evidence yet that this is the right product/runtime tradeoff.
- Long-term table growth could become a silent operational cost because expired drafts never get removed.

## Counterproposal / Escalation Path

1. Human/owner decision: confirm that `1 hour` TTL is an intentional product/runtime policy, not just an implementation default.
2. Add a checked-in Prisma migration or explicit rollout artifact for `ReviewDraft` before calling the durability path operationally complete.
3. Add a follow-up cleanup/runbook note for expired draft retention if the table is expected to live in production.

## Bottom Line

- The core substantive fix is directionally correct and does solve the original process-local fragility.
- I do not see a semantic break in the review flow itself.
- I do see enough hidden operational assumptions that I would not call the task fully “risk-closed” without rollout/retention follow-through.
