#!/usr/bin/env bash
set -euo pipefail

# Export schema-only from local DB, using Zi's default command shape.
# Usage:
#   ./scripts/export-schema-from-db.sh
#   SRC_DB=gate-pass SRC_DB_USER=zi OUT=schema.sql ./scripts/export-schema-from-db.sh

SRC_DB="${SRC_DB:-gate-pass}"
SRC_DB_USER="${SRC_DB_USER:-zi}"
OUT="${OUT:-schema.sql}"

sudo -u "${SRC_DB_USER}" pg_dump -d "${SRC_DB}" --schema-only > "${OUT}"
echo "Schema exported to ${OUT}"
