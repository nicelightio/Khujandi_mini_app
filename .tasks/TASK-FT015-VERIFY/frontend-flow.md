---
description: Verify #3 frontend customer flow/UI evidence for FT-015 / REQ-034.
status: done
---
# TASK-FT015-VERIFY Frontend Flow

Дата: 2026-05-08

## Scope

- Feature/REQ: `FT-015` / `REQ-034`.
- Owning slice: `catalog`.
- Contour: `mini-app` customer read flow; storefront admin affordance visibility checked only as a default/non-admin negative path.
- Touched layers for this verification: frontend presentation + route/view-model integration evidence.
- Shared extraction: не применимо; проверка не меняла код.

## Verification Targets

1. Root `/` после language overlay ведет на стартовую Витрину, а не generic browse.
2. `/shops` generic browse/list остается рабочим.
3. `/shops/:publicPath` storefront не сломан.
4. Showcase рендерит `Сегодня популярны`, до 3 favorite shop links и ссылку `весь Худжанд`.
5. Admin controls не видны by default.
6. Seller edit/cart behavior не сломан showcase props.

## Evidence

### Spec/source inspection

- `.memory-bank/features/FT-015-start-showcase-and-curation.md`: acceptance требует root showcase, `Сегодня популярны`, favorite shops, `весь Худжанд`, admin-only curation и запрет seller curation.
- `frontend/src/slices/catalog/routes/catalog-route.tsx:72`: `/shops/:publicPath` остается отдельным storefront branch.
- `frontend/src/slices/catalog/routes/catalog-route.tsx:84`: `pathname === "/"` рендерит `CatalogShowcaseRoute`.
- `frontend/src/slices/catalog/routes/catalog-route.tsx:88`: fallback/generic browse рендерит `CatalogBrowseRoute`.
- `frontend/src/slices/catalog/routes/catalog-storefront-route.tsx:40`: storefront отдельно читает showcase admin state и fail-closed default остается `false`.
- `frontend/src/slices/catalog/components/catalog-page.tsx:368`: root showcase admin bar рендерится только при `showcase.admin.canCurate`.
- `frontend/src/slices/catalog/components/catalog-page.tsx:381`: favorite shop links рендерятся из showcase view model.
- `frontend/src/slices/catalog/components/catalog-page.tsx:389`: `весь Худжанд` ссылка рендерится отдельным link.
- `frontend/src/slices/catalog/components/catalog-page.tsx:408`: products рендерятся в блоке showcase.
- `frontend/src/slices/catalog/components/catalog-page.tsx:514`: storefront admin add-to-showcase affordance gated by `canCurateShowcaseFromStorefront`.
- `frontend/src/slices/catalog/model/showcase-view-model.ts:119`: favorite shops frontend view model caps to `slice(0, 3)`.
- `frontend/src/shared/i18n/copy.ts:120`: RU showcase title is `Сегодня популярны`.
- `frontend/src/shared/i18n/copy.ts:124`: RU all-shops link label is `весь Худжанд`.

### Focused frontend Jest

Command:

```powershell
npx jest --config jest.config.cjs frontend/src/tests/app/localization-boundary.spec.tsx frontend/src/tests/app/root-router.spec.tsx frontend/src/tests/slices/catalog/catalog-route.spec.tsx frontend/src/tests/slices/catalog/catalog-route.storefront.spec.tsx frontend/src/tests/slices/catalog/catalog-page.cart.spec.tsx frontend/src/tests/slices/catalog/catalog-page.storefront-events.spec.tsx frontend/src/tests/slices/catalog/catalog-api.spec.ts --runInBand
```

Result: `PASS`, 7 suites / 42 tests.

Covered evidence:

- `frontend/src/tests/app/localization-boundary.spec.tsx:89`: hydrated/post-language state renders route content containing `Сегодня популярны`.
- `frontend/src/tests/app/root-router.spec.tsx:69`: root, `/shops`, and `/shops/:publicPath` stay on the catalog route tree.
- `frontend/src/tests/slices/catalog/catalog-route.spec.tsx:104`: `/shops` renders public shops/products and links to `/shops/<publicPath>`.
- `frontend/src/tests/slices/catalog/catalog-route.spec.tsx:206`: `/shops/:publicPath` public storefront browse remains valid even if seller access fails.
- `frontend/src/tests/slices/catalog/catalog-route.spec.tsx:329`: root `/` renders start showcase instead of generic shop list, shows `Сегодня популярны`, product, favorite shop, `весь Худжанд`, href `/shops`, and no `data-start-showcase-admin="bar"`.
- `frontend/src/tests/slices/catalog/catalog-route.storefront.spec.tsx:78`: owning seller edit mode still uses the same storefront tree.
- `frontend/src/tests/slices/catalog/catalog-route.storefront.spec.tsx:192`: non-seller storefront visitors remain browse-only.
- `frontend/src/tests/slices/catalog/catalog-page.cart.spec.tsx:39`: customer cart add/update/remove/totals/checkout readiness still work.
- `frontend/src/tests/slices/catalog/catalog-page.cart.spec.tsx:134`: short card press still adds to cart; long press remains description-only.
- `frontend/src/tests/slices/catalog/catalog-page.cart.spec.tsx:200`: checkout receives contract-shaped composition payload.
- `frontend/src/tests/slices/catalog/catalog-page.cart.spec.tsx:263`: stale/unavailable product repair still blocks checkout safely.

### Wider frontend catalog Jest

Command:

```powershell
npx jest --config jest.config.cjs frontend/src/tests/slices/catalog frontend/src/tests/app/localization-boundary.spec.tsx frontend/src/tests/app/root-router.spec.tsx --runInBand
```

Result: `PASS`, 11 suites / 61 tests.

This also covered catalog public page, composition model, storefront editor model, catalog view model, route storefront, cart and API specs.

### Frontend build

Command:

```powershell
npm run build:frontend
```

Result: `PASS`.

Vite summary: 120 modules transformed; production assets emitted under `dist/`; no TypeScript/Vite integration error from showcase props, storefront route, cart, or seller edit wiring.

### Browser/e2e gate

Skipped: no Playwright/Cypress/Selenium dependency or config was found in `package.json`, `frontend`, `tests`, or `.github`. Current evidence is React/Jest renderer + Vite build, not pixel/browser/Telegram WebView evidence.

## Verdict

`VERDICT: PASS`

Frontend customer flow/UI checks for verify #3 pass within repo-local feasible gates:

- root `/` after satisfied language state opens start showcase;
- `/shops` generic browse remains reachable and functional;
- `/shops/:publicPath` storefront remains functional;
- showcase renders `Сегодня популярны`, favorite links capped to 3 in the view model, and `весь Худжанд` links to `/shops`;
- admin curation controls are hidden by default;
- seller edit mode and customer cart/checkout composition behavior remain covered and passing.

Residual risk: this pass does not include real browser visual smoke or Android Telegram WebView smoke because no e2e browser harness is configured in the repo.
