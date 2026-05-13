---
description: Контракт staging-only test auth harness для безопасного UI QA без реального Telegram login.
status: active
---
# Staging Test Auth Harness Contract

## Purpose

Provide a safe non-production way for Playwright, `ui_qa`, and manual testers to obtain authenticated sessions for fixed personas without going through real Telegram WebApp login.

This contract exists only for staging/test runtime. It does not change production auth, payment or Telegram trust boundaries.

## Ownership

- Runtime/test harness owner: `FT-018`.
- Mini App session primitive owner: `checkout-payment`.
- Seller capability owner: `catalog`.
- Admin/operator session primitive owner: `admin-access`.
- Courier lifecycle owner: `delivery-assignment` and `delivery-tracking`.
- Shared extraction: not justified unless a tiny env guard helper is needed for repeated fail-closed checks.

## Guard Rules

The harness may be mounted only when all runtime guard checks pass:

- `E2E_TEST_MODE=TRUE`.
- `NODE_ENV !== "production"`.
- `APP_ENV=staging` or explicit local staging equivalent.
- Public server staging endpoints require `X-E2E-Test-Token`.

Production behavior:

- If `NODE_ENV=production`, test routes MUST be absent or return `404`.
- If `E2E_TEST_MODE` is not true, test routes MUST be absent or return `404`.
- If the route is mounted but token validation fails, return `403`.
- Startup SHOULD fail closed when production env attempts to enable `E2E_TEST_MODE=TRUE`.

## Endpoints

### `GET /api/v1/health`

Purpose: non-secret health and mode check for humans, deploy scripts and UI QA.

Allowed without `X-E2E-Test-Token` if it returns only non-sensitive data.

Response shape:

```json
{
  "ok": true,
  "appEnv": "staging",
  "nodeEnv": "staging",
  "debug": true,
  "paymentProvider": "mock",
  "e2eTestMode": true,
  "version": "git-sha-or-build-id"
}
```

Forbidden:

- secrets;
- raw Telegram payloads;
- session ids or cookie values;
- database URLs.

### `GET /api/v1/test/personas`

Purpose: expose fixed test persona keys and safe display labels for UI QA.

Guards: test mode + non-production + token.

Response shape:

```json
{
  "personas": [
    { "key": "client_alina", "contour": "mini-app", "role": "client" },
    { "key": "seller_plov", "contour": "mini-app", "role": "seller" },
    { "key": "admin_boss", "contour": "admin-web", "role": "admin" },
    { "key": "courier_7", "contour": "telegram-bot", "role": "courier" }
  ]
}
```

### `POST /api/v1/test/session`

Purpose: create a real runtime session for a fixed persona.

Guards: test mode + non-production + token.

Request:

```json
{
  "persona": "client_alina"
}
```

Allowed persona keys:

- `client_alina`
- `seller_plov`
- `admin_boss`
- `operator_manager`
- `courier_7`

The endpoint MUST ignore or reject arbitrary identity fields such as `telegramId`, `userId`, `role`, `shopId`, `adminAccountId` and `password`.

Session behavior:

- `client_alina` creates a `checkout-payment` Mini App HttpOnly cookie session.
- `seller_plov` creates a Mini App HttpOnly cookie session and relies on seeded `catalog` seller binding for seller access.
- `admin_boss` creates an `admin-access` HttpOnly cookie session.
- `operator_manager` creates an `admin-access` HttpOnly cookie session when the runtime supports that role as a distinct seeded account.
- `courier_7` creates only the narrow test identity/session needed for runtime checks; it must not pretend to be real Telegram transport verification.

Response:

```json
{
  "persona": "client_alina",
  "contour": "mini-app",
  "role": "client",
  "session": {
    "transport": "httpOnlyCookie",
    "expiresAt": "2026-05-13T12:00:00.000Z"
  }
}
```

Cookie values are set in `Set-Cookie` headers and MUST NOT be echoed in JSON.

### `POST /api/v1/test/reset`

Purpose: reset staging state to a known empty or baseline seed state.

Guards: test mode + non-production + token.

Allowed scope:

- staging-only local files under configured staging state paths;
- staging-only named volumes/state records;
- in-memory runtime state.

Forbidden:

- production volumes;
- production database;
- shared infrastructure;
- destructive Docker/system cleanup.

### `POST /api/v1/test/seed`

Purpose: seed a deterministic scenario after reset.

Guards: test mode + non-production + token.

Baseline scenario keys:

- `baseline_catalog`
- `checkout_happy`
- `seller_owned_shop`
- `operator_orders`
- `delivery_happy_path`

Seed data must be deterministic and must not depend on production identities.

## Audit And Logging

Allowed log fields:

- event type: `test_session_created`, `test_reset`, `test_seed`;
- persona key;
- scenario key;
- requester IP/user agent if already part of normal HTTP logs;
- trace id.

Forbidden log fields:

- `X-E2E-Test-Token`;
- cookie/session values;
- raw Telegram `initData`;
- Telegram bot token;
- payment provider secrets;
- database URL.

## Error Behavior

- Production route absence: `404`.
- Test mode disabled: `404`.
- Missing/wrong token: `403`.
- Unknown persona/scenario: `400 VALIDATION_ERROR`.
- Seed/reset conflict: controlled `{ error, trace_id }` shape per project error contract.

## Verification Requirements

- Production-like runtime with `NODE_ENV=production` cannot mount or use test routes.
- Non-production runtime with `E2E_TEST_MODE` disabled cannot use test routes.
- Staging runtime requires `X-E2E-Test-Token` for test routes.
- Arbitrary identity body fields are ignored/rejected.
- Persona sessions use the same cookie names/session validation path as normal auth contours.
- Session identifiers are not returned in JSON or written to logs.

## Source Artifacts

- [.memory-bank/features/FT-018-staging-runtime-and-test-auth-harness.md](../features/FT-018-staging-runtime-and-test-auth-harness.md): feature scope and acceptance.
- [.memory-bank/contracts/telegram-mini-app-auth-contract.md](telegram-mini-app-auth-contract.md): Mini App auth/session boundary.
- [.memory-bank/contracts/admin-auth-contract.md](admin-auth-contract.md): admin auth/session boundary.
- [.memory-bank/contracts/catalog-seller-access-and-session.md](catalog-seller-access-and-session.md): seller access over Telegram-linked identity.
- [.memory-bank/contracts/payment-confirmation-contract.md](payment-confirmation-contract.md): mock payment guardrails.
- [.memory-bank/runbooks/staging-runtime-and-ui-qa.md](../runbooks/staging-runtime-and-ui-qa.md): operational use.
