---
description: Execution plan for TASK-FT004-07.
status: active
---
# TASK-FT004-07 Plan

## Inputs strategy
- Audit the existing `delivery-assignment` backend/frontend suites against the `FT-004` acceptance criteria and task-card quality gates.
- Reuse current implementation and add only focused verification where acceptance coverage is still implicit instead of explicit.
- Sync Memory Bank and task/backlog state only after the final verification basis is stable.

## Planned steps
1. Inspect the existing assignment tests and identify any missing feature-level verification for backend acceptance, admin smoke, and targeted notification evidence.
2. Add the smallest missing test coverage or harness updates needed for deterministic repo-local execution.
3. Run focused verification commands and record the executed evidence.
4. Perform docs-first sync for `FT-004`, RTM, backlog, changelog, project index, and final task report.

## Constraints
- Do not add post-assignment lifecycle behavior from `FT-005`.
- Do not add admin login/session ownership from `FT-007`.
- Keep changes inside verification, evidence, and documentation sync unless a minimal bug fix is required by failing tests.

## Verification targets
- `FT-004` acceptance criteria are explicitly covered by backend integration/unit and admin frontend smoke evidence.
- Actor-targeted `order.assigned` notification evidence remains explicit and no-broadcast by default.
- RTM, backlog status, and feature/index/changelog wording stay aligned after PASS.
