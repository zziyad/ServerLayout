#!/usr/bin/env bash
set -euo pipefail

# Export RBAC baseline from an existing/local Postgres DB into a Docker init SQL.
# Use this when local DB has extra permissions/roles that must be included in
# fresh Docker installs.
#
# Default source DB is gate-pass as Linux user zi, matching Zi's command:
#   sudo -u zi pg_dump -d gate-pass --schema-only > schema.sql
#
# Usage:
#   ./scripts/export-rbac-seed-from-db.sh
#   SRC_DB=gate-pass SRC_DB_USER=zi ./scripts/export-rbac-seed-from-db.sh
#   OUT=docker/postgres/init/040_my_rbac_seed.sql ./scripts/export-rbac-seed-from-db.sh

SRC_DB="${SRC_DB:-gate-pass}"
SRC_DB_USER="${SRC_DB_USER:-zi}"
OUT="${OUT:-docker/postgres/init/040_rbac_permissions_roles_seed.sql}"
TMP="$(mktemp)"

cleanup() {
  rm -f "${TMP}"
}
trap cleanup EXIT

mkdir -p "$(dirname "${OUT}")"

sudo -u "${SRC_DB_USER}" pg_dump \
  -d "${SRC_DB}" \
  --data-only \
  --column-inserts \
  --disable-triggers \
  --table='public."Permission"' \
  --table='public."Role"' \
  --table='public."RolePermission"' \
  > "${TMP}"

cat > "${OUT}" <<'SQL'
-- RBAC seed exported from local DB.
-- This file is safe for Docker fresh init order after baseline schema.
-- It is data-only for public."Permission", public."Role", public."RolePermission".
-- If you re-export, review before committing because it may include local test roles.

SQL

cat "${TMP}" >> "${OUT}"

cat >> "${OUT}" <<'SQL'

-- Keep critical roles protected after import.
UPDATE public."Role"
SET is_system = true, is_active = true, updated_at = now()
WHERE name IN (
  'super_admin',
  'admin',
  'app_user',
  'gate_pass_approver',
  'security_officer',
  'security_supervisor',
  'security_manager'
)
AND is_deleted = false;
SQL

echo "RBAC seed exported to ${OUT}"
