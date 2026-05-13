---
description: Final implementation report for TASK-FT018-06 server staging deploy profile.
status: active
---
# TASK-FT018-06 Final Report

## Result

Implemented the server staging deploy profile parameterization in Compose/deploy config and updated operational docs. No deploy was run.

Production defaults remain production-safe:

- project: `tgmeal`;
- host: `tgmeal.natureonzoom.win`;
- Traefik router/service/middleware prefix: `tgmeal`;
- runtime volume: `tgmeal_catalog_runtime_data`;
- runtime mount path: `/var/lib/khujandi`;
- `APP_ENV=production`, `NODE_ENV=production`, `PAYMENT_PROVIDER=`, `DEBUG=FALSE`, `E2E_TEST_MODE=FALSE`.

Staging requires explicit env/project/host/prefix/runtime isolation:

- project: `tgmeal-staging`;
- host: `staging-tgmeal.natureonzoom.win`;
- prefix: `tgmeal-staging`;
- volume: `tgmeal_staging_runtime_data`;
- runtime path: `/var/lib/khujandi-staging`;
- `APP_ENV=staging`, `NODE_ENV=staging`, `PAYMENT_PROVIDER=mock`, `DEBUG=TRUE`, `E2E_TEST_MODE=TRUE`.

## Files Inspected

- `AGENTS.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `.memory-bank/index.md`
- `doc/ARCHITECTURE.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/features/FT-018-staging-runtime-and-test-auth-harness.md`
- `.memory-bank/runbooks/staging-runtime-and-ui-qa.md`
- `.memory-bank/runbooks/telegram-mini-app-container-deploy.md`
- `.memory-bank/architecture/deployment-and-runtime-topology.md`
- `.memory-bank/tasks/plans/IMPL-FT-018.md`
- `.memory-bank/guides/staging-server-usage.md`
- `.protocols/TASK-FT018-06/context.md`
- `.protocols/TASK-FT018-06/plan.md`
- `.protocols/TASK-FT018-06/progress.md`
- `.protocols/TASK-FT018-06/verification.md`
- `.tasks/TASK-FT018-02/*`
- `.env.example`
- `docker-compose.yml`
- `deploy/scripts/tgmeal-deploy-alma.sh`
- `.github/workflows/deploy-prod.yml`

## Files Changed

- `docker-compose.yml`
- `deploy/scripts/tgmeal-deploy-alma.sh`
- `.env.example`
- `.memory-bank/runbooks/staging-runtime-and-ui-qa.md`
- `.memory-bank/guides/staging-server-usage.md`
- `.memory-bank/runbooks/telegram-mini-app-container-deploy.md`
- `.memory-bank/architecture/deployment-and-runtime-topology.md`
- `.protocols/TASK-FT018-06/progress.md`
- `.protocols/TASK-FT018-06/verification.md`
- `.tasks/TASK-FT018-06/TASK-FT018-06-S-IMPL-final-report-code-01.md`

## Scope Notes

- Owning capability: runtime/testing enablement.
- Owning contour: server staging runtime/deploy path, all UI contours via edge routing, no product behavior.
- Touched layers: infrastructure/deploy config and operational docs.
- Shared justification: none.

## Behavior

- Compose Traefik labels now use list-form labels so `TRAEFIK_ROUTER_PREFIX` can safely parameterize router/service/middleware names.
- Compose runtime storage now supports `TGMEAL_RUNTIME_VOLUME` and `TGMEAL_RUNTIME_DIR`, preserving production defaults and allowing staging to render isolated volume and runtime paths.
- Compose passes `E2E_TEST_TOKEN` to the API container only when explicitly configured; default is empty.
- Deploy script exports the routing/storage isolation variables into `docker compose` while preserving production defaults.
- Deploy script config-log redaction includes `E2E_TEST_TOKEN`.
- Staging docs now include explicit `TRAEFIK_ROUTER_PREFIX`, `TGMEAL_RUNTIME_VOLUME` and `TGMEAL_RUNTIME_DIR`.

## Checks Run

- `bash -n deploy/scripts/tgmeal-deploy-alma.sh` — PASS.
- `python3` YAML parse for `docker-compose.yml` — PASS.
- Static interpolation comparison for production/staging labels, env, volume and mount path — PASS.
- Deploy script dry/read review — PASS.
- `git diff --check` — PASS.

## Checks Blocked

- `docker compose --project-name tgmeal -f docker-compose.yml config` — BLOCKED; local environment has no `docker`/`docker-compose` binary.
- Staging `docker compose config` render with explicit env/project/host/prefix — BLOCKED for the same reason.

## Blockers/Risks

- Required Compose render should be rerun in an environment with Docker Compose before merge/deploy.
- No server deploy was attempted.
- The working tree already contained unrelated FT-018 and runtime changes before this task; they were not reverted.

## Recommendation

Have the orchestrator/verifier run the two required Compose render commands where Docker Compose is available, then proceed to TASK-FT018-07 security/final verification if render output confirms the static evidence.
