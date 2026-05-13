---
description: Прогресс выполнения TASK-FT018-06 server staging deploy profile.
status: active
---
# TASK-FT018-06 Progress

## 2026-05-13

- Protocol artifact created from FT-018 feature spec, staging runbook, deployment topology and implementation handoff.
- Task is execution-ready but not implemented in this subtask.
- Micro-check recorded for implementation:
  - Owning capability: runtime/testing enablement.
  - Owning contour: server staging runtime/deploy path, all UI contours via edge routing, no product behavior.
  - Touched layers: infrastructure/deploy config and operational docs.
  - Shared justification: none.
- Implemented minimal Compose/deploy parameterization:
  - `TRAEFIK_ROUTER_PREFIX` controls Traefik router/service/middleware label names with production default `tgmeal`.
  - `TGMEAL_RUNTIME_VOLUME` controls the named runtime volume with production default `tgmeal_catalog_runtime_data`.
  - `TGMEAL_RUNTIME_DIR` controls the in-container runtime mount path with production default `/var/lib/khujandi`.
  - `E2E_TEST_TOKEN` is passed into the API container only from explicit env/.env and redacted from deploy script config logs.
- Updated `.env.example`, staging runbook, staging usage guide, production container deploy runbook and deployment topology docs with staging isolation variables.
- Current status: `implemented-with-local-compose-render-blocked`.

## Implementation Notes Placeholder

- Required `docker compose config` checks could not run locally because this environment has no `docker` or `docker-compose` binary.
- Static render evidence using the same Compose interpolation shape showed:
  - Production defaults: host `tgmeal.natureonzoom.win`, router/service prefix `tgmeal`, volume `tgmeal_catalog_runtime_data`, mount `/var/lib/khujandi`, `APP_ENV=production`, `NODE_ENV=production`, `PAYMENT_PROVIDER=`, `DEBUG=FALSE`, `E2E_TEST_MODE=FALSE`.
  - Staging explicit env: host `staging-tgmeal.natureonzoom.win`, router/service prefix `tgmeal-staging`, volume `tgmeal_staging_runtime_data`, mount `/var/lib/khujandi-staging`, `APP_ENV=staging`, `NODE_ENV=staging`, `PAYMENT_PROVIDER=mock`, `DEBUG=TRUE`, `E2E_TEST_MODE=TRUE`.
- Deploy script dry/read review:
  - Keeps GitHub-only remote check, dirty checkout refusal, fast-forward branch checkout and origin HEAD equality check.
  - Keeps production defaults for `APP_DIR`, `COMPOSE_PROJECT_NAME`, `TGMEAL_HOST`, `TRAEFIK_ROUTER_PREFIX`, `TGMEAL_RUNTIME_VOLUME`, `TGMEAL_RUNTIME_DIR`, `LOG_DIR` and `DEPLOY_BRANCH`.
  - Uses configured `PUBLIC_HOST` for public HTTPS checks, so staging command targets the staging host.
  - No deploy was run.
- Available checks:
  - `bash -n deploy/scripts/tgmeal-deploy-alma.sh` — PASS.
  - `python3` YAML parse for `docker-compose.yml` — PASS.
  - static render comparison for production/staging interpolation — PASS.
  - `git diff --check` — PASS.

## 2026-05-13 Fix: dirty checkout fail-closed

- Addressed verifier blocker in `deploy/scripts/tgmeal-deploy-alma.sh`.
- Added `require_clean_git_checkout`, using `git status --porcelain --untracked-files=all`.
- The deploy script now fails closed when the deploy checkout has any modified, staged, or untracked files.
- The clean-check runs:
  - before fetch/pull, immediately after logging current git state;
  - after fast-forward + `HEAD == origin/${DEPLOY_BRANCH}` verification and before `docker compose config` / build context usage.
- Existing GitHub remote check, fast-forward deploy branch flow, local/origin HEAD equality check and non-destructive Docker behavior were kept.
- No deploy was run.
- Fix checks:
  - `bash -n deploy/scripts/tgmeal-deploy-alma.sh` — PASS.
  - `git diff --check` — PASS.
  - `rg -n -- '--porcelain --untracked-files=all|require_clean_git_checkout|docker build context' deploy/scripts/tgmeal-deploy-alma.sh` — PASS.
