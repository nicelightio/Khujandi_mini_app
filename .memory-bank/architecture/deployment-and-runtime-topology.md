---
description: WHAT/WHY для текущего прод-развертывания проекта на AlmaLinux VPS через существующий Traefik + containerized app stack.
status: active
---
# Deployment And Runtime Topology

## Purpose

Зафиксировать текущую production topology для `tgmeal.natureonzoom.win` на сервере, где уже установлен Hermes:

- какие runtime-компоненты реально разворачиваются;
- как приложение подключается к существующему Traefik;
- какие host-порты и критичные сервисы нельзя трогать;
- какой deploy path считается рекомендуемым.

## Current deployment baseline

- Целевой сервер: `dbmart-alma9-DSLR.com`.
- ОС: `AlmaLinux 9.7`, `SELinux Enforcing`, `firewalld active`.
- Публичный origin: `https://tgmeal.natureonzoom.win`.
- Public edge: уже существующий Docker-контейнер `traefik` (`traefik:v3.6`) на host ports `80/443`.
- TLS termination: Traefik через existing Cloudflare Origin certificates из `/etc/ssl/cloudflare`, смонтированные в `/opt/traefik/docker-compose.yml`.
- Docker external network для public routing: `web`.
- App stack разворачивается как Docker Compose project `tgmeal` из `/srv/tgmeal/app`:
  - `web`: nginx container со static frontend build и internal `/api` proxy на `api`;
  - `api`: Node 22 runtime, запускающий `scripts/dev-api.ts`.

## Public vs internal surfaces

- Единственная public entrypoint surface для `tgmeal` — existing Traefik на `80/443`.
- `web` container НЕ публикует host ports; Traefik маршрутизирует в него по Docker labels через external network `web`.
- `api` наружу не публикуется; он доступен только контейнеру `web` по internal compose network как `http://api:3001`.
- Не использовать host nginx на текущем prod: ports `80/443` уже заняты Traefik, а замена edge может сломать PhotoChanger/Nature/3x-ui routes.

## Request flow

1. Пользователь открывает `https://tgmeal.natureonzoom.win`.
2. Cloudflare пересылает traffic на AlmaLinux origin.
3. Existing Traefik принимает `80/443`, применяет Docker labels из `tgmeal_web` и отправляет traffic в `web:80` на Docker network `web`.
4. `web`:
   - отдаёт `index.html` и `dist/assets/*` для frontend routes;
   - отправляет `/api/*` в `api:3001` по internal compose network.
5. `api` обслуживает checked-in runtime API.

## Deployment ownership

- Production deploy source is GitHub only: development happens in branches/PRs, and this server deploys only commits fetched from `origin/main` into `/srv/tgmeal/app`. The active development folder `/root/projects/khujandi-mini-app/Khujandi_mini_app` is never used as a direct production deploy source.
- Checked-in deploy artifacts:

- `docker-compose.yml`: Traefik-label based app stack для текущего AlmaLinux prod.
- `Dockerfile.web`: frontend build + nginx static/proxy container.
- `Dockerfile.api`: Node runtime для repo-local API.
- `deploy/nginx/web-container.conf`: nginx config внутри `web` container, не host nginx.
- `.github/workflows/deploy-prod.yml`: GitHub Actions SSH deployment trigger for merged `main`.
- `deploy/scripts/tgmeal-deploy-alma.sh`: server-side deploy script template for `/usr/local/bin/tgmeal-deploy`.

Operational rollout docs:

- [.memory-bank/runbooks/telegram-mini-app-container-deploy.md](../runbooks/telegram-mini-app-container-deploy.md): canonical prod runbook для AlmaLinux + Traefik.
- [.memory-bank/runbooks/staging-runtime-and-ui-qa.md](../runbooks/staging-runtime-and-ui-qa.md): staging-specific runtime, server deploy outline and UI QA workflow.
- [.memory-bank/guides/server-deploy-and-rollout.md](../guides/server-deploy-and-rollout.md): короткий HOW guide.

## Staging topology target

`FT-018` introduces a separate staging target for UI QA and non-production verification. It must not share production state.

Target staging shape:

- Repo checkout: `/srv/tgmeal/staging/app`.
- Compose project: `tgmeal-staging`.
- Public host: `staging-tgmeal.natureonzoom.win` or another explicit staging-only host.
- Runtime volume: `tgmeal_staging_runtime_data`.
- Logs: `/var/log/tgmeal/staging`.
- Env mode: `APP_ENV=staging`, `NODE_ENV=staging`, `DEBUG=TRUE`, `PAYMENT_PROVIDER=mock`, `E2E_TEST_MODE=TRUE`.
- Compose isolation variables: `TRAEFIK_ROUTER_PREFIX=tgmeal-staging`, `TGMEAL_RUNTIME_VOLUME=tgmeal_staging_runtime_data`, `TGMEAL_RUNTIME_DIR=/var/lib/khujandi-staging`.

Staging may use the same existing Traefik public edge and external Docker network `web`, but router/service/middleware names must be parameterized so they cannot collide with production `tgmeal` labels.

Staging deploy may use the same GitHub-only safety model as production, but with an explicit approved non-production branch and separate `APP_DIR`, `COMPOSE_PROJECT_NAME`, `TGMEAL_HOST`, `TRAEFIK_ROUTER_PREFIX`, `LOG_DIR`, runtime volume and runtime mount path.

## Critical co-tenancy constraints

На этом же сервере уже работают critical/prod-like services:

- `photochanger-app` и `photochanger-pg` — PhotoChanger считается критичным.
- `traefik` — общий public reverse proxy.
- `portainer`, `3x-ui`, `nature-static`, `nature-ws.service`.

MUST NOT без отдельного подтверждения:

- менять `/opt/traefik/docker-compose.yml` или dynamic configs вслепую;
- останавливать/пересоздавать Traefik без анализа routes;
- выполнять `docker system prune`, `docker volume rm`, `docker compose down -v`;
- трогать volumes/networks PhotoChanger;
- использовать опубликованные host ports `80`, `443`, `8000`, `5432`, `9000`, `37525` для `tgmeal`.

## Persistence and database note

- Runtime SQLite state для checked-in dev/runtime API хранится в named volume `tgmeal_catalog_runtime_data` по `/var/lib/khujandi` внутри `api` container.
- Staging runtime state must use a separate named volume and/or paths, for example `tgmeal_staging_runtime_data` and `/var/lib/khujandi-staging`.
- `DATABASE_URL` должен указывать только на отдельную Khujandi database, если включаются Prisma migrations.
- PhotoChanger PostgreSQL (`photochanger-pg`, host port `5432`) нельзя использовать как implicit target для Khujandi без явного создания отдельной database/user и backup/permission plan.

## Related docs

- [.memory-bank/guides/server-deploy-and-rollout.md](../guides/server-deploy-and-rollout.md): practical update/troubleshooting guide.
- [.memory-bank/runbooks/telegram-mini-app-container-deploy.md](../runbooks/telegram-mini-app-container-deploy.md): canonical AlmaLinux prod rollout.
- [.memory-bank/runbooks/staging-runtime-and-ui-qa.md](../runbooks/staging-runtime-and-ui-qa.md): staging topology and UI QA workflow.
- [.memory-bank/runbooks/telegram-mini-app-test-server-deploy.md](../runbooks/telegram-mini-app-test-server-deploy.md): deprecated Ubuntu non-container reference.
