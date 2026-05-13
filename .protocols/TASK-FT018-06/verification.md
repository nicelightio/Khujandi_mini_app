---
description: Verification notes for TASK-FT018-06 server staging deploy profile.
status: active
---
# TASK-FT018-06 Verification

## Verdict

- Result: `PARTIAL`
- Date: `2026-05-13`
- Scope verified: server staging Compose/Traefik/deploy isolation and production regression safety.
- Summary: previous dirty-check blocker is fixed; static deploy/compose safety checks pass; required Docker Compose render remains blocked because this environment has no Docker Compose binary.

## Required Evidence

- Production compose config renders with production defaults and without staging/test auth mode.
- Staging compose config renders with distinct host, project, router/service prefix, runtime volume and log/state paths.
- Deploy script/config keeps GitHub-only fast-forward checkout safety.
- Deploy script/config avoids destructive Docker/system operations.
- Health check targets are parameterized and can target staging host separately from production host.
- No secrets are printed in docs, logs or verification notes.

## Commands

- `bash -n deploy/scripts/tgmeal-deploy-alma.sh`: `PASS`.
- `rg -n -- '--porcelain --untracked-files=all|require_clean_git_checkout|compose config|compose build|git -C "\$\{APP_DIR\}" fetch|git -C "\$\{APP_DIR\}" pull' deploy/scripts/tgmeal-deploy-alma.sh`: `PASS`.
- `node` YAML parser load for `docker-compose.yml`: `PASS`.
- Node static interpolation comparison for production/staging labels, env, volume and mount path: `PASS`.
- Static destructive-command/shared-infra scan over deploy/compose/staging docs: `PASS`; forbidden commands appear only as documented prohibitions, not executable deploy actions.
- `git diff --check`: `PASS`.
- Docker Compose availability check: `BLOCKED`; neither `docker` nor `docker-compose` is available.
- Production `docker compose config`: `BLOCKED`; not run because Docker Compose is unavailable.
- Staging `docker compose config`: `BLOCKED`; not run because Docker Compose is unavailable.

## Static Render Evidence

Production defaults:

- Host: `tgmeal.natureonzoom.win`.
- Traefik router/service/middleware prefix: `tgmeal`.
- Runtime volume: `tgmeal_catalog_runtime_data`.
- Runtime mount: `/var/lib/khujandi`.
- Runtime mode: `APP_ENV=production`, `NODE_ENV=production`, `PAYMENT_PROVIDER=`, `DEBUG=FALSE`, `E2E_TEST_MODE=FALSE`.

Explicit staging env:

- Host: `staging-tgmeal.natureonzoom.win`.
- Traefik router/service/middleware prefix: `tgmeal-staging`.
- Runtime volume: `tgmeal_staging_runtime_data`.
- Runtime mount: `/var/lib/khujandi-staging`.
- Runtime mode: `APP_ENV=staging`, `NODE_ENV=staging`, `PAYMENT_PROVIDER=mock`, `DEBUG=TRUE`, `E2E_TEST_MODE=TRUE`.

## Deploy Script Review

- Production defaults remain `/srv/tgmeal/app`, project `tgmeal`, host `tgmeal.natureonzoom.win`, prefix `tgmeal`, volume `tgmeal_catalog_runtime_data`, runtime dir `/var/lib/khujandi`, logs `/var/log/tgmeal`, branch `main`.
- Staging is opt-in through explicit env: `APP_DIR`, `COMPOSE_PROJECT_NAME`, `TGMEAL_HOST`, `TRAEFIK_ROUTER_PREFIX`, `TGMEAL_RUNTIME_VOLUME`, `TGMEAL_RUNTIME_DIR`, `LOG_DIR`, `DEPLOY_BRANCH`.
- GitHub-only remote check, fast-forward pull and local/origin HEAD equality checks remain.
- Fixed blocker: `require_clean_git_checkout` refuses any modified, staged, or untracked files by checking `git status --porcelain --untracked-files=all`.
- The clean-check runs after the initial status log and again after fast-forward/HEAD equality, before `docker compose config` and later build context use.
- No destructive Docker cleanup commands were added.
- Public HTTPS check uses configured `PUBLIC_HOST`.

## Files Changed By This Verification

- `.protocols/TASK-FT018-06/verification.md`
- `.tasks/TASK-FT018-06/TASK-FT018-06-S-VERIFY-final-report-code-02.md`

## Blockers

- Required Docker Compose render checks remain `BLOCKED` in this local environment because neither `docker` nor `docker-compose` is installed.

## Scope Guard

- Do not run a real deploy without orchestrator approval.
- Do not modify shared Traefik config or PhotoChanger resources.
- Do not remove Docker volumes or run broad cleanup commands.
