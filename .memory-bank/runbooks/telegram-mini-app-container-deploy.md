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

## 5. Deploy Database Migrations

Перед запуском контейнеров нужно проверить и применить миграции БД.

### 5.1 Check pending migrations

```bash
sudo -u tgmeal -H bash -lc 'cd /srv/tgmeal/app && docker compose run --rm api npx --yes prisma migrate status'
```

### 5.2 Apply migrations

```bash
sudo -u tgmeal -H bash -lc 'cd /srv/tgmeal/app && docker compose run --rm api npx --yes prisma migrate deploy'
```

Ожидаемый вывод для новой миграции:

```
Database migration: 20260413120000_add_shop_identity_uniqueness
Applying migration: 20260413120000_add_shop_identity_uniqueness
```

### 5.3 Verify constraint exists

```bash
sudo -u tgmeal -H bash -lc 'cd /srv/tgmeal/app && docker compose run --rm api npx prisma db execute --stdin <<< "SELECT conname FROM pg_constraint WHERE conname = '\''Shop_sellerId_name_key'\'';"'
```

Или через psql напрямую (если есть доступ):

```sql
SELECT conname FROM pg_constraint WHERE conname = 'Shop_sellerId_name_key';
```

## 7. Clone fresh repo copy as app user

```bash
sudo -u tgmeal git clone https://github.com/nicelightio/Khujandi_mini_app.git /srv/tgmeal/app
cd /srv/tgmeal/app
```

Если нужен конкретный branch:


## 8. Prepare runtime env for compose

Создай `.env` рядом с `docker-compose.yml`:

```bash
cat >/srv/tgmeal/app/.env <<'EOF'
ADMIN_ALLOWED_ORIGINS=https://tgmeal.natureonzoom.win
ADMIN_DB_PATH=/var/lib/khujandi/admin-access-runtime.sqlite
CATALOG_DB_PATH=/var/lib/khujandi/catalog-runtime.sqlite
DEBUG=FALSE
EOF
chown tgmeal:tgmeal /srv/tgmeal/app/.env
chmod 600 /srv/tgmeal/app/.env
```

Важно: `scripts/dev-api.ts` хранит runtime SQLite state по `ADMIN_DB_PATH` и `CATALOG_DB_PATH`. Если не задать явные path и не примонтировать persistent Docker volume, admin cookie-сессии и catalog provisioning/seller edits останутся внутри filesystem конкретного `api` контейнера и исчезнут после `docker compose up -d --build` / recreate.

`DEBUG=TRUE` допускается только как temporary diagnostic mode для embedded Telegram debugging: web build включает storefront diagnostic panel, а mounted runtime может временно ослаблять owner-only seller storefront guard и писать structured debug logs. Для нормального production-like deploy значение должно оставаться `FALSE`.

Prisma CLI в checked-in `api` image запускается из `/app`, а каноническая schema лежит в `backend/prisma/schema.prisma`. Root `package.json` фиксирует этот path через `prisma.schema`, а pinned repo-local dependency `prisma` попадает в image через `npm ci --omit=dev`, поэтому `docker compose run --rm api npx --yes prisma migrate status|deploy` должен использовать совместимый checked-in CLI и работать без отдельного `--schema` workaround.

## 8. Build and start containers

```bash
sudo -u tgmeal docker compose -f /srv/tgmeal/app/docker-compose.yml build
sudo -u tgmeal docker compose -f /srv/tgmeal/app/docker-compose.yml up -d
sudo -u tgmeal docker compose -f /srv/tgmeal/app/docker-compose.yml ps
sudo -u tgmeal docker volume inspect tgmeal_catalog_runtime_data
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
- `api` контейнер хранит admin auth runtime state и catalog runtime state в named volume, а не только во внутреннем filesystem текущего container instance.

## 11. Update flow after new commit

Рекомендуемый способ обновления: через server-side deploy script.

```bash
/usr/local/bin/tgmeal-deploy
```

Эквивалент вручную:

```bash
sudo -u tgmeal -H bash -lc 'cd /srv/tgmeal/app && git pull'
sudo -u tgmeal -H bash -lc 'cd /srv/tgmeal/app && docker compose build'
sudo -u tgmeal -H bash -lc 'cd /srv/tgmeal/app && docker compose up -d'
systemctl reload nginx
```

После rollout проверь, что volume не потерян и catalog SQLite лежит на ожидаемом path:

```bash
sudo -u tgmeal -H bash -lc 'cd /srv/tgmeal/app && docker compose exec api sh -lc "echo $CATALOG_DB_PATH && ls -l /var/lib/khujandi"'
```

Если менялся только app code без compose/nginx:

```bash
sudo -u tgmeal -H bash -lc 'cd /srv/tgmeal/app && git pull'
sudo -u tgmeal -H bash -lc 'cd /srv/tgmeal/app && docker compose up -d --build'
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
/usr/local/bin/tgmeal-deploy
```

Если нужно посмотреть логи после обновления:

```bash
sudo -u tgmeal -H bash -lc 'cd /srv/tgmeal/app && docker compose logs --tail=200'
```

## 14. Install deploy script on the server

Создай server-side script:


Запуск:

```bash
/usr/local/bin/tgmeal-deploy
```

Если нужен только статус последнего deploy log:

```bash
ls -1t /var/log/tgmeal | head -n 5
```
или 
```bash
ls -1t /var/log/tgmeal
tail -n 200 /var/log/tgmeal/$(ls -1t /var/log/tgmeal | head -n 1)
```

## Source artifacts

- [.memory-bank/runbooks/telegram-mini-app-test-server-deploy.md](telegram-mini-app-test-server-deploy.md): исходный non-container deploy flow.
- `docker-compose.yml`: container stack для `web` + `api`.
- `Dockerfile.web`: build and serve frontend static app.
- `Dockerfile.api`: Node runtime для repo-local demo/admin auth API.
- `package.json`: canonical Prisma CLI schema path and pinned repo-local Prisma dependency for root/container runtime.

TG ID Луганский: 
5281851429

корень
https://tgmeal.natureonzoom.win

админка селлера 
https://tgmeal.natureonzoom.win/seller/shops/status


главная Админка добавить магазины 
https://tgmeal.natureonzoom.win/admin/catalog/shops/provision

Магазин 888
https://tgmeal.natureonzoom.win/shops/888

проверка оплаты
https://tgmeal.natureonzoom.win/checkout
