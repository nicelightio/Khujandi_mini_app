# FRONTEND_COMPONENT_GUIDE.md — Паттерны и структура React + Vite фронтенда

_Версия: 1.0_  
_Дата: 2026-03-27_

## 1. Роль фронтенда в архитектуре

Фронтенд следует общей архитектурной модели проекта: `Layered architecture` + `Vertical slices`.

- Основная единица организации UI-кода — capability slice.
- Каждый slice закрывает одну пользовательскую ценность end-to-end.
- Общий код хранится в `shared/`, но только если он действительно нужен нескольким slices.
- UI-слой не должен становиться местом, куда стекается размытая бизнес-логика.

## 2. Рекомендуемая структура каталогов

```text
frontend/
  src/
    app/
      main.tsx              # точка входа
      router.tsx            # корневой роутер
      providers/            # app-level providers
    slices/
      catalog/
        routes/
        components/
        hooks/
        api/
        model/
      checkout-payment/
        routes/
        components/
        hooks/
        api/
        model/
      delivery-tracking/
        routes/
        components/
        hooks/
        api/
        model/
      reviews-feedback/
        routes/
        components/
        hooks/
        api/
        model/
      admin-access/         # если admin-space временно живет в том же приложении
      delivery-assignment/
      order-cancellation/
    shared/
      ui/                   # переиспользуемые примитивы
      lib/                  # api client, storage, formatters
      state/                # user/session/ui stores
      telegram/             # интеграция с Telegram WebApp API
      i18n/                 # Paraglide.js и языковые настройки
      styles/               # global.css, variables.css
    tests/
      slices/
      shared/
```

Если `admin-web/` выделяется в отдельное приложение, оно повторяет те же принципы: `app/`, `slices/`, `shared/`.

## 3. Как раскладывать код внутри slice

| Папка | Что хранит |
|------|------------|
| `routes/` | route-level экраны и контейнеры slice |
| `components/` | UI-компоненты, специфичные для slice |
| `hooks/` | локальные hooks и orchestration клиентского поведения |
| `api/` | запросы и маппинг контрактов конкретного slice |
| `model/` | локальное состояние, селекторы, типы и view-model правила |

Правило: если код относится только к одному slice, он остается внутри этого slice.

## 4. Контейнеры и презентационные компоненты

| Тип | Расположение | Ответственность |
|-----|--------------|-----------------|
| **Container** | `slices/*/routes` или `slices/*/hooks` | Собирает данные, управляет локальным состоянием, вызывает API и stores |
| **Presentational** | `slices/*/components` или `shared/ui` | Рендерит UI по props, не знает о сетевых деталях |

Компонент переносится в `shared/ui` только тогда, когда он реально переиспользуется между несколькими slices без встраивания бизнес-смысла.

## 5. State management

Рекомендуемое разделение состояния:

| Store / state | Где живет | Что хранит |
|---------------|-----------|------------|
| `user/session` | `shared/state` | профиль пользователя, токен, роль, язык |
| `ui` | `shared/state` | loader, toasts, модальные окна, глобальные флаги |
| `cart` | `slices/checkout-payment/model` или `shared/state` | товары корзины и суммы |
| slice-local state | `slices/*/model` | локальные фильтры, stepper-стейт, временные view-model данные |

Правила:
- нет прямого обращения к `localStorage` из компонентов;
- persist выполняется через helpers в `shared/lib/storage.ts`;
- глобальный store не должен подменять собой границы slices.

## 6. i18n

- Paraglide.js генерирует функции переводов.
- Переводы лучше группировать по slices и `shared/common`, а не по абстрактным экранам.
- Язык выбирается один раз при первом запуске и затем хранится по explicit fallback policy: `DeviceStorage -> CloudStorage -> localStorage`; после появления auth-контекста синхронизируется с backend profile, если такой контур доступен.

Пример логики:

```tsx
{showLangOverlay && (
  <LanguagePicker onChoose={(lang) => setLang(lang)} />
)}
```

## 7. Telegram WebApp UI

- Вызываем `Telegram.WebApp.ready()` как можно раньше.
- Используем `Telegram.WebApp.expand()` для минимизации сжатого viewport.
- Все обращения к `Telegram.WebApp.*` держим в одном shell/runtime adapter слое, а не размазываем по feature-компонентам.
- Поддерживаем safe-area через Telegram safe-area fields/CSS variables `--tg-safe-area-inset-*` и `--tg-content-safe-area-inset-*`; `env(safe-area-inset-*)` не считаем надежным baseline внутри Telegram WebView.
- Стабилизируем высоту через `WebApp.viewportStableHeight` и `viewportChanged(isStateStable=true)`.
- Применяем тему через `WebApp.themeParams` и обновляем CSS-переменные на `themeChanged`.
- Обрабатываем `activated/deactivated`, back/swipe policy и feature detection (`isVersionAtLeast`) в shell, а не в feature коде.
- Убираем «прыжки» интерфейса через аккуратные контейнеры и `overscroll-behavior: none`.

## 8. Тестирование фронтенда

| Уровень | Инструмент | Организация |
|---------|-----------|-------------|
| Unit | Vitest | `src/tests/slices/*` и `src/tests/shared/*` |
| UI / E2E | Playwright | сценарии по capability slices |

Фронтенд-тесты должны повторять архитектурную логику проекта: сначала capability slice, затем конкретные компоненты и утилиты.

## 9. Практические правила

1. Не переносить бизнес-логику в UI-компоненты.
2. Не делать `shared` свалкой для slice-specific кода.
3. Не строить фронтенд вокруг глобального набора страниц, если фича естественно укладывается в slice.
4. API-вызовы, Telegram WebApp API и orchestration держать в hooks, model или shared-lib, а не в JSX-разметке.
5. Session identifiers не хранить в `localStorage`; для Mini App security baseline предпочитать HttpOnly cookie contour или отдельно зафиксированное безопасное исключение.
6. Имена: PascalCase для компонентов, camelCase для hooks и функций.

## 10. Связь с общей архитектурой проекта

- `catalog`, `checkout-payment`, `delivery-tracking` и `reviews-feedback` являются основными клиентскими slices Mini App.
- `admin-access`, `delivery-assignment` и `order-cancellation` живут либо в отдельной веб-админке, либо во временном admin-space внутри того же фронтенда.
- Если один slice затрагивает несколько UI-контуров, каждый контур все равно реализует только свой `presentation`-слой этого slice.
