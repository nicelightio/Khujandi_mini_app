# TASK-FT010-15 Plan

1. Replace the private in-memory `sellerWriteEvents` sink with a shared `events`-store analogue in the checked-in `catalog` runtime state.
2. Update focused runtime coverage to assert the shared sink semantics instead of the private seller-only array.
3. Run relevant catalog tests and lint/typecheck-adjacent gate(s) only as needed for the touched surface.
4. Sync Memory Bank, backlog state, changelog, protocol progress, and task report.

## Why this plan
- The semantic concern is narrow: the artifact shape is already aligned, so only the sink-level asymmetry needs closure.
- A minimal state/sink rename keeps behavior unchanged for callers while making the checked-in runtime semantics match the project-wide `events` model.
