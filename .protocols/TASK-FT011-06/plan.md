# TASK-FT011-06 Plan

## Inputs
- Backlog card provides acceptance targets, touched docs, and verification targets.
- `IMPL-FT-011` step 6 assigns manual smoke, RTM sync, and final verify narrative to this task.
- `FT-011` and `testing/index.md` require explicit manual restart durability evidence beyond automated tests.

## Plan
1. Inspect current FT-011 implementation/docs state and preserve any in-flight unrelated changes.
2. Run final automated gates for the catalog surface.
3. Execute a repo-local restart durability smoke covering admin provisioning, seller/public storefront resolution, and post-restart persistence on the same DB path.
4. Record evidence in `.tasks/TASK-FT011-06/` and fill `verification.md`.
5. Sync Memory Bank: feature closure text, RTM lifecycle, testing notes, changelog, root index, and backlog status.

## Constraints
- Keep changes minimal and docs-first.
- Do not alter unrelated in-flight worktree changes.
- No new runtime behavior should be invented for closure; only verify and document the canonical checked-in path.
