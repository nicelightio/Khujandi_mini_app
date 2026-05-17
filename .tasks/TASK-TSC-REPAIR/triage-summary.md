---
task: TASK-TSC-REPAIR
stage: wave-0-triage
role: subagent-explorer
date: 2026-05-14
---

# TASK-TSC-REPAIR Triage Summary

## Baseline

Command:

```bash
npx tsc --noEmit -p tsconfig.jest.json
```

Result: failed with exit code `2`.

Full log: `.tasks/TASK-TSC-REPAIR/tsc-before.log`.

Diagnostic first-line count: `85`.

By TypeScript code:

| Code | Count |
|---|---:|
| TS2322 | 39 |
| TS2345 | 25 |
| TS18046 | 10 |
| TS2769 | 4 |
| TS2739 | 3 |
| TS2741 | 2 |
| TS2677 | 1 |
| TS2305 | 1 |

## Grouping By Ownership

### G1. Catalog runtime, infrastructure and test fixture drift

Count: `44`.

Owning slice: `catalog`.

Contours:
- `mini-app`: public catalog, storefront, start showcase.
- `seller-web`: seller-owned status/edit surfaces.
- `admin-web`: catalog provisioning surface.

Touched layers implicated by diagnostics:
- backend `application/domain` contract boundary: `ProvisionSellerShopInput`, `SellerCatalogShop`, public path types.
- backend `infrastructure`: Prisma catalog readers/writers.
- backend `dev-runtime` presentation/runtime routes and in-memory repository.
- frontend presentation tests for catalog route/storefront.
- backend tests.

Files:
- `backend/src/dev-runtime/catalog-runtime-repository.ts` - 4 diagnostics.
- `backend/src/dev-runtime/routes/catalog.routes.ts` - 2 diagnostics.
- `backend/src/slices/catalog/infrastructure/prisma/catalog-public.reader.ts` - 1 diagnostic.
- `backend/src/slices/catalog/infrastructure/prisma/catalog-seller.writer.ts` - 5 diagnostics.
- `frontend/src/tests/slices/catalog/catalog-page.storefront-events.spec.tsx` - 2 diagnostics.
- `frontend/src/tests/slices/catalog/catalog-route.storefront.spec.tsx` - 1 diagnostic.
- `tests/slices/catalog/catalog.provisioning.integration.spec.ts` - 11 diagnostics.
- `tests/slices/catalog/catalog.unit.spec.ts` - 18 diagnostics.

Observed themes:
- Public-path contract drift: tests and runtime route call `provisionShop`/`provisionSellerShop` without `primaryPublicPath` and `secondaryPublicPath`, while the current service/repository type requires those fields at one boundary.
- Seller shop fixtures omit `primaryPublicPath` and `secondaryPublicPath`.
- Repository test doubles miss newer `CatalogRepository` members `listSellerMenuPagesByShop` and `listSellerProductsByShop`.
- In-memory showcase favorite shop mapping returns nullable rows and then uses a predicate whose type is wider than the inferred `"WORKING"` literal shape.
- Runtime `createShop` assigns optional public path fields into required `SellerCatalogShop` fields.
- Prisma public reader returns product rows where `description` can be `undefined`, but the domain contract expects `string | null`.
- Prisma seller writer select/result types allow optional `createdAt`/`updatedAt`, while event builders/mappers require concrete dates.
- Frontend catalog tests lag behind storefront `access` shape and removed/renamed `CatalogStorefrontData` export.

Relevant specs:
- `.memory-bank/features/FT-001-catalog-browse-and-seller-management.md`
- `.memory-bank/features/FT-010-seller-storefront-editing-and-store-admin.md`
- `.memory-bank/features/FT-011-db-backed-catalog-runtime-baseline.md`
- `.memory-bank/features/FT-015-start-showcase-and-curation.md`
- `.memory-bank/contracts/catalog-public-api.md`
- `.memory-bank/contracts/catalog-seller-provisioning-and-visibility.md`
- `.memory-bank/contracts/seller-catalog-write-policy.md`
- `.memory-bank/contracts/catalog-start-showcase-contract.md`
- `.memory-bank/architecture/data-boundaries-and-persistence.md`
- `.memory-bank/architecture/system-contours-and-slices.md`
- `.memory-bank/testing/index.md`

