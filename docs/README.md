# 📚 Документация проекта *Худжанди* — индекс

_Дата: 2025-05-27_

В каталоге `docs/` собраны все ключевые документы. Ниже приведён их перечень и краткое описание, чтобы было удобнее ориентироваться.

| Файл | Назначение | Основные разделы |
|------|------------|------------------|
| [`ARCHITECTURE_OVERVIEW.md`](ARCHITECTURE_OVERVIEW.md) | Высокоуровневая архитектура бекенда и фронтенда, Mermaid-диаграммы потоков данных, жизненный цикл запроса, дорожная карта | Структура репозитория • Слои системы • ER-диаграмма • UX-рекомендации |
| [`PROJECT_SPECIFICATION.md`](PROJECT_SPECIFICATION.md) | Полное повествовательное ТЗ: цели, роли, бизнес-процессы, требования к BE/FE, страницы, сценарии, глоссарий | Пользовательские сценарии • Бизнес-правила • Требования • Roadmap |
| [`DATA_MODEL.md`](DATA_MODEL.md) | Детальное описание схемы PostgreSQL: таблицы, поля, типы, ограничения и ER-диаграмма | Таблицы clients, couriers, admins, shops, products, orders, history, event_logs |
| [`API_GUIDELINES.md`](API_GUIDELINES.md) | Правила дизайна REST-API и WebApp API: URI, фильтры, коды ошибок, примеры эндпоинтов | Базовые принципы • Ошибки • Типовые маршруты • WebHooks • Swagger |
| [`FRONTEND_COMPONENT_GUIDE.md`](FRONTEND_COMPONENT_GUIDE.md) | Паттерны и структура SvelteKit-фронтенда: дерево каталогов, Smart/Dumb компоненты, stores, i18n, тесты | Каталоги • API-слой • Stores • Overlay языка • Темизация • Best practices |
| [`DEV_SETUP.md`](DEV_SETUP.md) | Пошаговая инструкция локального развертывания и запуска: Python, Node, Docker, тесты, линт | Backend setup • Frontend dev • Docker compose • Полезные команды |
| [`TELEGRAM_INTEGRATION.md`](TELEGRAM_INTEGRATION.md) | Переменные `.env`, жизненный цикл aiogram-бота, уведомления, платежи | TG_TOKEN • ADMIN_IDS • Payments • Webhooks |
| [`ERROR_HANDLING_AND_LOGGING.md`](ERROR_HANDLING_AND_LOGGING.md) | Централизованная обработка ошибок, структура логов, таблица `event_logs` | Middleware • trace_id • Telegram alerts |
| [`TESTING_STRATEGY.md`](TESTING_STRATEGY.md) | Подход к unit/E2E-тестам, сценарии, цели покрытия | pytest • Vitest • Playwright • Race conditions |
| [`ARCHITECTURE_UPDATED.md`](ARCHITECTURE_UPDATED.md) | Обновлённая архитектура после рефакторинга Phase 1 | Контекст • Изменения • Next Steps |

## Как пользоваться

1. Функциональные детали и бизнес-логика  `PROJECT_SPECIFICATION.md`.  
2. Понять, как устроен проект `ARCHITECTURE_OVERVIEW.md`.  
3. При работе с БД обращайтесь к `DATA_MODEL.md`.  
4. Разрабатывая или расширяя API, следуйте `API_GUIDELINES.md`.  
5. Фронтенд-разработчикам поможет `FRONTEND_COMPONENT_GUIDE.md`.  
6. Чтобы поднять проект локально или на CI, используйте `DEV_SETUP.md`.

---