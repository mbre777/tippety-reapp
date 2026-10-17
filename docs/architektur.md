# Tippety – Technische Architektur (Supabase)

Stand: 17.10.2026 · Hobby-Projekt, kein Echtgeld, **möglichst wartungsarm und günstig**.
Ersetzt das frühere Konzept mit Cloudflare Workers/Hono – **es gibt keinen eigenen API-Server mehr.**

## 0. Kurzfassung

| Baustein | Entscheidung |
|---|---|
| App | Expo SDK 57, React Native, TypeScript, Expo Router (`mobile/`), läuft in Expo Go |
| Backend | **Supabase** (Postgres + Auth + RLS + RPCs + Edge Functions + Cron) – App spricht direkt per `supabase-js` |
| Auth | **Nur Apple + Google** über Supabase Auth, danach Nickname + Ligen-Auswahl in der App |
| Sportdaten | Fußball: **Sportmonks** · National League: **SIHF data.sihf.ch** (Reserve: **API-Hockey**) · NHL: **api-web.nhle.com** |
| Import/Wertung | **Supabase Cron (pg_cron) → Edge Functions**, quellenunabhängige Import-Schicht; Wertung + Ranglisten in Postgres |
| Secrets | Sportdaten-API-Keys & `service_role` **nur serverseitig** (Edge-Function-Secrets). App kennt nur URL + anon key |
| Landingpage | separat auf **Vercel** mit **eigener DB** (Warteliste o. ä.), kein Zugriff auf die App-DB |

## 1. Gesamtbild

```
 ┌───────────── Expo-App (iOS/Android/Web) ─────────────┐
 │ UI ─ Repository/Auth-Interfaces ─┬─ Mock (aktiv)      │
 │                                  └─ Supabase (Gerüst) │
 └──────────────┬────────────────────────────────────────┘
                │ supabase-js (HTTPS, User-JWT, RLS)
 ┌──────────────▼──────────── Supabase ───────────────────┐
 │ Auth (Apple, Google)                                    │
 │ Postgres: leagues, teams, matches, tips, profiles,      │
 │   user_leagues, groups, group_members, Views leaderboard │
 │ RLS + RPCs (check_nickname, set_nickname, upsert_tip,   │
 │   create_group, join_group_by_code, leave_group)        │
 │ Trigger: Tipp-Sperre ab Anstoß, score_match() bei Ergebnis │
 │ pg_cron ──► Edge Functions (import-fixtures, import-results) │
 └──────────────┬──────────────────────────────────────────┘
                │ API-Keys nur hier (Secrets)
   Sportmonks · data.sihf.ch (API-Hockey als Reserve) · api-web.nhle.com
```

