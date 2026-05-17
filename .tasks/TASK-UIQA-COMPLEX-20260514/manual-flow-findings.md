# TASK-UIQA-COMPLEX-20260514 Manual Flow Findings

## Context

- Environment: public staging `https://staging-tgmeal.natureonzoom.win`.
- Date: 2026-05-14.
- Manual tester roles: human operator and courier.
- Target flow: client paid order -> operator assignment offer -> courier claim/progress -> operator completion -> two-sided reviews.

## Findings

### F1: Courier attention block duplicates unassigned attention content when multiple unassigned orders exist

Severity: Low/UX.

Evidence:
- Operator panel displayed two entries in the top courier-attention block after a new checkout-created order appeared:
  - seeded/demo order `order-created-1001`;
  - checkout-created order `order-runtime-1`.
- The block is technically reflecting two unassigned orders, but the UX reads like repeated "not accepted" messaging and makes it unclear which order belongs to the current test flow.

Recommendation:
- Add clearer grouping/copy for multiple unassigned orders, and visually distinguish seeded/demo orders from fresh checkout-created orders in staging.

### F2: Manual targeted offer uses raw prompt and courier id instead of selectable courier list

Severity: Medium/UX.

Evidence:
- Clicking `Персональное предложение` opens browser prompt `ID курьера для ожидающего персонального предложения`.
- Tester expected a list of available couriers by nickname, e.g. `Луганский`, not an internal id.
- Current working internal id for the tester-created courier is `courier-staff-1`.

Recommendation:
- Replace `window.prompt` with an in-panel selector populated from active/free courier staff.
- Show nickname and Telegram id in the option label; submit stable `courierUserId` internally.

### F3: Manual offer on seeded `order-created-1001` returned HTTP 404

Severity: Medium/test-flow blocker.

Evidence:
- Browser network log showed `POST /api/v1/admin/orders/order-created-1001/assignment-offers` returned `404`.
- The same order is visible in the operator panel as an unassigned row.
- This suggests a command/read-model mismatch for seeded/demo rows or a seeded order not suitable for assignment commands.

Recommendation:
- Ensure every row exposed in the operator assignment table is commandable through the same `orderId`, or mark seeded/demo rows as non-commandable with clear disabled action reason.
- For the current manual QA flow, use checkout-created `order-runtime-1`, not seeded `order-created-1001`.

### F4: Newly created courier is Staff-active but not delivery-work-active

Severity: Medium/manual-flow blocker.

Evidence:
- Manual offer for checkout-created `order-runtime-1` and courier `courier-staff-1` returned `409`.
- Diagnostic operator request returned error code `COURIER_UNAVAILABLE` with details `active=false`, `free=true`.
- Staff panel lists the courier as active staff, but delivery assignment requires a separate courier work availability state.

Recommendation:
- Expose courier work availability state clearly in Staff/operator panels, or provide a staging tester harness/control for activating a courier without relying on a real Telegram bot during UI QA.
- Current intended product path is Telegram bot menu: `Курьер` -> `Выйти на работу` / `Завершить прием заказов через 5 минут` / auto-offer toggle.

### F5: Staging has no real Telegram bot runtime wired for courier actions

Severity: High/end-to-end flow blocker.

Evidence:
- Staging server env has `APP_ENV=staging`, `PAYMENT_PROVIDER=mock`, `E2E_TEST_MODE=TRUE`, but `TELEGRAM_BOT_TOKEN` is still a test/non-real value.
- Local runtime search shows Telegram bot contract/harness/notifier code, but no mounted HTTP webhook or polling route in `backend/src/dev-runtime/dev-api-server.ts`.
- The current API server mounts health, test state/session, mini-app, catalog, staff, and admin order operation routes; it does not mount a real Telegram update ingress route.

Recommendation:
- Create a dedicated staging Telegram bot and configure staging with its token; do not reuse the production bot.
- Add/enable a staging-safe Telegram update ingress path before treating courier activation, courier claim/status progression, and bot reviews as real-client testable.
- Until that exists, use a test harness or server-side diagnostic command only for controlled QA, and keep the finding open as missing production-like bot evidence.

### F6: Operator assignment table is too wide for the working viewport

Severity: Medium/UX.

Evidence:
- The current operator assignment view uses 8 table columns: order, urgency, status, courier, assigned/claimed, latest message, actions, history.
- At around 1024px width, action buttons become cramped and the row loses scanability.
- CSS gives regular cells a minimum width and action cells their own minimum width, so horizontal overflow is expected rather than incidental.

Recommendation:
- Replace the 8-column desktop table with a table-card hybrid using 4 semantic columns: `Заказ`, `Курьер`, `Последнее сообщение`, `Действия`.
- Move urgency and status into the `Заказ` column as compact chips/details; move assigned/claimed into the `Курьер` column as quiet secondary rows.
- Move `История` into the actions area instead of a dedicated column.
- For narrow/mobile layouts, switch to per-order cards instead of horizontal table scrolling.
- Keep the top courier attention block, but make it more compact with a count and chips; avoid blinking the whole block.

## Security Note

Manual browser logs included session cookie values. Do not paste cookies/tokens in future QA notes. Treat the leaked staging operator session as temporary and log out after the run.
