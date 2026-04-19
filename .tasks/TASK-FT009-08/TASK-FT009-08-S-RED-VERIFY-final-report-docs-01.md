# TASK-FT009-08 Red-Verify Report

## Verdict
- `semantic-concern`

## Conclusion
- The checked-in change improves architecture by centralizing shell capability/degradation decisions instead of leaving them to page-level heuristics.
- A substantive residual risk remains: the current policy degrades the shell-owned keyboard-safe bottom-action layout itself, not just optional polish, so reduced runtime paths now fall back to `inline` CTA layout exactly where graceful fallback should be most protective.
- No new bug doc or backlog card is required because the remaining risk is already aligned with the planned `FT-009` closure wave `TASK-FT009-09`.

## Residual assumptions
- `bottomActionLayout="inline"` is assumed to be an acceptable degraded path for weak/old Telegram clients even though `FT-009` frames bottom-action safety as part of critical shell usability.
- The chosen `supportsEnhancedShell` gate is assumed to be the right proxy for `supportsKeyboardSafeBottomActions`, but current repo-local evidence proves only internal consistency, not that the coupling matches real Telegram behavior.