Shared extraction: not justified. These are catalog-owned contract/fixture/runtime alignment issues; shared code would hide the ownership.

### G2. Delivery assignment, delivery tracking and cancellation runtime adapter drift

Count: `29`.

Owning slices:
- `delivery-assignment` for offer/claim and `CREATED|DELAYED -> ASSIGNED`.
- `delivery-tracking` for post-assignment lifecycle/history/events.
- `order-cancellation` for cancellation/refund.

Contours:
- `admin-web`: operator/admin delivery operations.
- `telegram-bot`: courier offer/claim and delivery status presentation channel.
- `mini-app`: customer status read-only consumer where runtime tests read events/orders.

Touched layers implicated by diagnostics:
- backend `application`: delivery-assignment service error details and override input contract.
- backend `infrastructure`: Prisma repository claim/timeout typed return.
- backend `dev-runtime`: operational Prisma-like adapters for assignment, cancellation and tracking.
- backend tests.

Files:
- `backend/src/dev-runtime/order-ops-runtime.ts` - 8 diagnostics.
- `backend/src/slices/delivery-assignment/application/delivery-assignment.service.ts` - 3 diagnostics.
- `backend/src/slices/delivery-assignment/infrastructure/prisma-delivery-assignment.repository.ts` - 2 diagnostics.
- `tests/slices/delivery-assignment/delivery-assignment-claim.spec.ts` - 1 diagnostic.
- `tests/slices/delivery-assignment/delivery-assignment-courier-staff.spec.ts` - 3 diagnostics.
- `tests/slices/delivery-assignment/delivery-assignment-timeout.spec.ts` - 1 diagnostic.
- `tests/slices/delivery-assignment/delivery-assignment.integration.spec.ts` - 1 diagnostic.
- `tests/slices/delivery-assignment/delivery-assignment.runtime.spec.ts` - 7 diagnostics.
- `tests/slices/delivery-assignment/delivery-assignment.unit.spec.ts` - 3 diagnostics.

Observed themes:
- `order-ops-runtime.ts` returns broad runtime records where slice-specific Prisma provider types expect narrowed lifecycle status/event/payload shapes.
- Cancellation adapter maps checkout-payment order status/payment status unions into order-cancellation contract without narrowing out unsupported payment statuses like `AMBIGUOUS`.
- Delivery tracking event adapter returns a generic `Record<string, unknown>` payload where the tracking contract expects required `orderId` and `updatedAt`.
- `AppError` details only allow primitive values; current delivery-assignment code/tests pass arrays and optional dates into details.
- `assertClaimableOrder` narrows `courierId` to `null`, but repository timeout paths return records still typed as `string | null`.
- Tests lag behind `DeliveryAssignmentRepository.claimOffer` and required `AssignDeliveryOrderOverrideInput.override`.
- Runtime tests read `RuntimeHttpResult.body` as `unknown` without a typed guard.

Relevant specs:
- `.memory-bank/features/FT-004-courier-assignment.md`
- `.memory-bank/features/FT-005-order-tracking-and-events-polling.md`
- `.memory-bank/features/FT-006-operational-cancellation-and-manual-refund.md`
- `.memory-bank/features/FT-016-operator-orders-monitoring-and-courier-offer-flow.md`
- `.memory-bank/contracts/api-events-baseline.md`
- `.memory-bank/contracts/operator-delivery-ops-contract.md`
- `.memory-bank/contracts/telegram-bot-contract.md`
- `.memory-bank/states/order-lifecycle.md`
- `.memory-bank/architecture/events-polling-and-bot-runtime.md`
- `.memory-bank/testing/index.md`

Shared extraction: not justified for lifecycle/business narrowing. A tiny local test helper for response-body guards may be acceptable if it stays test-only and avoids broad shared business abstractions.

### G3. Staging runtime/test harness error-details drift

Count: `5`.

Owning capability: runtime/testing enablement (`FT-018`), not a product capability.

