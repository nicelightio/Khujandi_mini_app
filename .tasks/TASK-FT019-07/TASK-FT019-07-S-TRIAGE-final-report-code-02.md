---
description: TypeScript drift triage after TASK-FT019-07 verification.
status: active
---
# TASK-FT019-07 S-TRIAGE Final Report Code 02

## Result

Triage-only check completed. No source, test, or Memory Bank implementation docs were edited.

Micro-check: owning capability is `FT-019 Staff panel`; primary contour is `admin-web`; this task touched only verification/reporting. No `shared` extraction is justified.

`npx tsc --noEmit -p tsconfig.jest.json` is red with 122 diagnostics across 25 files. `git diff --check` passes. No TypeScript diagnostics were emitted for the TASK-FT019-07 frontend Staff files under `frontend/src/admin/**`.

## Blocking recommendation

Run a focused FT-019 repair before `TASK-FT019-08`.

Reason: the full-repo TypeScript drift includes FT-019-introduced backend Staff/runtime errors in command/read API dependencies that `TASK-FT019-08` will consume. Starting command workflow UI work on top of a red Staff backend baseline would hide whether new TASK-FT019-08 failures are frontend workflow issues or existing Staff API type drift.

Do not broaden this into a full-repo cleanup. Repair the Staff subset first; catalog, staging harness, and older frontend/test fixture drift can remain tracked separately unless the orchestrator requires full `tsc` green before continuing.

Likely minimal FT-019 repair scope:

- `backend/src/dev-runtime/admin-access-runtime.ts`
- `backend/src/dev-runtime/order-ops-runtime.ts` Staff-related provider methods only
- `backend/src/dev-runtime/routes/admin-staff.routes.ts`
- `backend/src/slices/delivery-assignment/application/delivery-assignment.service.ts` Staff target narrowing only
- `backend/src/slices/delivery-assignment/infrastructure/prisma-delivery-assignment.repository.ts` courier Staff record/select mapping only
- `tests/slices/admin-access/admin-access-operator-staff.spec.ts`
- `tests/slices/delivery-assignment/delivery-assignment-courier-staff.spec.ts`

## Error categories

### 1) FT-019-introduced, repair before TASK-FT019-08

Staff backend runtime provider shape drift:

- `backend/src/dev-runtime/admin-access-runtime.ts`: 6 diagnostics. The in-memory runtime implements `findMany` for `adminAccount`, `operatorStaffLifecycleEvent`, and `operatorStaffRatingAdjustment`, but the typed provider shape still only allows the older create/find/update subset.
- `backend/src/dev-runtime/order-ops-runtime.ts`: Staff-related diagnostics include missing typed `findMany` support for assignment `order`, status history, courier lifecycle events and rating adjustments, plus courier `create` returning the older `name/isActive/staffNickname` shape instead of the current courier Staff record shape.

Staff route detail typing:

- `backend/src/dev-runtime/routes/admin-staff.routes.ts:165`: `AppError` details receive raw `unknown` for invalid rating delta, but the error detail contract only accepts primitive values.

Courier Staff domain/repository record mismatch:

- `backend/src/slices/delivery-assignment/application/delivery-assignment.service.ts:844`: `DeliveryAssignmentCourierStaffIdentityRecord` is not narrowed to `DeliveryAssignmentCourierStaffRecord` after `role === "courier"`.
- `backend/src/slices/delivery-assignment/infrastructure/prisma-delivery-assignment.repository.ts:476`, `:662`, `:684`, `:706`, `:1533-1561`: repository/provider types mix the old courier availability record (`name`, `isActive`) with the new Staff identity record (`nickname`, `fallbackDisplayName`, `workActive`, `lifecycle`).
- `tests/slices/delivery-assignment/delivery-assignment-courier-staff.spec.ts:392`: mock courier create result still returns the old Staff fields.

Operator Staff test mock drift:

- `tests/slices/admin-access/admin-access-operator-staff.spec.ts`: 9 diagnostics. The mock no longer satisfies `AdminAccessOperatorStaffRepository`, mainly because the interface now requires deactivate/reactivate methods.

### 2) Pre-existing or unrelated dirty worktree drift, non-blocking for TASK-FT019-08

Catalog/public path contract drift:

- `backend/src/dev-runtime/catalog-runtime-repository.ts`
- `backend/src/dev-runtime/routes/catalog.routes.ts`
- `backend/src/slices/catalog/infrastructure/prisma/catalog-public.reader.ts`
- `backend/src/slices/catalog/infrastructure/prisma/catalog-seller.writer.ts`
- `tests/slices/catalog/catalog.provisioning.integration.spec.ts`
- `tests/slices/catalog/catalog.unit.spec.ts`

