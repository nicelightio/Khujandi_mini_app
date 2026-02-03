# TESTING_STRATEGY.md — Подход к тестированию

_Версия: 0.1  
Дата: 2025-05-25_

---

## 1. Инструменты

| Слой          | Фреймворк / Библиотека |
|---------------|------------------------|
| Backend       | `pytest`, `pytest-asyncio`, `httpx` |
| Frontend      | `Vitest`, `Playwright` (E2E, планируется) |

---

## 2. Покрываемые сценарии

1. **CRUD-операции** всех сущностей (shops, products, orders, reviews).  
2. **Права доступа** (RBAC) — попытки действий неавторизованными или чужими ролями.  
3. **Статусы заказов** — корректность переходов, soft-delete.  
4. **Edge-cases**: невалидные данные, превышение лимитов, пустые запросы.  
5. **Race conditions** — параллельное обновление статусов одним заказом.  
6. **Rollback** — транзакции откатываются при ошибках связности.  
7. **Отзывы и оплата** — валидация схем, негативные ответы.

---

## 3. Организация тестов

```text
tests/
├─ test_error_handling.py
├─ test_order_access.py
├─ test_shop_product_delete.py
├─ test_review_validation.py
└─ ...
```

- Backend-тесты используют фикстуру **`async_session`** → транзакция откатывается после каждого кейса.  
- Используется утилита `override_get_session` для DI тестовой БД.

---

## 4. Примеры

### 4.1 Проверка ответа при ошибке

```python
async def test_422_validation(client):
    resp = await client.post("/shops/", json={"name": ""})
    assert resp.status_code == 422
    data = resp.json()
    assert data["detail"] == "name must not be empty"
```

### 4.2 Тест гонки статусов

```python
async def test_order_race_condition(async_session, create_order):
    order = await create_order()
    # имитируем два параллельных запроса
    task1 = update_status(order.id, "IN_PROGRESS")
    task2 = update_status(order.id, "CANCELLED")
    await asyncio.gather(task1, task2)
    await async_session.refresh(order)
    assert order.status in {"IN_PROGRESS", "CANCELLED"}
```

---

## 5. Frontend

- `Vitest` для юнит-тестов компонентов и стор.  
- E2E-тесты **Playwright** планируются в `e2e/` после стабилизации UI.  
- Стратегия snapshot-тестов для критичных UI.

---

## 6. Запуск

```bash
# Backend
pytest -q  # опция -q для краткого вывода

# Frontend
cd frontend-svelte5
npm run test
```

---

## 7. Покрытие

- Плановая цель — ≥85 % backend, ≥80 % frontend.  
- Отчёт `pytest-cov` публикуется в CI.

---

_Конец файла._