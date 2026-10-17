#!/usr/bin/env bash
# Lokaler Testlauf auf Vanilla-Postgres 17 (+pgtap, +pg_cron mit cron.database_name=tippety_test).
set -euo pipefail
DB=${DB:-tippety_test}
PSQL="psql -v ON_ERROR_STOP=1 -q"
dropdb --force --if-exists "$DB"; createdb "$DB"
$PSQL -d "$DB" -f "$(dirname "$0")/local_supabase_shim.sql"
for f in "$(dirname "$0")"/../supabase/migrations/*.sql; do echo "== $f"; $PSQL -d "$DB" -f "$f"; done
$PSQL -d "$DB" -c "create extension if not exists pgtap"  # nach Migrationen (Revoke auf public-Funktionen)
pg_prove -d "$DB" "$(dirname "$0")"/../supabase/tests/*.sql
