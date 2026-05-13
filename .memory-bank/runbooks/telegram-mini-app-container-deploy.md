---
description: Runbook контейнерного развертывания Telegram Mini App на текущем AlmaLinux prod через existing Traefik, без host nginx и без риска для PhotoChanger.
status: active
---
# Telegram Mini App Container Deploy

## Purpose

Развернуть и обновлять `Khujandi Mini App / TgMeal` на текущем production host, где установлен Hermes:

- AlmaLinux 9.7;
- existing Docker `traefik` на ports `80/443`;
- existing critical services, особенно PhotoChanger;
- app stack через Docker Compose project `tgmeal`.

## Scope and assumptions

- Целевой origin: `https://tgmeal.natureonzoom.win`.
- Cloudflare может оставаться `Proxied + Full (strict)`.
- На host НЕ ставим и НЕ используем nginx для TgMeal: `80/443` уже принадлежат Traefik.
- Compose stack подключается к existing Docker network `web` и публикуется через Docker labels.
- Старый Ubuntu/non-container deploy path deprecated; см. historical reference в [.memory-bank/runbooks/telegram-mini-app-test-server-deploy.md](telegram-mini-app-test-server-deploy.md).
- Staging deploy is a separate `FT-018` profile and must follow [.memory-bank/runbooks/staging-runtime-and-ui-qa.md](staging-runtime-and-ui-qa.md); do not repurpose production `/srv/tgmeal/app`, production Compose project or production volume for staging.
- Скрипт deploy не делает destructive cleanup и не трогает PhotoChanger/Traefik configs.
- Production deploy NEVER runs from the active development/source folder. Единственный путь: branch -> GitHub PR -> merge/push в GitHub -> server deploy pulls the merged GitHub commit into `/srv/tgmeal/app`.

## Target layout

- App user: `tgmeal`.
- App home: `/srv/tgmeal`.
- Repo checkout: `/srv/tgmeal/app`.
- Compose file: `/srv/tgmeal/app/docker-compose.yml`.
- Compose project: `tgmeal`.
- Public edge: existing `traefik` container.
- Docker network for public routing: external `web`.
- Runtime data volume: `tgmeal_catalog_runtime_data`.
- Deploy script: `/usr/local/bin/tgmeal-deploy`.
- GitHub Actions entrypoint: `.github/workflows/deploy-prod.yml`, which SSH-runs `/usr/local/bin/tgmeal-deploy` after `main` is updated.
- Required GitHub Secrets for automated deploy: `PROD_SSH_HOST`, `PROD_SSH_USER`, `PROD_SSH_KEY`, optional `PROD_SSH_PORT`.
- Deploy logs: `/var/log/tgmeal/deploy-*.log`.

## 0. Safety invariants for this prod

Before any deploy, remember:

- PhotoChanger is critical: do not stop/remove/recreate `photochanger-app`, `photochanger-pg`, `app_media_data`, `/opt/photochanger`.
- GitHub is the only release source: do not deploy uncommitted worktree changes, do not copy files from `/root/projects/khujandi-mini-app/Khujandi_mini_app`, and do not build prod from a local feature branch.
- Traefik is shared public edge: do not replace it with host nginx and do not edit `/opt/traefik` during normal TgMeal deploy.
- Never run these as part of TgMeal deploy: `docker system prune`, `docker volume rm`, `docker compose down -v`, mass cleanup under `/var/lib/docker`.
- Do not bind TgMeal to host ports `80`, `443`, `8000`, `5432`, `9000`, `37525`.
- Prisma migrations must target only a dedicated Khujandi database. Do not accidentally use PhotoChanger PostgreSQL.

## 1. Inspect current host state

```bash
cat /etc/os-release | sed -n '1,8p'
docker --version
docker compose version
systemctl is-active docker firewalld
getenforce
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}'
docker network inspect web >/dev/null && echo 'network web exists'
```

Expected baseline:

- OS is AlmaLinux 9.x.
- Docker and firewalld are active.
- SELinux is Enforcing.
- `traefik` is running and owns `80/443`.
- `photochanger-app` and `photochanger-pg` are running or intentionally stopped by separate ops decision.

