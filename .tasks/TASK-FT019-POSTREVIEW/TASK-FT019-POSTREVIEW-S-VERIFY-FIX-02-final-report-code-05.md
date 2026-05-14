---
description: Verification report for TASK-FT019-POSTREVIEW-FIX-02 courier Staff operational deactivation repair.
status: active
---
# TASK-FT019-POSTREVIEW VERIFY FIX-02 Final Report Code 05

## Role

`SUBAGENT tester`

## Verdict

`PASS`

The focused repair closes post-review P1 finding #2 for repo-local scope: Staff-deactivated couriers are operationally inactive across delivery-assignment availability, offer, claim and override paths.

## Boundary

- Owning capability slice: `delivery-assignment`.
- Consuming contours: `admin-web` Staff panel and `telegram-bot` courier workflow.
- Touched layers verified: `application`, `domain types`, `infrastructure`, focused delivery-assignment tests.
- Shared extraction: not justified and not introduced by this repair.

## Evidence

- Operational courier reads now carry Staff lifecycle state: `DeliveryAssignmentCourierRecord.staffDeactivatedAt` exists in `backend/src/slices/delivery-assignment/domain/delivery-assignment.types.ts:62`, and Prisma courier selects include it in `backend/src/slices/delivery-assignment/infrastructure/prisma-delivery-assignment.repository.ts:482`.
- Courier availability read model treats Staff-deactivated couriers as inactive and non-auto-offer: `getCourierAvailability` returns through `toAvailability` in `backend/src/slices/delivery-assignment/application/delivery-assignment.service.ts:312`, while `toAvailability` gates `active` and `autoOfferEnabled` on `staffActive` in `backend/src/slices/delivery-assignment/application/delivery-assignment.service.ts:877`.
- Availability commands fail before writes for Staff-deactivated couriers: `startCourierWork`, `stopCourierWorkAfter`, and `setCourierAutoOfferParticipation` call `assertCourierStaffOperational` before persistence in `backend/src/slices/delivery-assignment/application/delivery-assignment.service.ts:243`, `backend/src/slices/delivery-assignment/application/delivery-assignment.service.ts:261`, and `backend/src/slices/delivery-assignment/application/delivery-assignment.service.ts:289`; the guard throws `COURIER_STAFF_INACTIVE` in `backend/src/slices/delivery-assignment/application/delivery-assignment.service.ts:821`.
- Manual offers and claims fail closed through the same availability read model: manual offer checks `availability.active/free` before persistence in `backend/src/slices/delivery-assignment/application/delivery-assignment.service.ts:502`; claim checks the same before `repository.claimOffer` in `backend/src/slices/delivery-assignment/application/delivery-assignment.service.ts:427`.
- Broadcast auto-offer eligibility filters candidates through `toAvailability` and only persists eligible courier ids in `backend/src/slices/delivery-assignment/application/delivery-assignment.service.ts:579` and `backend/src/slices/delivery-assignment/application/delivery-assignment.service.ts:600`.
- Direct assignment override rejects Staff-deactivated couriers before assignment persistence in `backend/src/slices/delivery-assignment/application/delivery-assignment.service.ts:347`.
- Boss reactivation clears only Staff deactivation metadata and does not silently reset `isActive`, `acceptingOrdersUntil` or `autoOfferEnabled`: `backend/src/slices/delivery-assignment/infrastructure/prisma-delivery-assignment.repository.ts:637`.
- Soft-delete semantics are preserved: deactivate/reactivate write Staff lifecycle fields only in `backend/src/slices/delivery-assignment/infrastructure/prisma-delivery-assignment.repository.ts:616` and `backend/src/slices/delivery-assignment/infrastructure/prisma-delivery-assignment.repository.ts:637`; hard-delete grep returned no delivery-assignment hits.
- No `OrderStatus.FAILED` reference was found in delivery-assignment code/tests or Prisma schema. Broad `FAILED` hits remain payment/auth or Staff defensive problem-bucket strings, not an order lifecycle enum addition.

## Regression Coverage

