---
description: Implementation plan for TASK-FT016-11 optional auto-offer broadcast trigger.
status: active
---
# TASK-FT016-11 Plan

## Steps

1. Mark task `in_progress` in backlog/run status and create protocol files.
2. Inspect current `delivery-assignment`, runtime route and admin operator page implementation.
3. Add slice-local broadcast command types, service method and repository persistence.
4. Add explicit admin/runtime trigger and narrow admin API/UI action defaulting to OFF unless triggered.
5. Add focused tests for default OFF/no automatic broadcast, eligibility filtering, pending offers, no assignment side effects and persistence-before-notification.
6. Run focused checks and `git diff --check`.
7. Update Memory Bank changelog/backlog/status plus task progress/final report; leave verifier role to a separate pass.

## Current Design Choice

Use explicit operator/admin broadcast trigger rather than a background setting evaluator for new orders. This satisfies default OFF, avoids timeout/queue scope, and keeps claim as the only assignment path.
