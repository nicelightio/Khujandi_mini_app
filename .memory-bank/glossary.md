---
description: Словарь терминов, сущностей и agreed vocabulary проекта.
status: active
---
# Glossary

## Terms
- `User`: субъект, взаимодействующий с системой в одной из ролей `boss|manager|admin|seller|courier|client`.
- `Role` / `RBAC`: роль определяет доступные сценарии и права доступа к операциям системы.
- `Shop`: торговая точка продавца с собственной витриной товаров.
- `Product`: товарная позиция магазина с ценой, доступностью и seller ownership.
- `Order`: сущность покупки, хранящая участников, суммы, статусы и историю изменений.
- `Order Status`: состояние заказа в основном delivery flow `CREATED -> ASSIGNED -> IN_PROGRESS -> DELIVERED -> COMPLETED`.
- `Status History`: журнал смены статусов заказа (`order_status_history`).
- `Review`: оценка `1..5` и комментарий после завершения заказа.
- `VIP`: признак повышенного приоритета для клиентов, курьеров, продавцов или магазинов.
- `Soft Delete`: логическое удаление записи без физического удаления из БД.
- `Mini App`: клиентское веб-приложение внутри Telegram WebApp.
- `WebView`: контейнер Telegram-клиента, в котором запускается Mini App.
- `WebAppData` / `initData`: подписанный набор параметров Telegram для авторизации Mini App.
- `initDataUnsafe`: клиентские данные без доверия; можно использовать для UI, но не для доверенных решений.
- `Data Check String`: каноническая строка для проверки подписи Telegram `initData`.
- `auth_date`: timestamp формирования `initData`, валидируемый на TTL сервером.
- `JWT`: возможный формат bearer-токена для API; для Mini App не считается безусловным baseline session transport и используется только при явно зафиксированной policy.
- `Polling`: периодический опрос `GET /events?since=<cursor>` для получения изменений.
- `REST`: HTTP-интерфейс для command/query операций системы.
- `Contract`: формализованное соглашение API, события или boundary-интерфейса.
- `Vertical Slice`: end-to-end единица ценности, проходящая через `presentation -> application -> domain -> infrastructure`.
- `Capability Slice`: вертикальный слайс, выделенный вокруг устойчивой продуктовой capability.
- `Layered Monolith`: монолитное приложение со слоистой архитектурой без распределенной сложности.
- `Layered Architecture`: организация кода по слоям с направлением зависимостей внутрь бизнес-правил.
- `Shared Kernel`: ограниченный набор общих технических примитивов и инфраструктурных контрактов между slices.
- `Acceptance Scenario`: пользовательский или операционный сценарий, подтверждающий ценность slice end-to-end.
- `Demo Result`: быстро демонстрируемый результат, показывающий работоспособность slice целиком.
- `State Machine`: формальная модель допустимых состояний и переходов жизненного цикла заказа.
- `Catalog`: capability витрины и seller-side управления магазинами/товарами.
- `Checkout-Payment`: capability оформления заказа, оплаты и создания заказа только после подтвержденного платежа.
- `Delivery Assignment`: capability ручного назначения курьера администратором.
- `Delivery Tracking`: capability управления жизненным циклом заказа, историей статусов и event polling.
- `Order Cancellation`: capability операционной отмены заказа и ручного refund workflow.
- `Reviews Feedback`: capability двусторонних отзывов и негативных alert-ов.
- `Admin Access`: отдельный login/password auth-контур веб-админки.
- `Event`: неизменяемая запись о доменном факте; читается через `GET /events?since=<cursor>`.
- `Domain Event`: событие, отражающее бизнес-смысл изменения (`order.created`, `order.status_changed` и т.п.).
- `Cursor` / `Revision`: строковое значение позиции в event stream; на базе `events.id` (`bigint`).
- `Snapshot`: зафиксированное в момент времени значение, не синхронизируемое задним числом.
- `Idempotency`: повторный вызов с тем же ключом не должен менять итоговый результат операции.
- `ETag`: опциональная HTTP-версия ресурса на уровне протокола.
- `Refund Status`: явное состояние ручного возврата (`NOT_REQUIRED`, `PENDING_MANUAL`, `DONE`, `REJECTED`).
- `Negative Review`: отзыв с рейтингом `<= 2`, который должен вызвать alert через Telegram-бота.
- `Shop Name Snapshot`: имя магазина, зафиксированное в заказе и не обновляемое при последующих переименованиях.

## Notes
- Канонические технические роли: `boss`, `manager`, `admin`, `seller`, `courier`, `client`.
- UI-лейблы типа `худБосс`, `худКур`, `худПотр` допустимы только как business-facing labels, не как API/DB contracts.
- Основной язык Memory Bank: русский; устойчивые технические термины допускаются на английском.