Examples: `ProvisionSellerShopInput` now requires `primaryPublicPath` and `secondaryPublicPath`; several mocks/records still omit public paths or treat `description`/dates as older optional shapes.

Staging/test harness detail typing:

- `backend/src/dev-runtime/routes/test-session.routes.ts`
- `backend/src/dev-runtime/staging-test-harness.ts`

Examples: arrays such as `string[]` / `PersonaKey[]` are passed into error/details fields typed as `string | number | boolean | null`.

Older frontend/test fixture drift:

- `frontend/src/tests/shared/ui/page-shell.spec.tsx`
- `frontend/src/tests/slices/catalog/catalog-page.storefront-events.spec.tsx`
- `frontend/src/tests/slices/catalog/catalog-route.storefront.spec.tsx`
- `frontend/src/tests/slices/checkout-payment/checkout-payment-route.spec.tsx`

Examples: old component/test prop shapes, removed `CatalogStorefrontData` export, and a Telegram bridge mock missing `getRuntimeCapabilities`.

Older checkout/delivery-assignment test fixture drift:

- `tests/slices/checkout-payment/checkout-payment.runtime.spec.ts`
- `tests/slices/delivery-assignment/delivery-assignment-claim.spec.ts`
- `tests/slices/delivery-assignment/delivery-assignment-timeout.spec.ts`
- `tests/slices/delivery-assignment/delivery-assignment.integration.spec.ts`
- `tests/slices/delivery-assignment/delivery-assignment.runtime.spec.ts`
- `tests/slices/delivery-assignment/delivery-assignment.unit.spec.ts`

Examples: `response.body` is still `unknown`, older assignment calls omit required `override`, older repository mocks omit `claimOffer`, and old error details pass arrays.

### 3) Unclear / orchestrator decision if requiring full tsc green

`backend/src/dev-runtime/order-ops-runtime.ts` has mixed Staff and non-Staff diagnostics. The Staff-related runtime provider errors should be repaired before `TASK-FT019-08`. Non-Staff diagnostics in the same file, such as order-cancellation/delivery-tracking runtime status/event record widening and payment status incompatibility, look like broader dev-runtime type looseness from earlier delivery/cancellation work.

If the orchestrator requires full `npx tsc --noEmit -p tsconfig.jest.json` to be green before `TASK-FT019-08`, those mixed non-Staff runtime adapter errors must also be repaired. If the gate is "clean Staff baseline for command workflow work", they are non-blocking but should stay visible as full-repo drift.

## Files inspected

- `.tasks/TASK-FT019-07/TASK-FT019-07-S-VERIFY-final-report-code-01.md`
- `.tasks/TASK-FT019-07/TASK-FT019-07-S-IMPL-final-report-code-01.md`
- `.tasks/TASK-FT019-06/TASK-FT019-06-S-VERIFY-final-report-code-01.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `doc/ARCHITECTURE.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/features/FT-019-staff-panel.md`
- `.memory-bank/contracts/staff-panel-contract.md`
- `.memory-bank/tasks/plans/IMPL-FT-019.md`
- `tsconfig.jest.json`
- `package.json`
- `backend/src/dev-runtime/admin-access-runtime.ts`
- `backend/src/dev-runtime/order-ops-runtime.ts`
- `backend/src/dev-runtime/routes/admin-staff.routes.ts`
- `backend/src/slices/admin-access/domain/admin-access.types.ts`
- `backend/src/slices/delivery-assignment/application/delivery-assignment.service.ts`
- `backend/src/slices/delivery-assignment/domain/delivery-assignment.types.ts`
- `backend/src/slices/delivery-assignment/infrastructure/prisma-delivery-assignment.repository.ts`
- `tests/slices/admin-access/admin-access-operator-staff.spec.ts`

## Files changed

- `.tasks/TASK-FT019-07/TASK-FT019-07-S-TRIAGE-final-report-code-02.md`

## Checks run

- `npx tsc --noEmit -p tsconfig.jest.json`: `FAIL` with 122 diagnostics across 25 files.
- `npx tsc --noEmit -p tsconfig.jest.json | grouped by file/code`: captured categorized summary.
- `npx tsc --noEmit -p tsconfig.jest.json | grep -E '^frontend/src/admin'`: no Staff frontend diagnostics.
- `git diff --check`: `PASS`.
- `git status --short`: dirty worktree confirmed; unrelated changes preserved.

## Blockers / risks

- Blocking for `TASK-FT019-08`: FT-019 Staff backend/runtime type drift listed in category 1.
- Non-blocking for `TASK-FT019-08`: catalog, staging harness, older frontend/test fixture drift listed in category 2.
- Risk: even after focused Staff repair, full-repo `tsc` may remain red due unrelated drift. The orchestrator should decide whether `TASK-FT019-08` requires full `tsc` green or a clean Staff-focused baseline plus existing focused frontend gates.
