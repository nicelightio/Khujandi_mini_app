# FRONTEND_COMPONENT_GUIDE.md — Паттерны и структура SvelteKit-фронтенда

_Версия: 0.1  
Дата: 2025-05-25_

---

## 1. Дерево каталогов

```
frontend-svelte5/
 ├─ src/
 │  ├─ app.html               # точка входа (WebApp API <script>)
 │  ├─ routes/                # SvelteKit маршруты
 │  │   ├─ +layout.svelte     # Глобальный layout (темы, overlay)
 │  │   ├─ +page.svelte       # Главная витрина
 │  │   ├─ shops/             # Магазины
 │  │   ├─ products/          # Все товары
 │  │   ├─ orders/            # Заказы
 │  │   ├─ profile/           # Профиль
 │  │   └─ auth/              # Авторизация
 │  ├─ lib/
 │  │   ├─ api.ts            # REST-обёртка
 │  │   ├─ stores.ts         # Svelte stores
 │  │   ├─ telegram.ts       # Telegram WebApp API
 │  │   ├─ i18n.ts           # Paraglide.js
 │  │   └─ types.ts          # Общие TS-типы
 │  ├─ components/
 │  │   ├─ UI/               # атомы/молекулы
 │  │   ├─ ShopCard.svelte
 │  │   ├─ ProductCard.svelte
 │  │   └─ MainBanner.svelte
 │  ├─ languages/            # ru.ts, en.ts, tg.ts
 │  └─ styles/               # global.css, variables.css
 ├─ static/                  # assets
 ├─ svelte.config.js
 ├─ vite.config.js
 └─ tailwind.config.cjs
```

---

## 2. Паттерн “Smart vs. Dumb”

| Тип | Расположение | Ответственность |
|-----|--------------|-----------------|
| **Smart** | `routes/*/+page.svelte` | Запрашивает данные, управляет состоянием, передаёт props |
| **Dumb**  | `components/**`         | Только UI-рендер по props, не знает о API |

---

## 3. Stores

| Store            | Тип      | Содержимое                           |
|------------------|----------|--------------------------------------|
| `user`           | writable | `{ id, role, lang, token }`          |
| `lang`           | writable | `"ru" | "en" | "tj"`                 |
| `cart`           | writable | `{ items: CartItem[], total }`       |
| `loading`        | writable | `boolean` глобальный лоадер          |
| `notifications`  | derived  | список toast-сообщений               |

Правило: **нет** прямого обращения к `localStorage`; persist делаем через `sessionStorage` в helper-функциях.

---

## 5. i18n

- Paraglide.js генерирует `t('key')`.  
- Файлы переводов разделены по пространствам: `home`, `shop`, `order`, `common`.  
- Строки UI хранятся в `languages/{lang}.ts` и импортируются “tree-shakable”.

---

## 6. Overlay выбора языка

```svelte
{#if showLangOverlay}
  <LanguagePicker on:choose={(e) => setLang(e.detail)}/>
{/if}
```

Скрываем после первого выбора, сохраняем `sessionStorage.setItem('lang', lang)`.

---

## 7. Темы

Telegram передаёт цветовую схему через `window.Telegram.WebApp.themeParams`.  
Глобально в `+layout.svelte` применяем CSS-переменные.

---

## 8. Тестирование

| Уровень | Инструмент | Папка |
|---------|-----------|-------|
| Unit    | Vitest    | `src/tests/*.test.ts` |
| UI      | Playwright| `frontend-tests/` (план) |

---

## 9. Best Practices

1. **No Business Logic in Components** – максимум map/format.  
2. `await tick()` после изменения store при UI-эффектах.  
3. Глобальный loader через `<Loader visible={$loading} />`.  
4. Ошибки API показываем toast-ом и логируем в Sentry (в будущем).  
5. Имя файлов PascalCase для компонентов, camelCase для store.

---

Конец документа.