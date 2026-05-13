---
description: План выполнения TASK-FT018-06 server staging deploy profile.
status: active
---
# TASK-FT018-06 Plan

## Steps

1. Re-read FT-018 staging docs, deployment topology and production container deploy runbook.
2. Inspect current deploy artifacts:
   - `docker-compose.yml`
   - `deploy/scripts/tgmeal-deploy-alma.sh`
   - `.env.example`
   - `.github/workflows/deploy-prod.yml` if deploy invocation changes are needed.
3. Identify hard-coded production names in Compose labels, volume names, container/service routing and deploy script defaults.
4. Implement minimal parameterization for staging without changing production defaults:
   - `COMPOSE_PROJECT_NAME=tgmeal-staging`
   - staging host such as `staging-tgmeal.natureonzoom.win`
   - unique Traefik router/service/middleware label prefix.
   - separate runtime volume, env paths and log directory.
   - explicit deploy branch for staging.
5. Update `.env.example` or staging docs with non-secret staging variables only; keep secrets out of tracked docs.
6. Render/validate configs:
   - production compose config with defaults.
   - staging compose config with explicit staging env/project/host/prefix.
7. Dry-review deploy script behavior:
   - still refuses dirty checkout and non-GitHub remote.
   - still uses fast-forward GitHub checkout.
   - does not run destructive cleanup.
   - health checks target the configured host.
8. Update runbook/Memory Bank summaries if implementation changes deploy behavior.
9. Update `.protocols/TASK-FT018-06/{progress,verification}.md` and detailed report under `.tasks/TASK-FT018-06/`.

## Candidate Touched Files

- `docker-compose.yml`
- `deploy/scripts/tgmeal-deploy-alma.sh`
- `.env.example`
- `.memory-bank/runbooks/staging-runtime-and-ui-qa.md`
- `.memory-bank/architecture/deployment-and-runtime-topology.md` only if runtime topology wording needs closure.
- `.tasks/TASK-FT018-06/**/*`
- `.protocols/TASK-FT018-06/**/*`

## Verification Targets

- `docker compose --project-name tgmeal -f docker-compose.yml config` passes with production defaults.
- Staging render passes with explicit staging env/project/host/prefix and shows no production router/service/volume names.
- Production render does not include `E2E_TEST_MODE=TRUE`, staging host, staging volume or mock payment by default.
- Staging render uses separate volume/name/path and `APP_ENV=staging`, `NODE_ENV=staging`, `DEBUG=TRUE`, `PAYMENT_PROVIDER=mock`, `E2E_TEST_MODE=TRUE` only through explicit staging env.
- Deploy script can be reviewed/dry-run enough to prove no destructive operations and no shared infra edits.
- `git diff --check` passes.

## Non-Goals

- No actual production deploy.
- No actual staging deploy unless orchestrator explicitly asks for rollout.
- No changes to PhotoChanger, Traefik global config or shared Docker network.
- No database migration design.
- No auth/payment product behavior changes.
