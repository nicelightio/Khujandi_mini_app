# TASK-FT010-20 Plan

## Basis
- Use explicit backlog/task constraints and `FT-010` follow-up note.
- Keep `seller-web` narrow; do not introduce a second broad edit surface.

## Steps
1. Change seller-web status submit payload to send only `shopId + status` intent.
2. Harden mounted seller runtime request parsing so omitted metadata fields remain untouched instead of being coerced to `null`.
3. Add focused regressions for seller route submit semantics and runtime stale-metadata preservation.
4. Run repo-local gates and sync Memory Bank/protocol artifacts.
