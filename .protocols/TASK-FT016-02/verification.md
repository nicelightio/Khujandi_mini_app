---
description: Verification verdict for TASK-FT016-02 courier availability and assignment offer persistence compatibility.
status: active
---
# TASK-FT016-02 Verification

## Verdict

PASS

## Scope Verified

- Owning capability slice: `delivery-assignment`.
- Contour: `backend`.
- Touched layers: `domain`, `infrastructure/persistence`, focused tests.
- Shared extraction: not justified and not introduced.

## Acceptance Evidence

- Additive schema/persistence compatibility only:
  - `backend/prisma/schema.prisma` adds `AssignmentOfferKind`, `AssignmentOfferStatus`, `AssignmentOffer`, and courier availability compatibility fields on `User`.
  - `backend/prisma/migrations/20260509173000_add_ft016_assignment_offer_compatibility/migration.sql` contains only enum creation, `ALTER TABLE ... ADD COLUMN`, `CREATE TABLE`, indexes, and foreign keys. No `UPDATE`, backfill, mass rewrite, delete, or destructive row operation is present.
- Courier availability fields:
  - Existing `User.isActive` remains the compatibility active flag.
  - New fields are `acceptingOrdersUntil DateTime?`, `autoOfferEnabled Boolean @default(false)`, and `ratingScore Int @default(0)`.
  - Defaults do not enable auto-offer or set stop-after state.
- `AssignmentOffer` persistence:
  - Fields present: `orderId`, optional `targetCourierId`, `kind`, `status`, `createdAt`, `updatedAt`.
  - Relations present to `Order` and optional target `User`.
  - Indexes present for order lookup and active/pending-style scans: `[orderId, status, createdAt]`, `[targetCourierId, status, createdAt]`, `[status, createdAt]`.
- Existing direct assignment v1 path remains operational:
  - `DeliveryAssignmentService.assignCourier` still uses the existing direct assignment command path.
  - `PrismaDeliveryAssignmentRepository.assignCourier` still writes `Order`, `OrderStatusHistory`, `DeliveryAssignmentAudit`, and `Event(type=order.assigned)`.
  - Focused delivery-assignment tests passed.
- No new behavior enabled:
  - No offer creation command, claim command, timeout evaluator, auto-offer broadcast, bot menu, operator panel, or status transition behavior was added.
  - The new repository method `findOffersForOrder` is read-only and optional for compatibility.

## Checks

- `DATABASE_URL=postgresql://user:pass@localhost:5432/khujandi npx prisma validate`: PASS.
- `npm run test:delivery-assignment`: PASS, 3 suites / 15 tests.
- `npx prisma migrate diff --from-empty --to-schema-datamodel backend/prisma/schema.prisma --script`: PASS; generated SQL includes the new enums, `AssignmentOffer` table, `User` courier fields, indexes, and foreign keys.
- `git diff --check`: PASS.
- Changed markdown link validation: PASS, 12 relative links checked across 19 changed markdown files.

## Migration Diff Nuance

`npx prisma migrate diff --from-empty --to-migrations backend/prisma/migrations --script` exits with:

```text
Error: You must pass the --shadow-database-url if you want to diff a migrations directory.
```

This is not a blocker for `TASK-FT016-02`: the required schema datamodel dry-run passes, the migration SQL is coherent and additive on inspection, and no shadow database URL was provided for migrations-directory replay.

## Residual Risk

- The existing `User.isActive` field is reused as the compatibility active flag. It predates this task and currently also participates in active-account semantics; the later `TASK-FT016-07` availability boundary should decide whether to keep that mapping or introduce a narrower courier-work-state field before enabling bot menu behavior.
