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

---

## Фаза 4 — локальный LLM-агент

Цикл: User → `agent/chat` → llama-server → tool decision → Node tool → llama → answer.

- [x] 4.1 Config `application/config/llm.js` (`LLM_BASE_URL`, default `http://127.0.0.1:8080`)
- [x] 4.2 `lib/llm/{client,tools,agent}` — OpenAI `/v1/chat/completions`, whitelist tools
- [x] 4.3 RPC `agent/chat` (`access: private`, JSON Schema, no SQL)
- [ ] 4.4 Новые tools только whitelist в `lib/llm/tools.js`. Не отдавать LLM произвольный RPC.
- [ ] 4.5 История диалога в Postgres — не делать, пока не закрыт 4.4

---

## Фаза 5 — каталог файлов и поиск

Цель: быстро найти какой файл нужен в ситуации. Корпус растёт.

Канон: `docs/ADR-002-file-search.md`.  
Это не возврат старого продукта index-search (запрещён ADR-001).

Существующий диск-RPC не ломать и не переименовывать:

`files/upload` · `files/download` · `files/list` · `files/hash`

- [ ] 5.0 Контракт зафиксирован (этот пункт + ADR-002). Реализацию не начинать, пока 5.0 не прочитан.
- [ ] 5.1 Инвентарь `application/api/files/*`: какие поля отдаёт list/upload сейчас. Новый payload только additive.
- [ ] 5.2 Additive SQL `028+`: таблица `File` (id, owner, name, mime, size, hash, disk_path, directory, tags, timestamps, soft-delete, `index_status`, extractor_version). Текст с лимитом + `tsvector` — та же таблица или `FileText`. GIN. Без DROP/RENAME. Статусы: pending → processing → ready | failed.
- [ ] 5.3 Четыре слоя: `files/get`, `files/search`, `files/index`. Entity = `files`. Schema + `validateEndpoint`. SQL только в repository. Default limit 20, max 100.
- [ ] 5.4 Extractor после upload (очередь, не внутри RPC): pdf/docx/xlsx/txt/csv/json → текст. Лимиты size/text/timeout. Идемпотентность: hash + extractor_version. Бинарник без текста — только метаданные.
- [ ] 5.5 `files/search` = Postgres FTS. ACL по строке в SQL (не только `file.read` на RPC). Индекс не источник прав. Только `index_status = ready`.
- [ ] 5.6 Права: `file.read` / `file.write` в seed. Смену `access: public` у старых upload/list **не** делать в том же патче, что поиск.
- [ ] 5.7 Sidecar Meilisearch или Tantivy — только если 5.5 уже в проде и упираемся. Не SQLite FTS5. Не FFI в Node.
- [ ] 5.8 Эмбеддинги (смысл «ситуации») — после 5.7. Llama не индекс.
- [ ] 5.9 Tool агента `files_search` — только после 5.5 и в whitelist 4.4.

Не делать в этой фазе: gate-pass директории как канон, `file/` вместо `files/`, поиск в repository через внешний движок, полная выгрузка списка в JS.
