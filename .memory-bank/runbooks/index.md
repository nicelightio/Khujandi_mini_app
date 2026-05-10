---
description: Роутер по operational runbooks проекта.
status: active
---
# Runbooks Index

- [.memory-bank/runbooks/manual-refund-and-negative-alerts.md](manual-refund-and-negative-alerts.md): Операционный runbook для ручного refund и эскалации негативных отзывов.
- [.memory-bank/runbooks/ft-010-manual-verification.md](ft-010-manual-verification.md): Ручной прогон provisioning, shared storefront seller edit mode, seller-web status toggle и visibility gating для `FT-010`.
- [.memory-bank/runbooks/security-auth-and-secret-response.md](security-auth-and-secret-response.md): Операционный runbook для lockout-response, token compromise и rotation секретов.
- [.memory-bank/runbooks/e2e-mock-payment.md](e2e-mock-payment.md): Repo-local/e2e mock payment mode для customer checkout flow, gates и forbidden cases.
- [.memory-bank/runbooks/telegram-mini-app-verification.md](telegram-mini-app-verification.md): Runbook проверки Telegram-specific auth/payment/WebView behavior в test environment и client matrix.
- [.memory-bank/runbooks/telegram-mini-app-container-deploy.md](telegram-mini-app-container-deploy.md): Канонический runbook текущего AlmaLinux prod deploy через existing Traefik + Docker Compose, без host nginx и без вмешательства в PhotoChanger.
- [.memory-bank/runbooks/telegram-mini-app-test-server-deploy.md](telegram-mini-app-test-server-deploy.md): Deprecated historical Ubuntu/non-container deploy reference; не применять на текущем AlmaLinux prod.
