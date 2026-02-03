# DEV_SETUP.md — Локальный запуск и окружение

_Версия: 0.1  
Дата: 2025-05-25_

---

## 1. Предварительные требования

| ПО                | Версия     |
|-------------------|-----------|
| Python            | 3.12.x    |
| Node.js           | ≥20 LTS   |
| pnpm / npm        | последняя |
| Docker & Compose  | ≥24       |
| Rust (опц.)       | 1.78      |
| Poetry (если используется) | ^1.8 |

---

## 2. Клонирование репозитория

```bash
git clone https://github.com/username/khujandi-mini-app.git
cd khujandi-mini-app
```

---

## 3. Backend

```bash
# Создать и активировать виртуальное окружение (venv/direnv/pyenv)
python -m venv .venv
source .venv/Scripts/activate  # Windows: .venv\Scripts\Activate

# Установка зависимостей
pip install -r requirements.txt

# Переменные окружения
cp .env.example .env  # отредактируйте TG_TOKEN, DATABASE_URL, ADMIN_IDS

# Миграции (alembic)
alembic upgrade head

# Запуск
uvicorn main:app --reload
```

Доступ: `http://127.0.0.1:8000/docs`

---

## 4. Telegram Bot

Бот запускается автоматически из lifespan FastAPI.  
Для локального теста установите переменные `TG_TOKEN` и добавьте свой TG ID в `ADMIN_IDS`.

---

## 5. Frontend

```bash
cd frontend-svelte5
npm ci              # или pnpm i
npm run dev         # Vite dev server (http://localhost:5173)
```

При запуске бэкенд должен быть доступен по `http://127.0.0.1:8000`.

## 6. Тесты

```bash
# Backend
pytest -q
 
# Frontend
cd frontend-svelte5
npm run test
```
 
---
 
## 7. Форматирование / Lint

```bash
# Python
ruff check .
black .

# Frontend
npm run lint  # eslint + prettier
```

---

## 8. Полезные команды

| Команда                        | Описание                              |
|--------------------------------|---------------------------------------|
| `alembic revision --autogenerate -m "msg"` | новая миграция |
| `uvicorn main:app --reload --port 9000`    | смена порта    |

---

Конец документа.