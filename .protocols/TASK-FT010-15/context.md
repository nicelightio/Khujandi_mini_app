# TASK-FT010-15 Context

## Task
- TASK-ID: `TASK-FT010-15`
- Title: `Resolve seller event-sink parity for non-persistent catalog adapters`

## Loaded docs
- `.memory-bank/commands/execute.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/tasks/backlog.md` (task card for `TASK-FT010-15`)
- `.memory-bank/features/FT-010-seller-storefront-editing-and-store-admin.md`
- `.memory-bank/contracts/seller-catalog-write-policy.md`
- `.memory-bank/testing/index.md`
- `.tasks/TASK-FT010-14/TASK-FT010-14-S-RED-VERIFY-final-report-docs-01.md`

## Richer inputs found
- Task card fields: `Touched files`, `Tests`, `Verify`, `Docs`, `Depends on`, `REQs`.
- Feature doc includes explicit follow-up rationale from `TASK-FT010-14` red-verify.
- Contract doc already freezes the normative persisted-event policy and the explicit repository-boundary observability requirement.

## Fallback used
- No extra task-local implementation plan for `TASK-FT010-15` was present, so execution falls back to the task card plus `FT-010`, `requirements`, contract, and testing docs.

## Constraints and invariants
- Keep observability ownership inside `catalog`.
- Close sink-level adapter drift with minimal code changes.
- Do not introduce a separate audit/reporting scope.
- Preserve the explicit write-result contract from `TASK-FT010-14`.
