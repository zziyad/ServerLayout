# TODO фаз платформы

Рабочее дерево: `artifacts/server2`.
Цель: шаблон, который не пишут заново — AAA session auth, user/role/permission, validator, notification, email.

Правило: не перескакивать фазу, пока предыдущая не закрыта.
Этот файл — источник правды по работам.

---

## Фаза 0 — честный шаблон

- [x] 0.1 Boot SQL без helpdesk/gate-pass
- [x] 0.2 Секреты только из env
- [x] 0.3 Канон auth: `signin` / `register` / `signout` / `me` / `activity`
- [x] 0.4 Убрать тестовые auth, legacy `auth/provider`, control-center, `vapp-*`

---

## Фаза 1 — слои user/auth

- [x] 1.1–1.5 закрыты

---

## Фаза 2 — runtime

- [x] 2.1–2.7 закрыты

---

## Фаза 3 — эксплуатация

- [x] 3.1–3.3 закрыты

---

## Boot SQL (фаза 0)

1. `application/db/install.sql` — только local
2. `application/db/auth_schema.sql`
3. `application/db/rbac_seed.sql`
4. `application/db/migrations/001–003`
5. `application/db/migrations/013–014`
6. `application/db/migrations/025–027`

Не источник: `zi-schema.sql`, helpdesk `004–009`.

---

## Фаза 4 — локальный LLM-агент

- [x] 4.1 Config `application/config/llm.js`
- [x] 4.2 `lib/llm/{client,tools,agent}`
- [x] 4.3 RPC `agent/chat`
- [ ] 4.4 Новые tools только whitelist в `lib/llm/tools.js`
- [ ] 4.5 История диалога в Postgres — не делать, пока не закрыт 4.4

---

## Фаза 5 — каталог файлов и поиск

Канон: `docs/ADR-002-file-search.md`.

`files/upload` · `files/download` · `files/list` · `files/hash` — не переименовывать.

- [ ] 5.0 Контракт зафиксирован. Реализацию не начинать, пока 5.0 не прочитан.
- [ ] 5.1 Инвентарь `application/api/files/*`
- [ ] 5.2 Additive SQL `028+`: `File` + текст/`tsvector`, GIN
- [ ] 5.3 Слои `files/get`, `files/search`, `files/index`. LIMIT ≤ 100
- [ ] 5.4 Extractor после upload (очередь)
- [ ] 5.5 `files/search` = Postgres FTS + ACL из PG
- [ ] 5.6 Права `file.read` / `file.write`. Access public у старых files/* — отдельный патч
- [ ] 5.7 Sidecar Meilisearch/Tantivy только после 5.5. Не SQLite FTS5
- [ ] 5.8 Эмбеддинги после 5.7
- [ ] 5.9 Tool `files_search` после 5.5 и whitelist 4.4
