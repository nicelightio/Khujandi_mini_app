---
task: TASK-TSC-REPAIR
stage: wave-0-plan
role: subagent-explorer
date: 2026-05-14
---

# TASK-TSC-REPAIR Plan

## Objective

Return the repository Jest TypeScript check to green:

```bash
npx tsc --noEmit -p tsconfig.jest.json
```

Baseline output is saved in `.tasks/TASK-TSC-REPAIR/tsc-before.log`.

Current baseline: `85` diagnostics, exit code `2`.

## Architectural Micro-Check

The repair is not one product feature. It is a type-safety repair across existing feature boundaries.

Owning slices/capabilities by wave:
- `catalog`: public paths, storefront/showcase, provisioning, seller write/read fixtures.
- `delivery-assignment`, `delivery-tracking`, `order-cancellation`: lifecycle/runtime adapter typing and tests.
- `checkout-payment` and `FT-009` Mini App shell: frontend/runtime test fixtures.
- `FT-018` runtime/testing enablement: staging fixed-persona harness.

Contours:
- `mini-app`: public catalog, checkout, shell, customer status.
- `seller-web`: seller catalog status/edit support.
- `admin-web`: catalog provisioning and delivery ops.
- `telegram-bot`: delivery-assignment/tracking presentation channel only where tests touch courier flow.

Touched layers should stay narrow per wave:
- Wave 1: `catalog` application/domain contract boundary, infra/dev-runtime adapters, tests.
- Wave 2: operational backend dev-runtime adapters plus delivery-assignment app/infra tests.
- Wave 3: test-only frontend/backend fixture alignment for shell/checkout and staging harness.
- Wave 4: final repo-wide typecheck and focused regression gates.

Shared extraction:
- No product shared extraction is justified.
- Do not create broad shared business abstractions.
- Test-only helpers are acceptable only if they reduce repeated `unknown` body guards without changing product contracts.
- Do not widen shared `ErrorDetails` unless orchestrator approves that public-contract change.

## Proposed Waves

### Wave 1. Catalog contract and fixture repair

Scope:
- `backend/src/slices/catalog/**`
- `backend/src/dev-runtime/catalog-runtime-repository.ts`
- `backend/src/dev-runtime/routes/catalog.routes.ts`
- `tests/slices/catalog/**`
- `frontend/src/tests/slices/catalog/**`

Primary groups addressed:
- G1, `44` diagnostics.

Recommended order:
1. Split the catalog provisioning command/input shape if needed so caller-level input can omit public paths and service-level/repository-level input still persists required immutable public paths.
2. Keep the normative `primaryPublicPath`/`secondaryPublicPath` persistence requirement from `FT-011`; do not make stored shop public paths optional.
3. Update catalog test fixtures to include public paths where they represent persisted shops.
4. Add missing repository test-double methods (`listSellerMenuPagesByShop`, `listSellerProductsByShop`) with narrow empty defaults.
5. Repair in-memory showcase favorite filtering with an explicit non-null intermediate type or helper.
6. Normalize Prisma catalog reader/writer result mapping so nullable fields become `null`, and required event-builder date fields are selected or mapped as concrete dates.
7. Align frontend catalog tests with current storefront access shape and current route exports.

Checks:
- `npx tsc --noEmit -p tsconfig.jest.json` after wave, or at least filtered first to verify catalog diagnostics are gone.
- `npm run test:catalog -- --runInBand` if available and not prohibitively slow.
- `git diff --check`.

Dependencies:
- None.

Risks:
- Public path generation is product-relevant. If code suggests changing route/API contract instead of fixtures/service split, escalate to orchestrator before implementation.

### Wave 2. Operational lifecycle/runtime adapter repair

Scope:
- `backend/src/dev-runtime/order-ops-runtime.ts`
- `backend/src/slices/delivery-assignment/**`
- `tests/slices/delivery-assignment/**`
- Only touch `order-cancellation` / `delivery-tracking` slice files if diagnostics after runtime adapter repair require it.

Primary groups addressed:
- G2, `29` diagnostics.

Recommended order:
1. Narrow `order-ops-runtime.ts` adapter return shapes at the boundary where each slice-specific Prisma provider is implemented. Prefer typed mapper functions per consumer slice over shared broad unions.
2. For cancellation, map only statuses/payment statuses valid for `OrderCancellationOrderRecord`; do not silently allow checkout-only ambiguous states into cancellation domain.
3. For tracking events, return payloads satisfying the tracking persisted event contract, especially `orderId` and `updatedAt`.
4. For delivery-assignment `AppError` details, serialize arrays/dates into primitive details locally, or wait for orchestrator approval if a project-wide `ErrorDetails` JSON widening is desired.
5. Repair repository timeout/claim narrowing so returned `order.courierId` is typed `null` only after the same runtime condition is enforced.
6. Update tests to satisfy `claimOffer`, `AssignDeliveryOrderOverrideInput.override`, and typed HTTP response body guards.

Checks:
- `npx tsc --noEmit -p tsconfig.jest.json`.
- `npm run test:delivery-assignment -- --runInBand` if available.
- `npm run test:delivery-tracking -- --runInBand` if available after touching tracking adapter.
- `npm run test:order-cancellation -- --runInBand` if available after touching cancellation adapter.
- `git diff --check`.

Dependencies:
- Wave 1 can run before this for easier baseline reduction.
- This wave should not be parallel with Wave 3 if both touch shared `AppError`.

