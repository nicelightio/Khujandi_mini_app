---
description: Implementation plan for TASK-FT016-12 offer timeout evaluator.
status: active
---
# TASK-FT016-12 Plan

## Steps

1. Mark `TASK-FT016-12` as `in_progress` in backlog and autonomous run status.
2. Inspect current delivery-assignment service, repository, notifier and runtime route patterns from prior FT-016 tasks.
3. Add slice-local timeout evaluator command with injected clock/cutoffs:
   - repeat pending offers once at `createdAt + 3 minutes`;
   - expire pending offers at `createdAt + 6 minutes`;
   - set/keep order `DELAYED` only for unassigned `CREATED|DELAYED` orders;
   - persist events/history/audit/penalty before notifications.
4. Add narrow manual tick/runtime harness only if existing dev-runtime admin command surface supports it.
5. Add focused tests for repeat-once, six-minute expiry/`DELAYED`, idempotency, accepted/assigned skip, no claim/broadcast side effects, and personal-only penalty.
6. Run focused checks and `git diff --check`.
7. Update task protocol/report plus backlog/status/changelog to `ready_for_verify`.

## Non-Goals

- No background worker, cron deployment, Redis, queues or microservice.
- No new claim logic or atomic claim changes.
- No auto-offer broadcast changes or auto-accept.
- No `PICKED_UP`, completion, post-`ASSIGNED` progression or legacy direct-assignment cleanup.
- No broad admin panel rewrite.
