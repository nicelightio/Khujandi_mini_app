---
description: UI QA report for Wave 1 retry public Mini App browse baseline.
status: blocked
---
# UI QA Report: Mini App Public Browse Baseline

## Result

BLOCKED

## Environment And URL

- Project: `/home/serg/Projects/Khujandi_mini_app`
- Target URL: `http://192.168.100.2:5173`
- URL family in scope: `/`, `/shops`, `/shops/<publicPath>`
- Environment classification: orchestrator-provided already-running local/runtime URL; not independently confirmed from this isolated QA sandbox.
- Owning slice: `catalog` plus `FT-003` language/localization and `FT-009` mini-app shell presentation evidence.
- Owning contour: `mini-app`.
- Touched layers: presentation/runtime evidence only.

## Specs And Docs Consulted

- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `.memory-bank/index.md`
- `doc/ARCHITECTURE.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/features/FT-003-language-selection-and-localization.md`
- `.memory-bank/features/FT-009-mini-app-shell-and-webview-ux.md`
- `.memory-bank/features/FT-015-start-showcase-and-curation.md`
- `.memory-bank/features/FT-001-catalog-browse-and-seller-management.md`
- `.memory-bank/testing/index.md`
- `README.md`
- Focused implementation hints only: `frontend/src/app/router.tsx`, catalog route/page/API/storefront components, and catalog/showcase test references.

## Expected Flow From Specs

- First run requires language selection; choosing Russian should enter the customer Mini App surface.
- Root `/` should render the start showcase after language selection.
- The showcase should include Russian copy for `Сегодня популярны`, up to 3 featured `WORKING` shops, and the `весь Худжанд` route/link to `/shops`.
- `/shops` should be publicly browsable without admin login.
- A visible storefront `/shops/<publicPath>` should render customer-facing product cards, no seller/admin destructive controls, and a discoverable add-to-cart affordance.

## Steps Attempted

1. Attempted Playwright MCP navigation to `http://192.168.100.2:5173/`.
2. Retried Playwright MCP navigation after the first tool call returned cancelled.
3. Attempted Playwright MCP `tabs list` to verify browser availability.
4. Performed non-browser network probes from the same QA sandbox:
   - `curl http://192.168.100.2:5173/`
   - `curl http://192.168.100.2:5173/api/v1/shops`

## Evidence

- Playwright MCP did not execute browser actions: navigation and tab-list calls returned `user cancelled MCP tool call` before a page could be inspected.
- Shell network probes from this QA sandbox could not connect:
  - `/`: `curl: (7) Failed to connect to 192.168.100.2 port 5173`; HTTP code `000`.
  - `/api/v1/shops`: `curl: (7) Failed to connect to 192.168.100.2 port 5173`; HTTP code `000`.
- No browser screenshot, trace, console log, network log, layout observation, or user-flow evidence could be captured.

## Bugs Found

None classified as an application bug.

The requested instructions explicitly say that if `http://192.168.100.2:5173` is unreachable from the browser sandbox, report `BLOCKED` as cross-sandbox network reachability and do not classify it as an app bug. The available evidence is consistent with sandbox reachability/tooling blockage, not verified runtime behavior.

## Testability Blockers

- Critical: target URL is unreachable from the isolated QA sandbox by direct network probe.
- Critical: Playwright MCP did not execute any browser action in this session, so the mandated real-browser UI QA could not start.

## Coverage Gaps

- First-run language overlay was not observed.
- Russian showcase copy and `весь Худжанд` link were not verified in browser.
- `/shops` public browse was not verified in browser.
- Storefront product cards, customer-safe controls, and add-to-cart affordance were not verified in browser.
- Console errors, network failures, layout overlap, mobile layout, and accessibility smoke could not be inspected.

## Recommendation

Retry UIQA-W01-R1 from an environment where Playwright can reach `http://192.168.100.2:5173`, or expose the already-running runtime on an address reachable from the QA browser sandbox. Keep the same scope and start with a clean browser storage state, then proceed through `/`, `/shops`, and one visible `/shops/<publicPath>` storefront.