Contours:
- `mini-app`, `seller-web`, `admin-web`, `telegram-bot` only as fixed-persona staging consumers.

Touched layers implicated by diagnostics:
- backend `presentation/application` test-only routes and harness orchestration.
- shared error primitive is touched only if the orchestrator decides the public error details contract should widen.

Files:
- `backend/src/dev-runtime/routes/test-session.routes.ts` - 3 diagnostics.
- `backend/src/dev-runtime/staging-test-harness.ts` - 2 diagnostics.

Observed themes:
- `AppError` details currently require `Record<string, string | number | boolean | null>`.
- Test-session and seed/reset validation details pass arrays (`rejectedFields`, `allowedPersonas`, `allowedScopes`, `allowedScenarios`).

Relevant specs:
- `.memory-bank/features/FT-018-staging-runtime-and-test-auth-harness.md`
- `.memory-bank/contracts/staging-test-auth-harness-contract.md`
- `.memory-bank/runbooks/staging-runtime-and-ui-qa.md`
- `.memory-bank/testing/staging-ui-qa.md`
- `.memory-bank/contracts/telegram-mini-app-auth-contract.md`
- `.memory-bank/contracts/payment-confirmation-contract.md`
- `.memory-bank/testing/index.md`

Shared extraction / contract decision:
- There is a small public-contract question: either keep `ErrorDetails` primitive-only and serialize arrays to strings/counts locally, or widen `ErrorDetails` to JSON-like values across the project. As subagent, I recommend the conservative local serialization path unless the orchestrator explicitly approves a project-wide error contract change.

### G4. Mini App shell / checkout frontend and runtime test fixture drift

Count: `7`.

Owning slices/capabilities:
- `FT-009` shell/runtime for `AppShell`, `PageShell`, `TelegramWebAppBridge`.
- `checkout-payment` for checkout route/runtime tests.

Contour:
- `mini-app`.

Touched layers implicated by diagnostics:
- frontend presentation tests.
- backend checkout-payment runtime tests.

Files:
- `frontend/src/tests/shared/ui/page-shell.spec.tsx` - 4 diagnostics.
- `frontend/src/tests/slices/checkout-payment/checkout-payment-route.spec.tsx` - 1 diagnostic.
- `tests/slices/checkout-payment/checkout-payment.runtime.spec.ts` - 2 diagnostics.

Observed themes:
- React `createElement` overloads require `children` at props type level for `AppShellProps` and `PageShellProps`, even though children are provided as the third argument.
- Checkout test bridge fixture lacks the newer `getRuntimeCapabilities` method.
- Checkout runtime test reads `RuntimeHttpResult.body` as `unknown` without a typed guard.

Relevant specs:
- `.memory-bank/features/FT-009-mini-app-shell-and-webview-ux.md`
- `.memory-bank/contracts/mini-app-runtime-contract.md`
- `.memory-bank/features/FT-002-checkout-payment-and-order-creation.md`
- `.memory-bank/features/FT-013-customer-checkout-handoff-and-paid-order-creation-flow.md`
- `.memory-bank/features/FT-017-guarded-e2e-mock-payment-mode.md`
- `.memory-bank/contracts/payment-confirmation-contract.md`
- `.memory-bank/testing/index.md`

Shared extraction: only test-only helper consolidation may be useful; no product shared extraction is justified.

## Files Inspected

