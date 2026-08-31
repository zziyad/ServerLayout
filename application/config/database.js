({
  // Use environment variables for Docker compatibility
  // In Docker: DB_HOST=pg-ts (service name in docker network), port always 5432
  // Outside Docker: DB_HOST=127.0.0.1 or localhost, port from POSTGRES_PORT or 5432
  host: node.process.env.DB_HOST || '127.0.0.1',
  // Inside Docker network (pg-ts) always use 5432, outside use POSTGRES_PORT or default 5432
  port:
    node.process.env.DB_HOST === 'postgres'
      ? 5432
      : parseInt(
          node.process.env.POSTGRES_PORT || node.process.env.DB_PORT || '5432',
          10,
        ),
  database:
    node.process.env.POSTGRES_DB || node.process.env.DB_NAME || 'app',
  user: node.process.env.POSTGRES_USER || node.process.env.DB_USER || 'app',
  password:
    node.process.env.POSTGRES_PASSWORD || node.process.env.DB_PASSWORD || '',
});
