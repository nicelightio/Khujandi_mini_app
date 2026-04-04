# TASK-FT006-02 Plan

1. Scaffold `backend/src/slices/order-cancellation/{domain,application,infrastructure,presentation}` following the existing backend slice module pattern.
2. Extend Prisma persistence with slice-owned cancellation metadata and audit baseline for cancellation/refund actions.
3. Add focused unit/integration specs under `tests/slices/order-cancellation/` that verify slice wiring, explicit refund persistence, and audit/event write scaffolding.
4. Wire repo-local Jest scripts/config for the new slice and keep status naming aligned with the `FT-006` normative docs.
5. Sync `.protocols`, backlog/Memory Bank status updates, and write the final implementation report.
