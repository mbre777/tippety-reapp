# Echter Login (Supabase OAuth) – Einrichtung & iPhone-Test

Projekt: `whfhjpneehvjvlyhuzpb` · Callback von Supabase: **`https://whfhjpneehvjvlyhuzpb.supabase.co/auth/v1/callback`**

## Ablauf in der App

`Mit Apple/Google anmelden` → `supabase.auth.signInWithOAuth({ provider, redirectTo, skipBrowserRedirect })` (PKCE)
→ `WebBrowser.openAuthSessionAsync(url, redirectTo)` (iOS: ASWebAuthenticationSession)
→ Provider-Login → Supabase `/auth/v1/callback` → Redirect zur App mit `?code=…`
→ `exchangeCodeForSession(code)` → Profil laden → Nickname/Ligen-Onboarding.

`redirectTo` = `Linking.createURL('auth-callback')`:

| Umgebung | redirectTo |
|---|---|
| Expo Go, LAN | `exp://192.168.x.y:8081/--/auth-callback` |
| Expo Go, `--tunnel` | `exp://<id>-anonymous-8081.exp.direct/--/auth-callback` |
| Dev-Build / Store | `tippety://auth-callback` (Scheme aus `app.json`) |
| Web (`expo start --web`) | `http://localhost:8081/auth-callback` |

## 1. Supabase Dashboard

**Authentication → URL Configuration**
- *Site URL*: `tippety://auth-callback`
- *Redirect URLs* (jede Zeile einzeln hinzufügen):
  - `exp://**`  ← Expo Go (LAN + Tunnel, IP/Host wechseln)
  - `tippety://**`  ← Dev-Build / App Store
  - `http://localhost:8081/**`  ← Web-Entwicklung

**Authentication → Sign In / Providers → Google**: aktivieren, *Client ID* + *Client Secret* aus Schritt 2 eintragen.

**Authentication → Sign In / Providers → Apple**: aktivieren,
- *Client IDs*: Services-ID aus Schritt 3 (z. B. `app.tippety.web`), später zusätzlich `app.tippety` für natives Sign in with Apple,
- *Secret Key (for OAuth)*: aus Team-ID, Key-ID und `.p8` generierter JWT (Dashboard bietet dafür einen Generator; **läuft nach max. 6 Monaten ab → erneuern**).

> Smoke-Test 17.10.2026: `/auth/v1/authorize?provider=google|apple` → `400 provider is not enabled` – beide Provider sind noch **nicht aktiv**.

## 2. Google Cloud Console

1. Projekt anlegen → *APIs & Dienste → OAuth-Zustimmungsbildschirm*: Typ „Extern“, App-Name „Tippety“, Support-Mail, Scopes `openid`, `email`, `profile`; im Testmodus eigene Google-Adresse als Testnutzer eintragen.
2. *Anmeldedaten → OAuth-Client-ID erstellen → Typ „Webanwendung“*
   - *Autorisierte Weiterleitungs-URIs*: `https://whfhjpneehvjvlyhuzpb.supabase.co/auth/v1/callback`
3. Client-ID + Secret → Supabase (Schritt 1).
4. (Später, nativer Login im Dev-Build: zusätzliche iOS-/Android-Client-IDs.)

## 3. Apple Developer (Programm 99 $/Jahr nötig)

1. *Certificates, IDs & Profiles → Identifiers → App IDs*: `app.tippety`, Capability **Sign in with Apple**.
2. *Identifiers → Services IDs*: z. B. `app.tippety.web`, **Sign in with Apple** aktivieren → *Configure*:
   - Primary App ID: `app.tippety`
   - Domains: `whfhjpneehvjvlyhuzpb.supabase.co`
   - Return URLs: `https://whfhjpneehvjvlyhuzpb.supabase.co/auth/v1/callback`
3. *Keys → +*: Sign in with Apple, Primary App ID `app.tippety` → `.p8` herunterladen (nur einmal!), Key-ID notieren; Team-ID (oben rechts).
4. Services-ID, Team-ID, Key-ID, `.p8` → Supabase-Generator (Schritt 1).

