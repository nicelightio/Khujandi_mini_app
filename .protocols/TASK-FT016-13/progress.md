---
description: Progress log for TASK-FT016-13 DELAYED presentation/read-copy surfacing.
status: active
---
# TASK-FT016-13 Progress

## 2026-05-09

- Read required operating guide, autopilot protocol, MBB, spec index, architecture, backlog, FT-016 plan, autonomous run status/review, TASK-FT016-12 verification, and relevant EP/FT/state/contract specs.
- Recorded ownership micro-check before code inspection: `delivery-tracking`; contours `admin-web` and `mini-app`; touched layers frontend presentation/read-model/parser/tests; no shared extraction justified.
- Observed pre-existing dirty worktree from previous FT-016 tasks; will not revert unrelated changes.
- Marked `TASK-FT016-13` as `in_progress` in backlog/run status before implementation.
- Updated admin operator read-model severity/alert mapping so `status=DELAYED` renders as delayed danger/alert copy even if the read model severity is stale.
- Added focused admin view-model coverage for stale-severity `DELAYED` alert/row copy.
- Added customer route coverage for `DELAYED` waiting/problem copy and read-only/no courier-progress controls.
- Checks passed:
  - `npx jest --config jest.config.cjs frontend/src/tests/admin/admin-assignment-view-model.spec.ts frontend/src/tests/admin/admin-assignment-route.spec.tsx --runInBand`
  - `npm run test:order-tracking:frontend -- --runInBand`
  - `git diff --check`
  - changed markdown local link validation for task docs/status/backlog
- Note: `npm run test:delivery-assignment:frontend -- --runInBand frontend/src/tests/admin/admin-assignment-view-model.spec.ts frontend/src/tests/admin/admin-assignment-route.spec.tsx` also ran the full admin suite because the package script already includes `frontend/src/tests/admin`; the scoped assignment specs passed, but the broader run still failed on unrelated catalog provisioning copy expectation drift in `frontend/src/tests/admin/admin-router.spec.tsx`.
- Marked `TASK-FT016-13` as `ready_for_verify`; verifier role remains separate.
