---
description: Backlog/protocol/task-history exploration report for future courier management work.
status: active
---
# TASK-COURIER-MGMT Backlog Exploration Report

## Result

Исследован backlog/protocol/task history вокруг `FT-016`, `FT-004`, `FT-005`, `FT-007` и близких `admin-web` CRUD/provisioning flows (`FT-010`/`FT-011`). Цель была не спроектировать courier management, а извлечь execution patterns, decomposition style, QA gates и риски.

Ключевой вывод: courier management нельзя вести как один широкий CRUD в `admin-web`. История проекта показывает успешный паттерн: сначала docs/backlog freeze и drift map, затем узкие additive tasks по одному owning slice/layer boundary, затем runtime/UI wiring, затем hostile verification/red-verify repair. Для courier management наиболее вероятный owning slice зависит от конкретного behavior:

- `delivery-assignment`: courier availability, offer/claim eligibility, courier work-state, courier rating score, assignment offer relations.
- `delivery-tracking`: courier current workload/read model, lifecycle/status history, operator panel visibility.
- `admin-access`: только consuming boundary для admin/operator auth/RBAC; не расширять его до courier business logic.
- `admin-web` contour: presentation/admin workflows only, не владеет assignment/tracking semantics.

Shared extraction заранее не оправдана. Исторические tasks прямо фиксируют, что state machine, severity mapping, offer semantics, provisioning conflict handling и UI-specific view models оставались локально в owning slice/contour.

## Existing Execution Patterns

### 1. Docs-first task freeze before behavior

`FT-004`, `FT-005`, `FT-007`, `FT-010`, `FT-016` начинались с явного task plan и protocol/context artifacts. В task context обязательно фиксировались:

- loaded Memory Bank inputs;
- owning capability slice;
- owning contour;
- touched layers;
- shared extraction justification;
- out-of-scope list;
- verification gates.

Практический паттерн для courier management: сначала отдельный docs/backlog/preflight task, который фиксирует текущий courier data/runtime baseline, spec/code drift и первый набор execution-ready cards. Не начинать с UI CRUD.

### 2. Additive-first migration

`FT-016` не переписал legacy `FT-004`/`FT-005`, а мигрировал v1 direct assignment/tracking chain staged:

1. schema/domain compatibility;
2. read endpoint;
3. admin read surface;
4. placeholders;
5. application boundary;
6. bot harness;
7. offer/claim;
8. timeout;
9. lifecycle v2;
10. cleanup/verification.

Для courier management это означает: если нужны новые courier fields, roles, statuses, eligibility flags или admin CRUD endpoints, сначала добавить representability/compatibility и tests, не включая сразу mutations в UI.

### 3. Repair existing admin surfaces, do not rebuild by default

`FT-016` выбрал repair/extend existing admin assignment page вместо rebuild. `FT-010` тоже сначала scaffolded route/page, затем wired runtime behavior. Задачи сохраняли unrelated admin routes: cancellation, provisioning, auth shell.

Для courier management default pattern: расширять существующий `admin-web` shell и route family, а не создавать новый admin app или отдельный shared CRM слой.

### 4. Separate read side from write side

`TASK-FT016-03/04/05` сделали read endpoint, read UI и sorting/alert без mutations. Mutations появились позже отдельными задачами (`offer`, `claim`, `status control`).

Для courier management:

- task A: courier list/read model;
- task B: filters/sorting/status badges;
- task C: create/update action API;
- task D: UI command wiring;
- task E: final flow verification.

Не смешивать list table, create form, edit form, deactivate action, assignment eligibility и bot behavior в один task.

### 5. Placeholder affordances before backend mutations

`TASK-FT016-06` добавил guarded/disabled action cells для offer/status/chat redirect до backend readiness. Это снизило риск UI presenting false behavior.

Для courier management UI можно сначала показать inert/guarded affordances только если они явно не обещают работающую mutation. Но после backend path готовности placeholder должен быть заменен focused wiring task.

### 6. Red-verify is expected, not exceptional

История `FT-011` показывает важный pattern:

- sequential duplicate provisioning fix прошел, но red-verify нашел race because guard lived only in service precheck;
- follow-up moved conflict guarantee to repository/DB boundary;
- next red-verify found cross-path side effect on seller rename due shared table uniqueness.

Для courier management это особенно важно для duplicate admin submits, repeated bot callbacks, concurrent courier updates, activation/deactivation while assigned, and identity uniqueness. Проверять hostile cases на persistence boundary, а не только happy path/service precheck.

## Task Decomposition Style Observed

Хорошие task cards в backlog/plans имеют одинаковую форму:

- `Status`
- `Feature`
- `REQs`
- `Depends on`
- `Touched files`
- `Tests`
- `Verify`
- `Docs`
- `Source`
- `Constraints`

