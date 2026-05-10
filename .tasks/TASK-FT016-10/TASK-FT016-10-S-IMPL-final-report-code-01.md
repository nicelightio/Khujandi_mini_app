---
description: Final implementation report for TASK-FT016-10 atomic courier claim.
status: active
---
# TASK-FT016-10 Final Report

## Scope

- Owning slice: `delivery-assignment`.
- Contour: `telegram-bot` through callback/harness boundary, backed by backend application/infra.
- Touched layers: application, domain, infra/persistence, dev-runtime test seam, Telegram bot harness, focused tests, task docs.
- Shared extraction: none; existing shared error/runtime/event primitives were reused.

## Implementation Summary

- Added `claimOffer` command to the delivery-assignment service/controller and repository contract.
- Added repository conditional transaction for first-claim-wins:
  - claimable offer must be `PENDING`;
  - manual offer must belong to the claimant; broadcast offer may have no target courier;
  - order must be unassigned and in `CREATED|DELAYED`;
  - courier must be active/free;
  - success sets `courierId`, status `ASSIGNED`, marks the accepted offer `CLAIMED`, cancels sibling pending offers, writes history/audit/event, and returns string `revision`.
- Added Telegram bot claim harness with callback data builder/parser and service-boundary executor. It stays transport-only and performs no direct Prisma writes.
- Preserved legacy direct assignment path unchanged as explicit migration baseline.
- Did not add `assignedAt` to Prisma because the current schema does not represent it; existing runtime/read model can derive assigned/claimed time from status history/runtime metadata.

## Tests / Checks

- `npm run test:delivery-assignment -- --runInBand` — PASS, 4 suites / 38 tests.
- `git diff --check` — PASS.

## Residual Risks

- True multi-process database contention depends on PostgreSQL transaction isolation and the conditional `updateMany` path; focused tests prove the repository contract and duplicate/concurrent behavior at repo-local level.
- Admin/operator notification after successful claim is limited to existing courier notification boundary; no new operator fan-out was added because no existing local mechanism was in scope.
- Timeout/`DELAYED` evaluator, auto-offer broadcast, and post-`ASSIGNED` lifecycle progression remain explicit follow-up scope.
