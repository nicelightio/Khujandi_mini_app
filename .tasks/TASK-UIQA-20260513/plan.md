---
description: Playwright UI QA orchestration plan for staging user flows on 2026-05-13.
status: active
---
# TASK-UIQA-20260513 Plan

## Context

- Role: orchestrator.
- Base URL: `https://staging-tgmeal.natureonzoom.win`.
- Harness: guarded staging fixed-persona UI QA from `.memory-bank/testing/staging-ui-qa.md`.
- Evidence location: `.tasks/TASK-UIQA-20260513/`.
- Secrets: `E2E_TEST_TOKEN` comes from ignored `.env` and must not be logged.

## Micro-check

- Owning slices: `catalog`, `checkout-payment`, `delivery-tracking`, `delivery-assignment`, `order-cancellation`, `admin-access`, `reviews-feedback`, plus runtime/testing `FT-018`.
- Owning contours: `mini-app`, `seller-web`, `admin-web`; bot-only flows are checked only through available staging UI/runtime surrogates unless a bot runtime test is explicitly run separately.
- Touched layers: test orchestration/evidence only; no product/runtime code changes planned unless UI QA finds minor defects.
- Shared extraction: none justified.

## User Flow Matrix

1. Customer mini-app: language/start showcase, `/shops`, storefront product selection, cart composition, `/checkout`, mock paid order, tracking entry.
2. Customer status: paid order tracking, event/polling visibility, terminal/customer-safe status copy.
3. Seller catalog: fixed seller session, `/seller/shops/status`, owned shop visibility, `WORKING/NOT_WORKING` status workflow, no delete UI.
4. Admin auth and provisioning: `/admin/login`, protected shell, `/admin/catalog/shops/provision`, duplicate/conflict feedback if visible.
5. Admin/operator delivery ops: `/admin/orders/assignment`, delayed/unassigned alert, status history, safe operator actions visible only where allowed.
6. Admin cancellation/refund: `/admin/orders/cancellation`, controlled cancellation/refund states, no client cancellation path.
7. Negative auth states: protected admin/seller routes without fixed session show controlled auth/recovery instead of data leakage.
8. Reviews/bot boundary: record whether browser UI exposes review/alert evidence; do not count browser UI QA as Telegram bot trust-boundary evidence.

## Agent Runs

- `customer`: end-to-end mini-app order flow from public browse to mock payment and tracking.
- `seller`: seller-web status and owned storefront visibility checks.
- `admin`: admin/provisioning/operator/cancellation checks.
- `negative`: no-session and route/auth boundary checks.

## Triage Rules

- Minor copy, route, visibility, selector, loading/error-state, or deterministic staging fixture issues may be fixed by implementer subagents.
- Major product behavior, auth/payment trust-boundary, architecture/slice ownership, public contract, or irreversible staging/deploy changes require consultation with the human before implementation.
