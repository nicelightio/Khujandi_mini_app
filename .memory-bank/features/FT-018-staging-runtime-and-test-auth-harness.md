---
description: Feature C4 L3 для настоящего staging runtime и staging-only test auth harness для UI QA.
status: active
---
# FT-018 Staging Runtime And Test Auth Harness

## REQs

- `REQ-037`
- Поддерживает verification evidence для `REQ-004`, `REQ-005`, `REQ-021`, `REQ-022`, `REQ-023`, `REQ-032`, `REQ-033`, `REQ-035`, `REQ-036`.

## Ownership

- Owning capability: runtime/testing enablement, not a customer product capability.
- Owning contours:
  - `mini-app` for customer/seller Mini App sessions and UI QA workflows.
  - `seller-web` for narrow seller admin workflows that reuse Telegram-linked identity.
  - `admin-web` for admin/operator UI QA sessions.
  - `telegram-bot` only for advisory smoke and contract/runtime tests; UI QA must not require real Telegram login.
- Touched layers:
  - `presentation`: test-only HTTP endpoints and non-secret health metadata.
  - `application`: fixed persona session bootstrap and reset/seed orchestration.
  - `infrastructure`: staging env profiles, Compose/Traefik deploy shape, state/volume separation.
- Shared extraction is not justified by default. A small local runtime guard helper may be added only if it prevents duplicated unsafe env checks across test-only endpoints.

## Purpose

Create a real staging environment that can be used by humans and `ui_qa`/Playwright for end-to-end workflow checks without depending on a real Telegram WebApp login or production payment provider.

The staging system must keep production trust boundaries intact:

- Production Telegram auth stays based on raw `initData` server-side validation.
- Production payment trust stays based on server-side provider confirmation.
- Test sessions and mock payment exist only in explicit non-production staging/runtime mode.

## Target Runtime Profiles

### Local host-OS staging

- Runs API through the repo-local Node runtime on the host OS.
- Runs frontend through Vite.
- Uses local ignored state under `.runtime/staging/`.
- Supports fast reset/seed for Playwright and manual UI QA.

Baseline command shape:

```bash
mkdir -p .runtime/staging

APP_ENV=staging NODE_ENV=staging DEBUG=TRUE PAYMENT_PROVIDER=mock \
E2E_TEST_MODE=TRUE E2E_TEST_TOKEN=local-only-token \
HOST=127.0.0.1 PORT=3001 \
ADMIN_ALLOWED_ORIGINS=http://127.0.0.1:5173,http://localhost:5173 \
ADMIN_DB_PATH=$PWD/.runtime/staging/admin-access.sqlite \
CATALOG_DB_PATH=$PWD/.runtime/staging/catalog-runtime.sqlite \
npm run dev:api
```

Frontend:

```bash
DEBUG=TRUE npm run dev:frontend
```

### Server staging

- Runs through Docker Compose and existing Traefik path.
- Uses a separate checkout from production, separate Compose project, separate public host, separate logs and separate named volumes.
- Must not share state/volumes/db with production.
- Must be deployable from GitHub checkout through an approved deploy path, not by copying local development files.

Baseline target shape:

- app checkout: `/srv/tgmeal/staging/app`
- logs: `/var/log/tgmeal/staging`
- Compose project: `tgmeal-staging`
- public host: `staging-tgmeal.natureonzoom.win` or another explicit staging-only host
- runtime volume: `tgmeal_staging_runtime_data`
- deploy branch: `staging` or another approved non-production branch

## Env Guard Rules

Required staging flags:

```bash
APP_ENV=staging
NODE_ENV=staging
DEBUG=TRUE
PAYMENT_PROVIDER=mock
E2E_TEST_MODE=TRUE
```

Production refusal:

- `E2E_TEST_MODE=TRUE` with `NODE_ENV=production` MUST fail closed before route mount or return production-safe `404`.
- `PAYMENT_PROVIDER=mock` with `NODE_ENV=production` MUST fail closed before checkout trust.
- Human-facing staging profiles SHOULD use `NODE_ENV=staging`; automated unit/runtime tests MAY use `NODE_ENV=test`.
- `DEBUG=TRUE` with `NODE_ENV=production` MUST NOT expose diagnostic/test behavior.
- Test auth endpoints MUST be absent or return `404` in production.
- Public staging test endpoints MUST require `X-E2E-Test-Token`; missing or wrong token returns `403`.

