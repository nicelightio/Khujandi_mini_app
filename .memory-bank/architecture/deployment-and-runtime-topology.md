---
description: WHAT/WHY для текущего серверного развертывания проекта на VPS через host nginx + containerized app stack.
status: active
---
# Deployment And Runtime Topology

## Purpose

Зафиксировать текущую серверную topology для `tgmeal.natureonzoom.win`, чтобы было ясно:

- какие runtime-компоненты реально разворачиваются на сервере;
- какие из них публичные, а какие только internal;
- где заканчивается TLS;
- какой deploy path считается рекомендуемым.

## Current deployment baseline

- Целевой сервер: Ubuntu VPS `213.155.13.112`.
- Публичный origin: `https://tgmeal.natureonzoom.win`.
- DNS и edge: Cloudflare `Proxied` + `Full (strict)`.
- TLS termination происходит на host `nginx` с Cloudflare Origin Certificate.
- Само приложение разворачивается как container stack из двух сервисов:
  - `web`: nginx внутри контейнера, раздаёт frontend static build и proxy-ит `/api` в `api`;
  - `api`: Node 22 runtime, запускающий `scripts/dev-api.ts`.

## Public vs internal surfaces

- Public surface на VPS ровно одна: host `nginx` на `80/443`.
- Container `web` слушает только локальный host bind `127.0.0.1:8080`.
- Container `api` наружу не публикуется; он доступен только из `web` через Docker network как `http://api:3001`.

## Request flow

1. Пользователь открывает `https://tgmeal.natureonzoom.win`.
2. Cloudflare принимает внешний HTTPS traffic и пересылает его на origin.
3. Host `nginx` принимает `80/443` и proxy-ит весь трафик в container `web` на `127.0.0.1:8080`.
4. Container `web`:
   - отдаёт `index.html` и `dist/assets/*` для frontend routes;
   - отправляет `/api/*` в container `api`.
5. Container `api` обслуживает demo catalog runtime и checked-in admin auth HTTP runtime.

## Deployment ownership

- Checked-in deploy artifacts в repo:
  - `Dockerfile.web`
  - `Dockerfile.api`
  - `docker-compose.yml`
  - `deploy/nginx/web-container.conf`
- Checked-in server entrypoint для backend runtime:
  - `scripts/dev-api.ts`
  - `backend/src/dev-runtime/dev-api-server.ts`
- Operational rollout ownership находится в runbook:
  - `.memory-bank/runbooks/telegram-mini-app-container-deploy.md`

## Constraints

- Старый non-container deploy через `/var/www/tgmeal` + `systemd` service больше не считается рекомендуемым baseline.
- На сервере не должно жить две параллельные app copies: legacy non-container и новый compose stack одновременно.
- Host `nginx` остаётся публичным edge даже после контейнеризации, чтобы не ломать существующий Cloudflare Origin Certificate flow.
- Текущий deploy baseline подходит для frontend + demo/runtime API и текущего checked-in admin auth runtime contour; это всё ещё не полный production backend с real DB/payment/webhook bootstrap.

## Related docs

- [.memory-bank/guides/server-deploy-and-rollout.md](../guides/server-deploy-and-rollout.md): как practically обновлять и обслуживать этот deploy.
- [.memory-bank/runbooks/telegram-mini-app-container-deploy.md](../runbooks/telegram-mini-app-container-deploy.md): пошаговый серверный rollout на VPS.
- [.memory-bank/runbooks/telegram-mini-app-test-server-deploy.md](../runbooks/telegram-mini-app-test-server-deploy.md): исторический non-container flow, оставлен как reference.
