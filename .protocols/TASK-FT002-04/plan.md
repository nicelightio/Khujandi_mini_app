---
description: Execution plan for TASK-FT002-04.
status: active
---
# TASK-FT002-04 Plan

## Inputs strategy
- Use the task-card verify target as the primary acceptance basis.
- Reuse the existing `checkout-payment` backend scaffold and extend only the owning slice layers.
- Keep auth/session logic inside `checkout-payment`; shared additions are allowed only for narrow technical helpers.

## Planned steps
1. Add auth-focused domain/application primitives for `initData` validation, TTL checks, replay guard, and session issuance contract.
2. Implement the `POST /auth/telegram` presentation path using raw `initData` input only.
3. Add repository/infrastructure support for replay detection and user/session persistence baseline as needed by the chosen scope.
4. Add unit tests for HMAC/TTL helpers and integration tests for valid, invalid, expired, and replayed `initData`.
5. Update task-local progress/report artifacts for downstream payment tasks.

## Constraints
- Raw `initData` is the only trusted auth input.
- Replay inside TTL must be blocked.
- Session issuance must follow the fixed transport/storage policy.
- Do not implement payment finalization or order creation behavior in this task.

## Verification targets
- `POST /auth/telegram` accepts raw `initData`.
- Signature and `auth_date` are validated server-side.
- Replay is blocked.
- Session issuance follows the documented transport policy.
