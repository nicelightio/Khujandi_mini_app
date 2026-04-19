---
description: Роутер по bug records и verification failures.
status: active
---
# Bugs Index

- [.memory-bank/bugs/BUG-2026-04-20-task-ft009-09-missing-android-keyboard-evidence.md](BUG-2026-04-20-task-ft009-09-missing-android-keyboard-evidence.md): активный quality-gate bug; `TASK-FT009-09` не может получить `PASS` без свежего real `Android Telegram` evidence для keyboard-open CTA reachability и degradation fallback behavior.
- [.memory-bank/bugs/BUG-2026-04-19-ft009-shell-runtime-hardening-gap.md](BUG-2026-04-19-ft009-shell-runtime-hardening-gap.md): активный bug по незакрытому shell-runtime hardening gap; high-churn runtime propagation, keyboard-safe bottom action primitives и centralized degradation policy еще не доведены до spec baseline.
- [.memory-bank/bugs/BUG-2026-04-10-ft010-admin-provisioning-runtime-open-without-admin-auth.md](BUG-2026-04-10-ft010-admin-provisioning-runtime-open-without-admin-auth.md): архивированный semantic bug; `TASK-FT010-09` закрыл open admin provisioning route через существующую admin cookie/session boundary и RBAC.
- [.memory-bank/bugs/BUG-2026-04-10-ft010-provisioning-route-uses-refresh-cookie-as-auth.md](BUG-2026-04-10-ft010-provisioning-route-uses-refresh-cookie-as-auth.md): архивированный semantic bug; `TASK-FT010-10` заменил refresh-only shortcut на reusable protected admin route boundary с обязательной protected cookie pair, валидацией `accessTokenHash` и проверкой `accessTokenExpiresAt`.
- [.memory-bank/bugs/BUG-2026-03-30-task-ft001-02-missing-backend-catalog-scaffold.md](BUG-2026-03-30-task-ft001-02-missing-backend-catalog-scaffold.md): архивированный bug по отсутствовавшему backend scaffold для `TASK-FT001-02`.
- [.memory-bank/bugs/BUG-2026-03-30-task-ft001-04-missing-jest-config.md](BUG-2026-03-30-task-ft001-04-missing-jest-config.md): активный bug по невозможности прогнать task-level catalog tests без Jest config.
- [.memory-bank/bugs/BUG-2026-03-30-task-ft001-05-missing-jest-config.md](BUG-2026-03-30-task-ft001-05-missing-jest-config.md): активный bug по невозможности формально проверифицировать seller shop writes без Jest config.
- [.memory-bank/bugs/BUG-2026-04-01-task-ft001-07-missing-route-render-verification.md](BUG-2026-04-01-task-ft001-07-missing-route-render-verification.md): архивированный bug по отсутствовавшему route/page-level smoke coverage для formal verify `TASK-FT001-07`.
- [.memory-bank/bugs/BUG-2026-04-02-task-ft009-06-missing-telegram-client-matrix-evidence.md](BUG-2026-04-02-task-ft009-06-missing-telegram-client-matrix-evidence.md): архивированный bug по ранее отсутствовавшему real `Android Telegram` evidence для closure `FT-009`.
- [.memory-bank/bugs/BUG-2026-04-06-ft007-missing-admin-auth-runtime-cookie-boundary.md](BUG-2026-04-06-ft007-missing-admin-auth-runtime-cookie-boundary.md): архивированный bug по ранее отсутствовавшему реальному HTTP cookie auth boundary для `FT-007`.
- [.memory-bank/bugs/BUG-2026-04-06-ft007-admin-auth-handler-not-mounted-in-runtime.md](BUG-2026-04-06-ft007-admin-auth-handler-not-mounted-in-runtime.md): архивированный semantic bug; `TASK-FT007-09` смонтировал admin auth handler в checked-in runtime entrypoint, который реально используется локальным `/api` dev flow.
- [.memory-bank/bugs/BUG-2026-04-06-ft008-stale-review-callback-replay-gap.md](BUG-2026-04-06-ft008-stale-review-callback-replay-gap.md): архивированный hardening bug; stale Telegram review callbacks теперь отсекаются revision-aware step validation.
- [.memory-bank/bugs/BUG-2026-04-06-ft008-ephemeral-review-draft-state.md](BUG-2026-04-06-ft008-ephemeral-review-draft-state.md): архивированный bug по ранее process-local review draft state; runtime durability, checked-in rollout и explicit retention policy закрыты через `TASK-FT008-09` и `TASK-FT008-10`.
