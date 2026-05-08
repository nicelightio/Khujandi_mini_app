# Build Tasks: Created Shops

Generated from: `.design/created-shops/DESIGN_BRIEF.md`
Date: 2026-05-09

## Foundation

- [x] **Design artifacts**: Save brief, IA, scoped tokens, and build plan for created shops. _New artifacts._
- [x] **Admin provisioning structure**: Rework `/admin/catalog/shops/provision` copy and markup so the admin reads it as a provisioning workspace, not a plain form. _Modifies: `AdminCatalogProvisioningPage`._
- [x] **Decision alignment**: Record seller as primary beneficiary, strict admin operational tone, provisioned-shops list as the post-create result, and no preview. _Updates design artifacts._

## Core UI

- [x] **Provisioning confidence panel**: Show runtime count, binding state, initial visibility, and skeleton outcome in a compact summary. _Reuses: `data-admin-ui="fact-list"` and `status-chip`._
- [x] **Created shops operational list**: Replace the plain table experience with a scan-friendly list that highlights shop name, status, seller, Telegram ID, and both public paths. _Modifies: provisioning page and admin CSS._
- [x] **Public path affordances**: Render storefront path aliases as readable monospaced chips/links without exposing technical `shop.id` as a customer route. _Reuses: existing path fields._

## Interactions & States

- [x] **Submit and feedback states**: Keep disabled pending state, success details, controlled errors, and refreshed list visible in the same workspace. _Reuses existing route state._
- [x] **Empty/loading/error states**: Make the created-shop list clear when loading, empty, or failed. _Modifies copy only._

## Responsive & Polish

- [x] **Responsive admin layout**: Ensure provisioning summary, form, and shop list stack cleanly below 920px and paths wrap safely. _Modifies admin CSS._
- [x] **Accessibility pass**: Preserve labels, visible status text, alert/status roles, keyboard focus, and 44px touch targets. _Verification task._

## Review

- [ ] **Design review**: Run design review after the build if requested.
