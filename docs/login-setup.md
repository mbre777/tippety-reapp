# Echter Login & Supabase – was noch fehlt

Die App läuft aktuell mit dem **Mock-Backend** (Login-Buttons melden sofort an, Daten im Speicher).
Umschalten auf Supabase: `mobile/.env` aus `mobile/.env.example` anlegen:

```
EXPO_PUBLIC_BACKEND=supabase
EXPO_PUBLIC_SUPABASE_URL=https://<projekt>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon/publishable key>
```

## Checkliste

1. **Supabase-Projekt** (laut `supabase/README.md` angelegt: `whfhjpneehvjvlyhuzpb`) – Migrationen aus PR #2 deployen (`supabase db push`), Ligen/Teams/Spiele per Import befüllen.
2. **Auth → URL Configuration**: Redirects erlauben: `tippety://auth-callback`, für Expo Go `exp://**/--/auth-callback`, für Web `http://localhost:8081/**`.
3. **Apple** (Apple Developer Program, 99 $/Jahr):
   - App-ID `app.tippety` mit Capability „Sign in with Apple“,
   - Services-ID + Key (.p8) für den OAuth-Webflow → in Supabase Auth → Providers → Apple eintragen,
   - App Store verlangt Sign in with Apple, wenn Google angeboten wird.
4. **Google** (Google Cloud Console): OAuth-Client „Web“ (Client-ID/Secret → Supabase), zusätzlich iOS-/Android-Client-IDs für nativen Login.
5. **Expo Go vs. Dev-Build**:
   - Der eingebaute **OAuth-Browser-Flow** (`expo-web-browser`, im Gerüst umgesetzt) funktioniert grundsätzlich in Expo Go.
   - **Natives** Apple-Sheet (`expo-apple-authentication`) und native Google-Anmeldung (`@react-native-google-signin/google-signin`) + `signInWithIdToken` brauchen die eigene Bundle-ID → **Dev-Build** (`npx eas-cli@latest build --profile development`). Empfohlen für den Release.
6. **Edge Functions + Secrets**: `SPORTMONKS_API_KEY`, ggf. `API_HOCKEY_KEY` als Supabase-Secrets; pg_cron-Jobs anlegen.
7. Danach: offene Punkte aus `docs/client-api-vertrag.md` klären.
