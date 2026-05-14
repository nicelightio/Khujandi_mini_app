---
description: Implementation plan for TASK-FT019-05 Staff cards and history read models.
status: active
---
# TASK-FT019-05 Plan

## Plan

1. Extend slice-local domain read-model types for Staff card/history data.
2. Add read-only courier Staff card projection in `delivery-assignment`, accepting review-derived inputs instead of reading review ownership directly.
3. Add review-derived rating-1 courier problem evidence in `reviews-feedback`.
4. Add read-only operator processed/problem order history projection in `delivery-tracking`.
5. Add operator Staff card composition in `admin-access`, accepting delivery-tracking order history inputs.
6. Add focused unit tests for courier/operator card fields, lifecycle/history, rating history, last-10 limits and problem blocks.
7. Run focused Jest, focused ESLint, relevant package tests as feasible, and `git diff --check`.
8. Record verification status, handoff and final implementation report without self-claiming final verifier PASS.

## Acceptance Notes

- Courier problem block includes unfinished assigned orders, rating-1 client review evidence and a defensive future-`FAILED` string bucket if such source data appears.
- Operator problem block includes future-`FAILED` source data if present or write-touched orders not personally completed by that operator.
- Card read models expose read-only data and no mutation affordances.
