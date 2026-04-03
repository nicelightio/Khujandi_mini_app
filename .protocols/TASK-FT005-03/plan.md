---
description: Execution plan for TASK-FT005-03.
status: active
---
# TASK-FT005-03 Plan

## Goal
- Leave the repo with execution-ready frontend and bot-side harnesses for `FT-005` polling/status interactions without moving lifecycle ownership out of `delivery-tracking`.

## Planned changes
1. Add a minimal frontend `order-tracking` slice scaffold (`api/model/hook/component/route`) that stores opaque polling cursors, applies duplicate-safe event updates, and exposes courier action entrypoints.
2. Add focused frontend tests for cursor advancement, route rendering, and courier action calls.
3. Add a transport-only Telegram bot harness for courier status prompts plus callback parsing, with focused unit coverage in the existing `delivery-tracking` suite.
4. Sync backlog, feature/index/changelog, protocol docs, and the implementation report without closing RTM rows prematurely.

## Verification targets
- Frontend scaffold renders and applies ordered polling updates without numeric cursor assumptions.
- Frontend courier action UI calls explicit entrypoints instead of embedding transition rules.
- Telegram bot harness only packages/parses action intents; it does not validate or mutate delivery state.
- Backlog/Memory Bank reflect `TASK-FT005-03 -> done` while `REQ-009/010` remain open.

## Non-goals
- No `409 CONFLICT` lifecycle implementation.
- No real `GET /events` backend/controller integration beyond existing scaffold.
- No cancellation or reviews integration.
- No SLA measurements.
