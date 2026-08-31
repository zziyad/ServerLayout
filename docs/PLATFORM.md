# Платформенный сервер

Шаблон бэкенда для клиентских приложений: не пишут AAA, сессии, RBAC и почту заново в каждом проекте.

Рабочее дерево: этот репозиторий (`application/` + `src/` + `main.js`).
Чеклист работ: `todo/PHASES.md`.

---

## Что это умеет

### Транспорт
- Один вход: HTTP `POST /api` и WebSocket на том же порту (по умолчанию **8010**).
- Протокол — JSON-RPC: `{ "type": "call", "id": "1", "method": "auth/signin", "args": { ... } }`.
- Ответ: `{ status: "fulfilled" | "rejected", response, error? }`.
- Бинарные стримы по WS (загрузка/скачивание файлов).
- Cookie `session_id` (HttpOnly). Сессия живёт в **Redis** (idle + absolute TTL).

### Аутентификация и сессии (AAA)
- Вход, регистрация, выход, текущий пользователь, heartbeat.
- Пароль — `metautil.hashPassword` / `validatePassword`.
- После `signin` / `register` сервер сам создаёт/ротирует сессию.
- Rate-limit на login (IP и аккаунт).
- CSRF на мутациях. `super_admin` обходит проверки прав.

Канон:

| метод | доступ | смысл |
|---|---|---|
| `auth/signin` | public | вход, cookie-сессия |
| `auth/register` | public | регистрация + сразу сессия |
| `auth/signout` | public | выход, идемпотентный |
| `auth/me` | public | текущая сессия или `null` |
| `auth/activity` | session | продлить idle TTL |

`auth/logout` — алиас `signout`.  
Служебные: `keep-alive`, `refresh`, `restore` — не расширять.

### Пользователи и RBAC
Таблицы: `User`, `Role`, `Permission`, `UserRole`, `RolePermission`, `UserPermission`.
Системные роли сида: `super_admin`, `admin`, `app_user`.

Умеет:
- список / карточка / обновление / мягкое удаление пользователя;
- смена пароля и роли;
- прямые permission grant/revoke;
- activate / activateImported;
- привязка department role assignment;
- preferences.

Права на методе: `public` | `private` | `"user.read"` и т.п. Проверка в слое `authorize` до domain.

### Отделы
CRUD department, departmentRoleTemplate, departmentRoleAssignment, структура дерева.

### Файлы
upload / download / list / hash. Стримы на WS.

### Уведомления и почта
- очередь + dispatcher + web-push (подписка, ключ, send);
- email outbox, SMTP-настройки, sandbox-режим, test email, process outbox.

### Система
`health` (Postgres `SELECT 1` + Redis `PING`; ответ `ok` / `degraded`), часы/timeSync, introspect, планировщик (`system/scheduler/*`).
Тесты без живой БД: `npm test` (`test/*.test.js`).

---

## Как устроен

```
main.js
  Application  грузит application/{config,lib,domain,api}
  Server       HTTP + WS
  Client       соединение
  SessionManager  Redis
       │
       ▼
  API  →  JSON Schema (validateEndpoint)  →  Domain  →  Repository  →  Postgres
```

- Runtime: `src/` — `server.js`, `client.js`, `session.js`, `streams.js`, `sessionManager.js`, `transport.js`, `rpc-pipeline.js`.
- Общие хелперы: `lib/common.js` (фасад) + `lib/http.js`, `lib/cookies.js`, `lib/redis-utils.js`, `lib/schema-validate.js`.
- Неизменяемые структуры: `lib/cons-list.js`, `lib/abort-scope.js`.
- RPC: раннер `runRpc` сам держит lifetime (AbortScope + access log). Слои без `next()`: `restoreSession → authorize → invoke`. Кто поставил `halted`, того хвост не видит. `context.ip` / `context.signal` — данные запроса, не `req`/`res`.
- Бизнес: `application/api`, `application/domain`, `application/lib/schemas`, `application/lib/repository`.
- В API нет SQL. В domain user нет `db.pg`.

---

## Как поднять локально

Нужны Node 18–20, PostgreSQL, Redis.

Секреты только из env:

```
SESSION_SECRET
POSTGRES_DB / POSTGRES_USER / POSTGRES_PASSWORD
DB_HOST  (по умолчанию 127.0.0.1)
REDIS_HOST / REDIS_PORT / REDIS_PASSWORD
```

База с нуля:

1. `application/db/install.sql` — только local (`app`/`app`)
2. `application/db/auth_schema.sql`
3. `application/db/rbac_seed.sql`
4. миграции `001–003`, `013–014`, `025–027`

Запуск: `npm start` → API на порту 8010.

Пример входа:

```json
{
  "type": "call",
  "id": "1",
  "method": "auth/signin",
  "args": { "email": "admin@example.com", "password": "secret" }
}
```

Дальше браузер сам шлёт `session_id`. Для `user.list` нужна роль с правом `user.read`.

---

## Чего это не умеет (намеренно)

- Нет домена gate-pass / helpdesk / control-center.
- Нет готового фронтенда в этом дереве.
- JWT как основной механизм не используется — сессия в Redis + cookie.
- `zi-schema.sql` не источник правды для новой базы.

---

## Где живут решения (не в чате)

Архитектура — файлы, которые агент читает, а не «помнит».

| файл | зачем |
|---|---|
| `docs/PLATFORM.md` | что умеет сервер |
| `todo/PHASES.md` | очередь работ |
| `docs/ADR-001-platform.md` | зафиксированные решения |
| `AGENTS.project.md` (корень artifacts) | правила для агента |
| скилл `nodejs-js-orchestrator` | слои + необратимые правки |

## Что нельзя молча менять

- имена канона auth
- cookie `session_id` и форма сессии в Redis
- разрушающие миграции и enum в Postgres
- лимиты списка (`user/list` max 100) — не выгружать всю таблицу в JS
