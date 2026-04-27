---
description: Backlog and plan quality review for FT-012/FT-013/FT-014 closure readiness.
status: active
---
# TASK-MB-REVIEW S-03 Plan/Backlog Report

## VERDICT

REJECT

## Scope

- Reviewed task cards, waves, dependencies, gates, and backlog safety for `FT-012`, `FT-013`, and `FT-014`.

## Findings

### P0 - Final closure path is blocked and should not be run as terminal closure

- Evidence: `.memory-bank/tasks/backlog.md:293-306` marks `TASK-FT013-07` as `failed`; repo-local gates passed, but formal closure failed because fresh real `Android Telegram` evidence is missing.
- Evidence: `.memory-bank/tasks/backlog.md:308-319` opens `TASK-FT013-08` for evidence collection but marks it `blocked` with dependency on `TASK-FT009-10`.
- Evidence: `.memory-bank/tasks/backlog.md:111-123` marks `TASK-FT014-06` as `blocked` by `TASK-FT013-07`.
- Planning impact: the project cannot proceed to final closure for `FT-013` or `FT-014` from the current state.

### P1 - `FT-014` closure task is missing an explicit implementation prerequisite for mounted events runtime

- Evidence: `.memory-bank/tasks/backlog.md:118-123` scopes `TASK-FT014-06` as final e2e/docs closure and names upstream Android checkout evidence as the blocker.
- Evidence: `frontend/src/slices/order-tracking/api/order-tracking-api.ts:175-186` needs `/api/v1/events`.
- Evidence: `backend/src/dev-runtime/dev-api-server.ts:349-413` mounts checkout but does not mount `/api/v1/events`; `backend/src/dev-runtime/order-ops-runtime.ts:361-368` does not return a delivery tracking module.
- Planning risk: after Android evidence is collected, `TASK-FT014-06` may still fail because the real polling endpoint is absent. A repair task should precede final e2e closure.

### P2 - Active queue summary is stale and unsafe for blind execution

- Evidence: `.memory-bank/tasks/backlog.md:31-35` lists old next executable tasks for `FT-012` and `FT-013` even though their detailed cards show later tasks completed/failed/blocked.
- Workflow impact: this violates the `/review` requirement that there be no blind backlog that cannot be safely launched autonomously.

## Task Card Quality

- Detailed cards include `Status`, `Wave`, `Depends on`, `Touched files`, `Tests`, `Verify`, and `Docs` fields.
- Dependency-free tasks are not incorrectly marked ready in the reviewed FT-012/013/014 detailed cards.
- The problem is not missing card structure; it is stale queue routing and a missing repair prerequisite for `FT-014`.

## Recommendation

- Add or route to a repair task for mounted `/api/v1/events` and cursor compatibility before `TASK-FT014-06`.
- Update active queue summary to point to `TASK-FT013-08` and the required `FT-014` repair/closure sequence.
