---
description: Роутер по key contracts MVP.
status: active
---
# Contracts Index

- [.memory-bank/contracts/catalog-public-api.md](catalog-public-api.md): Публичный browse-контракт `catalog` без auth и с soft-delete filtering.
- [.memory-bank/contracts/seller-catalog-write-policy.md](seller-catalog-write-policy.md): Seller-scoped write policy, ownership и rename markers для `catalog`.
- [.memory-bank/contracts/api-events-baseline.md](api-events-baseline.md): Базовые REST/event контракты MVP и polling shape.
- [.memory-bank/contracts/telegram-mini-app-auth-contract.md](telegram-mini-app-auth-contract.md): Контракт `POST /auth/telegram`, `initData` validation и JWT issuance.
- [.memory-bank/contracts/admin-auth-contract.md](admin-auth-contract.md): Контракт admin auth, lockout и session behavior.
- [.memory-bank/contracts/payment-confirmation-contract.md](payment-confirmation-contract.md): Trust boundary для подтверждения успешной оплаты и anti-replay.
- [.memory-bank/contracts/telegram-bot-contract.md](telegram-bot-contract.md): Контракт inbound/outbound Telegram-бота для assignment, status и review alerts.
