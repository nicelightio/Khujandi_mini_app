# Khujandi_mini_app

Telegram Mini App для заказа готовой еды и доставки по городу. Проект включает NestJS backend, React + Vite frontend и Telegram-бота.

Архитектурная модель проекта: `layered monolith` + `vertical slices`.

- Слои задают правило зависимостей: `presentation -> application -> domain -> infrastructure`.
- Вертикальный слайс является основной единицей поставки ценности, планирования и тестирования.
- MVP покрывает end-to-end цепочку: витрина -> checkout и оплата -> назначение курьера -> доставка -> отзывы.

Документация находится в каталоге `doc/`.
Рекомендуемый старт: `doc/PRD.md`, `doc/ARCHITECTURE.md`, `doc/TESTING_STRATEGY.md`.

## Environments

- Production: https://tgmeal.natureonzoom.win
- Production API smoke: https://tgmeal.natureonzoom.win/api/v1/shops
- Staging: https://staging-tgmeal.natureonzoom.win
- Staging API health: https://staging-tgmeal.natureonzoom.win/api/v1/health
- Staging API smoke: https://staging-tgmeal.natureonzoom.win/api/v1/shops

Staging runs on the same host as production, but uses a separate checkout, Compose project, Traefik router prefix and runtime volume:

- checkout: `/srv/tgmeal/staging/app`
- Compose project: `tgmeal-staging`
- Traefik router/service prefix: `tgmeal-staging`
- runtime volume: `tgmeal_staging_runtime_data`

Current staging note: the staging containers are deployed and healthy on the host-local Traefik route, but the public hostname requires a Cloudflare DNS record before external browser/QA access works.

Operational docs:

- `.memory-bank/runbooks/staging-runtime-and-ui-qa.md`
- `.memory-bank/guides/staging-server-usage.md`
- `.memory-bank/runbooks/telegram-mini-app-container-deploy.md`
