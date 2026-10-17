#!/usr/bin/env bash
# DB-Testlauf auf Vanilla-Postgres 17 (+pgtap, +pg_cron mit cron.database_name=$DB). Lokal und in CI (.github/workflows/db-tests.yml).
# pg_net/Vault gibt es ausserhalb von Supabase nicht: Falls pg_net fehlt, wird dessen CREATE EXTENSION uebersprungen
# und der Shim legt Stubs (net.http_post, vault.decrypted_secrets) an.
set -euo pipefail
DB=${DB:-tippety_test}
DIR="$(cd "$(dirname "$0")" && pwd)"
PSQL="psql -v ON_ERROR_STOP=1 -q"
dropdb --force --if-exists "$DB"; createdb "$DB"
$PSQL -d "$DB" -f "$DIR/local_supabase_shim.sql"
HAS_PGNET=$(psql -d "$DB" -Atc "select count(*) from pg_available_extensions where name = 'pg_net'")
for f in "$DIR"/../supabase/migrations/*.sql; do
  echo "== $(basename "$f")"
  if [ "$HAS_PGNET" = "0" ]; then
    sed -E 's/^\s*create extension if not exists pg_net.*$/-- (pg_net lokal nicht verfuegbar, Stub aus Shim)/I' "$f" | $PSQL -d "$DB" -f -
  else
    $PSQL -d "$DB" -f "$f"
  fi
done
$PSQL -d "$DB" -c "create extension if not exists pgtap"  # nach Migrationen (Revoke auf public-Funktionen)
pg_prove -d "$DB" "$DIR"/../supabase/tests/*.sql
