# TASK-FT010-04 Verification

## Basis
- Verification Targets from backlog card: seller capability/read boundary, `WORKING/NOT_WORKING` visibility, `/seller/*` auth failure posture.
- Normative inputs used for verification:
  - `.memory-bank/contracts/catalog-seller-access-and-session.md`
  - `.memory-bank/contracts/catalog-seller-provisioning-and-visibility.md`
  - `.memory-bank/contracts/catalog-public-api.md`
  - `.memory-bank/features/FT-010-seller-storefront-editing-and-store-admin.md`
  - `.memory-bank/requirements.md` (`REQ-025`, `REQ-026`)

## Executed checks
- `npx jest --runInBand tests/slices/catalog/catalog.unit.spec.ts`
- `npx jest --runInBand tests/slices/catalog/catalog.integration.spec.ts`
- `npx jest --runInBand tests/slices/catalog/catalog.runtime.integration.spec.ts`
- `npm run lint`

## Status
- PASS

## Evidence
- Unit coverage confirms seller-owned reads are derived from Telegram-linked bindings, preserve owner visibility for `NOT_WORKING`, and fail closed on missing binding or binding/shop drift.
- Integration coverage confirms the Prisma-backed repository boundary resolves seller-owned shops from `SellerShopBinding` rather than raw client flags.
- Runtime coverage confirms `POST /api/v1/auth/telegram` issues the Mini App cookie session family, `/api/v1/seller/*` returns `401` for anonymous callers, `403` for authenticated non-sellers and foreign sellers, and owner reads keep `NOT_WORKING` shops hidden from public browse while visible to the owner.

## AC / REQ Mapping
- `REQ-025` / seller capability resolution: PASS.
  - What was checked: seller-owned reads are granted only after Telegram-linked session auth plus `SellerShopBinding` lookup; missing binding and binding/shop drift fail closed.
  - Evidence: `tests/slices/catalog/catalog.unit.spec.ts`, `tests/slices/catalog/catalog.integration.spec.ts`, `tests/slices/catalog/catalog.runtime.integration.spec.ts`.
- `REQ-026` / status-based visibility: PASS.
  - What was checked: public browse remains `WORKING`-only and auth-free; owning seller can still read `NOT_WORKING` shops through protected seller routes.
  - Evidence: `tests/slices/catalog/catalog.integration.spec.ts`, `tests/slices/catalog/catalog.runtime.integration.spec.ts`.
- `/seller/*` failure posture target: PASS.
  - What was checked: anonymous callers get `401 AUTH_REQUIRED`; authenticated non-sellers and foreign sellers get controlled `403 FORBIDDEN`.
  - Evidence: `tests/slices/catalog/catalog.runtime.integration.spec.ts`.

## Verdict
- `PASS`

## Follow-up
- No blocking issue found for `TASK-FT010-04`.
- Red-verify remains appropriate because the task card explicitly calls out semantic risk around trusting `shop.sellerId` alone.
