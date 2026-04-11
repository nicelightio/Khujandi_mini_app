# TASK-FT010-04 Context

## Task
- `TASK-FT010-04` — Implement seller capability resolution and status-based catalog visibility.

## Loaded inputs
- Richer inputs found in `.memory-bank/tasks/backlog.md`:
  - Constraints: public browse stays auth-free; no separate seller password/auth endpoint.
  - Verification Targets: seller capability/read boundary, `WORKING/NOT_WORKING` visibility, `/seller/*` auth failure posture.
  - Red-verify focus: capability resolution must trust Telegram-linked binding/session family rather than `shop.sellerId` alone.
- Feature spec: `.memory-bank/features/FT-010-seller-storefront-editing-and-store-admin.md`.
- Parent epic: `.memory-bank/epics/EP-001-customer-ordering-experience.md`.
- Requirements: `.memory-bank/requirements.md` (`REQ-025`, `REQ-026`).
- Normative contracts:
  - `.memory-bank/contracts/catalog-public-api.md`
  - `.memory-bank/contracts/catalog-seller-provisioning-and-visibility.md`
  - `.memory-bank/contracts/catalog-seller-access-and-session.md`
  - `.memory-bank/contracts/telegram-mini-app-auth-contract.md`
- Verification basis: `.memory-bank/testing/index.md`.

## Fallback usage
- No separate task-local richer implementation spec exists yet, so execution uses the backlog card plus FT-010/REQ/contract docs as the normative fallback basis.

## Current code reality
- Public catalog browse already filters `WORKING` shops, but seller access still relies on legacy `shop.sellerId` inputs rather than Telegram-linked binding/session resolution.
- Repo-local dev runtime mounts admin provisioning, but not Mini App auth/session or seller-protected catalog reads.
- Checkout auth already defines the Telegram HttpOnly cookie session family used by Mini App flows.

## Implementation intent
- Keep seller ownership inside `catalog`.
- Reuse Telegram-linked authenticated user context from the Mini App session family and resolve seller capability via `SellerShopBinding` plus canonical `shop.sellerId` alignment.
- Keep public browse auth-free while adding protected seller-owned read routes that expose owner visibility for `NOT_WORKING` shops.
