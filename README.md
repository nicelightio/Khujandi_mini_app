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

Current staging note: Cloudflare DNS for the public staging hostname is configured and the staging route is healthy. Some local resolvers may temporarily keep the previous NXDOMAIN response; use public resolvers or wait for cache expiry if `staging-tgmeal.natureonzoom.win` does not resolve immediately from a specific network.

Operational docs:

- `.memory-bank/runbooks/staging-runtime-and-ui-qa.md`
- `.memory-bank/guides/staging-server-usage.md`
- `.memory-bank/runbooks/telegram-mini-app-container-deploy.md`
