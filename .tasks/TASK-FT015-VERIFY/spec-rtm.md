# TASK-FT015-VERIFY - SPEC/RTM consistency

## Scope

- Feature: `FT-015` / `REQ-034`
- Focus: spec and RTM consistency only.
- Constraint: no existing code/spec edits; this report is the only intended artifact.

## Acceptance

1. Owning slice, contour and touched layers are explicit and compatible with architecture.
2. `REQ-034` RTM lifecycle is consistent with the feature state and Memory Bank navigation.
3. Feature/index/contract links route correctly through EP-001 and contracts indexes.
4. `FT-015` and `catalog-start-showcase-contract` have no semantic drift.
5. No hidden conflict with no-delete, seller ownership, seller/admin boundary, or `NOT_WORKING` public visibility rules.

## Evidence

- `FT-015` declares owning slice `catalog`, contours `mini-app` public read plus admin-web session affordances, touched layers `presentation + application + domain + infrastructure`, and rejects shared extraction as unjustified: `.memory-bank/features/FT-015-start-showcase-and-curation.md:14-17`.
- `doc/ARCHITECTURE.md` defines `catalog` as the MVP slice for storefront browsing and allows shared only for true primitives, while business rules stay slice-owned.
- `REQ-034` states the same behavior: language selection leads to the start showcase, "Сегодня популярны", up to 3 `WORKING` favorite shops, "весь Худжанд", admin-only `BOSS`/`ADMIN` curation, reference-only storage, and public hiding of `NOT_WORKING`/deleted shops/products: `.memory-bank/requirements.md:46`.
- RTM lifecycle model allows `planned|implemented|verified`, and `REQ-034` row is `EP-001` / `FT-015` / `verified`: `.memory-bank/requirements.md:7-9`, `.memory-bank/requirements.md:97`.
- `FT-015` current-state section also says repo-local implementation is complete and `REQ-034` is `verified`: `.memory-bank/features/FT-015-start-showcase-and-curation.md:27-32`.
- Navigation exists:
  - main Memory Bank recent update mentions `FT-015` verified: `.memory-bank/index.md:37`;
  - features index links `FT-015`: `.memory-bank/features/index.md:8`;
  - contracts index links `catalog-start-showcase-contract`: `.memory-bank/contracts/index.md:8`;
  - EP-001 includes `FT-015`: `.memory-bank/epics/EP-001-customer-ordering-experience.md:14`;
  - architecture data boundaries links the showcase contract: `.memory-bank/architecture/data-boundaries-and-persistence.md:57`.
- EP-001 acceptance and workflow align with FT-015: showcase is the entry after language overlay, "весь Худжанд" keeps generic browse reachable, data is live references, seller cannot curate, and unlink is not delete: `.memory-bank/epics/EP-001-customer-ordering-experience.md:42`, `.memory-bank/epics/EP-001-customer-ordering-experience.md:66`, `.memory-bank/epics/EP-001-customer-ordering-experience.md:72`.
- Contract owner and contour align with feature ownership: read contour is `mini-app`, write contour is admin session affordances from storefront/admin-web context: `.memory-bank/contracts/catalog-start-showcase-contract.md:12-16`.
- Contract read rules match FT acceptance: public read without customer auth, live catalog facts, hidden deleted/not public/`NOT_WORKING` references, no admin-only metadata leakage: `.memory-bank/contracts/catalog-start-showcase-contract.md:27-35`.
- Contract write/RBAC rules match FT acceptance: unlink/unfavorite do not mutate underlying product/shop, writes require admin session, seller/customer/anonymous/expired sessions are forbidden, favorite output cap is 3: `.memory-bank/contracts/catalog-start-showcase-contract.md:45`, `.memory-bank/contracts/catalog-start-showcase-contract.md:52`, `.memory-bank/contracts/catalog-start-showcase-contract.md:54-58`, `.memory-bank/contracts/catalog-start-showcase-contract.md:67`.
- Testing layer explicitly requires FT-015 coverage beyond frontend render: landing after language, live references, admin-only curation, no seller curation, cap 3, unlink-only, and hiding `NOT_WORKING`/deleted references: `.memory-bank/testing/index.md:26`, `.memory-bank/testing/index.md:41`.
- No-delete/seller boundary is compatible: seller-facing catalog surfaces must not expose destructive delete actions, and seller may only edit owned shop/page/product/status surfaces, not curation: `.memory-bank/contracts/seller-catalog-write-policy.md:29-37`, `.memory-bank/contracts/seller-catalog-write-policy.md:49-50`.
- Visibility boundary is compatible: `NOT_WORKING` shops are hidden from public browse and visible only to owning seller; showcase public reads also hide not publicly visible references: `.memory-bank/contracts/catalog-seller-provisioning-and-visibility.md:43-45`, `.memory-bank/architecture/data-boundaries-and-persistence.md:37`.

## Findings

- No blocking SPEC/RTM drift found between `FT-015`, `REQ-034`, EP-001, the showcase contract, contracts index, features index, and architecture data-boundary docs.
- Ownership is coherent: `catalog` owns the capability; `mini-app` is the public read contour; admin curation uses an admin session affordance without moving ownership into `admin-access` or `seller-web`.
- Shared extraction is correctly rejected in the feature because showcase curation is catalog business behavior, not a reusable primitive.
- No hidden conflict found with seller boundaries: seller edit mode and seller identity do not grant curation permissions.
- No hidden conflict found with no-delete policy: showcase removal is specified as unlink-only and does not delete or mutate underlying catalog records.
- No hidden conflict found with admin boundaries: curation is restricted to valid platform admin session roles `BOSS`/`ADMIN`; the admin auth contract remains the session/security boundary.
- Non-blocking evidence note: no `.tasks` or `.protocols` directory named for `FT015`/`FT-015` was found during this pass, while the spec layer already marks `REQ-034` as `verified`. This report did not validate implementation/test logs, by request scope.

## Verdict

VERDICT: PASS

Basis: SPEC/RTM consistency is acceptable for `FT-015` / `REQ-034`; the normative documents align on behavior, ownership, lifecycle, visibility, RBAC, and no-delete boundaries.
