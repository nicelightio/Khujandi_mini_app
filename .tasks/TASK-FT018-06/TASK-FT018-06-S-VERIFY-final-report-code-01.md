---
description: Independent verifier report for TASK-FT018-06 server staging deploy profile.
status: active
---
# TASK-FT018-06 Verifier Report

## Result

`FAIL`

Static Compose/deploy evidence is mostly aligned with FT-018 staging isolation, but the deploy script does not fully satisfy the dirty-checkout safety requirement: it refuses staged/unstaged diffs, but it does not fail on untracked files before building from the repo as Docker context.

Docker Compose render checks are also `BLOCKED` in this environment because neither `docker` nor `docker-compose` is installed locally.

## Files Inspected

- `AGENTS.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `doc/ARCHITECTURE.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/features/FT-018-staging-runtime-and-test-auth-harness.md`
- `.memory-bank/contracts/staging-test-auth-harness-contract.md`
- `.memory-bank/architecture/deployment-and-runtime-topology.md`
- `.memory-bank/runbooks/staging-runtime-and-ui-qa.md`
- `.memory-bank/testing/staging-ui-qa.md`
- `.memory-bank/runbooks/telegram-mini-app-container-deploy.md`
- `.memory-bank/guides/staging-server-usage.md`
- `.tasks/TASK-FT018-06/TASK-FT018-06-S-IMPL-final-report-code-01.md`
- `docker-compose.yml`
- `deploy/scripts/tgmeal-deploy-alma.sh`
- `.env.example`

## Files Changed

- `.protocols/TASK-FT018-06/verification.md`
- `.tasks/TASK-FT018-06/TASK-FT018-06-S-VERIFY-final-report-code-01.md`

## Checks Run

- `bash -n deploy/scripts/tgmeal-deploy-alma.sh` - `PASS`
- `python3` YAML parser load for `docker-compose.yml` - `PASS`
- Static interpolation check for production/staging env, labels, volume and runtime mount - `PASS`
- Static destructive-command scan for deploy/compose/staging docs - `PASS`
- Static deploy Git safety review - `FAIL`
- `git diff --check` - `PASS`
- Docker Compose availability check - `BLOCKED`; no local Docker Compose binary found
- `docker compose config` production/staging renders - `BLOCKED`; not run because Docker Compose is unavailable

## Evidence

Production defaults render statically to:

- `APP_ENV=production`
- `NODE_ENV=production`
- `DEBUG=FALSE`
- `E2E_TEST_MODE=FALSE`
- `PAYMENT_PROVIDER=` empty
- host `tgmeal.natureonzoom.win`
- Traefik prefix `tgmeal`
- volume `tgmeal_catalog_runtime_data`
- runtime mount `/var/lib/khujandi`

Explicit staging env renders statically to:

- `APP_ENV=staging`
- `NODE_ENV=staging`
- `DEBUG=TRUE`
- `E2E_TEST_MODE=TRUE`
- `PAYMENT_PROVIDER=mock`
- host `staging-tgmeal.natureonzoom.win`
- Traefik prefix `tgmeal-staging`
- volume `tgmeal_staging_runtime_data`
- runtime mount `/var/lib/khujandi-staging`

`deploy/scripts/tgmeal-deploy-alma.sh` keeps:

- GitHub remote refusal for non-approved origin.
- `git pull --ff-only origin "${DEPLOY_BRANCH}"`.
- local `HEAD` equality check against `origin/${DEPLOY_BRANCH}`.
- no added `docker system prune`, `docker volume rm`, `docker compose down -v`, broad `rm -rf`, or shared infrastructure edits.

## Blockers/Risks

- Dirty-checkout refusal is incomplete. The script logs `git status --short --branch`, then checks only `git diff --quiet` and `git diff --cached --quiet`; untracked files do not fail the deploy and may be included in Docker build context.
- Required Compose render evidence is unavailable in this local environment and must be rerun where Docker Compose exists.
- No deploy was run, per task scope.

## Recommendation

Do not accept TASK-FT018-06 as production-safe yet. Add an explicit clean-worktree gate that fails on any non-clean `git status --porcelain --untracked-files=all` entry before compose render/build, then rerun this verifier checklist including production and staging `docker compose config` renders in an environment with Docker Compose.
