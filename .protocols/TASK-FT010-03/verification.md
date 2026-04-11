# TASK-FT010-03 Verification

## Target checks
- Integration: admin provisioning creates shop, seller binding, starter menu pages, and starter products atomically.
- Integration: conflict/error path does not leave partial persisted state.
- Runtime: provisioning command path is reachable via repo-local dev API and returns controlled payloads.
- Regression: starter blueprint and canonical seller ownership remain explicit.

## Status
- PASS

## Evidence
- `npx jest --config jest.config.cjs tests/slices/catalog/catalog.unit.spec.ts tests/slices/catalog/catalog.provisioning.integration.spec.ts tests/slices/catalog/catalog.runtime.integration.spec.ts`
- `npm run test:catalog`
- `npm run lint`

## Verification mapping
- `Verification Target: admin provisioning command path`
  - Check: repo-local runtime test hits `POST /api/v1/admin/catalog/shops/provision` and asserts `201` on success plus controlled `409` on duplicate provisioning.
  - Evidence: `tests/slices/catalog/catalog.runtime.integration.spec.ts`
- `Verification Target: skeleton shop creation`
  - Check: integration test asserts one provisioning call creates shop, starter menu pages `Popular/Drinks`, and starter products `Starter Dish/Starter Drink`.
  - Evidence: `tests/slices/catalog/catalog.provisioning.integration.spec.ts`
- `Verification Target: Telegram-linked seller binding`
  - Check: integration/runtime tests assert binding is created together with shop and preserves the canonical seller identity between shop and binding.
  - Evidence: `tests/slices/catalog/catalog.provisioning.integration.spec.ts`, `tests/slices/catalog/catalog.runtime.integration.spec.ts`
- `Invariant: no partial shop/binding state on conflict/error`
  - Check: integration tests assert duplicate/conflict and starter-product failure leave shops, bindings, menu pages, and products empty.
  - Evidence: `tests/slices/catalog/catalog.provisioning.integration.spec.ts`
- `REQ-025`
  - Check: verified admin-side provisioning creates the first skeleton shop from admin input (`sellerId`, `telegramId`, `name`) without introducing a separate seller password baseline in this task scope.
  - Evidence: service/runtime wiring plus the focused tests above.

## Notes
- Repo-local integration coverage now verifies that provisioning commits shop + binding + starter catalog data together and leaves no partial state when starter product creation fails.
- Repo-local runtime coverage verifies `POST /api/v1/admin/catalog/shops/provision` success and duplicate-conflict behavior with controlled `409` payloads.
