---
description: Implementation plan for TASK-FT016-10 atomic courier claim.
status: active
---
# TASK-FT016-10 Plan

## Steps

1. Mark task/run state `in_progress` in active backlog and autonomous run protocol.
2. Add slice-local claim command types and service method.
3. Implement repository transaction/conditional persistence for pending offer claim:
   - pending claimable offer belongs to claimant or is broadcast;
   - order status `CREATED|DELAYED`;
   - empty `courierId`;
   - courier active/free;
   - first successful claimant wins.
4. Add Telegram bot claim callback parser/executor in the existing bot integration boundary.
5. Add focused unit/integration/runtime coverage:
   - atomic first-claim-wins;
   - wrong claimant;
   - invalid status;
   - unavailable/busy courier;
   - no pre-claim `ASSIGNED`;
   - event only after successful claim;
   - duplicate callback controlled reject.
6. Run focused checks and `git diff --check`.
7. Update task protocol/report, backlog/status/changelog to `implemented` / `ready_for_verify`.

## Non-Goals

- No timeout or delayed evaluator.
- No auto-offer fan-out.
- No status progression after `ASSIGNED`.
- No cleanup/removal of legacy direct assignment.
- No admin manual claim UI.