## 2. Create app user and directories

```bash
id -u tgmeal >/dev/null 2>&1 || useradd --system --create-home --home-dir /srv/tgmeal --shell /bin/bash tgmeal
usermod -aG docker tgmeal
install -d -o tgmeal -g tgmeal /srv/tgmeal
install -d -m 0755 /var/log/tgmeal
```

After adding the user to `docker`, open a fresh shell if group membership is needed interactively. The deploy script runs Docker via `runuser` and expects the user to be in the `docker` group.

## 3. Clone or update deploy checkout from GitHub

`/srv/tgmeal/app` is a production deploy checkout, not a development workspace. It must contain only commits fetched from GitHub.

Fresh clone:

```bash
runuser -u tgmeal -- git clone https://github.com/nicelightio/Khujandi_mini_app.git /srv/tgmeal/app
```

Existing checkout repair/update:

```bash
chown -R tgmeal:tgmeal /srv/tgmeal/app/.git
runuser -u tgmeal -- git -C /srv/tgmeal/app remote get-url origin
runuser -u tgmeal -- git -C /srv/tgmeal/app status --short --branch
runuser -u tgmeal -- git -C /srv/tgmeal/app fetch origin main
runuser -u tgmeal -- git -C /srv/tgmeal/app checkout main
runuser -u tgmeal -- git -C /srv/tgmeal/app pull --ff-only origin main
```

If `status --short` shows local changes, stop. Fix them through normal GitHub PR flow; do not deploy that dirty checkout.

## 4. Prepare runtime env

Create `/srv/tgmeal/app/.env` with only non-secret defaults first. Add real secrets separately when needed; do not paste tokens into chat or logs.

```bash
cat >/srv/tgmeal/app/.env <<'EOF'
TGMEAL_HOST=tgmeal.natureonzoom.win
TRAEFIK_ROUTER_PREFIX=tgmeal
TGMEAL_RUNTIME_VOLUME=tgmeal_catalog_runtime_data
TGMEAL_RUNTIME_DIR=/var/lib/khujandi
ADMIN_ALLOWED_ORIGINS=https://tgmeal.natureonzoom.win
ADMIN_DB_PATH=/var/lib/khujandi/admin-access-runtime.sqlite
CATALOG_DB_PATH=/var/lib/khujandi/catalog-runtime.sqlite
APP_ENV=production
NODE_ENV=production
PAYMENT_PROVIDER=
DEBUG=FALSE
E2E_TEST_MODE=FALSE
# DATABASE_URL must point to a dedicated Khujandi database before RUN_MIGRATIONS=1 is used.
# DATABASE_URL=postgresql://tgmeal:CHANGE_ME@khujandi-db-host:5432/tgmeal?schema=public
# TELEGRAM_BOT_TOKEN=replace-with-real-token-outside-chat
EOF
chown tgmeal:tgmeal /srv/tgmeal/app/.env
chmod 600 /srv/tgmeal/app/.env
```

Important:

- `DEBUG=TRUE` is temporary diagnostic mode only; production-like deploy keeps `FALSE`.
- Test servers that intentionally use guarded mock checkout must set explicit runtime/test guards together: `DEBUG=TRUE`, `PAYMENT_PROVIDER=mock`, `APP_ENV=staging|test|local` or `E2E_TEST_MODE=TRUE`; `NODE_ENV=production` remains forbidden.
- `FT-018` staging servers that expose UI QA test auth must additionally set `APP_ENV=staging`, `E2E_TEST_MODE=TRUE` and a secret `E2E_TEST_TOKEN` outside docs/logs; production deploy must never enable this combination.
- Runtime SQLite state persists through `tgmeal_catalog_runtime_data` volume.
- `TRAEFIK_ROUTER_PREFIX`, `TGMEAL_RUNTIME_VOLUME` and `TGMEAL_RUNTIME_DIR` are parameterized for staging, but production defaults remain `tgmeal`, `tgmeal_catalog_runtime_data` and `/var/lib/khujandi`.
- `DATABASE_URL` default in compose is a placeholder. Confirm a dedicated Khujandi DB before migrations.

