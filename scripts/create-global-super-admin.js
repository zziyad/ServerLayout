#!/usr/bin/env node
'use strict';

const pg = require('pg');
const metautil = require('metautil');

const required = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
};

const main = async () => {
  const email = process.argv[2] || process.env.SUPER_ADMIN_EMAIL;
  const password = process.argv[3] || process.env.SUPER_ADMIN_PASSWORD;

  if (!email || !password) {
    console.error(
      'Usage: node scripts/create-global-super-admin.js email password',
    );
    process.exit(1);
  }

  const client = new pg.Client({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.POSTGRES_PORT || process.env.DB_PORT || 5432),
    database: process.env.POSTGRES_DB || process.env.DB_NAME || 'gate_pass',
    user: process.env.POSTGRES_USER || process.env.DB_USER || required('USER'),
    password: process.env.POSTGRES_PASSWORD || process.env.DB_PASSWORD || '',
  });

  await client.connect();

  try {
    await client.query('BEGIN');

    await client.query(`
      ALTER TABLE public."User"
      ALTER COLUMN tenant_id DROP NOT NULL
    `);

    const passwordHash = await metautil.hashPassword(password);
    const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, '_');

    const userResult = await client.query(
      `
      INSERT INTO public."User" (
        email, username, password_hash,
        first_name, last_name, display_name,
        is_active, is_deleted, tenant_id, account_status,
        employee_id, activated_at
      )
      VALUES (
        $1, $2, $3,
        'Global', 'Super Admin', 'Global Super Admin',
        true, false, null, 'ACTIVE',
        'GLOBAL-SUPER-ADMIN', now()
      )
      ON CONFLICT (email) WHERE is_deleted = false
      DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        username = EXCLUDED.username,
        is_active = true,
        account_status = 'ACTIVE',
        tenant_id = null,
        updated_at = now()
      RETURNING id, email
      `,
      [email.toLowerCase(), username, passwordHash],
    );

    const user = userResult.rows[0];

    const roleResult = await client.query(`
      INSERT INTO public."Role" (
        name, display_name, description, is_system, is_active, is_deleted
      )
      VALUES (
        'super_admin', 'Super Administrator',
        'Global technical owner/full-access bypass.', true, true, false
      )
      ON CONFLICT (name) WHERE is_deleted = false
      DO UPDATE SET is_system = true, is_active = true, updated_at = now()
      RETURNING id
    `);

    const roleId = roleResult.rows[0].id;

    await client.query(
      `
      INSERT INTO public."UserRole" (user_id, role_id, assigned_by, is_active, is_deleted)
      VALUES ($1, $2, $1, true, false)
      ON CONFLICT (user_id, role_id) WHERE is_deleted = false AND is_active = true
      DO NOTHING
      `,
      [user.id, roleId],
    );

    await client.query('COMMIT');
    console.log(`Global super_admin ready: ${user.email} (${user.id})`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
