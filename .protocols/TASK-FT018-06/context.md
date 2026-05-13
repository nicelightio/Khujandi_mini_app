---
description: Контекст выполнения TASK-FT018-06 server staging deploy profile.
status: active
---
# TASK-FT018-06 Context

## Scope

- Task: `TASK-FT018-06`.
- Feature: `FT-018 Staging Runtime And Test Auth Harness`.
- Goal: добавить server staging deploy profile с Compose/Traefik/deploy isolation и regression-safety для production deploy.
- Mode: implementation task; staging deploy config only, no production rollout without orchestrator approval.

## Required Spec Inputs Read

- `AGENTS.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `doc/ARCHITECTURE.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/commands/prd-to-tasks.md`
- `.memory-bank/features/FT-018-staging-runtime-and-test-auth-harness.md`
- `.memory-bank/contracts/staging-test-auth-harness-contract.md`
- `.memory-bank/runbooks/staging-runtime-and-ui-qa.md`
- `.memory-bank/testing/staging-ui-qa.md`
- `.memory-bank/tasks/plans/IMPL-FT-018.md`
- `.protocols/FT-018/plan.md`
- `.protocols/FT-018/handoff.md`

## Additional Context Inputs

- `.memory-bank/architecture/deployment-and-runtime-topology.md`
- `.memory-bank/runbooks/telegram-mini-app-container-deploy.md`
- `docker-compose.yml`
- `deploy/scripts/tgmeal-deploy-alma.sh`
- `.env.example`

## Micro-Check

- Owning capability/slice: `runtime/testing enablement`; not a product slice. Existing product slices are only consumers of the staged runtime.
- Owning contour: deployment/runtime contour for `mini-app`, `seller-web` and `admin-web` behind the same web origin; `telegram-bot` only if a staging bot token is explicitly provided through secrets.
- Touched layers: infrastructure/deploy config, runtime env profile docs, server runbook; no domain or product application behavior.
- Shared justification: no shared extraction justified. Parameterization belongs in deploy/config artifacts, not in shared business code.

## Boundaries

- Do not edit or deploy production server state from this task unless explicitly instructed by orchestrator.
- Do not copy local development files to server manually.
- Production deploy must keep `/srv/tgmeal/app`, Compose project `tgmeal`, host `tgmeal.natureonzoom.win` and production volume isolated from staging.
- Staging target must use `/srv/tgmeal/staging/app`, Compose project `tgmeal-staging`, staging host and separate runtime volume/log directory.
- Do not touch PhotoChanger, `/opt/photochanger`, `/opt/traefik`, production `tgmeal` containers/volumes, unrelated Docker volumes/networks or shared infra except read-only health checks.
- Do not run destructive commands: `docker system prune`, `docker volume rm`, `docker compose down -v`, mass deletes under `/var/lib/docker`.
- Do not print secrets from `.env`, `E2E_TEST_TOKEN`, Telegram bot tokens, `DATABASE_URL` or private keys.

## Dependencies And Assumptions

- Depends on `TASK-FT018-02` for staging health/mode facts and production-negative guard baseline.
- Can proceed independently of UI QA fixture polish, but should not claim full FT-018 closure before `TASK-FT018-05`.
- Assumes current production deploy path remains GitHub checkout + `/usr/local/bin/tgmeal-deploy` unless orchestrator changes the rollout model.

## Acceptance Focus

- Compose config can render for production and staging without router/service/middleware/volume collisions.
- Deploy script/config accepts explicit staging parameters (`APP_DIR`, `COMPOSE_PROJECT_NAME`, `TGMEAL_HOST`, `TRAEFIK_ROUTER_PREFIX`, `LOG_DIR`, `DEPLOY_BRANCH`) while preserving production defaults.
- Staging env uses `APP_ENV=staging`, `NODE_ENV=staging`, `DEBUG=TRUE`, `PAYMENT_PROVIDER=mock`, `E2E_TEST_MODE=TRUE` and staging state paths.
- Production-like config remains safe: no test auth, no mock payment, no staging volume/host collision.