## 5. Install deploy script

Install from the checked-in template:

```bash
install -m 0755 /srv/tgmeal/app/deploy/scripts/tgmeal-deploy-alma.sh /usr/local/bin/tgmeal-deploy
```

Dry-read before first run:

```bash
sed -n '1,240p' /usr/local/bin/tgmeal-deploy
```

## 6. First deploy / update deploy

Required release workflow before this command:

1. Develop in a branch.
2. Push branch to GitHub.
3. Open PR.
4. Review/check CI.
5. Merge to `main` or otherwise update the approved deploy branch in GitHub.
6. Only then deploy the GitHub commit to this server.

Normal deploy:

```bash
/usr/local/bin/tgmeal-deploy
```

By default the script:

1. verifies AlmaLinux, Docker, Traefik and network `web`;
2. warns if PhotoChanger critical containers are not running;
3. verifies `/srv/tgmeal/app` has origin `https://github.com/nicelightio/Khujandi_mini_app.git`;
4. refuses dirty local worktree/cached changes;
5. fast-forwards `/srv/tgmeal/app` from `origin/main`;
6. refuses deploy if local `HEAD` differs from `origin/main`;
7. renders `docker compose config`;
8. skips Prisma migrations unless explicitly enabled;
9. builds and starts `tgmeal` containers;
10. verifies internal web/api and public HTTPS through Traefik;
11. writes logs under `/var/log/tgmeal`.

The same checked-in script may render staging only with explicit overrides such as `APP_DIR=/srv/tgmeal/staging/app`, `COMPOSE_PROJECT_NAME=tgmeal-staging`, `TGMEAL_HOST=<staging-host>`, `TRAEFIK_ROUTER_PREFIX=tgmeal-staging`, `TGMEAL_RUNTIME_VOLUME=tgmeal_staging_runtime_data`, `TGMEAL_RUNTIME_DIR=/var/lib/khujandi-staging`, `LOG_DIR=/var/log/tgmeal/staging` and `DEPLOY_BRANCH=staging`; see [.memory-bank/runbooks/staging-runtime-and-ui-qa.md](staging-runtime-and-ui-qa.md).

Optional migrations, only after confirming a dedicated Khujandi DB:

```bash
RUN_MIGRATIONS=1 /usr/local/bin/tgmeal-deploy
```

Migration readiness baseline:

- `backend/prisma/schema.prisma` must validate with the project-pinned Prisma CLI.
- `backend/prisma/migrations/` includes `20260401000000_init_current_schema_baseline`, so a blank PostgreSQL database can be bootstrapped by `prisma migrate deploy` before later incremental migrations.
- Before changing DB rollout logic, verify the empty-DB path against a disposable PostgreSQL container rather than relying only on the already-bootstrapped prod DB.
- If a production database was previously bootstrapped with `prisma db push`, inspect `_prisma_migrations` before enabling `RUN_MIGRATIONS=1`; after taking a `pg_dump`, reconcile only migration history with `prisma migrate resolve` when the physical schema already matches the migration output.

## 7. Manual deploy equivalent

Use this only to debug the server-side script. It must still deploy `origin/main`, not local source changes.

```bash
runuser -u tgmeal -- git -C /srv/tgmeal/app remote get-url origin
runuser -u tgmeal -- git -C /srv/tgmeal/app status --short --branch
runuser -u tgmeal -- git -C /srv/tgmeal/app fetch origin main
runuser -u tgmeal -- git -C /srv/tgmeal/app checkout main
runuser -u tgmeal -- git -C /srv/tgmeal/app pull --ff-only origin main
test "$(runuser -u tgmeal -- git -C /srv/tgmeal/app rev-parse HEAD)" = "$(runuser -u tgmeal -- git -C /srv/tgmeal/app rev-parse origin/main)"
runuser -u tgmeal -- docker compose --project-name tgmeal -f /srv/tgmeal/app/docker-compose.yml config
runuser -u tgmeal -- docker compose --project-name tgmeal -f /srv/tgmeal/app/docker-compose.yml build
runuser -u tgmeal -- docker compose --project-name tgmeal -f /srv/tgmeal/app/docker-compose.yml up -d
runuser -u tgmeal -- docker compose --project-name tgmeal -f /srv/tgmeal/app/docker-compose.yml ps
```

