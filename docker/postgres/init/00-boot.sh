#!/bin/sh
set -eu

DB="${APP_DB_PATH:-/opt/app-db}"
psql_cmd="psql -v ON_ERROR_STOP=1 --username ${POSTGRES_USER} --dbname ${POSTGRES_DB}"

run_sql() {
  echo "postgres init: $1"
  $psql_cmd -f "$1"
}

run_sql "$DB/auth_schema.sql"

echo "postgres init: bootstrap admin@gp.com"
$psql_cmd <<'SQL'
INSERT INTO public."User" (
  id, email, username, password_hash, first_name, last_name,
  display_name, employee_id, is_active, is_deleted
)
VALUES (
  'bd911b56-fe1b-4fa7-81a7-a67bbc107ce3',
  'admin@gp.com',
  'admin',
  '$scrypt$N=32768,r=8,p=1,maxmem=67108864$tKpnL6oSP039Fb1lAtsGmRxE52Q0yNByVPTruoT12xg$kKxEmH016iWEOPOtiI+C+Zt2TzuuqyZExG8rzB3r4Covl8gzY22ZEQ3ujkEJAz9yy0NtJ/eEnQSUQGW1rKUvMA',
  'System',
  'Administrator',
  'System Administrator',
  'GLOBAL-ADMIN',
  true,
  false
)
ON CONFLICT (email) WHERE is_deleted = false
DO NOTHING;
SQL

echo "postgres init: rbac_seed.sql"
grep -v -E '^SET transaction_timeout' "$DB/rbac_seed.sql" | $psql_cmd

for f in \
  001_add_system_roles_super_admin_admin_guest.sql \
  002_add_permission_management_permissions.sql \
  003_add_department_and_department_role_permissions.sql \
  013_user_import_activation.sql \
  014_seed_core_permissions_and_user_role_api.sql \
  025_notification_email_outbox.sql \
  026_notification_email_settings.sql \
  027_notification_email_delivery_controls.sql
do
  run_sql "$DB/migrations/$f"
done

echo "postgres init: assign super_admin + admin"
$psql_cmd <<'SQL'
INSERT INTO public."UserRole" (user_id, role_id, assigned_by, is_active, is_deleted)
SELECT u.id, r.id, u.id, true, false
FROM public."User" u
JOIN public."Role" r
  ON r.name IN ('super_admin', 'admin') AND r.is_deleted = false
WHERE u.email = 'admin@gp.com'
  AND u.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public."UserRole" ur
    WHERE ur.user_id = u.id AND ur.role_id = r.id
      AND ur.is_deleted = false AND ur.is_active = true
  );
SQL