Schema, RLS und Funktionen: `supabase/` (PR #2, `feat/supabase-schema`, Doku `supabase/README.md`).
Vertrag App ↔ DB: [`docs/client-api-vertrag.md`](client-api-vertrag.md).

## 2. App-Architektur (`mobile/src`)

- `data/repository.ts` – Interface `TippetyRepository` (Spiele, Tipps, Ranglisten, Gruppen).
- `auth/types.ts` – `AuthService` (Apple/Google) + `ProfileService` (Nickname, Ligen, Favorit).
- `data/index.ts` – **einziger Umschaltpunkt**: Supabase aktiv bei `EXPO_PUBLIC_BACKEND=supabase` + `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY`, sonst Mock.
- `data/mock/*`, `auth/mockAuth.ts` – Beispieldaten, Session nur im Speicher.
- `data/supabase/*`, `auth/supabaseAuth.ts` – Gerüst gegen das Schema aus PR #2.
- `auth/session.ts` – synchroner Session-Store; `app/_layout.tsx` = Routing-Gate **Login → Nickname → Ligen → App**.
- Regeln doppelt (Client für Live-Feedback, Server verbindlich): `lib/nickname.ts`, `lib/scoring.ts`, `lib/inviteCode.ts`.

## 3. Auth & Onboarding

1. Login nur **Sign in with Apple** oder **Google** (Supabase OAuth, PKCE; Redirect `tippety://auth-callback`).
2. Trigger `handle_new_user()` legt `profiles` an (Nickname leer).
3. **Nickname**: 3–16 Zeichen, nur `a–z 0–9 _`, eindeutig case-insensitiv (citext), Sperrliste (`admin`, `tippety`, `support`, `moderator`, Schimpfwörter; Tabelle `reserved_nicknames`). Live-Validierung: lokal sofort, `check_nickname()` entprellt (300 ms).
4. **Ligen**: mind. 1 (Client-Prüfung), genau eine Lieblingsliga (Stern, `user_leagues.is_favorite`). Nicht gewählte Ligen erscheinen nirgends. Ohne Eishockey- (bzw. Fußball-)Liga verschwindet der Sport-Button.

Was für echten Login noch fehlt: siehe [`docs/login-setup.md`](login-setup.md).

## 4. Datenquellen & Import (quellenunabhängig)

| Liga | Quelle | Bemerkung |
|---|---|---|
| Bundesliga, AT Bundesliga, CH Super League (später PL, Ligue 1, Serie A, La Liga) | Sportmonks | kostenpflichtiger Plan je nach Ligen-Anzahl |
| Schweizer National League | SIHF `data.sihf.ch` | Reserve: API-Hockey (api-sports) |
| NHL | `api-web.nhle.com` | inoffiziell, ohne Key |

- Je Quelle ein **Adapter** in der Edge Function, der auf ein gemeinsames Format mappt (Liga, Saison, Team, Spiel, Status, `*_regular`, `*_final`, `decided_by`).
- Zuordnung externer IDs über `external_ids(provider, entity_type, external_id)` → Quellenwechsel ohne Datenmigration.
- Jobs per **pg_cron**: Spielplan täglich, Ergebnisse alle 5 min während Spielfenstern; Protokoll in `sync_runs`.

## 5. Wertung, Tippschluss, Ranglisten

- **Punkte 5/3/2/0**: exakt 5 · richtige Tordifferenz 3 (nicht bei Remis) · richtige Tendenz 2 · sonst 0 (`calc_points`).
- **Eishockey zählt nach 60 Minuten** (`*_regular`); angezeigt wird zusätzlich der Endstand mit **n.V./n.P.** (`*_final`, `decided_by`).
- **Tippschluss**: Trigger auf `tips` – nur solange `now() < kickoff_at` und `status = 'scheduled'`, sonst `tip_locked` (auch `postponed`/`cancelled`). Schreiben nur via `upsert_tip()`.
- `score_match()` idempotent per Trigger bei Ergebnis-/Statusänderung (`result_version`).
- Ranglisten: Views `leaderboard_league` (pro Liga, Liga-Umschalter in der App), `leaderboard_group` (pro Liga oder `league_id IS NULL` = Gruppen-Gesamt), `leaderboard_global`.
- Header-Pill: offene Tipps der **Lieblingsliga** im nächsten Spieltag (Fallback je Sportart: erste gewählte Liga).

## 6. Sicherheit

- RLS überall: Stammdaten lesbar für `authenticated`, Schreiben nur `service_role` (Edge Functions).
- `tips`: eigene immer lesbar, fremde erst ab Anstoß. `user_leagues`: nur eigene, direkt schreibbar. Alles andere nur über RPCs.
- In der App nur `EXPO_PUBLIC_SUPABASE_URL` + anon key (öffentlich by design). **Keine** Sportdaten-Keys in der App.

## 7. Landingpage

Eigenes Projekt auf **Vercel** mit **eigener DB** (z. B. Vercel Postgres/Neon für Warteliste). Keine Verbindung zur App-Datenbank → kein Risiko für Nutzerdaten.

## 8. Kosten & Wartung (Schätzung ⚠️)

| Posten | ca./Monat |
|---|---|
| Supabase Free → Pro bei Bedarf | 0 € → ~25 $ |
| Sportmonks (je nach Ligen) | ~30–100 € |
| SIHF / NHL | 0 € (API-Hockey Reserve: Free-Tier) |
| Vercel Hobby (Landingpage) | 0 € |
| Apple Developer Program | 99 $/Jahr |

Wartung: Quellen-Adapter bei API-Änderungen, Saisonwechsel (Ligen/Saisons), Monitoring über `sync_runs`.

## 9. Offene Punkte

Siehe `docs/client-api-vertrag.md` (Abschnitt „Offen“) und `docs/login-setup.md`.
