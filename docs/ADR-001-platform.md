# ADR-001 — Платформа, не продукт

Статус: принято  
Дата: 2026-08-30

## Решение

`artifacts/server2` — шаблон бэкенда для многих клиентских приложений.

В шаблоне уже есть: session auth, user/role/permission, JSON Schema validator, notification, email.

Нет и не возвращать: gate-pass, helpdesk, control-center, index-search.

## Контракт, который нельзя тихо снять

RPC: `auth/signin`, `auth/register`, `auth/signout`, `auth/me`, `auth/activity`.  
`auth/logout` — алиас.  
Cookie: `session_id`. Хранилище сессии: Redis.  
Схема пользователя: `application/db/auth_schema.sql` + миграции + `rbac_seed.sql`.  
`zi-schema.sql` не канон.

## Дешёвые vs дорогие правки

Дешёвые: слои API/domain/schema/repository, нарезка `src/`, доки, additive SQL.

Дорогие: DROP/RENAME, смена enum, переименование публичного метода, смена cookie.

## Runtime-запрос

Цепочка слоёв — `ConsList`, без `next()`. Раннер держит abort и лог.

Порядок: `restoreSession → authorize → invoke`. `halted` останавливает хвост.

AbortSignal живёт столько же, сколько RPC. Закрытие сокета не равно logout.

## Списки

Фильтр и LIMIT в SQL. Не обходить всю таблицу в JS. `await` в цикле не ускоряет event loop.

## Где это повторено для агента

- `AGENTS.project.md`
- скилл `nodejs-js-orchestrator` + `references/irreversible.md`
- `docs/PLATFORM.md`
- `todo/PHASES.md`
