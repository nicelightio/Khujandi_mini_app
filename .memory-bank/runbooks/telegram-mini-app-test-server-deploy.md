---
description: Deprecated historical runbook старого Ubuntu/non-container test deploy; текущий prod deploy живёт в AlmaLinux + Traefik runbook.
status: deprecated
---
# Telegram Mini App Test Server Deploy

## Status note

Этот документ оставлен как historical reference для старого Ubuntu 22 / host nginx / systemd / non-container test deploy.

Текущий актуальный deploy path больше НЕ этот документ:

- canonical prod runbook: [.memory-bank/runbooks/telegram-mini-app-container-deploy.md](telegram-mini-app-container-deploy.md);
- topology: [.memory-bank/architecture/deployment-and-runtime-topology.md](../architecture/deployment-and-runtime-topology.md);
- short guide: [.memory-bank/guides/server-deploy-and-rollout.md](../guides/server-deploy-and-rollout.md).

## Why deprecated

Старый flow был рассчитан на отдельный Ubuntu VPS:

- `apt`, `ufw`, host `nginx`;
- `/var/www/tgmeal/app`;
- `tgmeal-demo-api.service`;
- public ports `80/443`, занятые host nginx.

Текущий prod — AlmaLinux 9.7 server, где уже работают:

- Docker `traefik` on `80/443`;
- critical PhotoChanger containers and PostgreSQL;
- Portainer, 3x-ui, Nature on Zoom.

Поэтому старые инструкции с host nginx/systemd нельзя применять на текущем prod: они могут конфликтовать с Traefik и сломать co-hosted services.

## Historical scope only

Use this document only to understand legacy assumptions or old Android Telegram verification context. For any real server rollout, use the active AlmaLinux container deploy runbook.

## Legacy summary

Old target environment was:

- VPS: `213.155.13.112`;
- OS: `Ubuntu 22.04`;
- Domain: `tgmeal.natureonzoom.win`;
- Stack: host `nginx`, `nodejs 20`, `systemd` service `tgmeal-demo-api.service`, Cloudflare `Full (strict)`.

Old outcome was:

- `https://tgmeal.natureonzoom.win` opens Mini App frontend;
- `/api/v1/shops` is proxied to a host Node process;
- BotFather menu button points to the URL;
- Android Telegram shell/runtime verification could be performed.

## Do not copy to current prod

Do not run these legacy patterns on the AlmaLinux prod host:

```bash
apt update
apt install nginx ufw nodejs
ufw allow 80/tcp
systemctl enable --now tgmeal-demo-api.service
ln -sf /etc/nginx/sites-available/tgmeal.natureonzoom.win /etc/nginx/sites-enabled/tgmeal.natureonzoom.win
systemctl reload nginx
```

Use the active Traefik/Compose path instead:

```bash
/usr/local/bin/tgmeal-deploy
```

## Related current docs

- [.memory-bank/runbooks/telegram-mini-app-container-deploy.md](telegram-mini-app-container-deploy.md): current canonical deploy.
- [.memory-bank/runbooks/telegram-mini-app-verification.md](telegram-mini-app-verification.md): Telegram-specific verification scope.
- [.memory-bank/contracts/mini-app-runtime-contract.md](../contracts/mini-app-runtime-contract.md): runtime ownership boundary.
- [.memory-bank/contracts/telegram-mini-app-auth-contract.md](../contracts/telegram-mini-app-auth-contract.md): production-like auth boundary.