Specs and architecture:
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `doc/ARCHITECTURE.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/glossary.md`
- `.memory-bank/invariants.md`
- `.memory-bank/architecture/index.md`
- `.memory-bank/architecture/system-contours-and-slices.md`
- `.memory-bank/architecture/frontend-presentation-and-webview.md`
- `.memory-bank/architecture/data-boundaries-and-persistence.md`
- `.memory-bank/epics/EP-001-customer-ordering-experience.md`
- `.memory-bank/epics/EP-002-delivery-operations.md`
- `.memory-bank/epics/EP-003-admin-access-and-security.md`
- `.memory-bank/features/FT-001-catalog-browse-and-seller-management.md`
- `.memory-bank/features/FT-002-checkout-payment-and-order-creation.md`
- `.memory-bank/features/FT-004-courier-assignment.md`
- `.memory-bank/features/FT-005-order-tracking-and-events-polling.md`
- `.memory-bank/features/FT-006-operational-cancellation-and-manual-refund.md`
- `.memory-bank/features/FT-009-mini-app-shell-and-webview-ux.md`
- `.memory-bank/features/FT-010-seller-storefront-editing-and-store-admin.md`
- `.memory-bank/features/FT-011-db-backed-catalog-runtime-baseline.md`
- `.memory-bank/features/FT-013-customer-checkout-handoff-and-paid-order-creation-flow.md`
- `.memory-bank/features/FT-015-start-showcase-and-curation.md`
- `.memory-bank/features/FT-016-operator-orders-monitoring-and-courier-offer-flow.md`
- `.memory-bank/features/FT-017-guarded-e2e-mock-payment-mode.md`
- `.memory-bank/features/FT-018-staging-runtime-and-test-auth-harness.md`
- `.memory-bank/features/FT-019-staff-panel.md`
- `.memory-bank/contracts/index.md`
- `.memory-bank/contracts/catalog-public-api.md`
- `.memory-bank/contracts/catalog-seller-provisioning-and-visibility.md`
- `.memory-bank/contracts/seller-catalog-write-policy.md`
- `.memory-bank/contracts/catalog-start-showcase-contract.md`
- `.memory-bank/contracts/api-events-baseline.md`
- `.memory-bank/contracts/operator-delivery-ops-contract.md`
- `.memory-bank/contracts/staging-test-auth-harness-contract.md`
- `.memory-bank/contracts/mini-app-runtime-contract.md`
- `.memory-bank/contracts/payment-confirmation-contract.md`
- `.memory-bank/contracts/telegram-mini-app-auth-contract.md`
- `.memory-bank/states/index.md`
- `.memory-bank/states/order-lifecycle.md`
- `.memory-bank/testing/index.md`
- `.memory-bank/testing/staging-ui-qa.md`
- `.memory-bank/runbooks/staging-runtime-and-ui-qa.md`

Code/test files inspected around diagnostic lines:
- `backend/src/dev-runtime/catalog-runtime-repository.ts`
- `backend/src/dev-runtime/routes/catalog.routes.ts`
- `backend/src/slices/catalog/domain/catalog.types.ts`
- `backend/src/slices/catalog/application/catalog.service.ts`
- `backend/src/slices/catalog/infrastructure/prisma/catalog-public.reader.ts`
- `backend/src/slices/catalog/infrastructure/prisma/catalog-seller.writer.ts`
- `backend/src/dev-runtime/order-ops-runtime.ts`
- `backend/src/slices/delivery-assignment/application/delivery-assignment.service.ts`
- `backend/src/slices/delivery-assignment/infrastructure/prisma-delivery-assignment.repository.ts`
- `backend/src/dev-runtime/routes/test-session.routes.ts`
- `backend/src/dev-runtime/staging-test-harness.ts`
- `backend/src/shared/errors/app-error.ts`
- `frontend/src/app/app-shell.tsx`
- `frontend/src/shared/ui/page-shell.tsx`
- `frontend/src/tests/shared/ui/page-shell.spec.tsx`
- `frontend/src/tests/slices/catalog/catalog-page.storefront-events.spec.tsx`
- `frontend/src/tests/slices/checkout-payment/checkout-payment-route.spec.tsx`
- `tests/slices/catalog/catalog.unit.spec.ts`
- `tests/slices/catalog/catalog.provisioning.integration.spec.ts`

## Risks / Blockers

- The `ErrorDetails` array/object issue may look trivial, but widening it is a public error-contract decision. Keep it local unless orchestrator approves contract change.
- The catalog public-path drift spans service input types, repository input types, runtime routes, and many tests. Repair should avoid weakening the normative immutable public path requirement.
- The `order-ops-runtime.ts` diagnostics are mixed-slice. Repair should narrow adapter shapes per consuming slice rather than introduce a broad shared order/event type that flattens lifecycle ownership.
- Several diagnostics are test fixture drift. Fixing tests by casting to `any` would hide real contract changes and should be avoided.
