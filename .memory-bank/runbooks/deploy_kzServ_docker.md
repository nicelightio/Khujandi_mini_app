---
description: Runbook контейнерного развертывания Telegram Mini App на том же Ubuntu VPS с очисткой старого non-container deploy и выделенным системным пользователем.
status: active
---
# Telegram Mini App Container Deploy

## Purpose

Перевести текущий тестовый сервер `tgmeal.natureonzoom.win` на контейнерный deploy того же repo: `web` контейнер со статическим frontend + reverse proxy на `api` контейнер с demo/runtime API.

## Scope and assumptions

- Основа — предыдущий runbook `.memory-bank/runbooks/telegram-mini-app-test-server-deploy.md`.
- Целевой origin остается тем же: `https://tgmeal.natureonzoom.win` через Cloudflare `Full (strict)`.
- В контейненый `80/443` остаются на host `nginx`, чтобы не ломать существующий Cloudflare Origin Certificate flow.
- Старый non-container deploy (`/var/www/tgmeal`, `tgmeal-demo-api.service`) должен быть удален, чтобы на сервере не осталось двух параллельных app copies.

## Target layout

- App user: `tgmeal`
- App home: `/srv/tgmeal/app`
- Compose project: `/srv/tgmeal/app/docker-compose.yml`
- Host nginx public edge: `443 -> 127.0.0.1:8080`
- Containers:
  - `web`: nginx со static frontend и `/api` proxy на `api`
  - `api`: Node 22 runtime для `scripts/dev-api.ts`

## 1. Connect and inspect current state

```bash
ssh root@213.155.13.112
systemctl status tgmeal-demo-api.service --no-pager
docker ps -a
```

## 2. Install Docker Engine + Compose plugin

```bash
apt update && apt upgrade -y
apt install -y ca-certificates curl gnupg nginx git ufw
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu jammy stable" > /etc/apt/sources.list.d/docker.list
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable --now docker
docker --version
-- Docker version 29.3.1, build c2be9cc --
docker compose version
-- Docker Compose version v5.1.1 --
```

## 3. Keep firewall baseline

```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

## 4. Create dedicated app user

```bash
id -u tgmeal >/dev/null 2>&1 || useradd --system --create-home --home-dir /srv/tgmeal --shell /bin/bash tgmeal
usermod -aG docker tgmeal
install -d -o tgmeal -g tgmeal /srv/tgmeal
```

## 5. Remove old application copy and old service

## 6. Clone fresh repo copy as app user

```bash
sudo -u tgmeal git clone https://github.com/nicelightio/Khujandi_mini_app.git /srv/tgmeal/app
cd /srv/tgmeal/app
```

Если нужен конкретный branch:


## 7. Prepare runtime env for compose

Создай `.env` рядом с `docker-compose.yml`:

```bash
cat >/srv/tgmeal/app/.env <<'EOF'
ADMIN_ALLOWED_ORIGINS=https://tgmeal.natureonzoom.win
EOF
chown tgmeal:tgmeal /srv/tgmeal/app/.env
chmod 600 /srv/tgmeal/app/.env
```

## 8. Build and start containers

```bash
sudo -u tgmeal docker compose -f /srv/tgmeal/app/docker-compose.yml build
sudo -u tgmeal docker compose -f /srv/tgmeal/app/docker-compose.yml up -d
sudo -u tgmeal docker compose -f /srv/tgmeal/app/docker-compose.yml ps
```

Проверь container-local origin:

```bash
curl http://127.0.0.1:8080/
curl http://127.0.0.1:8080/api/v1/shops
curl -i -X POST http://127.0.0.1:8080/api/v1/admin/auth/login \
  -H 'Origin: https://tgmeal.natureonzoom.win' \
  -H 'Content-Type: application/json' \
  --data '{"login":"boss@example.com","password":"super-secret-01"}'
```

## 9. Repoint host nginx to the web container

Используй тот же Cloudflare Origin Certificate и оставь host nginx единственной публичной точкой входа.

```bash
cat >/etc/nginx/sites-available/tgmeal.natureonzoom.win <<'EOF'
server {
    listen 80;
    server_name tgmeal.natureonzoom.win;

    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tgmeal.natureonzoom.win;

    ssl_certificate /etc/ssl/cloudflare/tgmeal.natureonzoom.win.crt;
    ssl_certificate_key /etc/ssl/cloudflare/tgmeal.natureonzoom.win.key;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
EOF

ln -sf /etc/nginx/sites-available/tgmeal.natureonzoom.win /etc/nginx/sites-enabled/tgmeal.natureonzoom.win
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

## 10. Validate public origin

```bash
curl -I https://tgmeal.natureonzoom.win
curl https://tgmeal.natureonzoom.win/api/v1/shops
```

Ожидаемо:

- frontend открывается с того же origin;
- `/api/v1/shops` отдает demo catalog;
- `/api/v1/admin/auth/*` доступны через тот же публичный origin и не упираются в missing-runtime mount gap.

## 11. Update flow after new commit

```bash
sudo -u tgmeal git -C /srv/tgmeal/app pull
sudo -u tgmeal docker compose -f /srv/tgmeal/app/docker-compose.yml build
sudo -u tgmeal docker compose -f /srv/tgmeal/app/docker-compose.yml up -d
systemctl reload nginx
```

Если менялся только app code без compose/nginx:

```bash
sudo -u tgmeal git -C /srv/tgmeal/app pull
sudo -u tgmeal docker compose -f /srv/tgmeal/app/docker-compose.yml up -d --build
```

## 12. Rollback

```bash
sudo -u tgmeal docker compose -f /srv/tgmeal/app/docker-compose.yml logs --tail=200
sudo -u tgmeal docker compose -f /srv/tgmeal/app/docker-compose.yml down
```

Если нужно быстро вернуть legacy host nginx config, восстанови предыдущий `sites-available` файл только после полной остановки контейнерного стека.

## 13. Commands to deploy updates on the server

Быстрый безопасный сценарий для накатывания новой версии приложения:

```bash
ssh root@213.155.13.112
sudo -u tgmeal git -C /srv/tgmeal/app pull
sudo -u tgmeal docker compose -f /srv/tgmeal/app/docker-compose.yml up -d --build
sudo -u tgmeal docker compose -f /srv/tgmeal/app/docker-compose.yml ps
systemctl reload nginx
curl -I https://tgmeal.natureonzoom.win
curl https://tgmeal.natureonzoom.win/api/v1/shops
```

Если нужно посмотреть логи после обновления:

```bash
sudo -u tgmeal docker compose -f /srv/tgmeal/app/docker-compose.yml logs --tail=200
```

## Source artifacts

- [.memory-bank/runbooks/telegram-mini-app-test-server-deploy.md](telegram-mini-app-test-server-deploy.md): исходный non-container deploy flow.
- `docker-compose.yml`: container stack для `web` + `api`.
- `Dockerfile.web`: build and serve frontend static app.
- `Dockerfile.api`: Node runtime для repo-local demo/admin auth API.