Hinweis: Apple liefert den Namen nur beim ersten Login; wir brauchen ihn nicht (Nickname wird separat gewählt).
Natives Apple-Sheet (`expo-apple-authentication` + `signInWithIdToken`) erst mit Dev-Build – in Expo Go läuft der Browser-Flow.

## 4. App konfigurieren

`mobile/.env` (gitignored, Vorlage `mobile/.env.example`):
```
EXPO_PUBLIC_BACKEND=supabase        # oder mock
EXPO_PUBLIC_SUPABASE_URL=https://whfhjpneehvjvlyhuzpb.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```
Nach Änderungen an `.env` den Dev-Server mit `--clear` neu starten (Werte werden beim Bundeln eingebettet).

## 5. Test auf dem iPhone mit Expo Go

1. iPhone: **Expo Go** aus dem App Store (SDK 57).
2. Box/Rechner: 
   ```
   cd /workspace/tippety/app-repo && git checkout feat/supabase-live
   cd mobile && npm install
   npx expo start --tunnel --clear
   ```
   (`--tunnel` installiert beim ersten Mal `@expo/ngrok` – mit `y` bestätigen. Im selben WLAN geht auch `npx expo start --lan`.)
3. Im Terminal erscheint ein **QR-Code** → mit der iPhone-**Kamera** scannen → „In Expo Go öffnen“.
4. Login-Screen → **Mit Google anmelden** → Systemdialog „…supabase.co möchte sich anmelden“ → *Fortfahren* → Google-Konto wählen.
5. Erwartet: Rücksprung in Expo Go → Schritt „Nickname“ → Ligen → Home.
6. Fehlerbilder:
   - Browser zeigt `provider is not enabled` → Provider in Supabase aktivieren (Schritt 1).
   - Browser landet auf der *Site URL* / bleibt hängen → `exp://**` fehlt in den Redirect URLs.
   - `redirect_uri_mismatch` (Google) → Callback-URL in Google Cloud prüfen.
   - Leere Ligen-Liste nach Login → Tabelle `leagues` ist leer (Import/Seed nötig).
7. Fallback ohne Backend: `EXPO_PUBLIC_BACKEND=mock` in `.env`, `npx expo start --tunnel --clear`.

## Fehlerbild „Adresse ungültig“ in Expo Go (Safari nach Google-Zustimmung)
Die App sendet `redirect_to=exp://<host>/--/auth-callback` (Log: `[auth] OAuth redirectTo = …`).
`/auth/v1/authorize` nimmt jeden Wert an und leitet mit 302 zu Google weiter (per curl geprüft).
Ob die URL erlaubt ist, prüft Supabase erst im Callback. Steht sie nicht in der Allowlist, leitet Supabase
still auf die **Site URL** (`tippety://auth-callback`) um, und Expo Go kann dieses Schema nicht öffnen.

Supabase → Authentication → URL Configuration → Redirect URLs:
- `exp://**`  (Expo Go; Host/IP ändert sich je nach LAN/Tunnel, z. B. `exp://192.168.x.x:8081/--/auth-callback` oder `exp://xyz-anonymous-8081.exp.direct/--/auth-callback`)
- `tippety://auth-callback`  (Dev/Store-Build)
- `http://localhost:8081/auth-callback`  (Web lokal)

### Update: echte Ursache (per curl belegt)
Supabase Auth verwirft **jede** `redirect_to`-URL mit IP-Adresse als Host (außer 127.0.0.1/::1), egal was in der
Allowlist steht (Sicherheitsfix supabase/auth#1984, Issue #2039). Test über `/auth/v1/callback` mit echtem state:
- `exp://192.168.178.21:8081/--/auth-callback` → Fallback `tippety://auth-callback` (auch bei exaktem Eintrag)
- `exp://x.exp.direct/--/auth-callback`, `exp://localhost:8081/--/a`, `exp://host:8081/--/…` → werden übernommen

**Expo Go deshalb immer mit Tunnel starten:** `npm run start:tunnel` (`expo start --tunnel`). Dann ist redirectTo
`exp://<id>-anonymous-8081.exp.direct/--/auth-callback`, und `exp://**` greift.
