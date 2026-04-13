# TASK-FT011-02 Plan

## Basis
- Use the backlog verify target and `FT-011` acceptance that mounted runtime bootstrap must stop fabricating storefront availability from process-local demo state.
- Keep any remaining in-memory fixtures bounded to explicit tests/tooling only; they must not define default runtime startup data.

## Steps
1. Inspect the current `dev-runtime` bootstrap, Prisma rollout artifacts, and test helpers to locate where hidden catalog seed state is still introduced.
2. Replace the default startup path with a minimal DB-backed seed/bootstrap baseline that is idempotent and does not depend on process memory.
3. Update targeted catalog runtime/integration tests to prove startup and restart reuse persisted catalog state instead of reseeding hidden in-memory fixtures.
4. Run focused verification and sync protocol plus Memory Bank artifacts.
