---
description: Proder staging deploy report for GitHub main commit 4532702.
status: complete
---
# Proder Deploy Report 4532702

## Result

PASS. Staging `https://staging-tgmeal.natureonzoom.win` was updated from GitHub `main` to `4532702ffc29f426c33591c83e8be30c394a3dbf` (`Shorten courier availability callback data`).

Scope was deploy-only. No source, docs, Memory Bank, server env, Traefik, PhotoChanger, production TgMeal resources, commits, or pushes were changed by this subagent.

## Context

- Role: `SUBAGENT implementer`, deploy-only Proder task.
- Target: staging only.
- Server checkout: `/srv/tgmeal/staging/app`.
- Compose project: `tgmeal-staging`.
- Host: `staging-tgmeal.natureonzoom.win`.
- Deploy source: GitHub `origin/main`.
- Local Proder note: requested `.agents/skills/proder/SKILL.md` was absent; fallback instructions were taken from `.codex/agents/proder.toml`, AGENTS.md, deployment topology, and staging runbook.

## Commands And Checks Run

Commands below are command shapes only; SSH credentials and secret values were loaded from ignored `.env` and not printed.

- Local context:
  - `git status --short --branch`
  - `git rev-parse --abbrev-ref HEAD`
  - `git rev-parse --short HEAD`
  - `git ls-remote origin refs/heads/main`
  - `git show --no-patch --format=... 4532702`
- Server staging preflight:
  - `systemctl is-active docker firewalld`
  - `docker ps --format ...`
  - `docker network inspect web`
  - `git -C /srv/tgmeal/staging/app remote get-url origin`
  - `git -C /srv/tgmeal/staging/app status --short --branch`
  - `git -C /srv/tgmeal/staging/app rev-parse ...`
  - safe `.env` key/value check for non-secret staging flags only
- Deploy:
  - `APP_DIR=/srv/tgmeal/staging/app COMPOSE_PROJECT_NAME=tgmeal-staging TGMEAL_HOST=staging-tgmeal.natureonzoom.win TRAEFIK_ROUTER_PREFIX=tgmeal-staging TGMEAL_RUNTIME_VOLUME=tgmeal_staging_runtime_data TGMEAL_RUNTIME_DIR=/var/lib/khujandi-staging LOG_DIR=/var/log/tgmeal/staging DEPLOY_BRANCH=main /usr/local/bin/tgmeal-deploy`
- Post-deploy verification:
  - deployed commit and branch status
  - `docker compose --project-name tgmeal-staging ps`
  - `curl -fsS https://staging-tgmeal.natureonzoom.win/api/v1/health`
  - `curl -fsS https://staging-tgmeal.natureonzoom.win/api/v1/shops`
  - `docker compose --project-name tgmeal-staging logs --tail=160 api` filtered for Telegram polling telemetry
  - latest staging deploy log tail

## Verification Evidence

- Preflight:
  - Docker and firewalld were active.
  - Docker network `web` existed.
  - Existing shared containers including `traefik`, `photochanger-app`, and `photochanger-pg` were only inspected.
  - Staging checkout was clean on `main`, before deploy at `0e094ca`, with `origin/main` at `4532702`.
  - Staging non-secret env flags showed `APP_ENV=staging`, `NODE_ENV=staging`, `DEBUG=TRUE`, `PAYMENT_PROVIDER=mock`, `E2E_TEST_MODE=TRUE`, `TELEGRAM_BOT_POLLING=TRUE`.
- Deploy:
  - Git fast-forwarded `/srv/tgmeal/staging/app` from `0e094ca` to `4532702`.
  - Compose config rendered with project `tgmeal-staging`, router prefix `tgmeal-staging`, volume `tgmeal_staging_runtime_data`, runtime dir `/var/lib/khujandi-staging`.
  - Prisma migrations were skipped.
  - `api` and `web` images built and containers recreated.
  - Initial public HTTPS check returned one transient `404` while Traefik refreshed; retry returned `HTTP/2 200`.
- Post-deploy:
  - Deployed commit: `4532702ffc29f426c33591c83e8be30c394a3dbf`.
  - Server git status: `## main...origin/main`.
  - Compose status:
    - `tgmeal-staging-api-1`: `Up`, `healthy`, port `3001/tcp`.
    - `tgmeal-staging-web-1`: `Up`, port `80/tcp`.
  - Public health exposed staging facts: `appEnv=staging`, `nodeEnv=staging`, `paymentProvider=mock`, `e2eTestMode=true`, `debug=true`.
  - Public shops endpoint returned `200`, `shopCount=2`.
  - Telegram polling startup telemetry was present: `{"scope":"telegram-bot-runtime","event":"telegram.polling.started"}`.
  - Deploy log: `/var/log/tgmeal/staging/deploy-2026-05-19_233515.log`.

## Local Files Changed

- Added this report: `.tasks/TASK-STAGING-BOT-DIAG-20260519/proder-deploy-4532702.md`.

Pre-existing local worktree changes were observed but not modified by this subagent:

- `AGENTS.md`
- `.memory-bank/guides/server-deploy-and-rollout.md`
- `.memory-bank/runbooks/staging-runtime-and-ui-qa.md`
- `.memory-bank/runbooks/telegram-mini-app-container-deploy.md`
- existing untracked `.tasks/TASK-STAGING-BOT-DIAG-20260519/` artifacts

## Blockers And Risks

- Requested `.agents/skills/proder/SKILL.md` was missing. The deploy used the local Proder agent instructions in `.codex/agents/proder.toml` plus the normative runbooks.
- One post-deploy `docker compose ps` attempt was run from an inaccessible current directory and failed with a local compose invocation error; it was immediately rerun from `/srv/tgmeal/staging/app` and passed.
- Public HTTPS root check had one transient `404` during Traefik provider refresh, then passed on retry.
- Telegram polling startup is verified. No live Telegram update was sent during this deploy task, so there is no new update-processing telemetry beyond startup.

## Recommendation

Keep staging on `4532702`. For live bot confirmation, send a staging bot `/start` or `Курьер` action from a mapped courier test account and inspect sanitized `telegram-bot-runtime` logs for update/action handling.
