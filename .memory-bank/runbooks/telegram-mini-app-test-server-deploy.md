---
description: Runbook развертывания тестового Telegram Mini App сервера на Ubuntu VPS с Cloudflare subdomain и первым Android test flow.
status: active
---
# Telegram Mini App Test Server Deploy

## Purpose

Поднять тестовый сервер для реального `Android Telegram` verify `FT-009` на VPS `Ubuntu 22` с доменом `tgmeal.natureonzoom.win` через Cloudflare.

## Scope and assumptions

- Цель этого runbook: быстро получить публичный `https` URL для Telegram Mini App и пройти Android runtime checks по `FT-009`.
- Текущий repo state подходит для shell/runtime verify как `frontend + demo API`.
- Это не production deploy всего MVP: здесь нет полноценного production backend bootstrap, БД migration flow, payment provider wiring и bot webhook contour.
- Для текущего тестового прогона достаточно:
  - Vite-built frontend;
  - demo API на `/api/v1/shops` и `/api/v1/shops/:id/products`;
  - запуска Mini App из Telegram Android client.
- Вход в приложение для тестов идет через Telegram Mini App launch context; отдельного login form нет.

## Target environment

- VPS: `213.155.13.112`
- OS: `Ubuntu 22.04`
- Domain: `natureonzoom.win`
- Mini App subdomain: `tgmeal.natureonzoom.win`
- Recommended origin stack:
  - `nginx`
  - `nodejs 20`
  - `systemd` services for frontend demo API
  - `Cloudflare Proxied` DNS
  - `Cloudflare Origin Certificate` on origin
  - Cloudflare SSL mode: `Full (strict)`

## Outcome

После выполнения runbook должно получиться:

- `https://tgmeal.natureonzoom.win` открывает Mini App frontend;
- `/api/v1/shops` и `/api/v1/shops/:id/products` доступны через тот же origin;
- BotFather направляет кнопку Web App на этот URL;
- приложение открывается в `Android Telegram`, проходит language overlay и customer-facing shell checks;
- evidence складывается в `.tasks/TASK-FT009-06/`.

## 1. DNS setup in Cloudflare

Создай запись:

- Type: `A`
- Name: `tgmeal`
- IPv4: `213.155.13.112`
- Proxy status: `Proxied`

Проверь, что запись резолвится:

```bash
nslookup tgmeal.natureonzoom.win
```

Ожидаемо: IP `213.155.13.112`.

## 2. Server bootstrap

Подключись к серверу:

```bash
ssh root@213.155.13.112
```

Обнови систему и поставь базовые пакеты:

```bash
apt update && apt upgrade -y
apt install -y nginx git curl ca-certificates ufw
```

Открой нужные порты:

```bash
ufw allow OpenSSH && ufw allow 80/tcp && ufw allow 443/tcp && ufw --force enable
```

