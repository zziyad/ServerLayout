# Docker

Default stack: API + Postgres + Redis.

```bash
cp .env.example .env   # already present for local
docker compose up -d --build
```

API: `http://127.0.0.1:8010`  
Postgres host port: `5433` (container `5432`)  
Redis host port: `6379`

First empty volume runs `docker/postgres/init/00-boot.sh`:
`auth_schema` → admin user → `rbac_seed` → migrations `001–003`, `013–014`, `025–027`.

Login after boot: `admin@gp.com` / `password`. Change it.

```bash
curl -sS -X POST http://127.0.0.1:8010/api \
  -H 'content-type: application/json' \
  -d '{"type":"call","id":"1","method":"health","args":{}}'
```

Optional:

```bash
docker compose --profile proxy up -d nginx    # http://127.0.0.1:8081
docker compose --profile admin up -d pgadmin  # http://127.0.0.1:5050
```

Code mounts (no image rebuild):

- `application/` — watcher reloads api/domain/config/lib
- `src/`, `lib/`, `main.js` — `docker compose restart api`

`--build` only after Dockerfile / package.json change.

Logs: `docker compose logs -f api`  
Files: `log/YYYY-MM-DD.log`  
RPC (session): `system/logs` `{ "lines": 200 }`.

Llama on the host: `LLM_BASE_URL=http://host.docker.internal:8080`.

Re-init schema (destroys Postgres volume):

```bash
docker compose down -v
docker compose up -d --build
```
