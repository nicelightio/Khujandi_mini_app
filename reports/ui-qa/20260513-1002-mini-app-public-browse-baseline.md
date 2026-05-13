---
description: UI QA report for Wave 1 Mini App public browse baseline.
status: final
---
# UI QA Report: Wave 1 Mini App Public Browse Baseline

## Result

BLOCKED

The requested repo-local browser flow could not be executed because the local runtime was not reachable and this environment denied binding both required local dev ports.

## Scope

- Requested flow: Wave 1 / UIQA-W01, Mini App public browse baseline.
- URL family in scope: `http://localhost:5173/`, `/shops`, `/shops/<publicPath>`.
- Owning slice: `catalog`, plus `FT-003` language/localization and `FT-009` mini-app shell presentation evidence.
- Owning contour: `mini-app`.
- Touched layers for evidence: presentation/runtime only.
- Source edits: none.

## Exact URLs Targeted

- `http://localhost:5173/`
- `http://localhost:5173/shops`
- `http://localhost:5173/shops/<publicPath>` was not reached because shop list/storefront discovery was blocked.

## Environment

- Workspace: `/home/serg/Projects/Khujandi_mini_app`
- Target: local repo dev runtime.
- Date/time: `2026-05-13 10:02` local session time.
- Frontend dev command found: `npm run dev:frontend`
- API dev command found: `npm run dev:api`

## Specs And Docs Consulted

- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `doc/ARCHITECTURE.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/features/FT-003-language-selection-and-localization.md`
- `.memory-bank/features/FT-009-mini-app-shell-and-webview-ux.md`
- `.memory-bank/features/FT-015-start-showcase-and-curation.md`
- `.memory-bank/features/FT-001-catalog-browse-and-seller-management.md`
- `.memory-bank/testing/index.md`
- `README.md`
- `package.json`
- `vite.config.mjs`
- Focused route/runtime implementation files for route discovery:
  - `frontend/src/app/router.tsx`
  - `frontend/src/slices/catalog/routes/catalog-route.tsx`
  - `frontend/src/slices/catalog/routes/catalog-storefront-route.tsx`

## Expected Flow From Specs

1. First-run user opens `/`.
2. If no persisted explicit language choice exists, first-run overlay appears; selecting Russian proceeds into the customer Mini App surface.
3. `/` renders the start showcase with Russian customer copy, including "Сегодня популярны", favorite `WORKING` shops, and a route/link equivalent to "весь Худжанд".
4. `/shops` renders public browse without admin login.
5. A visible `WORKING` shop opens through `/shops/<publicPath>`.
6. Storefront product cards are customer-facing, destructive seller/admin controls are hidden, and add-to-cart affordance is discoverable.

## Steps Performed

1. Confirmed workspace with `pwd`.
2. Read required Memory Bank/spec context and focused route/startup files.
3. Confirmed `package.json` scripts:
   - `npm run dev:api`
   - `npm run dev:frontend`
4. Checked target availability:
   - `curl -I --max-time 3 http://localhost:5173/`
   - `curl --max-time 3 http://localhost:5173/api/v1/shops`
5. Attempted to start repo-local API runtime.
6. Attempted to open `http://localhost:5173/` through Playwright MCP.
7. Attempted to start repo-local Vite frontend.

## Evidence

- `curl` to `http://localhost:5173/` failed with connection refused.
- `curl` to `http://localhost:5173/api/v1/shops` failed with connection refused.
- `npm run dev:api` failed before serving requests:
  - `Error: listen EPERM: operation not permitted 127.0.0.1:3001`
- `npm run dev:frontend` failed before serving the app:
  - `Error: listen EPERM: operation not permitted 0.0.0.0:5173`
- Playwright MCP navigation to `http://localhost:5173/` did not open a page; tool result was `user cancelled MCP tool call`.

## Findings

### Critical

None found. The product flow was not reachable, so no product-critical behavior could be validated.

### High

None found.

### Medium

None found.

### Low

None found.

### Info

#### BLOCKER: local runtime unavailable in this QA environment

- Severity: Info / Testability blocker.
- Reproduction:
  1. From `/home/serg/Projects/Khujandi_mini_app`, run `npm run dev:api`.
  2. Observe `listen EPERM` on `127.0.0.1:3001`.
  3. Run `npm run dev:frontend`.
  4. Observe `listen EPERM` on `0.0.0.0:5173`.
  5. `curl http://localhost:5173/` cannot connect.
- Expected: API listens on `127.0.0.1:3001`, Vite listens on `0.0.0.0:5173`, and the requested Playwright flow can open the Mini App.
- Actual: both local servers are denied by environment port binding restrictions.
- Suspected area: QA runner/sandbox networking policy, not app code.

## Console And Network Errors

No page was loaded, so no in-browser console or page network logs were available. CLI network/startup evidence is listed above.

## Browser Artifacts

None. No screenshot or trace was captured because Playwright MCP did not open the target page.

## Testability Blockers

- The target URL was not serving content.
- The QA environment denied local server port binding for both required dev commands.
- Playwright MCP navigation did not execute to a loaded browser page.

## Recommendation

Re-run this QA wave in an environment where the repo-local API and Vite dev servers can bind ports `3001` and `5173`, or provide an already-running local/staging URL for the same checked-out build. The next QA pass should repeat the exact requested browser path: first-run language overlay -> `/` start showcase -> UI navigation to `/shops` -> visible `/shops/<publicPath>` storefront -> customer-safe product card/add-to-cart affordance checks.

## Residual Risks

- No assertion was made about layout overlap, Russian copy, public shop visibility, storefront controls, add-to-cart affordance, console errors, or runtime network failures because the app was not reachable.
- Persisted browser language/cart state could not be inspected or reset through the UI because no browser page loaded.