## 3. Install Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v
npm -v
```

Ожидаемо: Node `20.x`.

## 4. Prepare app directory

Рекомендуемый путь:

```bash
mkdir -p /var/www/tgmeal
cd /var/www/tgmeal
```

Дальше либо клонируй репозиторий, либо скопируй текущий workspace на сервер.

Пример с git:

```bash
git clone <YOUR_REPO_URL> app
cd /var/www/tgmeal/app
```

Если репозиторий не в remote, загрузи файлы любым удобным способом и перейди в каталог проекта.

## 5. Install dependencies and build frontend

```bash
cd /var/www/tgmeal/app
npm ci
npm run build:frontend
```

Ожидаемо появится:

- `dist/index.html`
- `dist/assets/*`

## 6. Start demo API as a service

Создай unit-файл:

```bash
cat >/etc/systemd/system/tgmeal-demo-api.service <<'EOF'
[Unit]
Description=Khujandi Mini App Demo API
After=network.target

[Service]
Type=simple
WorkingDirectory=/var/www/tgmeal/app
ExecStart=/usr/bin/node /var/www/tgmeal/app/scripts/dev-api.mjs
Restart=always
RestartSec=3
User=root
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF
```

Запусти:

```bash
systemctl daemon-reload
systemctl enable --now tgmeal-demo-api.service
systemctl status tgmeal-demo-api.service
```

Проверь API локально на сервере:

```bash
curl http://127.0.0.1:3001/api/v1/shops
```

## 7. Create Cloudflare Origin Certificate

В Cloudflare:

1. Открой `SSL/TLS`.
2. Перейди в `Origin Server`.
3. Нажми `Create Certificate`.
4. Выбери:
   - key type: `RSA (2048)` или `ECDSA P-256`
   - hostname: `tgmeal.natureonzoom.win`
   - при желании дополнительно `*.natureonzoom.win`
5. Создай сертификат.
6. Скопируй оба блока:
   - `Origin Certificate`
   - `Private Key`

На сервере:

```bash
mkdir -p /etc/ssl/cloudflare
chmod 700 /etc/ssl/cloudflare
```

Сохрани сертификат:

```bash
nano /etc/ssl/cloudflare/tgmeal.natureonzoom.win.crt
```

Сохрани ключ:

```bash
nano /etc/ssl/cloudflare/tgmeal.natureonzoom.win.key
```

После сохранения выставь права:

```bash
chmod 644 /etc/ssl/cloudflare/tgmeal.natureonzoom.win.crt
chmod 600 /etc/ssl/cloudflare/tgmeal.natureonzoom.win.key
```

## 8. Configure nginx

Создай конфиг:

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

    root /var/www/tgmeal/app/dist;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }

    location / {
        try_files $uri /index.html;
    }
}
EOF
```

Активируй его:

```bash
ln -sf /etc/nginx/sites-available/tgmeal.natureonzoom.win /etc/nginx/sites-enabled/tgmeal.natureonzoom.win
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

Проверь:

```bash
curl http://tgmeal.natureonzoom.win
curl http://tgmeal.natureonzoom.win/api/v1/shops
```

## 9. Configure Cloudflare SSL mode

В Cloudflare открой `SSL/TLS -> Overview` и установи:

- encryption mode: `Full (strict)`

Дополнительно проверь, что DNS запись `tgmeal` остается `Proxied`.

Проверки:

```bash
curl -I https://tgmeal.natureonzoom.win
```

Важно:

- при `Proxied + Full (strict)` отдельный `Let's Encrypt` на origin не обязателен;
- origin cert доверяется Cloudflare, а не обычным браузером при прямом обращении к IP;
- не переключай SSL mode на `Flexible`, если хочешь избежать лишних проблем с redirect/cookie/security baseline.

## 10. Telegram BotFather integration

Нужен бот, через который будет открываться Mini App.

Если бот уже существует:

1. Открой `@BotFather`
2. Выполни `/mybots`
3. Выбери нужного бота
4. Открой `Bot Settings`
5. Открой `Menu Button`
6. Выбери `Configure menu button`
7. Укажи:
   - Title: `Open app`
   - URL: `https://tgmeal.natureonzoom.win`

Если хочешь запуск через inline/web app button в сообщении, это делается уже на стороне логики бота, но для первого Android verify menu button достаточно.

## 11. First launch on Android

1. Открой Telegram на Android.
2. Найди своего бота.
3. Нажми `Open app`.
4. Дождись открытия Mini App.
5. На первом запуске выбери язык.
6. Пройди в каталог и затем в checkout.

## 12. How login works for tests

- Отдельного логина сейчас нет.
- Для текущего test server flow входом считается запуск Mini App из Telegram клиента, чтобы приложение получило реальный Telegram runtime context.
- Это достаточно для `FT-009` shell/runtime verify.
- Для production-like auth verify нужен отдельный backend deploy с реальным `POST /auth/telegram`, `bot token`, replay guard и session contour; этот runbook этого не покрывает.

## 13. What to verify on Android now

См. checklist:

- `.tasks/TASK-FT009-06/android-evidence-checklist.md`

Минимальные обязательные проверки:

1. bootstrap без долгого placeholder;
2. safe-area на catalog;
3. safe-area и bottom CTA на checkout;
4. keyboard behavior без layout jump;
5. theme change;
6. deactivate/reactivate;
7. back/swipe policy.

## 14. Evidence collection

Сохраняй в `.tasks/TASK-FT009-06/`:

- `android-01-bootstrap.png`
- `android-02-catalog-safe-area.png`
- `android-03-checkout-safe-area.png`
- `android-04-checkout-keyboard.mp4`
- `android-05-theme-change.mp4`
- `android-06-lifecycle-resume.mp4`
- `android-07-back-swipe-policy.mp4`
- `android-notes.md`

Минимальный шаблон notes:

```md
- Device model:
- Android version:
- Telegram version:
- Scenario:
- Result: PASS/FAIL
- What is visible:
- Issues:
```

## 15. Quick health checks

На сервере:

```bash
systemctl status tgmeal-demo-api.service
nginx -t
curl http://127.0.0.1:3001/api/v1/shops
curl -I https://tgmeal.natureonzoom.win
```

Проверка nginx-конфига напрямую на origin с Host header:

```bash
curl -I http://127.0.0.1 -H "Host: tgmeal.natureonzoom.win"
```

Если frontend не обновился после новой сборки:

```bash
cd /var/www/tgmeal/app
npm ci
npm run build:frontend
systemctl restart tgmeal-demo-api.service
systemctl reload nginx
```

## 16. Known limitations

- Текущий test server deploy дает real Telegram runtime для `FT-009`, но не production-complete backend contour.
- Checkout здесь годится для UI/runtime verify, а не для trusted payment verification.
- `POST /auth/telegram`, database-backed session issuance, payment callbacks и bot webhook ingress требуют отдельного production-like backend bootstrap.

## Source artifacts

- [.memory-bank/features/FT-009-mini-app-shell-and-webview-ux.md](../features/FT-009-mini-app-shell-and-webview-ux.md): shell/runtime acceptance.
- [.memory-bank/runbooks/telegram-mini-app-verification.md](telegram-mini-app-verification.md): Android Telegram verify scope.
- [.memory-bank/contracts/mini-app-runtime-contract.md](../contracts/mini-app-runtime-contract.md): runtime ownership boundary.
- [.memory-bank/contracts/telegram-mini-app-auth-contract.md](../contracts/telegram-mini-app-auth-contract.md): production-like auth boundary, outside this quick test deploy.
