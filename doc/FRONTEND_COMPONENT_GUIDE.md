# FRONTEND_COMPONENT_GUIDE.md — Паттерны и структура Next.js фронтенда

_Версия: 0.3  
Дата: 2026-02-04_

---

## 1. Дерево каталогов

```
frontend/
  ├─ app/
  │  ├─ layout.tsx            # корневой layout
  │  ├─ page.tsx              # витрина
  │  ├─ shops/
  │  │  ├─ page.tsx
  │  │  └─ [id]/page.tsx
  │  ├─ products/page.tsx
  │  ├─ orders/
  │  │  ├─ page.tsx
  │  │  └─ [id]/page.tsx
  │  ├─ profile/page.tsx
  │  └─ auth/page.tsx
  ├─ components/
  │  ├─ ui/
  │  ├─ ShopCard.tsx
  │  ├─ ProductCard.tsx
  │  └─ MainBanner.tsx
  ├─ lib/
  │  ├─ api.ts                # REST-обёртка
  │  ├─ telegram.ts           # Telegram WebApp API
  │  ├─ i18n.ts               # Paraglide.js
  │  ├─ storage.ts            # sessionStorage helpers
  │  └─ types.ts              # общие TS-типы
  ├─ state/
  │  ├─ useUserStore.ts
  │  ├─ useCartStore.ts
  │  └─ useUiStore.ts
  ├─ styles/
  │  ├─ globals.css
  │  └─ variables.css
  └─ public/
```

---

## 2. Паттерн “Smart vs. Dumb”

| Тип | Расположение | Ответственность |
|-----|--------------|-----------------|
| **Smart** | `app/**/page.tsx` + `app/**/layout.tsx` | Запрашивает данные, управляет состоянием, передаёт props |
| **Dumb**  | `components/**` | Только UI-рендер по props, не знает о API |

Для компонентов, использующих hooks или доступ к Telegram WebApp, добавляем директиву `"use client"`.

---

## 3. State

| Store            | Тип      | Содержимое                           |
|------------------|----------|--------------------------------------|
| `useUserStore`   | Zustand  | `{ id, role, lang, token }`          |
| `useCartStore`   | Zustand  | `{ items: CartItem[], total }`       |
| `useUiStore`     | Zustand  | `{ loading, toasts }`                |

Правило: **нет** прямого обращения к `localStorage`; persist делаем через `sessionStorage` в `storage.ts` и `useEffect`.

---

## 4. i18n

- Paraglide.js генерирует `t('key')`.  
- Файлы переводов разделены по пространствам: `home`, `shop`, `order`, `common`.  
- Строки UI хранятся в `languages/{lang}.ts` или `frontend/messages/*.ts` (по выбранной структуре).

---

## 5. Overlay выбора языка

```tsx
{showLangOverlay && (
  <LanguagePicker onChoose={(lang) => setLang(lang)} />
)}
```

Скрываем после первого выбора, сохраняем `sessionStorage.setItem('lang', lang)`.

---

## 6. Гладкий Telegram WebView UI

- Вызываем `Telegram.WebApp.ready()` как можно раньше (в клиентском layout или корневом компоненте страницы).
- Используем `Telegram.WebApp.expand()` для минимизации “сжатого” viewport.
- Поддерживаем safe-area через `env(safe-area-inset-*)` и паддинги контейнеров.
- Стабилизируем высоту: ставим CSS-переменную из `WebApp.viewportStableHeight`, обновляем на событие `viewportChanged`.
- Применяем тему через `WebApp.themeParams` и обновляем переменные на событие `themeChanged`.
- Убираем «прыжки» и скролл: `overscroll-behavior: none;` и аккуратные контейнеры.

---

## 7. Тестирование

| Уровень | Инструмент | Папка |
|---------|-----------|-------|
| Unit    | Jest + React Testing Library | `frontend/__tests__/*.test.tsx` |
| UI      | Playwright| `frontend-tests/` (план) |

---

## 8. Best Practices

1. **No Business Logic in Components** — максимум map/format.  
2. Фетчи и Telegram WebApp API — в hooks (`useEffect`) или `lib/telegram.ts`.  
3. Глобальный loader через `<Loader visible={loading} />`.  
4. Ошибки API показываем toast-ом и логируем в Sentry (в будущем).  
5. Имена: PascalCase для компонентов, camelCase для hooks и функций.

---

Конец документа.
