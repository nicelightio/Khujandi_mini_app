---
description: Implementation plan for TASK-FT016-09 manual targeted offer creation.
status: active
---
# TASK-FT016-09 Plan

## Steps

1. Mark task/run state as `in_progress`.
2. Inspect existing delivery-assignment service/repository/types, admin runtime route, admin page/API tests, and Telegram harness/notifier boundaries.
3. Add backend manual offer command using the existing courier availability boundary.
4. Persist pending targeted `AssignmentOffer` and `order.offer_created` event after successful write while leaving order status unchanged.
5. Wire admin runtime/API/UI action from targeted offer placeholder to offer creation with controlled success/error states.
6. Notify courier through the existing Telegram notification/harness boundary if available.
7. Add focused backend/runtime/frontend tests.
8. Update Memory Bank operational artifacts and changelog.
9. Run focused checks and `git diff --check`.

## Out Of Scope Guard

- No courier claim or atomic first-claim-wins implementation.
- No timeout or `DELAYED` escalation.
- No auto-offer broadcast.
- No delivery status progression changes.
- No cleanup/removal of legacy direct assignment.
- No broad admin panel rewrite.
