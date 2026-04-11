---
description: Хэндoфф по TASK-FT010-09.
---
# TASK-FT010-09 Handoff

## Expected outcome
- Repo-local runtime `POST /api/v1/admin/catalog/shops/provision` no longer behaves as an anonymous write path.
- The route reuses the checked-in admin session family and denies non-admin roles.

## Follow-up
- Backlog, bug record, changelog, and root Memory Bank index were synced after verification.
- If the team wants an adversarial semantic pass on downstream seller access work, run `/red-verify TASK-FT010-09` before reopening blocked FT-010 verification closure.
- `/red-verify` found a semantic break: the route now authenticates from the refresh cookie directly. See `.protocols/TASK-FT010-09/red-verification.md`, active bug `BUG-2026-04-10-ft010-provisioning-route-uses-refresh-cookie-as-auth`, and follow-up `TASK-FT010-10`.
