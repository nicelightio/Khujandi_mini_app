---
description: Archived bug for FT-008 stale Telegram review callbacks; revision-aware step validation now blocks stale draft mutations.
status: archived
---
# BUG-2026-04-06 FT-008 Stale Review Callback Replay Gap

## Summary

The bot review flow is duplicate-safe at final submit, but callback payloads currently omit prompt revision identity and the stepper accepts any callback matching `orderId + direction`. As a result, stale Telegram button presses from an earlier prompt can overwrite the active draft before final submit.

## Detection

- Date: `2026-04-06`
- Detection mode: semantic verification of PR `#6` against `origin/main`
- Reviewed files:
  - `backend/src/integrations/telegram-bot/telegram-bot-reviews-feedback.harness.ts`
  - `backend/src/integrations/telegram-bot/telegram-bot-reviews-feedback.flow.ts`
  - `.memory-bank/contracts/telegram-bot-contract.md`
  - `.memory-bank/features/FT-008-two-sided-reviews-and-negative-alerts.md`
- Evidence:
  - `buildReviewStepperCallbackData()` encodes only `orderId`, `direction`, `stage`, and `value`.
  - `notifyRatingStep()`, `notifyReasonCodeStep()`, and `notifyCommentStep()` use `revision` only for dedupe keys and prompt text generation, not for callback validation.
  - `handleCallback()` accepts any parsed callback for the same direction and updates the in-memory draft without checking whether the callback belongs to the latest prompt revision.

## Expected behavior

- Duplicate or stale Telegram deliveries should be safely ignored before they can mutate the currently active wizard state.
- The transport-level step identity should be explicit enough to reject outdated button clicks for a superseded prompt.
- Final submit is already duplicate-safe; intermediate bot-guided step transitions should be hardened to reject stale prompt callbacks as well.

## Actual behavior

- Final persisted review writes are uniqueness-protected.
- Intermediate step transitions are not revision-protected.
- A stale rating or reason-code callback can replace the current draft state if the actor still has an active draft for the same order and direction.

## Impact

- The final persisted review may reflect an outdated button press rather than the user's latest visible flow state.
- `FT-008` currently satisfies duplicate-safety mainly at write time, but the bot stepper itself is not revision-aware on intermediate callbacks.
- Retry/noise behavior from Telegram remains semantically unsafe for the stepper itself even if duplicate writes are prevented.

## Execution notes

- Keep the owning review rules in `reviews-feedback`; do not move domain ownership into the bot harness.
- The fix should preserve current idempotent final-submit semantics.
- Prefer a minimal change that carries and validates revision/stage identity without introducing a second parallel state machine.

## Suggested fix

- Extend callback payloads to carry prompt revision identity.
- Store the latest expected revision per step in the draft state.
- Make `handleCallback()` ignore callbacks that do not match the currently expected revision/stage.
- Add tests that replay stale rating/reason-code buttons after a newer prompt has already been issued.

## Follow-up artifacts

- Backlog task: `TASK-FT008-08`
- Implementation plan: `.memory-bank/tasks/plans/IMPL-FT-008-BUGFIX-review-callback-replay-hardening.md`

## Resolution

- `TASK-FT008-08` extended step callback payloads with revision identity and stored expected `stage + revision` in the active draft.
- `TelegramBotReviewsFeedbackFlow.handleCallback()` now returns controlled `ignored/stale_callback` for superseded `rating`, `reason_code`, and `skip_comment` callbacks before any draft mutation.
- Repo-local unit/integration coverage now replays older step buttons after newer prompts and confirms final submit plus `review.negative` semantics remain duplicate-safe.
