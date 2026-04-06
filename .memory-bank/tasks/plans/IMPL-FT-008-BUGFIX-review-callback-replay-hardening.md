---
description: Bugfix plan for FT-008 stale callback rejection and revision-aware bot review transitions.
status: active
---
# IMPL-FT-008-BUGFIX-review-callback-replay-hardening

## Goal

Сделать bot-guided review stepper revision-aware, чтобы stale и replayed callbacks не меняли текущий draft state и не подменяли пользовательский выбор на промежуточных шагах flow, сохраняя текущую final-submit duplicate safety.

## Bug linkage

- `.memory-bank/bugs/BUG-2026-04-06-ft008-stale-review-callback-replay-gap.md`
- Backlog task: `TASK-FT008-08`

## Current state

- Persisted review submit уже duplicate-safe через uniqueness guard и `P2002` fallback.
- Bot callback payload не содержит revision identity и не различает актуальный prompt от устаревшего.
- Draft mutation в `TelegramBotReviewsFeedbackFlow` выполняется по `orderId + direction` без step revision validation.

## Normative inputs

- `.memory-bank/features/FT-008-two-sided-reviews-and-negative-alerts.md`
- `.memory-bank/contracts/telegram-bot-contract.md`
- `.memory-bank/testing/index.md`

## Constraints

- Не переносить review ownership из `reviews-feedback` в transport layer.
- Не ломать текущую duplicate-safe final submit semantics.
- Предпочитать минимальное расширение payload/state, а не полную переделку stepper architecture.

## Steps

1. Расширить callback payload так, чтобы он однозначно связывал callback с ожидаемым prompt revision/stage.
2. Хранить в draft state ожидаемую revision identity для текущего шага.
3. Обновить `handleCallback()` так, чтобы stale callbacks short-circuit'ились controlled `ignored` outcome и не мутировали draft.
4. Сохранить совместимость с duplicate-safe final submit path и low-rating escalation semantics.
5. Добавить integration/contract tests на replay старой rating/reason-code кнопки после выдачи нового prompt.

## Expected touched files

- `.memory-bank/bugs/BUG-2026-04-06-ft008-stale-review-callback-replay-gap.md`
- `.memory-bank/tasks/backlog.md`
- `.memory-bank/features/FT-008-two-sided-reviews-and-negative-alerts.md` при необходимости
- `.memory-bank/contracts/telegram-bot-contract.md` при необходимости
- `.memory-bank/changelog.md`
- `backend/src/integrations/telegram-bot/telegram-bot-reviews-feedback.harness.ts`
- `backend/src/integrations/telegram-bot/telegram-bot-reviews-feedback.flow.ts`
- `tests/slices/reviews-feedback/**/*`

## Tests

- bot contract/integration: stale rating callback after newer rating prompt is ignored.
- bot contract/integration: stale reason-code callback after newer reason prompt is ignored.
- regression: final submit remains idempotent and low-rating alerts still publish exactly once.

## Verify

- Duplicate/replayed Telegram step callbacks cannot silently mutate the active draft.
- Transport replay hardening now covers both intermediate wizard steps and the already duplicate-safe final review submit path.
