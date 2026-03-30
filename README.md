# Khujandi_mini_app

Telegram Mini App для заказа готовой еды и доставки по городу. Проект включает NestJS backend, React + Vite frontend и Telegram-бота.

Архитектурная модель проекта: `layered monolith` + `vertical slices`.

- Слои задают правило зависимостей: `presentation -> application -> domain -> infrastructure`.
- Вертикальный слайс является основной единицей поставки ценности, планирования и тестирования.
- MVP покрывает end-to-end цепочку: витрина -> checkout и оплата -> назначение курьера -> доставка -> отзывы.

Документация находится в каталоге `doc/`.
Рекомендуемый старт: `doc/PRD.md`, `doc/ARCHITECTURE.md`, `doc/TESTING_STRATEGY.md`.
