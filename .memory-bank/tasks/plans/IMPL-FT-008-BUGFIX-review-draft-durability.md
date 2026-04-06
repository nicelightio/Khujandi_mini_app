---
description: Hardening plan for FT-008 review draft runtime guarantees and explicit durability assumptions.
status: active
---
# IMPL-FT-008-BUGFIX-review-draft-durability

## Goal

Сделать runtime guarantees для bot review drafts явными и проверяемыми: либо убрать process-local fragility, либо честно зафиксировать более узкую MVP runtime assumption.

## Bug linkage

- `.memory-bank/bugs/BUG-2026-04-06-ft008-ephemeral-review-draft-state.md`
- Backlog task: `TASK-FT008-09`

## Current state

- Review draft state живет только в in-memory `Map` внутри `TelegramBotReviewsFeedbackFlow`.
- При отсутствии draft flow возвращает `missing_draft`, даже если пользователь следует валидному prompt.
- Repo-local tests подтверждают happy path, но не покрывают restart/scale-out runtime semantics.
- Current spec layer does not yet decide whether that limitation is acceptable for MVP.

## Normative inputs

- `.memory-bank/features/FT-008-two-sided-reviews-and-negative-alerts.md`
- `.memory-bank/contracts/telegram-bot-contract.md`
- `.memory-bank/runbooks/manual-refund-and-negative-alerts.md`
- `.memory-bank/testing/index.md`

## Constraints

- Не размывать ownership финального review submit path.
- Предпочитать минимально достаточную durability strategy с явным TTL/cleanup поведением.
- Если выбирается explicit MVP limitation вместо полноценной durability, это должно быть честно отражено в spec/runbook и verify evidence, а не оставлено implicit.

## Steps

1. Явно выбрать и зафиксировать MVP runtime guarantee для review drafts: durable/reconstructable flow либо документированная узкая single-process assumption.
2. Если выбирается durable path, реализовать actor/order/direction-scoped draft persistence или reconstruction с TTL и controlled cleanup semantics.
3. Если выбирается durable path, обновить flow так, чтобы restart или cross-instance hop не приводили к ложному `missing_draft` для валидного следующего шага.
4. Добавить tests/harness evidence либо для restart-safe/multi-instance-safe behavior, либо для явно задокументированного fallback behavior.
5. Синхронизировать feature/runbook/testing docs с выбранной runtime guarantee.

## Expected touched files

- `.memory-bank/bugs/BUG-2026-04-06-ft008-ephemeral-review-draft-state.md`
- `.memory-bank/tasks/backlog.md`
- `.memory-bank/features/FT-008-two-sided-reviews-and-negative-alerts.md` при необходимости
- `.memory-bank/contracts/telegram-bot-contract.md` при необходимости
- `.memory-bank/runbooks/manual-refund-and-negative-alerts.md` при необходимости
- `.memory-bank/changelog.md`
- `backend/prisma/schema.prisma` при выборе persistence-backed approach
- `backend/src/integrations/telegram-bot/telegram-bot-reviews-feedback.flow.ts`
- `backend/src/slices/reviews-feedback/**/*` при необходимости
- `tests/slices/reviews-feedback/**/*`

## Tests

- integration/harness: flow can resume after draft reload/reconstruction for the same actor/order/direction.
- regression: duplicate-safe final submit and low-rating alert semantics remain unchanged.
- operational verify evidence: chosen runtime guarantee is explicitly tested or documented with controlled fallback.

## Verify

- Operational runtime assumptions are explicit, testable, and aligned with `FT-008` closure claims.
- If durable behavior is selected, bot review flow no longer depends on one long-lived process-local `Map` for correctness.
