# FRONTEND_COMPONENT_GUIDE.md — Паттерны и структура React + Vite фронтенда

_Версия: 0.2  
Дата: 2026-02-03_

---

## 1. Дерево каталогов

```
frontend/
  ├─ src/
  │  ├─ main.tsx             # точка входа
  │  ├─ App.tsx              # роутер и layout
  │  ├─ routes/              # страницы (React Router)
  │  │   ├─ Home.tsx
  │  │   ├─ Shops.tsx
  │  │   ├─ ShopDetails.tsx
  │  │   ├─ Products.tsx
  │  │   ├─ Orders.tsx
  │  │   ├─ OrderDetails.tsx
  │  │   ├─ Profile.tsx
  │  │   └─ Auth.tsx
  │  ├─ components/
  │  │   ├─ ui/
  │  │   ├─ ShopCard.tsx
  │  │   ├─ ProductCard.tsx
  │  │   └─ MainBanner.tsx
  │  ├─ lib/
  │  │   ├─ api.ts            # REST-обёртка
  │  │   ├─ telegram.ts       # Telegram WebApp API
  │  │   ├─ i18n.ts           # Paraglide.js
  │  │   ├─ storage.ts        # sessionStorage helpers
  │  │   └─ types.ts          # общие TS-типы
  │  ├─ state/
  │  │   ├─ useUserStore.ts
  │  │   ├─ useCartStore.ts
  │  │   └─ useUiStore.ts
  │  ├─ languages/            # ru.ts, en.ts, tj.ts
  │  └─ styles/               # global.css, variables.css
  ├─ public/                  # assets
  ├─ vite.config.ts
  └─ tsconfig.json
```

---

## 2. Паттерн “Smart vs. Dumb”

| Тип | Расположение | Ответственность |
|-----|--------------|-----------------|
| **Smart** | `routes/*.tsx` | Запрашивает данные, управляет состоянием, передаёт props |
| **Dumb**  | `components/**` | Только UI-рендер по props, не знает о API |

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
- Строки UI хранятся в `languages/{lang}.ts` и импортируются “tree-shakable”.

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

- Вызываем `Telegram.WebApp.ready()` как можно раньше (в `main.tsx` или `App.tsx`).
- Используем `Telegram.WebApp.expand()` для минимизации “сжатого” viewport.
- Поддерживаем safe-area через `env(safe-area-inset-*)` и паддинги контейнеров.
- Стабилизируем высоту: ставим CSS-переменную из `WebApp.viewportStableHeight`, обновляем на событие `viewportChanged`.
- Применяем тему через `WebApp.themeParams` и обновляем переменные на событие `themeChanged`.
- Убираем «прыжки» и скролл: `overscroll-behavior: none;` и аккуратные контейнеры.

---

## 7. Тестирование

| Уровень | Инструмент | Папка |
|---------|-----------|-------|
| Unit    | Vitest    | `src/tests/*.test.ts` |
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
