# Client-API-Vertrag App ↔ Supabase

Grundlage: Schema PR #2 (`feat/supabase-schema`, `supabase/README.md`), mit dem DB-Bot abgestimmt am 17.10.2026.
Implementierung in der App: `mobile/src/auth/supabaseAuth.ts`, `mobile/src/data/supabase/supabaseRepository.ts`.
Alle Aufrufe mit User-JWT, Schema `public`, `auth.uid()` implizit.

## Festgelegt (bestätigt)

| Zweck | Aufruf | Rückgabe / Fehler |
|---|---|---|
| Nickname prüfen (live) | `rpc('check_nickname', { p_nickname })` | `'available' \| 'taken' \| 'invalid' \| 'reserved'` |
| Nickname setzen | `rpc('set_nickname', { p_nickname })` | `profiles`; Fehler `nickname_taken`, `nickname_invalid`, `nickname_reserved` |
| Profil lesen | `from('profiles').select('id,nickname,created_at')` | Zeile legt `handle_new_user()` an |
| Ligen-Katalog | `from('leagues').select('id,sport,name,country,active')` | `active=false` → „bald verfügbar“ |
| Eigene Ligen + Favorit | `from('user_leagues')` **direkt** (insert/update/delete, nur eigene) | `is_favorite`, **max. 1 Favorit**; mind. 1 Liga prüft der **Client** |
| Spiele | `from('matches')` + `teams(id,name,short_name,logo_url)` | `status`: scheduled/live/finished/postponed/cancelled; `*_regular`, `*_final`, `decided_by` |
| Eigene Tipps | `from('tips').eq('user_id', uid)` | fremde Tipps erst ab Anstoß lesbar → immer auf `user_id` filtern |
| Tipp speichern | `rpc('upsert_tip', { p_match_id, p_home, p_away })` | Fehler `tip_locked` (ab Anstoß **und** bei postponed/cancelled), `invalid_tip` |
| Gruppe erstellen | `rpc('create_group', { p_name })` | `groups` mit `invite_code` (8 Zeichen, ohne 0/O/1/I) |
| Gruppe beitreten | `rpc('join_group_by_code', { p_code })` | Fehler `invalid_code`, `already_member` |
| Gruppe verlassen | `rpc('leave_group', { p_group_id })` | Owner-Übergabe an ältestes Mitglied, letzte Person löscht Gruppe (UI-Text berücksichtigt) |
| Rangliste pro Liga | `from('leaderboard_league').eq('league_id', …)` | `user_id, nickname, points, exact_hits, diff_hits, tendency_hits, rank` |
| Gruppen-Rangliste | `from('leaderboard_group')` | `league_id IS NULL` = Gruppen-Gesamtwertung |
| Wertung | serverseitig `calc_points` / `score_match()` | Fußball `*_final`, Eishockey `*_regular` (60 Min) |

Alle anderen Writes nur per RPC. Die zuvor als „offen mit DB-Bot“ markierten Punkte (Rangliste pro Liga, Ligen-Auswahl/Lieblingsliga, `nickname_reserved`) sind damit **aufgelöst**.

## Migration 0005 (feat/schema-client-gaps) – Feature-Detection

Der Client baut gegen die geplanten Namen und fällt automatisch zurück, wenn Spalte/RPC fehlt
(`mobile/src/data/supabase/features.ts`: PostgREST-/Postgres-Codes `PGRST200/202/204/205`, `42703`, `42883`, `42P01`;
**`42501` Permission denied gilt nicht als „fehlt“** und wird als Fehler gemeldet). Ergebnis wird pro App-Start gemerkt.

| 0005-Name | Nutzung | Fallback ohne 0005 |
|---|---|---|
| `leagues.short_name, color, flag_url, country_code` | Liga-Badge, Flagge (Emoji aus `country_code`) | Client-Mapping per Liganame, sonst neutral |
| `teams.color` | Wappenfarbe (Schrift kontrastiert automatisch) | neutrales Grau |
| `matches.is_top_match, matchday, venue` | Topspiel-Karussell, Spieltag-Gruppierung, Spielort | nächste Spiele, `round`-Text, leer |
| `groups.is_private`, `group_leagues` | Gruppenliste, Liga-Filter | privat, „alle Ligen“ |
| `create_group(p_name, p_league_ids, p_is_private)` | Gruppe erstellen | `create_group(p_name)` |
| `preview_group_by_code(p_code)` | Vorschau vor Beitritt, `invalid_code` | Platzhalter „Gruppe XXXX-XXXX“ |
| `profiles.reminder_enabled`, `update_profile_settings(…)` | Erinnerung (Minuten fix 60) | AsyncStorage lokal |
| `get_match_tip_distribution(p_match_id)` (P2) | Community-Tipps | leere Karte |
| `leaderboard_period(…, 'matchday'\|'month'\|'season', …)` (P2) | Rangliste Spieltag/Monat | Saison-View |
| `points_week`, `rank_change` in Views (P2) | „+x diese Woche“, ▲▼ | 0 / neutral |

## Schema-Wünsche

- **Ligen vor dem Login lesbar** (`grant select on leagues to anon` oder RPC `public_leagues()`): Der Login-Screen zeigt „Fußball · N Ligen / Eishockey · …“. Aktuell zählt der Client mit dem statischen Katalog; nach Login wird der echte Katalog geladen. Kein Blocker – die Ligen-Auswahl kommt erst nach dem Login.

## Offen (Gerüst nutzt Fallback, markiert mit `OFFEN` im Code)

| Thema | Fallback in der App | Vorschlag |
|---|---|---|
| Liga-Darstellung (Kürzel, Farbe, Flagge) | Client-Mapping per Liganame (`data/leagueCatalog.ts`) | Spalten `code`, `color`, `flag` oder `slug` in `leagues` |
| Vereinsfarben/Kürzel | neutrales graues Wappen, Kürzel aus `short_name` | `teams.code`, `teams.color`; `logo_url` im Crest anzeigen |
| Topspiele | nächste anstehende Spiele | `matches.top_match boolean` |
| Community-Tipps vor Anstoß | 0 % (Karte leer) | View/RPC mit aggregierter Verteilung (ohne Einzeltipps) |
| Rangliste „Spieltag“/„Monat“ | Saisonwerte | Views/RPC mit Zeitraum-Parameter |
| Trend ▲▼ / „+x diese Woche“ | neutral / 0 | Snapshot pro Woche |
| Gruppen-Ligen + „Nur mit Code“ | alle eigenen Ligen, immer privat | `group_leagues(group_id, league_id)`, `groups.is_private` |
| Gruppen-Vorschau vor Beitritt | Platzhalter „Gruppe XXXX-XXXX“ | `rpc('preview_group_by_code')` (Name, Mitgliederzahl) |
| Erinnerung vor Tippschluss | lokal (AsyncStorage) | `profiles.reminders` + Push-Token-Tabelle |
| Spielort | leer | `matches.venue` |
