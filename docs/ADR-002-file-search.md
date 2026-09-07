# ADR-002 — File catalog and search

Status: accepted  
Date: 2026-09-07

## Context

Need fast “which file is for this situation” over a growing set of files.

Existing platform already has disk RPC (not a catalog):

| method | today |
|---|---|
| `files/upload` | WS stream → `uploads/{directory}` |
| `files/download` | WS stream |
| `files/list` | `readdir` of a directory |
| `files/hash` | hash of an uploaded file |

Those methods are `access: public`, have no domain/schema/repository, no Postgres row, no ACL. Upload still allows legacy directories `gate-pass-request-attachments` / `gate-pass-approval-signatures` — do not treat as canon.

ADR-001 forbids bringing back the old **index-search product**. This ADR is a reusable platform capability, not that product.

## Decision

### Source of truth

- Postgres owns file **metadata and ACL**.
- Disk (or object storage later) owns bytes.
- Search index is a **projection**. Never the ACL source.

### Search engine — staged

| stage | engine | when |
|---|---|---|
| 5a (now, when implementation starts) | Postgres FTS (`tsvector` + GIN) on name + tags + extracted text | default |
| 5b | Sidecar lexical index (Meilisearch first, Tantivy if ranking/volume needs it) | FTS too slow or weak |
| 5c | Embeddings (hybrid keyword + meaning) | “situation” queries, not exact words |

**Do not use SQLite FTS5.** Extra DB, bad multi-writer in Docker, ACL still in Postgres.

**Do not embed Tantivy/Meilisearch inside `application/lib/repository`.** Repository = SQL. Sidecar is a lib client called from domain.

### What is indexed

- Filename, mime, size, hash, owner, tags, timestamps.
- Extracted text from pdf / docx / xlsx / txt / csv / json. Preview stored, not the whole binary.
- Binary without text: metadata only.
- Extract + index **async** after upload. Upload RPC must not wait on parse.

### RPC contract (additive)

Keep existing `files/*` names. Do not rename upload/download/list/hash.

New methods (not published until implementation phase):

| method | access | meaning |
|---|---|---|
| `files/search` | session + `file.read` | keyword search, LIMIT in SQL |
| `files/get` | session + `file.read` | one row by id |
| `files/index` | session + `file.write` | enqueue extract+index for an existing file |

`files/list` later should read PG, not only disk. Until then list stays disk-shaped. Changing list payload is **expensive** — add fields, do not remove `name/size/type/directory/uploadedAt/path`.

Envelope stays `{ status, response, error }` (`application/docs/api-response-contract.md`).

Pagination: SQL `LIMIT`, max page **100** (same rule as `user/list`). No full-table scan in JS.

### Layers

Four layers for new work:

- `application/api/files/{action}.js`
- `application/domain/files/{action}.js`
- `application/lib/schemas/files/{action}Schema.js`
- `application/lib/repository/files/{action}.js`

Entity folder stays **`files`** (matches live RPC). Do not invent `file/` or `search/` or `index/`.

No `module.exports`. Validate in API via `validateEndpoint`. Domain has no `db.pg`. Repository has SQL only.

### SQL

Additive only:

- New table(s), e.g. `File` + optional `FileText`.
- Nullable columns, GIN on `tsvector`.
- No DROP/RENAME of existing tables.
- No Session table. No change to auth schema.

Next free migration band after `027`: **`028+`**.

### Out of scope

- Old index-search / analytics / builder / openclaw product.
- Gate-pass domain and new gate-pass upload dirs.
- Chat history in Postgres (phase 4.5 still blocked).
- Changing auth canon, cookie `session_id`, Redis session shape.
- Making current `files/*` private in the same patch as search (access change is expensive; do it as its own task).

## Consequences

- Implementation does not start in this ADR. Queue is `todo/PHASES.md` phase 5.
- Agent tools that search files go through whitelist (`lib/llm/tools.js`) and call domain, never raw RPC from the model (phase 4.4).
- Sidecar and embeddings are later phases. Do not add compose services until 5b.
