# TASK-FT004-06 Context

## Scope
- Wire `frontend/src/admin` assignment UX to the existing `FT-004` backend assignment command flow.
- Keep scope limited to loading, success, controlled error rendering, and duplicate-submit prevention.
- Do not expand into `FT-007` login/session ownership.

## Normative inputs
- `AGENTS.md`
- `.memory-bank/features/FT-004-courier-assignment.md`
- `.memory-bank/tasks/plans/IMPL-FT-004.md`
- `.memory-bank/contracts/api-events-baseline.md`
- `.memory-bank/contracts/telegram-bot-contract.md`
- `.memory-bank/states/order-lifecycle.md`
- `.memory-bank/testing/index.md`
- `.memory-bank/tasks/backlog.md` (`TASK-FT004-06`)

## Upstream artifacts reviewed
- `.tasks/TASK-FT004-03/TASK-FT004-03-S-IMPL-final-report-code-01.md`
- `.tasks/TASK-FT004-04/TASK-FT004-04-S-IMPL-final-report-code-01.md`
- `.tasks/TASK-FT004-05/TASK-FT004-05-S-IMPL-final-report-code-01.md`

## Notes
- Existing admin route already has scaffolded loading/success/error states, but submit still uses a fixture implementation.
- Current submit guard is state-based only and can allow duplicate side effects before React flushes state.