Также каждая implementation task пишет `.protocols/TASK-*/context.md`, `plan.md`, `progress.md`, `verification.md` и финальный report в `.tasks/TASK-*`.

Для courier management рекомендуемая decomposition:

1. `TASK-COURIER-MGMT-00`: baseline/drift report and execution handoff.
2. `TASK-COURIER-MGMT-01`: spec/backlog update for courier management semantics if missing.
3. `TASK-COURIER-MGMT-02`: persistence/domain compatibility for courier profile fields, without runtime behavior.
4. `TASK-COURIER-MGMT-03`: admin-protected read endpoint/list model.
5. `TASK-COURIER-MGMT-04`: admin-web read/list route with deterministic sorting/filtering.
6. `TASK-COURIER-MGMT-05`: create/provision/update command boundary with auth/RBAC/audit/error tests.
7. `TASK-COURIER-MGMT-06`: admin-web mutation wiring with controlled success/error and duplicate-submit guard.
8. `TASK-COURIER-MGMT-07`: hostile verification: duplicate creation, identity conflict, busy-courier deactivation, assignment eligibility, audit/event evidence.
9. `TASK-COURIER-MGMT-08`: final Memory Bank sync and RTM closure.

Если task touches both `delivery-assignment` and `admin-access` semantics, split it. `admin-access` should provide session/RBAC consuming boundary only.

## QA Gates Found

Minimum gates depend on touched layers:

- Docs-only/preflight: `git diff --check`, changed markdown link validation when links changed.
- Backend domain/application: focused slice unit tests, integration tests, `git diff --check`.
- Persistence/Prisma: `npx prisma validate`, migration dry-run/diff if applicable, integration coverage for rollback/conflict.
- Runtime/API: mounted runtime tests, auth/RBAC negative cases, error contract assertions.
- Admin frontend: focused Jest specs for API adapter/view-model/route, `npm run build:frontend`.
- Cross-slice/order flow: delivery-assignment + delivery-tracking suites, admin route tests, order-tracking frontend tests, lint/build.
- Final feature closure: full acceptance scenario plus docs/RTM/changelog sync.

Specific historical commands used:

- `npm run test:delivery-assignment -- --runInBand`
- `npm run test:delivery-tracking -- --runInBand`
- `npm run test:order-tracking:frontend -- --runInBand`
- `npx jest --config jest.config.cjs frontend/src/tests/admin/... --runInBand`
- `npm run lint`
- `npm run build:frontend`
- `git diff --check`

For courier management CRUD/provisioning specifically, add:

- duplicate-submit frontend guard test;
- concurrent duplicate identity/provisioning test at repository/DB level;
- controlled `409` or equivalent business error for duplicate courier identity;
- authorization matrix for `boss/admin/operator/manager/courier`;
- audit/event evidence for every meaningful write;
- negative test that deactivating/removing a courier with active `ASSIGNED/PICKED_UP/IN_PROGRESS/DELIVERED` work is blocked or explicitly handled according to specs.

## Risks For Courier Management

### Spec gap risk

Current specs define courier availability, auto-offer participation and lifecycle participation, but not a full admin courier management CRUD/provisioning product surface. If courier management means create/edit/deactivate courier accounts, required spec additions are likely needed before implementation.

Do not infer silently:

- who may create courier records;
- whether couriers are Telegram-linked identities, admin-created accounts, or both;
- uniqueness key for courier identity;
- whether delete is allowed or only deactivate;
- what happens to active assignments when courier is disabled;
- whether courier profile changes emit events/audit;
- whether rating score is manually editable.

### Slice-boundary risk

Courier management can look like `admin-access` because it is an admin UI, but business ownership is delivery-side. Historical `FT-007` explicitly keeps auth/session separate; other features consume it.

### Race/idempotency risk

Provisioning history (`FT-011`) shows service-level prechecks are insufficient for duplicate/conflict guarantees. Courier identity/provisioning should have DB/repository-level uniqueness or transactional conflict handling, with tests that simulate concurrent attempts.

### Active-order consistency risk

Courier availability free/busy definition already treats `ASSIGNED`, `PICKED_UP`, `IN_PROGRESS`, `DELIVERED` as busy. Any management action that disables/deletes/unlinks a courier must account for these states. This is a likely blocker unless specified.

### Role drift risk

FT-016 history mentions role mapping drift around `operator`, `admin`, `boss`, `manager`. Courier management must explicitly state which roles can manage couriers and which role names are accepted by current runtime.

### UI false affordance risk

FT-016 intentionally used placeholders before mutation paths. Courier CRUD UI must not show destructive or active mutation affordances until backend behavior and error handling exist.

### Test false confidence risk

History has cases where focused tests passed while mounted runtime or red-verify found semantic gaps: auth route not mounted, cookie boundary shortcut, provisioning duplicate race. Courier management needs mounted runtime coverage, not only isolated service tests.

## Recommendation

