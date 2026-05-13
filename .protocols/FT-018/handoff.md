---
description: Human/developer handoff for FT-018 staging server and UI QA workflow.
status: active
---
# FT-018 Handoff

## What This Delivers

`FT-018` defines a real staging runtime and a staging-only fixed-persona test auth harness for UI QA/Playwright.

Handoff теперь incremental: локальный checkout browser smoke через fixed-persona HttpOnly cookie session проходит при backend bootstrap `testSessionAuthAvailable=true`; Telegram auth на checkout в этом staging/dev harness не вызывается. Server staging checkout создан и deploy запущен из GitHub `main` commit `47a4a37`; containers подняты и отвечают через Traefik на host-local TLS route, но публичный hostname `staging-tgmeal.natureonzoom.win` пока не резолвится в DNS.

## Canonical Docs

- Feature spec: [.memory-bank/features/FT-018-staging-runtime-and-test-auth-harness.md](../../.memory-bank/features/FT-018-staging-runtime-and-test-auth-harness.md)
- Test auth contract: [.memory-bank/contracts/staging-test-auth-harness-contract.md](../../.memory-bank/contracts/staging-test-auth-harness-contract.md)
- Operational runbook: [.memory-bank/runbooks/staging-runtime-and-ui-qa.md](../../.memory-bank/runbooks/staging-runtime-and-ui-qa.md)
- Testing policy: [.memory-bank/testing/staging-ui-qa.md](../../.memory-bank/testing/staging-ui-qa.md)
- Implementation plan: [.memory-bank/tasks/plans/IMPL-FT-018.md](../../.memory-bank/tasks/plans/IMPL-FT-018.md)

## Server Shape

- Production remains `/srv/tgmeal/app`, Compose project `tgmeal`, volume `tgmeal_catalog_runtime_data`.
- Staging target is `/srv/tgmeal/staging/app`, Compose project `tgmeal-staging`, volume `tgmeal_staging_runtime_data`.
- Staging host should be explicit, for example `staging-tgmeal.natureonzoom.win`.
- Staging env is non-production: `APP_ENV=staging`, `NODE_ENV=staging`, `DEBUG=TRUE`, `PAYMENT_PROVIDER=mock`, `E2E_TEST_MODE=TRUE`.

## UI QA Workflow

1. `ui_qa` receives `UI_QA_BASE_URL` and `E2E_TEST_TOKEN` from ignored/secret config.
2. Test calls guarded `POST /api/v1/test/reset`.
3. Test calls guarded `POST /api/v1/test/seed`.
4. Test calls `POST /api/v1/test/session` with one fixed persona.
5. Browser uses returned HttpOnly cookies and runs the workflow.
6. Checkout may skip Telegram auth only when backend checkout bootstrap exposes `testSessionAuthAvailable=true`; default/production behavior still requires Telegram `initData`.

## Hard Boundaries

- No production test auth endpoint.
- No arbitrary test identities.
- No session values in JSON or logs.
- No production mock payment.
- No shared production/staging state.
- No treating UI QA as Telegram auth correctness evidence.

## Next Step

Продолжить с public staging closure: добавить/исправить DNS для `staging-tgmeal.natureonzoom.win`, затем повторить public HTTPS health/UI QA smoke. `REQ-037` не закрывать как fully verified до публичного staging URL и UI QA evidence через него.
