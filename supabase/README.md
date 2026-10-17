# Supabase – Tippety

Projekt: `whfhjpneehvjvlyhuzpb`. Migrationen in `migrations/`, pgTAP-Tests in `tests/`.

- **Punkte:** 5 exakt · 3 richtige Tordifferenz (nur bei Sieg/Niederlage) · 2 Tendenz (inkl. Remis mit falschem Ergebnis) · 0.
  Fußball wertet `*_final`, Eishockey `*_regular` (nach 60 Min). `score_match()` ist idempotent und läuft per Trigger bei Ergebnis-/Statusänderung (`result_version`).
- **Tipp-Sperre:** Trigger auf `tips` – nur bei `now() < kickoff_at` und `status = 'scheduled'`, sonst Fehler `tip_locked`. Clients schreiben Tipps nur via `upsert_tip()`.
- **Nickname:** 3–16 Zeichen `[a-z0-9_]`, Eingabe wird lower-cased, case-insensitiv eindeutig (citext); Sperrliste `reserved_nicknames` (`exact` / `contains`). `check_nickname()` → `available|taken|invalid|reserved`.
- **Gruppen:** `create_group`, `join_group_by_code` (8 Zeichen, ohne 0/O/1/I), `leave_group` (Owner-Übergabe an ältestes Mitglied, letzte Person löscht Gruppe).
- **Ranglisten:** `leaderboard_global`, `leaderboard_league`, `leaderboard_group` (`league_id IS NULL` = Gruppen-Gesamtwertung inkl. Mitglieder ohne Punkte; sonst pro Liga). Alle `security_invoker`.
- **RLS:** Stammdaten lesbar für `authenticated`, Schreiben nur `service_role`; `external_ids`, `sync_runs`, `reserved_nicknames` ohne Client-Zugriff; `user_leagues` nur eigene (max. 1 Favorit).

## Tests
- Supabase CLI: `supabase test db`
- Ohne CLI (Vanilla-Postgres 17 + pgtap + pg_cron, `cron.database_name='tippety_test'`): `scripts/test_local.sh` (nutzt `scripts/local_supabase_shim.sql`, der nur Rollen/`auth.uid()` nachbildet).
