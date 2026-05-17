---
description: Sanitized staging deploy/preflight report for public `/admin/staff` availability.
status: done
---
# Staging Deploy Preflight Report

## Result

- Public staging was behind GitHub `main`.
- Approved staging deploy was run from the server GitHub checkout only.
- Staging deploy completed successfully.
- `/api/v1/admin/staff/couriers` is no longer missing: unauthenticated/no-origin request returns controlled `403`; guarded `admin_boss` staging session returns `200`.
- `/admin/staff` serves the refreshed frontend bundle that contains `/admin/staff`, `Staff panel` and `data-admin-staff`.

## Evidence

- Local `origin/main`: `dad392eafb56dfd71667d063cb5562f8d8a7e164`.
- Server staging before deploy: `c1591f701f6053d7ce7956ff344d271798b0e6ba`.
- Server staging after deploy: `dad392eafb56dfd71667d063cb5562f8d8a7e164`.
- Deploy command shape:
  - `APP_DIR=/srv/tgmeal/staging/app`
  - `COMPOSE_PROJECT_NAME=tgmeal-staging`
  - `TGMEAL_HOST=staging-tgmeal.natureonzoom.win`
  - `TRAEFIK_ROUTER_PREFIX=tgmeal-staging`
  - `TGMEAL_RUNTIME_VOLUME=tgmeal_staging_runtime_data`
  - `TGMEAL_RUNTIME_DIR=/var/lib/khujandi-staging`
  - `LOG_DIR=/var/log/tgmeal/staging`
  - `DEPLOY_BRANCH=main`
  - `/usr/local/bin/tgmeal-deploy`
- Deploy log path on server: `/var/log/tgmeal/staging/deploy-2026-05-14_164233.log`.
- Refreshed public frontend bundle: `/assets/index-BND1IqZD.js`.
- Staging health after deploy: `appEnv=staging`, `nodeEnv=staging`, `paymentProvider=mock`, `e2eTestMode=true`.
- Staging compose after deploy: `tgmeal-staging-api-1` healthy, `tgmeal-staging-web-1` up.

## Production Boundary

- Production compose was checked read-only.
- Production `tgmeal-api-1` and `tgmeal-web-1` remained up from their previous 2-day runtime.
- Production `/api/v1/shops` returned `200`.
- No production deploy command was run.
- No PhotoChanger, Traefik config, unrelated Docker volumes/networks or destructive commands were touched.

## Notes

- Public `/api/v1/admin/staff/couriers` without proper `Origin`/session returns `403 FORBIDDEN`, which is expected for a mounted protected admin route.
- Browser-level authenticated Staff panel verification should proceed via fixed `admin_boss` staging session or normal boss login.
