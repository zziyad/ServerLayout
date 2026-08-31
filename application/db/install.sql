-- Local bootstrap only. Do not use these credentials in production.
-- Override via POSTGRES_* / DB_* env when running the app.

DROP DATABASE IF EXISTS app;
DROP USER IF EXISTS app;
CREATE USER app WITH PASSWORD 'app';
CREATE DATABASE app OWNER app;
