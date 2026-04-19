---
description: План выполнения TASK-FT009-08.
status: active
---
# TASK-FT009-08 Plan

1. Extend the Telegram bridge with a minimal capability snapshot based on runtime availability, stable viewport availability, and available Telegram chrome helpers.
2. Store a derived shell-owned degradation policy in shared shell state and expose it through `AppShell` layout markers.
3. Switch `PageShell` bottom-action layout/effect markers to the centralized shell policy.
4. Add focused unit/contract/smoke tests for capability derivation and fallback behavior.
5. Run targeted frontend tests plus lint, then sync task/docs artifacts.
