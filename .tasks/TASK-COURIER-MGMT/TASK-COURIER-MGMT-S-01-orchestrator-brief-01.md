# TASK-COURIER-MGMT S-01 Orchestrator Brief

ROLE: ORCHESTRATOR

Дата: 2026-05-13

## Result

Проведена delegated разведка по трем направлениям:

- spec/normative layer;
- checked-in code reality;
- backlog/protocol/task-history patterns.

Вывод: внедрение admin courier management сейчас заблокировано не техникой, а отсутствующим product/API contract. В коде уже есть `User.role=COURIER`, courier availability fields и `ratingScore`; отдельного courier CRUD/list/rating admin API и UI нет. Реализовывать сразу в коде нельзя без уточнения ручной "кармы", RBAC, audit/event и lifecycle safety rules.

## Strategic Decision

Рекомендуемый owning capability slice: `delivery-assignment`.

Причина: courier operational profile, active/free eligibility, auto-offer participation and `ratingScore` уже живут в delivery assignment semantics. `delivery-tracking` должен потребляться read-only для active workload/status history. `admin-access` должен оставаться только auth/session/RBAC boundary. `admin-web` является presentation contour, но не owner бизнес-логики.

Touched contours:

- `admin-web`: список/карточка/формы управления курьерами;
- backend admin runtime/API: admin-protected routes;
- `telegram-bot`: только consumed context for Telegram identity/binding, не owner admin CRUD.

Touched layers after spec freeze:

- `presentation`: admin-web routes/components/API client;
- `application/domain/infra`: `delivery-assignment`;
- persistence/runtime adapters;
- tests.

Shared extraction: не оправдана. Использовать только existing shared primitives: auth/RBAC, db, error/event primitives.

## Recommended Spec Shape

Создать отдельную feature spec, вероятно `FT-019-admin-courier-management`, вместо расширения `FT-016`.

Причина: `FT-016` уже закрывает operator order flow, availability, offers/claims and timeout. Courier CRUD/manual karma is a separate admin-management capability, even if it consumes FT-016 fields. Отдельный FT снизит риск смешать order flow migration with user/profile provisioning.

Минимальные spec artifacts:

- `.memory-bank/features/FT-019-admin-courier-management.md`;
- `.memory-bank/contracts/admin-courier-management-contract.md`;
- update `.memory-bank/requirements.md` with a new REQ or explicit extension of `REQ-036`;
- update `.memory-bank/glossary.md`: define "карма";
- update `.memory-bank/architecture/data-boundaries-and-persistence.md`: courier operational profile ownership;
- update `.memory-bank/testing/index.md`: gates for RBAC, duplicate identity, audit/event and active-order safety;
- implementation plan `.memory-bank/tasks/plans/IMPL-FT-019.md`;
- `.protocols/FT-019/*` and execution-ready task cards.

## Proposed MVP Scope

Recommended narrow MVP:

- courier list in admin-web;
- create courier with minimal Telegram-linked identity;
- show operational fields: name, Telegram id/username, active/free state, auto-offer participation, accepting-until, current/busy order marker, `ratingScore`;
- manual `ratingScore` adjustment with required reason and audit/event;
- deactivate/disable courier, not destructive delete;
- block disable when courier has active order unless product owner explicitly approves forced handling;
- replace prompt-based targeted offer courier id entry with selector from courier list.

Out of first increment:

- automatic review-to-karma recalculation;
- VIP/reputation analytics;
- hard delete;
- GPS/maps/routing;
- broad user-management CRM;
- new shared business abstractions.

## Required Human Decisions

1. Is "карма" exactly existing `User.ratingScore`, or a separate field/model?
2. Manual karma edit semantics: absolute set, additive delta, or both?
3. Bounds/default: can score be negative, and is there min/max?
4. Is reason/comment mandatory for every manual karma change?
5. RBAC: who can create couriers and edit karma: `operator/manager`, `admin`, `boss`?
6. Courier creation identity: must every courier have Telegram id/chat binding at creation, or can admin create a pending/unbound courier?
7. Deactivation policy: disable only, no delete? What happens if courier has active order or pending offer?
8. Should negative reviews only be displayed, or should they ever change karma automatically?
9. Should manual karma changes publish domain events such as `courier.rating_adjusted` and admin audit entries?
10. Route shape preference: separate `/admin/couriers` page, or embedded courier panel inside existing operator delivery page?

## Proposed Execution Tasks After Decisions

1. `TASK-FT019-01`: docs-first spec freeze and handoff.
2. `TASK-FT019-02`: backend courier read model and runtime list endpoint.
3. `TASK-FT019-03`: admin-web courier list/read UI and selector replacement for targeted offer.
4. `TASK-FT019-04`: create courier command API with RBAC, duplicate identity handling, audit/event.
5. `TASK-FT019-05`: manual karma adjustment command API with reason, audit/event and bounds.
6. `TASK-FT019-06`: admin-web create/edit/karma mutation wiring with duplicate-submit guard.
7. `TASK-FT019-07`: deactivation command and active-order/pending-offer safety rules.
8. `TASK-FT019-08`: hostile verification/red-verify and Memory Bank sync.

## Subagent Reports

- `.tasks/TASK-COURIER-MGMT/TASK-COURIER-MGMT-S-01-final-report-specs-01.md`
- `.tasks/TASK-COURIER-MGMT/TASK-COURIER-MGMT-S-01-final-report-code-01.md`
- `.tasks/TASK-COURIER-MGMT/TASK-COURIER-MGMT-S-01-final-report-backlog-01.md`