Risks:
- `order-ops-runtime.ts` is intentionally mixed-runtime glue; changes can accidentally alter delivery behavior. Keep this wave type-preserving and test-backed.
- Do not reintroduce legacy direct assignment semantics while fixing type drift.

### Wave 3. Runtime/testing and frontend fixture repair

Scope:
- `backend/src/dev-runtime/routes/test-session.routes.ts`
- `backend/src/dev-runtime/staging-test-harness.ts`
- `frontend/src/tests/shared/ui/page-shell.spec.tsx`
- `frontend/src/tests/slices/checkout-payment/checkout-payment-route.spec.tsx`
- `tests/slices/checkout-payment/checkout-payment.runtime.spec.ts`
- Optional test helper files only if already local to tests.

Primary groups addressed:
- G3, `5` diagnostics.
- G4, `7` diagnostics.

Recommended order:
1. Keep staging harness production guards unchanged.
2. Convert array-valued validation details to primitive details locally, for example comma-joined allowlists or counts, unless orchestrator chooses to widen `ErrorDetails`.
3. Repair `createElement` test calls by satisfying `children` at props type level or by using JSX in the spec if the local pattern allows it.
4. Add `getRuntimeCapabilities` to the checkout test bridge fixture.
5. Add minimal typed guards for runtime response bodies in checkout tests.

Checks:
- `npx tsc --noEmit -p tsconfig.jest.json`.
- Focused frontend Jest specs for page shell/catalog/checkout if scripts exist.
- `npm run test:checkout-payment -- --runInBand` if available.
- `git diff --check`.

Dependencies:
- If Wave 2 chooses to change shared `ErrorDetails`, coordinate with this wave. Conservative path avoids dependency.

Risks:
- Staging harness must not print or return secrets/session ids while repairing typed details.
- Shell tests should stay aligned with `FT-009` keyboard-safe bottom action policy and not relax the component contract by accident.

### Wave 4. Final repo-wide closure

Scope:
- No new source scope unless `tsc` reveals residual diagnostics.

Steps:
1. Rerun `npx tsc --noEmit -p tsconfig.jest.json`.
2. Run focused tests for all touched slices.
3. Run `git diff --check`.
4. If source behavior changed meaningfully, update `.memory-bank/` per Docs First in a separate docs wave controlled by orchestrator.

Recommended final checks:
- `npx tsc --noEmit -p tsconfig.jest.json`
- `npm run test:catalog -- --runInBand`
- `npm run test:delivery-assignment -- --runInBand`
- `npm run test:checkout-payment -- --runInBand`
- `npm run build:frontend` if frontend test/source changes are non-trivial
- `npm run lint` if runtime/source changes are non-trivial
- `git diff --check`

## Dependencies And Sequencing

Preferred sequence:
1. Wave 1 first, because catalog accounts for `44/85` diagnostics and has a coherent owner.
2. Wave 2 second, because operational runtime adapters are mixed-slice and need a smaller post-catalog baseline.
3. Wave 3 third, because it is mostly fixture/runtime harness cleanup and may share the `ErrorDetails` decision with Wave 2.
4. Wave 4 final verification.

Parallelization:
- Wave 1 and Wave 2 should not both edit broad tests at the same time in the same checkout unless coordinated.
- Wave 3 frontend fixture repairs can be parallel with Wave 1 only if no shared test helper is introduced.

## Relevant Spec Docs Per Group

Catalog:
- `.memory-bank/features/FT-001-catalog-browse-and-seller-management.md`
- `.memory-bank/features/FT-010-seller-storefront-editing-and-store-admin.md`
- `.memory-bank/features/FT-011-db-backed-catalog-runtime-baseline.md`
- `.memory-bank/features/FT-015-start-showcase-and-curation.md`
- `.memory-bank/contracts/catalog-public-api.md`
- `.memory-bank/contracts/catalog-seller-provisioning-and-visibility.md`
- `.memory-bank/contracts/seller-catalog-write-policy.md`
- `.memory-bank/contracts/catalog-start-showcase-contract.md`
- `.memory-bank/architecture/data-boundaries-and-persistence.md`
- `.memory-bank/testing/index.md`

Delivery operations:
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

Staging/runtime testing:
- `.memory-bank/features/FT-018-staging-runtime-and-test-auth-harness.md`
- `.memory-bank/contracts/staging-test-auth-harness-contract.md`
- `.memory-bank/runbooks/staging-runtime-and-ui-qa.md`
- `.memory-bank/testing/staging-ui-qa.md`
- `.memory-bank/testing/index.md`

Mini App shell and checkout:
- `.memory-bank/features/FT-009-mini-app-shell-and-webview-ux.md`
- `.memory-bank/contracts/mini-app-runtime-contract.md`
- `.memory-bank/features/FT-002-checkout-payment-and-order-creation.md`
- `.memory-bank/features/FT-013-customer-checkout-handoff-and-paid-order-creation-flow.md`
- `.memory-bank/features/FT-017-guarded-e2e-mock-payment-mode.md`
- `.memory-bank/contracts/payment-confirmation-contract.md`
- `.memory-bank/contracts/telegram-mini-app-auth-contract.md`
- `.memory-bank/testing/index.md`

## Acceptance For This Triage

- `tsc-before.log` exists and contains the full baseline output.
- Diagnostics are grouped by file and ownership.
- Relevant specs are identified per group.
- Implementation waves are scoped and sequenced.
- No source, tests, or `.memory-bank` files were edited.
