# TASK-FT006-05 Plan

1. Add command-level input handling for manual refund updates without expanding into frontend wiring or provider integrations.
2. Enforce backend validation for authenticated operator access, cancelled paid-order scope, `PENDING_MANUAL -> DONE/REJECTED` progression, and required refund note persistence.
3. Keep repository writes transactional and reuse the existing audit/event path for `order.refund_updated`.
4. Extend repo-local unit/integration coverage for paid cancellation visibility, refund progression, note persistence, and side-effect-free invalid paths.
5. Sync protocol docs, backlog/Memory Bank status docs, and write the final implementation report.
