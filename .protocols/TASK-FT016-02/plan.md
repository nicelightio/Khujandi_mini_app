---
description: Implementation plan for TASK-FT016-02.
status: active
---
# TASK-FT016-02 Plan

## Plan

1. Inspect current Prisma schema, delivery-assignment domain/repository, and focused tests.
2. Add additive Prisma fields/model and SQL migration only.
3. Update delivery-assignment types/repository compatibility so courier availability and assignment offers are representable without enabling runtime behavior.
4. Add focused tests if needed for representability/direct assignment compatibility.
5. Run required checks and write implementation report.

## Constraints

- No backfill, rewrite, mass update, or destructive migration.
- New courier availability defaults must not imply every courier is active/available/auto-offer enabled.
- `AssignmentOffer` must be optional to current direct assignment runtime paths.
- Do not mark backlog `done`; verifier owns completion.
