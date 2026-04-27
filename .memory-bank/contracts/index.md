---
description: Роутер по key contracts MVP.
status: active
---
# Contracts Index

- [.memory-bank/contracts/catalog-public-api.md](catalog-public-api.md): Публичный storefront browse-контракт `catalog` без auth и с visibility rules по статусу магазина.
- [.memory-bank/contracts/customer-order-composition-contract.md](customer-order-composition-contract.md): Boundary payload для customer cart/order composition и checkout handoff между `catalog` и `checkout-payment`.
- [.memory-bank/contracts/seller-catalog-write-policy.md](seller-catalog-write-policy.md): Seller-scoped edit policy, ownership, no-delete и rename markers для `catalog`.
- [.memory-bank/contracts/catalog-seller-provisioning-and-visibility.md](catalog-seller-provisioning-and-visibility.md): Admin provisioning skeleton shop, Telegram-linked seller binding и `WORKING/NOT_WORKING` visibility.
- [.memory-bank/contracts/catalog-seller-access-and-session.md](catalog-seller-access-and-session.md): Seller access resolution, shared session family и route boundaries для `mini-app` + `seller-web`.
- [.memory-bank/contracts/api-events-baseline.md](api-events-baseline.md): Базовые REST/event контракты MVP и polling shape.
- [.memory-bank/contracts/telegram-mini-app-auth-contract.md](telegram-mini-app-auth-contract.md): Контракт `POST /auth/telegram`, `initData` validation и session issuance policy.
- [.memory-bank/contracts/mini-app-runtime-contract.md](mini-app-runtime-contract.md): Контракт shell/runtime adapter для Telegram WebView, storage policy и feature detection.
- [.memory-bank/contracts/admin-auth-contract.md](admin-auth-contract.md): Контракт admin auth, lockout и session behavior.
- [.memory-bank/contracts/payment-confirmation-contract.md](payment-confirmation-contract.md): Trust boundary для подтверждения успешной оплаты и anti-replay.
- [.memory-bank/contracts/telegram-bot-contract.md](telegram-bot-contract.md): Контракт inbound/outbound Telegram-бота для assignment, status и review alerts.
