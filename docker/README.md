# Docker deployment notes

## First run

1. Copy `.env.docker.example` to `.env` and replace every `change_me_*` value.
2. Start the stack:

```bash
docker compose up -d --build
```

On a fresh Postgres volume, files under `docker/postgres/init/` initialize the Gate Pass baseline schema and apply production migrations through `035`.

## Optional tools

Start pgAdmin only when needed, bound to localhost:

```bash
docker compose --profile admin up -d pgadmin
```

## Verification

```bash
docker compose ps
curl http://127.0.0.1/health
docker exec gate-pass-postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c '\dt'
```

## Important

- Do not expose Postgres, Redis, or pgAdmin publicly.
- Rotate SMTP/mailbox password before production.
- Back up Postgres and `uploads/` before migrations or deployment.
