Если совсем коротко, то цепочка такая:

/prd — из идеи в feature-уровень
  — из feature в задачи
  /execute TASK-FT001-01 — сделать задачу
  /verify TASK-FT001-01 — доказать, что она сделана правильно
  /mb-sync — зафиксировать это в Memory Bank
/review
/mb-sync


/prd-to-tasks FT-00
/autopilot - Выполняй каждую таску в отдельном сабагенте. 
После того как сабагент выполнит таску, отдавай ему команду `/verifiy` этой таски.

/review
/mb-sync

---

## /prd

/prd
Читает prd.md или твои продуктовые требования и строит верхний слой Memory Bank:

product.md
requirements.md
epics/*
features/*
базовый backlog-скелет
Не должна сразу бездумно генерировать все TASK-* для всего проекта.
/prd-to-tasks FT-001
Берёт одну конкретную фичу FT-001 и декомпозирует её в реализацию:

создаёт implementation plan для этой фичи
создаёт TASK-* для неё
раскладывает зависимости, порядок, acceptance basis, verification targets
Это шаг “из feature в исполнимые задачи”.

## /execute TASK-001

/execute TASK-001
Берёт одну задачу TASK-001 и исполняет её:

создаёт или обновляет .protocols/TASK-001/
фиксирует контекст, план, прогресс, handoff
вносит кодовые изменения только в рамках задачи
складывает runtime-артефакты в .tasks/TASK-001/
Это шаг реализации.

## /verify TASK-001

/verify TASK-001
Проверяет, что задача реально выполнена:

сверяет результат с acceptance criteria
смотрит evidence: код, тесты, артефакты, протокол
фиксирует verification result в протоколе
отмечает, что не прошло, если задача недоделана
Это не “кажется ок”, а именно верификация по критериям.

## /mb-sync

/mb-sync
После выполнения и проверки синхронизирует долговременную память проекта:

обновляет .memory-bank/ по фактическому состоянию проекта
добавляет новые знания о том, что изменилось и почему
выравнивает навигацию, ссылки, docs-first слой
не должен превращаться в генерацию случайной документации, а должен отражать уже сделанные изменения

-------------


Я бы шел так:

FT-001
FT-009
FT-003
FT-002
FT-007
FT-004
FT-005
FT-006
FT-008
Почему именно так:

FT-001 первым, потому что это первый нормальный vertical slice и он задаст структуру backend/frontend, catalog domain и test layout.
FT-009 и FT-003 рано, чтобы не переделывать later весь Mini App shell, WebView UX и language persistence.
FT-002 уже поверх готового каталога и стабильного клиентского контура.
FT-007 я бы поднял до delivery-операций, чтобы admin flows сразу строились на правильном auth/security контуре.
FT-004 -> FT-005 -> FT-006 это естественная цепочка: назначение, потом lifecycle/polling, потом отмена/refund.
FT-008 в конце, потому что она зависит от уже работающего завершения заказа, bot flows и delivery lifecycle.
Если совсем кратко:

сначала customer foundation,
потом secure admin foundation,
потом delivery operations,
потом feedback.



-----------------

-- BUGS --

для каждого найденного бага\проблемы подготовь `execution-ready` описание бага, чтобы другой агент смог безопасно взять `TASK-*` в `/execute`. 
Лучше  сделать по 3 артефакта для каждого бага:
1. `BUG-...` документ в `.memory-bank/bugs/`, если баг ещё не оформлен.
2. Запись `TASK-*` в `.memory-bank/tasks/backlog.md` в формате полноценной task card.
3. При необходимости `IMPL-...` план в `.memory-bank/tasks/plans/`, если баг нетривиальный.


-- размер проекта --
```
Set-Location "C:\Users\Acer\Documents\python_lessons\Khujandi_mini_app"; $root=(Get-Location).Path; $totalFiles=0; $totalLines=0; $stats=@{}; git ls-files | Where-Object { $_ -notmatch '^(?:\.memory-bank)(?:/|\\|$)' } | ForEach-Object { $full=Join-Path $root $_; try { $lines=([System.IO.File]::ReadLines($full) | Measure-Object).Count } catch { $lines=0 }; $totalFiles++; $totalLines+=$lines; $top=(($_ -split '[\\/]')[0]); if ($_ -notmatch '[\\/]') { $top='_ROOT_FILES' }; if (-not $stats.ContainsKey($top)) { $stats[$top]=[pscustomobject]@{Scope=$top; Files=0; Lines=0} }; $stats[$top].Files++; $stats[$top].Lines+=$lines }; $stats.Values | Sort-Object Scope; [pscustomobject]@{Scope='TOTAL'; Files=$totalFiles; Lines=$totalLines} | Format-Table -AutoSize
```
