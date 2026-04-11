---
description: Adversarial semantic verification for TASK-FT010-13.
---
# TASK-FT010-13 Red Verification

## Semantic verdict
- `semantic-concern`

## Top substance risks
- The event-backed observability fix is implemented in the Prisma repository only, not at the `CatalogRepository` contract boundary.
- The checked-in `dev-runtime` `InMemoryCatalogRepository` still performs seller shop/menu/product writes silently, so the same slice contract now has divergent observability semantics depending on adapter choice.

## Hidden assumptions
- The current fix assumes all meaningful seller write execution will always go through the Prisma-backed repository.
- It also assumes future maintainers will remember that seller write observability is an adapter responsibility even though the domain contract does not encode that requirement.

## Cross-boundary impact
- This creates drift risk between repo-local runtime/test surfaces and the persisted backend path.
- Future seller runtime mounting can appear verified by contract while still missing the intended observability artifacts outside the Prisma adapter.

## Architectural concerns
- The chosen policy is documented as slice-owned, but the code currently enforces it only in one infrastructure implementation.
- That weakens the claimed owner-boundary guarantee and leaves observability as an implementation detail instead of a stable slice contract property.

## State/data consistency concerns
- No direct data corruption was found.
- The concern is consistency of emitted operational artifacts: two implementations of the same write boundary can mutate identical catalog state while producing different observability trails.

## Operational concerns
- Troubleshooting in repo-local runtime or alternate adapters may falsely suggest that seller writes are still silent.
- Tests currently prove the Prisma path, but they do not guard against future mounted-runtime drift on non-Prisma adapters.

## Future maintenance cost
- Every new `CatalogRepository` implementation now has to rediscover and manually reproduce the event policy.
- Without a contract-level or shared helper enforcement point, the chance of regressions is high and the policy will be expensive to keep aligned.

## How this could still be wrong
- If the project intentionally treats repo-local in-memory runtime as a non-normative throwaway harness, then this concern is less severe.
- If seller write routes never execute against non-Prisma adapters, the drift remains latent rather than user-visible.

## Counterproposal
- Open a follow-up to lift seller write observability from Prisma-only behavior to an explicit slice boundary guarantee.
- Minimal options: either extend the `CatalogRepository`/application contract to return write artifacts including events, or align `InMemoryCatalogRepository` with the same event semantics and add runtime regressions proving parity.