Recommended next step: create a docs-first/preflight task for courier management before code. The task should update or add spec-layer coverage if the product intent is admin courier CRUD/provisioning rather than only courier availability management.

Proposed first task scope:

- Owning slices: likely `delivery-assignment` primary, `delivery-tracking` consumed for active workload/read status.
- Contour: `admin-web`; auth consumed from `admin-access`.
- Touched layers: docs/backlog/protocol only.
- Shared: no extraction justified.
- Output: execution-ready backlog cards with acceptance, constraints, tests, and explicit unresolved product questions.

Recommended implementation sequencing after spec freeze:

1. persistence/domain representability;
2. read endpoint;
3. admin read UI;
4. command API with RBAC/audit/error contract;
5. admin mutation UI;
6. hostile/concurrent verification;
7. docs/RTM sync.

## Files Inspected

- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `doc/ARCHITECTURE.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/epics/EP-002-delivery-operations.md`
- `.memory-bank/epics/EP-003-admin-access-and-security.md`
- `.memory-bank/features/FT-004-courier-assignment.md`
- `.memory-bank/features/FT-005-order-tracking-and-events-polling.md`
- `.memory-bank/features/FT-007-admin-auth-and-session-security.md`
- `.memory-bank/features/FT-016-operator-orders-monitoring-and-courier-offer-flow.md`
- `.memory-bank/contracts/operator-delivery-ops-contract.md`
- `.memory-bank/contracts/admin-auth-contract.md`
- `.memory-bank/states/order-lifecycle.md`
- `.memory-bank/testing/index.md`
- `.memory-bank/tasks/backlog.md`
- `.memory-bank/tasks/plans/IMPL-FT-004.md`
- `.memory-bank/tasks/plans/IMPL-FT-005.md`
- `.memory-bank/tasks/plans/IMPL-FT-007.md`
- `.memory-bank/tasks/plans/IMPL-FT-010.md`
- `.memory-bank/tasks/plans/IMPL-FT-016-operator-delivery-migration.md`
- `.memory-bank/tasks/plans/MIGRATE-FT-004-FT-005-to-FT-016.md`
- `.memory-bank/tasks/archive/FT-007-to-FT-009.md`
- `.protocols/TASK-FT016-02/context.md`
- `.protocols/TASK-FT016-02/plan.md`
- `.protocols/TASK-FT016-02/verification.md`
- `.protocols/TASK-FT016-05/context.md`
- `.protocols/TASK-FT016-05/plan.md`
- `.protocols/TASK-FT016-05/verification.md`
- `.protocols/TASK-FT005-06/verification.md`
- `.protocols/TASK-FT011-03/red-verification.md`
- `.protocols/TASK-FT011-07/red-verification.md`
- `.protocols/TASK-FT010-07/context.md`
- `.protocols/TASK-FT010-07/plan.md`
- `.protocols/TASK-FT010-07/verification.md`
- `.protocols/TASK-FT010-10/verification.md`
- `.tasks/TASK-FT004-06/TASK-FT004-06-S-IMPL-final-report-code-01.md`
- `.tasks/TASK-FT004-07/TASK-FT004-07-S-IMPL-final-report-code-01.md`
- `.tasks/TASK-FT005-06/TASK-FT005-06-S-IMPL-final-report-code-01.md`
- `.tasks/TASK-FT016-05/TASK-FT016-05-S-IMPL-final-report-code-01.md`
- `.tasks/TASK-FT016-14/TASK-FT016-14-S-IMPL-final-report-code-01.md`
- `.tasks/TASK-FT016-18/TASK-FT016-18-S-VERIFY-final-report-docs-01.md`
- `.tasks/TASK-FT010-15/TASK-FT010-15-S-IMPL-final-report-code-01.md`
- `.tasks/TASK-FT010-15/TASK-FT010-15-S-RED-VERIFY-final-report-docs-01.md`
- `.tasks/TASK-FT011-07/TASK-FT011-07-S-IMPL-final-report-code-01.md`

## Checks Run

- `git status --short`
- `rg --files .memory-bank doc .protocols .tasks`
- `rg -n "FT-016|FT-004|FT-005|FT-007|provision|CRUD|admin-web|operator|courier" .memory-bank/tasks/backlog.md .memory-bank/tasks/archive .protocols .tasks -g "*.md"`
- Manual review of the files listed above.

No production/spec/code files were changed. No tests were run because this was read-only exploration plus task-local report creation.

## Blockers / Risks

- There is significant dirty worktree state outside this subagent scope; it was not touched.
- Full courier management product semantics are not yet found as a dedicated feature spec. Existing specs cover courier availability/offer/claim more than admin CRUD/provisioning.
- The `rg` history search output was very large and truncated in terminal output, so the report is based on targeted follow-up reads of the most relevant plans/protocols/reports rather than exhaustive line-by-line reading of every hit.
