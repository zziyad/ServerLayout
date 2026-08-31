# TODO фаз платформы

Рабочее дерево: `artifacts/server2`.
Цель: шаблон, который не пишут заново — AAA session auth, user/role/permission, validator, notification, email.

Правило: не перескакивать фазу, пока предыдущая не закрыта.
Этот файл — источник правды по работам.

---

## Фаза 0 — честный шаблон

Сделать дерево платформой, не обломком продукта.

- [x] 0.1 Boot SQL без helpdesk/gate-pass (порядок внизу файла)
- [x] 0.2 Секреты только из env (session, DB password)
- [x] 0.3 Канон auth: `signin` / `register` / `signout` / `me` / `activity`
- [x] 0.4 Убрать тестовые auth, legacy `auth/provider`, control-center, `vapp-*`

Канон после 0.3:

| метод | роль |
|---|---|
| `auth/signin` | вход + session |
| `auth/register` | публичная регистрация + session |
| `auth/signout` | выход (идемпотентный) |
| `auth/me` | текущий user/session |
| `auth/activity` | heartbeat |

Служебные сессии (`keep-alive`, `refresh`, `restore`) не расширять. `logout` — совместимость, не новый канон.

---

## Фаза 1 — слои user/auth

- [x] 1.1 `auth/signin` через JSON Schema + `validateEndpoint`
- [x] 1.2 Все `user/*` через существующие schema-файлы
- [x] 1.3 SQL из `domain/user/*` в `application/lib/repository/user/*`
- [x] 1.4 `lib.provider` — тонкая обёртка над repository/user
- [x] 1.5 Domain user без `db.pg`

---

## Фаза 2 — облегчить runtime

- [x] 2.1 Вынести `Session` / `Client` из `src/server.js`
- [x] 2.2 Streams отдельным модулем
- [x] 2.3 Разрезать `lib/common.js` (http / cookies / redis / validation)
- [x] 2.4 Мёртвый код в `main.js`
- [x] 2.5 Хвосты: лишние docs/scripts (`xlsx` оставлен — excelGenerator)
- [x] 2.6 RPC-цепочка ConsList + `console.access` / `console.security`
- [x] 2.7 `AbortScope` на запрос (`context.signal`), не на Redis-сессию

---

## Фаза 3 — эксплуатация

- [x] 3.1 Тесты auth (`npm test` → `test/*.test.js`)
- [x] 3.2 `health` проверяет Postgres + Redis
- [x] 3.3 Одна страница: docs/PLATFORM.md

---

## Boot SQL (фаза 0)

Пустой Postgres:

1. `application/db/install.sql` — только local
2. `application/db/auth_schema.sql`
3. `application/db/rbac_seed.sql` — super_admin, admin, app_user
4. `application/db/migrations/001–003`
5. `application/db/migrations/013–014`
6. `application/db/migrations/025–027` — email outbox / settings

Не источник правды: `zi-schema.sql`, helpdesk `004–009` (уже удалены).
