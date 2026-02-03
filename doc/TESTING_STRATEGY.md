# TESTING_STRATEGY.md — Подход к тестированию

_Версия: 0.2  
Дата: 2026-02-03_

---

## 1. Инструменты

| Слой | Инструмент |
|------|------------|
| Backend | Jest + @nestjs/testing + Supertest |
| Frontend | Vitest (unit), Playwright (E2E, позже) |

---

## 2. Минимальные сценарии (MVP)

1. CRUD основных сущностей (shops, products, orders, reviews).  
2. RBAC: проверка ролей и прав (boss/manager/admin/seller/courier/client).  
3. Корректные переходы статусов заказа.  
4. Ошибки валидации и конфликтные состояния (409).  
5. Доменные события создаются на изменения.

---

## 3. Организация тестов

```
tests/
  backend/
    orders/
    shops/
    auth/
  frontend/
```

- Для backend используем тестовую БД и транзакции.  
- В e2e тестах поднимаем NestJS приложение целиком.

---

## 4. Запуск

```bash
# Backend
npm run test
npm run test:e2e

# Frontend
cd frontend
npm run test
```

---

## 5. Покрытие

- Цели на MVP: ≥80% backend, ≥70% frontend.  
- Отчёты публикуются в CI.

---

Конец документа.
