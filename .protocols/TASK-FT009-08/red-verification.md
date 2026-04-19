---
description: Adversarial semantic verification for TASK-FT009-08.
status: active
---
# TASK-FT009-08 Red Verification

## Semantic verdict
- semantic-concern

## Top substance risks
- The new centralized policy is directionally correct, but it currently degrades not only optional shell polish, it also disables the shell-owned keyboard-safe bottom-action layout on reduced runtime paths. In `frontend/src/shared/telegram/webapp.ts:171-176` and `frontend/src/shared/state/ui-shell.ts:81-84`, `supportsKeyboardSafeBottomActions` is tied directly to the broader `supportsEnhancedShell` check, so missing `viewportStableHeight` or `isVersionAtLeast("7.10")` forces `bottomActionLayout` to `inline`.
- That coupling is semantically risky because the spec intent treats degradation as a way to reduce optional effects while preserving domain-critical usability. The checked-in fallback path in `frontend/src/shared/ui/page-shell.tsx:78-80` plus `frontend/src/shared/styles/webview-shell.css:47-55` removes the sticky keyboard-safe footer behavior exactly on older/weaker clients, which are the main target for graceful fallback.

## Hidden assumptions
- The implementation assumes keyboard-safe bottom actions are an optional enhancement rather than part of the critical CTA reachability baseline.
- It assumes clients without `viewportStableHeight` or without the chosen version gate cannot safely keep a shell-owned bottom action zone, even though the current CSS primitive could still provide a conservative shell-owned footer path.

## Cross-boundary impact
- Positive: capability/degradation decisions are now centralized in the shell rather than scattered across feature code.
- Risky: the centralized policy currently changes the behavior of every `PageShell` bottom action consumer, not just visual polish. Checkout tests now codify `data-shell-bottom-action="minimal"` plus `data-shell-footer-layout="inline"` on degraded paths, so later screens may inherit a semantically weaker CTA pattern with false confidence.

## Architectural concerns
- The solution stays inside the correct shell/runtime boundary.
- The semantic issue is policy granularity: the implementation collapses `enhanced shell`, `keyboard-safe bottom actions`, and some chrome affordances into one broad capability bucket, which is narrower than the intent of the docs-first split between optional enhancements and critical shell usability.

## State and data consistency concerns
- No data consistency issue was introduced.
- UI/runtime consistency remains partially open: the policy is centralized, but the degraded path may now be internally consistent while still missing the intended shell-owned CTA protection.

## Operational concerns
- No backend or persistence risk was introduced.
- Frontend operational risk remains moderate because real weak/old Telegram paths may now fall back to an inline CTA layout that is easier to regress for keyboard-open reachability before `TASK-FT009-09` gathers Android evidence.

## Future maintenance cost
- Moderate. The new capability layer is small, but because its semantics are now frozen into tests, future contributors may treat `inline` fallback as the intended long-term pattern for older clients instead of revisiting whether only the decorative part should degrade.

## How this could still be wrong
- Real Android Telegram runs may show that the degraded inline footer is still sufficiently reachable and the concern is overstated.
- Or the repo may later decide that keyboard-safe sticky behavior truly requires `viewportStableHeight` and should not be attempted on older clients.
- But the current checked-in evidence does not yet prove either of those stronger claims.

## Counterproposal or escalation path
- Do not revert the task: centralized shell policy ownership is the right direction.
- Treat the current result as `semantic-concern` until `TASK-FT009-09` explicitly verifies whether degraded clients should keep a conservative shell-owned bottom-action primitive instead of dropping to `inline`, and captures real Android evidence for that fallback path.
- No new bug doc or backlog card is required because this residual risk is already aligned with the planned closure wave `TASK-FT009-09`.
