# Документация проекта Khujandi Mini App — индекс

_Дата: 2026-03-27_

Основной источник продуктовых решений: `doc/PRD.md`.
Если между документами есть расхождения, приоритет у `doc/PRD.md`, затем у `doc/ARCHITECTURE.md` для архитектурных правил реализации.

Каноническая архитектурная модель проекта: `Layered architecture` + `Vertical slices` без оверинжиниринга.

| Файл | Назначение | Что фиксирует |
|------|------------|---------------|
| [`PRD.md`](PRD.md) | Продуктовые требования MVP | Scope, роли, acceptance-сценарии, capability slices, SLA, Go-Live |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Единая архитектура решения | Слои, vertical slices, shared-границы, потоки данных, anti-overengineering rules |
| [`TESTING_STRATEGY.md`](TESTING_STRATEGY.md) | Стратегия тестирования | Acceptance -> e2e -> integration -> unit по каждому slice |
| [`API_GUIDELINES.md`](API_GUIDELINES.md) | Правила API и событий | Контракты REST/polling, auth, ошибки и API по slices |
| [`DATA_MODEL.md`](DATA_MODEL.md) | Концептуальная модель данных | Сущности, ключевые поля, связи и привязка к slices |
| [`PROJECT_SPECIFICATION.md`](PROJECT_SPECIFICATION.md) | Повествовательное ТЗ | Бизнес-сценарии и реализация capability slices в продукте |
| [`FRONTEND_COMPONENT_GUIDE.md`](FRONTEND_COMPONENT_GUIDE.md) | Гайд по фронтенду | React + Vite, UI-слой и клиентская организация |
| [`BRIEF.md`](BRIEF.md) | Краткий контекст | Краткое описание продукта и ценности MVP |
| [`BRIEF_EXT.md`](BRIEF_EXT.md) | Расширенный контекст | Бизнес-детали, ограничения и подход к поставке |
| [`GLOSSARY.md`](GLOSSARY.md) | Глоссарий | Канонические продуктовые и архитектурные термины |

## Рекомендуемый порядок чтения

1. `PRD.md` — что именно запускаем и какие capability slices обязательны в MVP.
2. `ARCHITECTURE.md` — как slices проходят через слои и какие ограничения действуют.
3. `TESTING_STRATEGY.md` — как acceptance-сценарии превращаются в тестовый контур.
4. `API_GUIDELINES.md` — как slices публикуют REST- и event-контракты.
5. `DATA_MODEL.md` — как slices опираются на общую модель данных.
6. `PROJECT_SPECIFICATION.md` — как архитектурная модель проявляется в пользовательских сценариях.

## Документы, критичные для текущего MVP

- `checkout-payment`: онлайн-оплата через локального провайдера и создание заказа только после успешной оплаты.
- `admin-access`: отдельный контур веб-админки (login/password) и политики безопасности.
- `delivery-tracking`: polling `GET /events?since=<cursor>` с целевым SLA p95 <= 10 секунд.
- `reviews-feedback`: двусторонние отзывы и негативные алерты через Telegram-бота.
