# Design Brief: Created Shops

## Problem

Sellers should receive a usable created shop, not an empty canvas or a vague promise that something was provisioned. Platform admins are the screen actors, but the seller is the primary beneficiary: the creation flow must produce a durable skeleton storefront with seller binding, public paths, starter content, and the right initial visibility.

## Solution

Treat shop creation as a compact, strict operational provisioning workspace: the admin sees the current runtime state, enters only the required shop and Telegram-linked seller facts, receives controlled feedback, and immediately sees the created shop in an operational list with status and public paths. The seller then opens the same shared storefront with starter content already present; no preview, duplicate builder, or extra launch flow is introduced.

## Experience Principles

1. Seller handoff over admin flourish -- every admin-facing detail should help the seller receive a usable storefront.
2. One storefront, many roles -- admin, seller, and customer surfaces may differ, but the created shop resolves into the same catalog storefront model.
3. Operational clarity over decoration -- visual polish should help scanning, status comparison, and repeated provisioning.

## Aesthetic Direction

- **Philosophy**: Functionalist operations with storefront warmth.
- **Tone**: Calm, precise, trustworthy.
- **Reference points**: Existing `admin-web` protected shell, existing warm storefront visual language, Telegram-safe compact workflows.
- **Anti-references**: Heavy visual builder, marketing landing page, analytics dashboard, decorative card-heavy flow, seller-only duplicate storefront.

## Primary User Decision

- Primary beneficiary: `seller`.
- Screen actor: `admin/operator`.
- Design consequence: the admin page stays strict and operational, while labels and hierarchy emphasize that the result is a seller-ready created storefront.
- KISS constraint: the provisioned shops list is the post-create result; no inline storefront preview or separate success dashboard.

## Existing Patterns

- Typography: admin contour uses Inter / Segoe UI; storefront uses system text with strong display scale in hero areas.
- Colors: admin dark cinematic shell uses `--admin-*`; storefront uses warm cream, charcoal, amber glow, and green action accent.
- Spacing: admin pages use dense but readable 20-24px panels; storefront is mobile-first and safe-area aware.
- Components: `AdminPageShell`, admin fact list/status/table primitives, `CatalogPage`, `StorefrontHero`, `StorefrontMenuSections`, `StorefrontEditorModal`, `SellerShopStatusPage`.

## Component Inventory

| Component | Status | Notes |
| --------- | ------ | ----- |
| Admin provisioning summary | Modify | Clarify runtime, binding, visibility, and starter storefront outcome. |
| Admin provisioning form | Modify | Keep existing fields; improve grouping and labels without changing API semantics. |
| Provisioned shops list | Modify | Turn table into a scan-friendly operational list with status, seller, Telegram ID, and public paths. |
| Shared storefront | Exists | No new builder; created shops open through `/shops/:publicPath`. |
| Seller status control | Exists | Remains narrow: `WORKING/NOT_WORKING` only. |
| Design tokens | New artifact | Document scoped tokens for created-shops design; implementation should extend existing admin CSS vars. |

## Key Interactions

- Admin loads `/admin/catalog/shops/provision` and sees existing created shops from canonical catalog runtime.
- Admin submits seller ID, Telegram ID, shop name, optional media URLs, description, and initial status.
- Submit disables the form and shows pending feedback.
- Success shows the created shop, status, public paths, starter page count, starter product count, and refreshes the list.
- Controlled errors stay inline and keep form data for correction.
- Seller later opens the existing shared storefront and edits only owned content; seller does not start from an empty canvas.

## Responsive Behavior

- Mobile/tablet admin view stacks summary, form, and shop list in one column.
- Desktop view keeps the summary as contextual side panel and form as primary workspace.
- Long paths wrap or break safely; tables/lists must not force horizontal overflow except where an existing admin table intentionally scrolls.

## Accessibility Requirements

- All form controls keep explicit labels.
- Status and errors use `role="status"` / `role="alert"` as currently implemented.
- Buttons remain at least 44px tall.
- Focus states reuse admin focus styling.
- Status must not be communicated by color alone; text `WORKING` / `NOT_WORKING` remains visible.

## Out of Scope

- No new seller password or self-service shop creation.
- No destructive delete UI for shops, menu pages, or products.
- No sales stats, reporting, or analytics.
- No upload/storage contract change; media remains string URL/data boundary.
- No duplicate seller storefront tree or heavy builder.
- No provisioning preview panel.
- No separate post-create launch block beyond the existing refreshed provisioned-shops list.
- No backend contract changes in this design pass.

## Architecture Micro-Check

- Owning capability slice: `catalog`.
- Owning contours: `admin-web` for provisioning, `mini-app` for shared storefront, `seller-web` for narrow status control.
- Touched layer: `presentation`.
- Shared extraction: not justified; created-shop behavior is catalog-owned business UX, not a reusable primitive.
