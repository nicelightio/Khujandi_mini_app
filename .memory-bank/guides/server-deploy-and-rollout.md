---
description: HOW-гайд по текущему серверному развороту: что запускать, что обновлять и где смотреть при проблемах.
status: active
---
# Server Deploy And Rollout

## Purpose

Дать короткий practical guide поверх deployment architecture и runbook, чтобы было понятно, как именно проект сейчас разворачивается на сервере.

## Canonical deployment path

- Основной deploy path: host `nginx` + Docker Compose stack.
- Compose stack состоит из:
  - `web` контейнера для frontend static build и internal `/api` reverse proxy;
  - `api` контейнера для `scripts/dev-api.ts`.
- Канонический серверный runbook:
  - `.memory-bank/runbooks/telegram-mini-app-container-deploy.md`

## What is deployed from the repo

- Frontend production build из `npm run build:frontend`.
- Runtime API process из `scripts/dev-api.ts`.
- Compose orchestration из `docker-compose.yml`.
- Public edge routing через host nginx config на сервере.

## Server layout

- App user: `tgmeal`
- Repo checkout: `/srv/tgmeal/app`
- Public domain: `tgmeal.natureonzoom.win`
- Host public ports: `80`, `443`
- Internal container entrypoint on host: `127.0.0.1:8080`

## Clean install mental model

1. На VPS ставятся Docker Engine, Compose plugin и host `nginx`.
2. Создаётся системный пользователь `tgmeal`.
3. Старый non-container deploy удаляется.
4. Repo клонируется в `/srv/tgmeal/app`.
5. `docker compose build && docker compose up -d` поднимает `web` и `api`.
6. Host `nginx` proxy-ит публичный домен в `127.0.0.1:8080`.

## Update flow

Обычное обновление после нового commit:

```bash
sudo -u tgmeal git -C /srv/tgmeal/app pull
sudo -u tgmeal docker compose -f /srv/tgmeal/app/docker-compose.yml up -d --build
systemctl reload nginx
```

## Validation checklist

- `curl -I https://tgmeal.natureonzoom.win`
- `curl https://tgmeal.natureonzoom.win/api/v1/shops`
- `curl -i -X POST https://tgmeal.natureonzoom.win/api/v1/admin/auth/login ...`
- `sudo -u tgmeal docker compose -f /srv/tgmeal/app/docker-compose.yml ps`

## Troubleshooting entrypoints

- Container logs:

```bash
sudo -u tgmeal docker compose -f /srv/tgmeal/app/docker-compose.yml logs --tail=200
```

- Host nginx config check:

```bash
nginx -t
systemctl status nginx --no-pager
```

- Public/container-local split useful for diagnosis:
  - `curl http://127.0.0.1:8080/` checks host -> web container path;
  - `curl https://tgmeal.natureonzoom.win/` checks full public edge path.

## Related docs

- [.memory-bank/architecture/deployment-and-runtime-topology.md](../architecture/deployment-and-runtime-topology.md)
- [.memory-bank/runbooks/telegram-mini-app-container-deploy.md](../runbooks/telegram-mini-app-container-deploy.md)