## 8. Validate public origin

```bash
curl -I https://tgmeal.natureonzoom.win
curl https://tgmeal.natureonzoom.win/api/v1/shops
runuser -u tgmeal -- docker compose --project-name tgmeal -f /srv/tgmeal/app/docker-compose.yml logs --tail=120
```

Expected:

- frontend opens on `https://tgmeal.natureonzoom.win`;
- `/api/v1/shops` responds from the same origin;
- `api` container is healthy;
- no host ports are published by TgMeal containers;
- Traefik continues serving other services.

## 9. Troubleshooting

Recent deploy log:

```bash
ls -1t /var/log/tgmeal | head -n 5
tail -n 200 /var/log/tgmeal/$(ls -1t /var/log/tgmeal | head -n 1)
```

Compose/app logs:

```bash
runuser -u tgmeal -- docker compose --project-name tgmeal -f /srv/tgmeal/app/docker-compose.yml ps
runuser -u tgmeal -- docker compose --project-name tgmeal -f /srv/tgmeal/app/docker-compose.yml logs --tail=200
```

Traefik logs, read-only:

```bash
docker logs --tail=200 traefik
```

Internal app checks:

```bash
runuser -u tgmeal -- docker compose --project-name tgmeal -f /srv/tgmeal/app/docker-compose.yml exec -T web wget -qO- http://127.0.0.1/
runuser -u tgmeal -- docker compose --project-name tgmeal -f /srv/tgmeal/app/docker-compose.yml exec -T web wget -qO- http://api:3001/api/v1/shops
```

If git files become root-owned from a previous manual command:

```bash
chown -R tgmeal:tgmeal /srv/tgmeal/app/.git
```

## 10. Rollback

Safe rollback is a git fast-forward/back-to-known-commit plus compose recreate. Do not remove volumes.

```bash
runuser -u tgmeal -- git -C /srv/tgmeal/app log --oneline -n 10
runuser -u tgmeal -- git -C /srv/tgmeal/app checkout <known-good-commit>
runuser -u tgmeal -- docker compose --project-name tgmeal -f /srv/tgmeal/app/docker-compose.yml up -d --build
curl -I https://tgmeal.natureonzoom.win
```

After rollback, return to `main` intentionally:

```bash
runuser -u tgmeal -- git -C /srv/tgmeal/app checkout main
```

## Source artifacts

- `docker-compose.yml`: Traefik-label based container stack for AlmaLinux prod.
- `Dockerfile.web`: build and serve frontend static app.
- `Dockerfile.api`: Node runtime for repo-local API.
- `deploy/nginx/web-container.conf`: nginx config inside `web` container only.
- `.github/workflows/deploy-prod.yml`: GitHub Actions workflow that runs server-side deploy over SSH after `main` changes.
- `deploy/scripts/tgmeal-deploy-alma.sh`: deploy script template.
- [.memory-bank/architecture/deployment-and-runtime-topology.md](../architecture/deployment-and-runtime-topology.md): topology WHY/WHAT.
- [.memory-bank/guides/server-deploy-and-rollout.md](../guides/server-deploy-and-rollout.md): short HOW guide.
- [.memory-bank/runbooks/staging-runtime-and-ui-qa.md](staging-runtime-and-ui-qa.md): staging server and UI QA workflow.

## Useful app URLs

- Root: `https://tgmeal.natureonzoom.win`
- Seller admin: `https://tgmeal.natureonzoom.win/seller/shops/status`
- Admin provisioning: `https://tgmeal.natureonzoom.win/admin/catalog/shops/provision`
- Checkout smoke: `https://tgmeal.natureonzoom.win/checkout`
