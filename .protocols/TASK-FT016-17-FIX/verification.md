---
description: Verification report for TASK-FT016-17-FIX delivery-tracking runtime setup repair.
status: active
---
# TASK-FT016-17-FIX Verification

## Verdict

PASS

## Scope Verified

- Owning slice: `delivery-tracking` runtime verification.
- Adjacent boundary: `delivery-assignment` v2 offer + courier claim setup.
- Owning contour: backend runtime test contour.
- Touched layers: focused test/runtime setup and operational task docs.
- Shared extraction: not added and not justified.

## Acceptance Evidence

- `tests/slices/delivery-tracking/delivery-tracking.runtime.spec.ts` no longer uses normal legacy `POST /api/v1/admin/orders/:id/assignment` expecting `200` as setup.
- Newly assigned runtime orders in the delivery-tracking spec now use v2 manual `assignment-offers` plus `claimOffer`, preserving the intended `CREATED -> ASSIGNED` semantics through successful courier claim.
- Customer event filtering coverage now expects the v2 event stream for the visible order: `order.offer_created` followed by `order.assigned`; unrelated order events remain filtered out and the global opaque cursor still advances.
- `/assignment-override` was not added to delivery-tracking runtime setup. Existing override coverage remains in explicit delivery-assignment tests and includes `confirmDirectAssignmentOverride: true`.
- Normal legacy `POST /api/v1/admin/orders/:id/assignment` remains disabled with `410 LEGACY_ASSIGNMENT_DISABLED`; no production behavior was changed to re-enable it.
- No offer/claim/timeout/auto-offer/status/cancellation/refund semantic change, broad cleanup, or shared abstraction extraction was found in the scoped repair.
- Historical `TASK-FT016-17` failure evidence is retained in `.protocols/TASK-FT016-17/verification.md`; this fix repairs only the stale delivery-tracking runtime setup that caused that failure.

## Commands

- `npm run test:delivery-tracking -- --runInBand` - PASS; 3 suites / 29 tests passed.
- `npm run test:delivery-assignment -- --runInBand` - PASS; 5 suites / 54 tests passed.
- `git diff --check` - PASS.
- Changed markdown local link validation - PASS; the only added/changed local markdown link target found in the current diff exists.

## Risks / Notes

- The workspace contains many pre-existing uncommitted changes from the broader FT-016 run; this verification did not revert or rewrite them.
- The repair depends on the existing delivery-assignment controller test boundary for `claimOffer`, matching the current runtime test pattern.
