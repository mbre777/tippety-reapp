# Import (quellenunabhängig)

- **Whitelist:** `leagues.config.ts` – nur `enabled: true` wird importiert (aktuell 5 Ligen: Bundesliga DE/AT, Super League CH via Sportmonks; National League via SIHF; NHL via api-web.nhle.com). Neue Liga = neuer Eintrag.
- **Adapter** (`adapters/`): implementieren `ProviderAdapter` (`fetchLeagues`, `fetchTeams`, `fetchMatches`) und liefern normalisierte Typen (`types.ts`).
- **Upsert-Kern** (`core/sql.ts`): Zuordnung nur über `external_ids (provider, entity_type, external_id)`, idempotent, eine Transaktion, `sync_runs`-Eintrag pro Provider. Ergebnis-/Statusänderungen lösen die Wertung über den `matches`-Trigger aus.
- **Eishockey:** `home_regular/away_regular` = Stand nach 60 Min (SIHF: Summe der 3 Drittel; NHL: bei OT/SO beide = kleinerer Endstand), getrennt von `*_final` + `decided_by`.
- **Lokal:** `deno run --allow-net --allow-env --allow-write scripts/import.ts --dry-run [--only=nhl] [--json=r.json] [--sql=out.sql]` (`--sql` schreibt nur die Datei, führt nichts aus).
- **Edge Function** `index.ts` (noch nicht deployt): Secrets `SPORTMONKS_API_TOKEN`, `IMPORT_SECRET`, `SUPABASE_DB_URL`.
- Benötigt Migration `20261017100400_client_gaps` (PR #4) wegen `leagues.short_name/color/country_code`, `matches.matchday/venue`.
