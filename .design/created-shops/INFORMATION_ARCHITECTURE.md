# Information Architecture: Created Shops

## Site Map

- Mini App `/`
  - Start Showcase `/`
  - All Khujand shop browse `/shops`
  - Public/shared storefront `/shops/:publicPath`
- Admin Web `/admin`
  - Dashboard `/admin`
  - Catalog shop provisioning `/admin/catalog/shops/provision`
- Seller Web `/seller`
  - Shop status control `/seller/shops/status`

## Navigation Model

- **Primary navigation**: existing contour routers stay unchanged. Admin reaches provisioning from the admin dashboard/nav.
- **Secondary navigation**: provisioning page owns contextual links through displayed public paths, not a new route family.
- **Utility navigation**: protected admin shell owns session/logout; seller session remains Telegram-linked.
- **Mobile navigation**: no additional nav pattern; pages stack inside existing responsive shells.

## Content Hierarchy

### Admin Catalog Shop Provisioning

1. Provisioning state summary -- confirms runtime list, binding, initial visibility, and seller-ready skeleton outcome.
2. Provisioning form -- primary action for creating a skeleton shop.
3. Provisioned shops list -- operational verification that created shops exist with seller binding and public paths.
4. Controlled feedback -- success/error context near the workflow.

### Shared Storefront

1. Hero image/name/description -- the created shop's public identity.
2. Menu tabs and product cards -- starter content becomes normal editable catalog content.
3. Seller edit affordances -- only when server grants ownership.
4. Customer cart summary -- only for public browse mode.

### Seller Status Control

1. Owned shop selector.
2. Visibility status selector.
3. Save feedback.

## User Flows

### Admin Creates A Shop

1. Admin opens `/admin/catalog/shops/provision`.
2. Admin reviews current created-shop count, initial visibility, and seller handoff context.
3. Admin enters seller ID, Telegram ID, shop name, description, media URLs, and status.
4. Admin submits.
   - If valid: system creates durable shop, binding, starter menu pages/products, public paths, then refreshes list.
   - If conflict/forbidden/invalid: system shows controlled inline error and leaves inputs editable.
5. Admin inspects the created shop in the provisioned-shops list; this list is the post-create result.

### Seller Receives Created Shop

1. Seller opens the shared storefront path from Telegram-linked access.
2. Server resolves ownership.
3. Seller sees existing starter content and edit controls in the same storefront tree.
4. Seller updates shop/menu/product content without using a separate builder.

### Customer Opens Created Shop

1. Customer enters from start showcase, browse list, or public path.
2. Customer sees only `WORKING` shops.
3. Customer interacts with normal storefront product cards and checkout handoff.

## Naming Conventions

| Concept | Label in UI | Notes |
| ------- | ----------- | ----- |
| Created shop | Provisioned shop | Matches existing admin copy and backend command semantics. |
| Seller Telegram identity | Seller Telegram ID | Operationally explicit. |
| Public route | Paths | Shows vanity and seller-ordinal aliases together. |
| Visibility | Initial visibility / Visibility | Maps directly to `WORKING` and `NOT_WORKING`. |
| Starter content | Starter pages/products | Confirms skeleton creation without implying demo-only data. |

## Component Reuse Map

| Component | Used on | Behavior differences |
| --------- | ------- | -------------------- |
| `AdminPageShell` | Admin provisioning | Existing protected admin shell and responsive grid. |
| `data-admin-ui=status-chip` | Admin provisioning, tables | Text status remains visible. |
| `CatalogPage` | Start showcase, browse, storefront | Same component owns customer/seller storefront modes. |
| `StorefrontEditorModal` | Seller edit mode | Only available for owning seller. |
| `SellerShopStatusPage` | Seller web | Narrow status-only surface. |

## Content Growth Plan

Provisioned shops will grow over time. The current MVP can keep a compact list, but the UI should tolerate many rows via wrapping and later pagination/filtering without changing route structure.

## KISS Decisions

- Primary beneficiary is seller, but the provisioning screen remains an admin operational surface.
- The provisioned-shops list remains the main post-create destination.
- No inline storefront preview.
- No extra launch wizard or duplicate builder.

## URL Strategy

- Public storefront pattern: `/shops/:publicPath`.
- Customer-facing links prefer the vanity public path when available.
- Technical `shop.id` remains internal and is not displayed as the customer path.
- Admin provisioning route remains `/admin/catalog/shops/provision`.
- Seller status route remains `/seller/shops/status`.
