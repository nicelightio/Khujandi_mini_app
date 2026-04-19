# TASK-FT009-07 Red Verification

## Semantic verdict
- semantic-concern

## Top substance risks
- The task materially improves ownership by moving checkout CTA rendering onto a shell-owned primitive, but the new "keyboard-safe" claim is still supported mostly by `position: sticky`, bottom padding, and narrow Jest assertions rather than explicit runtime evidence that the CTA stays reachable when the Telegram keyboard is open.
- The change also adds `overflow-y: auto` to `[data-shell="page"]`, which silently changes scroll ownership for every `PageShell` consumer, not only the new bottom-action path. That broad layout side effect may be acceptable, but it is not yet semantically validated against the wider customer-facing shell baseline.

## Hidden assumptions
- The implementation assumes `viewportStableHeight` plus sticky footer behavior is enough for keyboard-open reachability on weak/mid Android Telegram WebView without an explicit keyboard or unstable/stable viewport reconciliation path.
- The implementation assumes the new page-level scroll container does not interfere with existing back/swipe expectations, anchor behavior, or future CTA-heavy screens that also use `PageShell`.

## Cross-boundary impact
- Positive: checkout no longer owns an ad hoc local CTA placement path, which aligns with the shell/runtime ownership baseline of `FT-009`.
- Neutral-to-risky: the shell layout model changed for all `PageShell` consumers, while only checkout received scoped semantic verification in this task.
- Open: the broader `FT-009` hardening gap around centralized degradation policy and runtime propagation still remains outside this task and continues to limit full feature closure confidence.

## Architectural concerns
- The chosen implementation is minimal and stays inside the shell boundary, which is architecturally correct.
- However, the current primitive is still mostly a styled footer slot, not yet a stronger shell policy that proves keyboard-open behavior under real runtime pressure.

## State and data consistency
- No data consistency issue was introduced.
- UI/runtime consistency is only partially demonstrated: the new primitive exists and checkout uses it, but the stronger reachability claim under keyboard-open runtime changes remains assumed rather than proved.

## Operational concerns
- No backend or persistence risk was introduced.
- Frontend operational risk remains moderate until Android Telegram notes explicitly confirm the new footer path under keyboard-open conditions, because deterministic tests do not exercise real Telegram viewport/keyboard behavior.

## Future maintenance cost
- Moderate. The new primitive is a useful base, but if the sticky-footer approach turns out to be insufficient in Telegram WebView, later CTA-heavy pages could copy a semantically incomplete pattern with false confidence.
- The new global page scroll model may also accumulate hidden layout regressions unless later verify waves explicitly cover more than checkout.

## How this could still be wrong
- The CTA can still become partially obscured by the keyboard on real Android Telegram even though the footer is shell-owned and tests pass.
- Another `PageShell` consumer could regress because `overflow-y: auto` moved scroll responsibility into the page container without wider runtime verification.

## Counterproposal or escalation path
- Do not revert this task: the ownership move is directionally correct.
- Keep the current verdict as `semantic-concern` until the already planned follow-up wave (`TASK-FT009-08` / `TASK-FT009-09`) explicitly verifies keyboard-open reachability and broader shell degradation/runtime behavior on the hardened path.