- Staff-deactivated active courier availability becomes `active=false` and `autoOfferEnabled=false`, and start/stop-after/toggle do not call write methods: `tests/slices/delivery-assignment/delivery-assignment-courier-staff.spec.ts:381`.
- Broadcast offers exclude a Staff-deactivated courier and preserve eligibility for a reactivated active/auto-offer courier: `tests/slices/delivery-assignment/delivery-assignment-courier-staff.spec.ts:433`.
- Courier Staff deactivate/reactivate remains metadata-only, with no rating reset and no hard delete: `tests/slices/delivery-assignment/delivery-assignment-courier-staff.spec.ts:644`.
- Staff-deactivated courier claim is rejected before order update/event side effects: `tests/slices/delivery-assignment/delivery-assignment-claim.spec.ts:448`.
- Direct assignment override rejects a Staff-deactivated courier before assignment persistence: `tests/slices/delivery-assignment/delivery-assignment.unit.spec.ts:1041`.
- Prisma integration still selects `staffDeactivatedAt` for courier reads used by assignment paths: `tests/slices/delivery-assignment/delivery-assignment.integration.spec.ts:134`.

## Files Inspected

- `.tasks/TASK-FT019-POSTREVIEW/TASK-FT019-POSTREVIEW-S-01-final-report-code-01.md`
- `.tasks/TASK-FT019-POSTREVIEW/TASK-FT019-POSTREVIEW-S-FIX-02-final-report-code-04.md`
- `backend/src/slices/delivery-assignment/application/delivery-assignment.service.ts`
- `backend/src/slices/delivery-assignment/domain/delivery-assignment.types.ts`
- `backend/src/slices/delivery-assignment/infrastructure/prisma-delivery-assignment.repository.ts`
- `tests/slices/delivery-assignment/delivery-assignment-courier-staff.spec.ts`
- `tests/slices/delivery-assignment/delivery-assignment-claim.spec.ts`
- `tests/slices/delivery-assignment/delivery-assignment.unit.spec.ts`
- `tests/slices/delivery-assignment/delivery-assignment.integration.spec.ts`
- `backend/prisma/schema.prisma`
- Relevant Memory Bank specs/contracts/states for `FT-019`, `FT-016`, Staff panel, operator delivery ops and order lifecycle.

## Files Changed

- `.tasks/TASK-FT019-POSTREVIEW/TASK-FT019-POSTREVIEW-S-VERIFY-FIX-02-final-report-code-05.md`

No source code or tests were edited.

## Checks Run

- `npm run test:delivery-assignment -- --runInBand`: `PASS`, 8 suites / 69 tests.
- `npx eslint backend/src/slices/delivery-assignment/application/delivery-assignment.service.ts backend/src/slices/delivery-assignment/infrastructure/prisma-delivery-assignment.repository.ts backend/src/slices/delivery-assignment/domain/delivery-assignment.types.ts tests/slices/delivery-assignment/delivery-assignment-courier-staff.spec.ts tests/slices/delivery-assignment/delivery-assignment-claim.spec.ts tests/slices/delivery-assignment/delivery-assignment.unit.spec.ts tests/slices/delivery-assignment/delivery-assignment.integration.spec.ts`: `PASS`.
- `grep -RIn "OrderStatus\\.FAILED" backend/src/slices/delivery-assignment tests/slices/delivery-assignment backend/prisma/schema.prisma | head -80`: `PASS`, no output.
- `grep -RIn "deleteMany\\|user\\.delete\\|\\.delete({" backend/src/slices/delivery-assignment tests/slices/delivery-assignment | head -120`: `PASS`, no output.
- `git diff --check`: `PASS`.

## Blockers / Risks

- No blocker for this focused repair.
- Worktree was already heavily dirty before verification; unrelated dirty files were preserved.
- `REQ-038` RTM/status drift and post-review P1 finding #1 remain outside this verification scope.

## Recommendation

Accept `TASK-FT019-POSTREVIEW-FIX-02` as verified. Keep operator auth repair and final `REQ-038` status reconciliation in their separate post-review closure tasks.