## Test Auth Harness

Canonical test endpoint shape is defined in [.memory-bank/contracts/staging-test-auth-harness-contract.md](../contracts/staging-test-auth-harness-contract.md).

Minimum routes:

- `GET /api/v1/health`
- `GET /api/v1/test/personas`
- `POST /api/v1/test/session`
- `POST /api/v1/test/reset`
- `POST /api/v1/test/seed`

`POST /api/v1/test/session` creates the same cookie/session primitives as the normal owning auth contour where applicable:

- Mini App client/seller personas use the `checkout-payment` Mini App session family.
- Seller capability comes from `catalog` seed bindings, not from a client-provided flag.
- Admin/operator personas use `admin-access` cookie session primitives.
- Courier persona may create backend test identity/session only for runtime/API harnesses; real Telegram bot correctness remains a separate verification track.

The endpoint must not accept arbitrary production identities. It selects from fixed seeded personas only.

## Fixed Personas

Baseline personas:

- `client_alina`: customer Mini App session for browse/cart/checkout/status.
- `seller_plov`: Telegram-linked seller owning one seed shop.
- `admin_boss`: admin-web session with `BOSS`/`ADMIN` capability.
- `operator_manager`: admin-web session with operator/manager capability when multi-admin runtime support exists.
- `courier_7`: courier test identity for assignment/tracking runtime checks.

Persona records must be seeded data, not request body authority.

## UI QA Workflow Scope

Allowed staging UI QA flows:

- Public catalog browse and storefront navigation.
- Product selection, cart composition, checkout, guarded mock paid order and customer status polling.
- Seller owned storefront edit/status flow.
- Admin/operator panel read, offer/status/cancellation/refund workflows where the runtime supports them.
- Negative UI states: missing session, stale composition, direct checkout, auth-required surfaces.

Forbidden evidence shortcut:

- UI QA with test sessions is not proof of Telegram auth correctness.
- Mock payment UI QA is not proof of real provider correctness.
- Real Telegram smoke remains an advisory separate run; it must not be collapsed into Playwright evidence.

## Acceptance Criteria

- A local staging profile runs from host OS with explicit non-production flags and isolated local state paths.
- A server staging profile runs through Compose/Traefik/current deploy path with a distinct host, project name and runtime volume.
- Staging supports `APP_ENV=staging`, `DEBUG=TRUE`, `PAYMENT_PROVIDER=mock` and `E2E_TEST_MODE=TRUE` without treating `NODE_ENV=development` as the payment guard or enabling these flags in production.
- Test auth endpoints are unreachable in production and token-guarded in staging.
- `POST /api/v1/test/session` creates normal session cookies for fixed personas and does not accept arbitrary identity input.
- Reset/seed strategy is documented and safe for staging-only state.
- `ui_qa` can obtain base URL and test token out of ignored/local/CI secret sources, not from Memory Bank.
- Production auth/payment trust boundaries remain unchanged.

## Out Of Scope

- Real payment provider implementation changes.
- Weakening Telegram `initData` validation.
- Production test-login or backdoor accounts.
- Reusing production database, volumes or Telegram identities for staging UI QA.
- Making `seller-web` a separate seller password contour.
- Replacing advisory real Telegram smoke with browser-only Playwright evidence.

## Source Artifacts

- [doc/ARCHITECTURE.md](../../doc/ARCHITECTURE.md): canonical slice/layer/contour rules.
- [.memory-bank/contracts/staging-test-auth-harness-contract.md](../contracts/staging-test-auth-harness-contract.md): test auth endpoint and guard contract.
- [.memory-bank/runbooks/staging-runtime-and-ui-qa.md](../runbooks/staging-runtime-and-ui-qa.md): staging run/deploy/use workflow.
- [.memory-bank/testing/staging-ui-qa.md](../testing/staging-ui-qa.md): UI QA verification split and evidence rules.
- [.memory-bank/contracts/telegram-mini-app-auth-contract.md](../contracts/telegram-mini-app-auth-contract.md): production Mini App auth boundary.
- [.memory-bank/contracts/payment-confirmation-contract.md](../contracts/payment-confirmation-contract.md): production/payment mock trust boundary.
- [.memory-bank/runbooks/e2e-mock-payment.md](../runbooks/e2e-mock-payment.md): guarded mock payment mode.
