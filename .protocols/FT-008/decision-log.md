---
description: Decision log для декомпозиции FT-008 в waves и task cards.
status: active
---
# FT-008 Decision Log

## Decisions

- 2026-04-04: `FT-008` декомпозируется как owning `reviews-feedback` slice для двусторонних review submissions, `review.created` / `review.negative` semantics и Telegram alert fan-out.
- 2026-04-04: Первая wave начинается с docs freeze, потому что feature acceptance already fixes review payload shape, negative-alert semantics и duplicate/replay constraints до runtime implementation.
- 2026-04-04: Для детерминированной навигации используются feature-scoped task IDs вида `TASK-FT008-0X`.
- 2026-04-04: Backend review persistence/idempotency и negative-alert fan-out разделены на отдельные core tasks, чтобы не смешивать duplicate-safe write correctness с notification fan-out behavior.
- 2026-04-04: Bot-guided review stepper выделяется в отдельную task после backend command semantics, чтобы existing Telegram integration patterns переиспользовались без преждевременного расширения shared runtime ownership.

## Open questions

- Должны ли `reason_code` enums быть едиными для client->courier и courier->client review directions, или требуется direction-specific taxonomy; решение должно быть явно зафиксировано в docs-first task.
- Как exactly определяется множество `active administrators` для `review.negative`: по активным admin accounts, по explicit alert recipient registry или по другому boundary; `FT-008` не берет ownership над admin auth/session model без явной спецификации.

## Notes

- `REQ-014` и runtime docs уже фиксируют `review.negative` как fan-out exception; decomposition сохраняет это как slice-owned business rule, а не как transport-only detail.
