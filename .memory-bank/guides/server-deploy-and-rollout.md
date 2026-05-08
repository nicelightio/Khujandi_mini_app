---
description: HOW-гайд по текущему серверному развороту на AlmaLinux prod: что запускать, что обновлять и где смотреть при проблемах.
status: active
---
# Server Deploy And Rollout

## Purpose

Дать короткий practical guide поверх deployment architecture и runbook для текущего production host, на котором работает Hermes: AlmaLinux 9.7 + existing Traefik + Docker Compose app stack.

## Canonical deployment path

- Основной deploy path: existing Docker `traefik` на host ports `80/443` + Docker Compose project `tgmeal`.
- Compose stack состоит из:
  - `web` контейнера для frontend static build и internal `/api` reverse proxy;
  - `api` контейнера для `scripts/dev-api.ts`.
- `web` подключается к external Docker network `web` и публикуется только через Traefik labels.
- Host nginx больше не является частью canonical deploy на текущем prod.
- Канонический серверный runbook:
  - [.memory-bank/runbooks/telegram-mini-app-container-deploy.md](../runbooks/telegram-mini-app-container-deploy.md)

## Server layout

- App user: `tgmeal`.
- Repo checkout: `/srv/tgmeal/app`.
- Public domain: `tgmeal.natureonzoom.win`.
- Compose project name: `tgmeal`.
- Public edge: existing container `traefik`.
- External Docker network: `web`.
- Runtime volume: `tgmeal_catalog_runtime_data` mounted to `/var/lib/khujandi` inside `api`.
- Deploy log dir: `/var/log/tgmeal`.

## What is deployed from the repo

- Frontend production build from `Dockerfile.web` / `npm run build:frontend`.
- Runtime API process from `Dockerfile.api` / `scripts/dev-api.ts`.
- Compose orchestration from `docker-compose.yml`.
- Internal container nginx config from `deploy/nginx/web-container.conf`.
- Server deploy script template from `deploy/scripts/tgmeal-deploy-alma.sh`.

## Normal update flow

Release policy:

- local development folder is for editing only;
- all production changes go through branch -> GitHub push -> PR -> review/CI -> merge to `main`;
- server deploy pulls the merged GitHub commit into `/srv/tgmeal/app`;
- never copy/build/deploy directly from `/root/projects/khujandi-mini-app/Khujandi_mini_app` or any dirty worktree.

Preferred automated path:

1. Merge an approved PR into `main` on GitHub.
2. GitHub Actions workflow `.github/workflows/deploy-prod.yml` connects to prod by SSH using repository/environment secrets.
3. The workflow runs `/usr/local/bin/tgmeal-deploy` on the server.
4. The server-side script pulls `origin/main` into `/srv/tgmeal/app` and refuses dirty/non-GitHub state.

Required GitHub Secrets:

- `PROD_SSH_HOST`
- `PROD_SSH_USER`
- `PROD_SSH_KEY`
- `PROD_SSH_PORT` optional, defaults to `22`

Manual server-side command, only if GitHub Actions needs a rerun/debug:

```bash
/usr/local/bin/tgmeal-deploy
```

Manual equivalent for debugging the script only:

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

Do not reload/restart Traefik for a normal app deploy. Docker provider watches labels/containers.

## Validation checklist

```bash
runuser -u tgmeal -- docker compose --project-name tgmeal -f /srv/tgmeal/app/docker-compose.yml ps
runuser -u tgmeal -- docker compose --project-name tgmeal -f /srv/tgmeal/app/docker-compose.yml logs --tail=120
curl -I https://tgmeal.natureonzoom.win
curl https://tgmeal.natureonzoom.win/api/v1/shops
```

Container-local split for diagnosis:

```bash
runuser -u tgmeal -- docker compose --project-name tgmeal -f /srv/tgmeal/app/docker-compose.yml exec -T web wget -qO- http://127.0.0.1/
runuser -u tgmeal -- docker compose --project-name tgmeal -f /srv/tgmeal/app/docker-compose.yml exec -T web wget -qO- http://api:3001/api/v1/shops
```

Traefik sanity checks:

```bash
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}'
docker logs --tail=120 traefik
```

## Troubleshooting entrypoints

- App logs:

```bash
runuser -u tgmeal -- docker compose --project-name tgmeal -f /srv/tgmeal/app/docker-compose.yml logs --tail=200
```

- Compose rendered config:

```bash
runuser -u tgmeal -- docker compose --project-name tgmeal -f /srv/tgmeal/app/docker-compose.yml config
```

- Check app is attached to Traefik network:

```bash
docker network inspect web
```

- Recent deploy logs:

```bash
ls -1t /var/log/tgmeal | head -n 5
tail -n 200 /var/log/tgmeal/$(ls -1t /var/log/tgmeal | head -n 1)
```

## Safety rules for current prod

- PhotoChanger is critical: do not touch `photochanger-app`, `photochanger-pg`, their volumes, or `/opt/photochanger` during Khujandi deploy.
- Traefik is shared public edge: do not replace it with host nginx and do not edit `/opt/traefik` without backup and explicit reason.
- Do not use host ports already occupied by current services: `80`, `443`, `8000`, `5432`, `9000`, `37525`.
- Do not run `docker system prune`, `docker volume rm`, or `docker compose down -v` as part of deploy.
- Prisma migrations are disabled in the deploy script by default; set `RUN_MIGRATIONS=1` only after confirming `DATABASE_URL` targets a dedicated Khujandi database, not PhotoChanger.

## Related docs

- [.memory-bank/architecture/deployment-and-runtime-topology.md](../architecture/deployment-and-runtime-topology.md)
- [.memory-bank/runbooks/telegram-mini-app-container-deploy.md](../runbooks/telegram-mini-app-container-deploy.md)
