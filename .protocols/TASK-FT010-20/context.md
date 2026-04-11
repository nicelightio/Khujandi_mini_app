# TASK-FT010-20 Context

## Task
- `TASK-FT010-20`
- Goal: isolate narrow `seller-web` status toggles from stale shared-storefront metadata writes.

## Loaded docs
- `.memory-bank/commands/execute.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/features/FT-010-seller-storefront-editing-and-store-admin.md`
- `.memory-bank/tasks/backlog.md`
- `.memory-bank/tasks/plans/IMPL-FT-010.md`
- `.memory-bank/contracts/seller-catalog-write-policy.md`
- `.memory-bank/contracts/catalog-seller-provisioning-and-visibility.md`
- `.memory-bank/testing/index.md`

## Richer inputs found
- backlog card with explicit touched files, tests, verify target, constraints
- feature doc note from `red-verify` describing stale metadata overwrite risk

## Fallback used
- no separate task-local richer artifact existed in `.tasks/` or `.protocols/`, so execution used feature + backlog + contract/testing docs as the normative basis.

## Implementation context
- Current seller status API submitted a full cached shop snapshot from `frontend/src/seller/**/*`.
- Mounted `dev-runtime` seller `PUT /api/v1/seller/shops/:shopId` coerced absent metadata fields to `null`, which made a narrow status toggle capable of rolling back newer shared-storefront metadata.
- Shared storefront seller edits already use the same backend update path, so the fix must preserve broad storefront editing while making seller-web status toggles status-only.
