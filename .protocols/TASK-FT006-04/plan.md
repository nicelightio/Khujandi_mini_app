# TASK-FT006-04 Plan

1. Add command-level domain types for authorized cancellation without expanding into refund-update scope.
2. Implement service validation for auth, allowed roles, allowed states, courier unavailable-case ownership, and refund-status derivation.
3. Keep repository writes transactional and reuse the existing persistence path for order/history/audit/event commits.
4. Replace scaffold tests with focused unit/integration coverage for success and side-effect-free failure paths.
5. Sync task/backlog/Memory Bank docs and write the final implementation report.
