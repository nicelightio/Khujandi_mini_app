# TASK-FT011-05 Context

## Task
- `TASK-FT011-05` — Add durability regression suite for restart-safe catalog behavior

## Richer inputs found
- `.memory-bank/tasks/backlog.md:1425`
- `.memory-bank/features/FT-011-db-backed-catalog-runtime-baseline.md`
- `.memory-bank/tasks/plans/IMPL-FT-011.md`
- `.memory-bank/testing/index.md`

## Fallback used
- No extra task-local richer fields beyond the backlog card were present, so execution used the classic feature + requirements + testing-doc fallback described by `/execute`.

## Normative scope summary
- `REQ-027`: mounted `catalog` runtime must stay DB-backed and restart-safe.
- `REQ-028`: provisioning must remain atomic, duplicate/conflict-safe, and free from partial durable state.
- This task owns automated regression evidence only; the final manual restart smoke and RTM closure stay with `TASK-FT011-06`.

## Implementation focus
- Extend mounted runtime regression coverage in `tests/slices/catalog/catalog.runtime.integration.spec.ts`.
- Add an explicit repo-local command for runtime-only catalog regressions.
- Sync task-scoped Memory Bank/testing navigation after the evidence lands.
