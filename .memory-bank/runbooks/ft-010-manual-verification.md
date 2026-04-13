---
description: Runbook ручного тестирования FT-010: provisioning, shared storefront edit mode и seller-web status toggle.
status: active
---
# FT-010 Manual Verification

## Purpose

Зафиксировать канонический ручной сценарий проверки `FT-010` в checked-in repo/runtime scope:
- admin-side provisioning skeleton shop;
- shared storefront seller edit mode на `/shops/:shopId`;
- narrow `seller-web` status toggle на `/seller/shops/status`;
- public visibility gating для `WORKING/NOT_WORKING`;
- controlled missing/error states на `/shops/:shopId`.

## Preconditions

1. Backend runtime поднят и обслуживает checked-in `/api` routes.
2. Frontend runtime поднят и доступен через тот же repo-local entrypoint, что использовался в `FT-010` verify.
3. Есть рабочая admin session для `admin-web`.
4. Есть тестовый seller Telegram identity, который можно привязать через provisioning.
5. Для ручной seller-side проверки доступен тот же Telegram-linked auth path, который использует checked-in seller runtime.

## Test data

Используй отдельные test значения, чтобы не смешивать ручную проверку с уже существующими магазинами:
- `sellerId`: новый уникальный строковый идентификатор
- `telegramId`: Telegram ID тестового seller
- `shopName`: уникальное имя магазина, например `FT010 Manual Test <date/time>`
- `status`: сначала `WORKING`

## Scenario 1: Admin provisioning

1. Открой `admin-web` страницу `/admin/catalog/shops/provision`.
2. Заполни поля `Seller ID`, `Seller Telegram ID`, `Shop name`.
3. По желанию заполни `Description`, `Header image URL`, `Background image URL`.
4. Оставь `Initial visibility = WORKING`.
5. Нажми `Provision shop`.
6. Убедись, что UI показывает controlled success feedback с:
   - именем магазина;
   - seller id;
   - количеством starter menu pages;
   - количеством starter products.

### Expected result

- Shop создается без ручного seller-side bootstrap.
- Telegram-linked seller binding создается в том же flow.
- Skeleton storefront содержит starter pages/products, а не пустую оболочку.

## Scenario 2: Public browse baseline

1. Открой shared storefront route созданного магазина как обычный public visitor: `/shops/:shopId`.
2. Убедись, что storefront рендерится без seller edit affordances.
3. Проверь, что starter content виден как обычная customer-facing storefront page.

### Expected result

- Public visitor видит storefront без edit controls.
- Никакой второй seller-only storefront tree не появляется.

## Scenario 3: Shared storefront seller edit mode

1. Войди в seller runtime через Telegram-linked identity, привязанную на шаге provisioning.
2. Открой тот же route `/shops/:shopId`.
3. Активируй edit mode через contextual `click` / `long press` на существующих storefront компонентах.
4. Измени последовательно:
   - `shop.name` или `shop.description`;
   - имя существующей menu page;
   - данные одного starter product;
   - добавь новую menu page;
   - добавь новый product.
5. После каждого submit дождись controlled success/error feedback.
6. Перезагрузи страницу и проверь, что отображаются именно сохраненные canonical данные, а не synthetic placeholder.

### Expected result

- Seller редактирует тот же storefront tree, что и customer browse.
- Edit controls доступны только owning seller.
- После reload остаются реальные сохраненные данные.
- Не появляется fake `Starter Dish` или fake shop shell из fallback-логики.
- Для legacy/unpaged товаров, если они есть в test data, они остаются видимыми и редактируемыми без искусственной menu page.

## Scenario 4: Access control negative cases

1. Открой `/shops/:shopId` как anonymous visitor.
2. Открой `/shops/:shopId` под другим seller, не владеющим магазином.
3. Попробуй открыть `/seller/shops/status` без seller auth.

### Expected result

- Anonymous и foreign seller не получают seller edit mode.
- Narrow seller-web route отрабатывает controlled `401/403`, а не выдает доступ по умолчанию.

## Scenario 5: Seller-web status toggle

1. Открой `/seller/shops/status` под owning seller.
2. Убедись, что страница показывает только owned shops и остается narrow store-admin surface.
3. Переключи статус магазина из `WORKING` в `NOT_WORKING`.
4. Не меняя seller identity, проверь:
   - `/shops/:shopId` все еще доступен owning seller;
   - public browse больше не показывает этот магазин.
5. Верни статус в `WORKING`.
6. Еще раз проверь public browse.

### Expected result

- seller-web меняет только `WORKING/NOT_WORKING`.
- Toggle не откатывает более свежие storefront metadata edits.
- `NOT_WORKING` скрыт из public browse, но виден owning seller.
- После возврата в `WORKING` магазин снова появляется в public browse.

## Scenario 6: Missing and error states for `/shops/:shopId`

1. Открой несуществующий путь `/shops/<nonexistent-shop-id>`.
2. Если есть безопасный способ локально воспроизвести API failure без изменения кода, проверь route при ошибке источника данных.

### Expected result

- Route показывает controlled `not found` или `error` state.
- Route не создает synthetic storefront, fake product или fake starter shell.

## No-delete baseline

Во всех seller-facing поверхностях ручной проверкой подтвердить, что нет UI-действий:
- delete shop
- delete menu page
- delete product

Create/add flows допустимы, destructive removal semantics в baseline `FT-010` отсутствуют.

## Evidence to record

Сохрани в `.tasks/TASK-XXX/` или другом operator artifact месте:
- дату/время прогона;
- использованный `shopId`, `sellerId`, `telegramId`;
- какие шаги прошли успешно;
- какие шаги дали controlled error/forbidden behavior;
- краткую заметку, что no-delete baseline проверен вручную.

Screenshots/videos optional; для этого runbook blocking является operator-confirmed note, если иное не запрошено отдельно.

## Failure handling

1. Зафиксируй точный route и actor context (`admin`, owning seller, foreign seller, anonymous).
2. Зафиксируй expected vs actual behavior.
3. Проверь, относится ли проблема к:
   - provisioning boundary;
   - seller access/session boundary;
   - shared storefront data wiring;
   - `WORKING/NOT_WORKING` visibility gating;
   - route missing/error handling.
4. Открой follow-up task или bug только после привязки к конкретному checked-in route/runtime path.

## Source artifacts

- [.memory-bank/features/FT-010-seller-storefront-editing-and-store-admin.md](../features/FT-010-seller-storefront-editing-and-store-admin.md): acceptance criteria и verification targets.
- [.memory-bank/contracts/catalog-seller-provisioning-and-visibility.md](../contracts/catalog-seller-provisioning-and-visibility.md): provisioning, seller ownership и visibility rules.
- [.memory-bank/contracts/catalog-seller-access-and-session.md](../contracts/catalog-seller-access-and-session.md): seller auth/session boundary.
- [.memory-bank/contracts/seller-catalog-write-policy.md](../contracts/seller-catalog-write-policy.md): edit ownership, no-delete и write policy.
- [.memory-bank/testing/index.md](../testing/index.md): общие quality gates и verification basis.
