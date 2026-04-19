---
description: Active bug for FT-009 because the checked-in shell/runtime path still misses key hardening required by the updated Mini App frontend baseline.
status: active
---
# BUG-2026-04-19 FT-009 Shell Runtime Hardening Gap

## Summary

- `FT-009` now fixes a stricter Mini App shell baseline: high-churn runtime propagation must stay cheap, keyboard-safe bottom action primitives must be shell-owned, and weak-device/old-client degradation must be centralized.
- The checked-in `AppShell` boundary covers Telegram runtime ownership, but the new hardening layer is only partially reflected in code and still drifts from the updated spec baseline.

## Detection

- Date: `2026-04-19`
- Detection mode: spec/code drift review after tightening `FT-009`, runtime contract, frontend architecture, and guide docs.
- Reviewed files:
  - `frontend/src/app/app-shell.tsx`
  - `frontend/src/shared/state/ui-shell-context.tsx`
  - `frontend/src/shared/telegram/webapp.ts`
  - `frontend/src/shared/ui/page-shell.tsx`
  - `frontend/src/shared/styles/webview-shell.css`
  - `frontend/src/slices/checkout-payment/components/checkout-payment-page.tsx`
  - `frontend/src/slices/catalog/components/catalog-page.tsx`
  - `.memory-bank/contracts/mini-app-runtime-contract.md`
  - `.memory-bank/features/FT-009-mini-app-shell-and-webview-ux.md`
  - `.memory-bank/guides/frontend-slices-and-webview.md`

## Expected behavior

- Raw high-churn Telegram runtime events should be normalized once in the shell and delivered to feature code through derived stable state, CSS variables, or other narrow shell-owned primitives rather than broad app-wide React churn.
- CTA-heavy and input-heavy pages should use shared shell primitives for keyboard-safe bottom action zones instead of page-local action layouts.
- Weak Android / old Telegram client behavior should follow one centralized shell capability/degradation policy that can disable or simplify optional enhancements without touching domain flows.

## Actual behavior

- `AppShell` calls `setShellState(...)` on every `themeChanged`, `viewportChanged`, `safeAreaChanged`, and `contentSafeAreaChanged` event, and `UiShellProvider` republishes the full shell state through shared React context.
- The bridge wrapper exposes `onEvent(event, handler: () => void)` without runtime event payloads, so the shell cannot use event-level stability hints such as `viewportChanged(isStateStable=true)` and instead recomputes through a broad snapshot path.
- `PageShell` exposes only metadata like `actionLabel` and swipe/back policy; it does not provide a shared bottom action container or keyboard-safe footer primitive.
- `CheckoutPaymentPage` and catalog editor forms still render page-local action buttons inside arbitrary sections/forms rather than through a shell-owned bottom action zone.
- `webview-shell.css` applies safe-area padding and basic layout but contains no keyboard-safe bottom-zone rules or shared action-area primitive.
- Production code does not implement a centralized capability/degradation layer; `isVersionAtLeast()` is present in the bridge but is used only in tests, not in runtime UI policy.

## Evidence

- `frontend/src/app/app-shell.tsx:26-80` updates React shell state for every runtime event and routes all customer-facing children through one `UiShellProvider`.
- `frontend/src/shared/state/ui-shell-context.tsx:42-82` republishes `state`, `pagePolicy`, and `telegramBridge` via one shared context value.
- `frontend/src/shared/telegram/webapp.ts:89,182-188` keeps `onEvent` payload-less and therefore cannot expose stable/unstable viewport event metadata to the shell policy layer.
- `frontend/src/shared/ui/page-shell.tsx:4-75` has no bottom-action slot/primitive beyond inline label feedback.
- `frontend/src/shared/styles/webview-shell.css:11-42` defines page padding and body flex layout but no shell-owned bottom action zone or keyboard-safe footer behavior.
- `frontend/src/slices/checkout-payment/components/checkout-payment-page.tsx:34-49` renders the primary CTA as a local section button.
- `frontend/src/slices/catalog/components/catalog-page.tsx:273-305` keeps seller editor submit/cancel actions inside the local form rather than a shell-owned bottom action primitive.
- Repository search over `frontend/src/**/*.ts(x)` finds no production usage of `isVersionAtLeast(...)`; current hits are limited to tests.

## Impact

- The updated `FT-009` hardening baseline is not fully implemented in repo reality.
- Frequent Telegram runtime changes can still cause broader React churn than the new shell policy intends.
- Keyboard-open and bottom CTA behavior remain vulnerable to page-by-page drift as customer-facing forms become richer.
- Optional UX enhancements currently have no centralized weak-device/old-client policy guard, so future visual additions can increase Mini App fragility unless every slice hardens itself manually.

## Execution notes

- Keep ownership in `FT-009` shell/runtime and shared frontend primitives; do not distribute WebView workaround logic into each feature page.
- The fix does not require a heavy framework: narrow shell state, CSS-variable propagation, and one reusable bottom-action primitive are consistent with the cheap-first frontend baseline.
- Degradation policy should stay minimal and explicit; avoid turning it into a sprawling device-detection subsystem unless later specs require that scope.

## Suggested fix

- Narrow runtime propagation so frequent viewport/theme/safe-area changes do not fan out through one broad context-driven rerender path.
- Extend the shell with a reusable keyboard-safe bottom action primitive and migrate customer-facing CTA-heavy surfaces to it.
- Introduce a minimal shell-level capability/degradation policy based on runtime availability and supported client features, then route optional motion/effects through that policy.
- Add repo-local tests and Android verify notes that explicitly cover keyboard-open bottom CTA reachability, runtime update stability, and degradation/fallback behavior.

## Follow-up artifacts

- Backlog task: `TASK-FT009-07`
- Backlog task: `TASK-FT009-08`
- Backlog task: `TASK-FT009-09`
- Current scoped execution wave intentionally covers only the keyboard-safe bottom action primitive and the minimal shell capability/degradation policy.
- The broader `high-churn runtime propagation` refactor remains open and is not yet decomposed into an execution-ready task card.
