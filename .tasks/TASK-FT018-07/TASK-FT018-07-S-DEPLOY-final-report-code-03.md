---
description: Staging deploy evidence for FT-018 after compose render was treated as non-blocking.
status: active
---
# TASK-FT018-07 Staging Deploy Report

## Result

`STAGING_DEPLOYED_DNS_BLOCKED`

Staging was deployed on the production host from the clean GitHub checkout at `/srv/tgmeal/staging/app`, using `origin/main` commit `47a4a37`.

## Actions

- Pushed `main` to GitHub at commit `47a4a37`.
- Created `/srv/tgmeal/staging/app` as a GitHub checkout under app user `tgmeal`.
- Wrote staging `.env` on the server with token/secret values redacted from logs.
- Installed `/usr/local/bin/tgmeal-deploy` from the checked-in script in the staging checkout.
- Ran staging deploy with:
  - `APP_DIR=/srv/tgmeal/staging/app`
  - `COMPOSE_PROJECT_NAME=tgmeal-staging`
  - `TGMEAL_HOST=staging-tgmeal.natureonzoom.win`
  - `TRAEFIK_ROUTER_PREFIX=tgmeal-staging`
  - `TGMEAL_RUNTIME_VOLUME=tgmeal_staging_runtime_data`
  - `TGMEAL_RUNTIME_DIR=/var/lib/khujandi-staging`
  - `LOG_DIR=/var/log/tgmeal/staging`
  - `DEPLOY_BRANCH=main`

## Evidence

- Compose render ran on the server inside deploy script and showed isolated staging names:
  - project: `tgmeal-staging`
  - volume: `tgmeal_staging_runtime_data`
  - Traefik router/service prefix: `tgmeal-staging`
  - runtime mount: `/var/lib/khujandi-staging`
- Images built:
  - `tgmeal-staging-api`
  - `tgmeal-staging-web`
- Containers started:
  - `tgmeal-staging-api-1` healthy
  - `tgmeal-staging-web-1` running
- Internal checks passed:
  - web container to API `/api/v1/shops`
  - web container static frontend
- Host-local Traefik TLS health check with local resolve passed:
  - `appEnv=staging`
  - `nodeEnv=staging`
  - `debug=true`
  - `paymentProvider=mock`
  - `e2eTestMode=true`
- Production `/api/v1/shops` check passed after staging deploy.
- Latest deploy log:
  - `/var/log/tgmeal/staging/deploy-2026-05-13_183346.log`

## Blocker

`staging-tgmeal.natureonzoom.win` does not resolve in DNS. The deploy script exited non-zero at the final public HTTPS check for this reason after the containers had already been built and started.

## Next Step

Add or fix DNS for `staging-tgmeal.natureonzoom.win`, then rerun public HTTPS health and UI QA browser smoke against the public staging URL.
