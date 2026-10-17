# EAS Update / CI (Stufe 1)

Jeder Push auf `main`, der `mobile/**` ändert, veröffentlicht per `.github/workflows/eas-update.yml`
ein EAS Update auf Branch/Channel **preview**.

## Voraussetzungen (einmalig)
1. Gültiger Expo Access Token (expo.dev → Account settings → Access tokens), als GitHub-Secret `EXPO_TOKEN`.
2. `cd mobile && npx eas-cli init` (schreibt `extra.eas.projectId` + `owner` in app.json) und
   `npx expo install expo-updates` + `updates.url = https://u.expo.dev/5818aa52-1b43-4e14-a175-00ddce2732fa` (macht `eas update:configure`).
   **Kein `runtimeVersion` setzen**, solange wir Expo Go nutzen: Updates mit runtimeVersion lädt Expo Go nicht.
3. GitHub-Secret `EXPO_PUBLIC_SUPABASE_ANON_KEY`, Repo-Variables `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_BACKEND=supabase`
   (Settings → Secrets and variables → Actions).

## Öffnen auf dem iPhone (Expo Go)
1. Expo Go installieren, unten „Profile“ → mit demselben Expo-Konto anmelden.
2. Auf expo.dev → Projekt tippety → Updates → neuestes Update auf Branch `preview` → **Preview** → QR mit der iPhone-Kamera scannen
   (öffnet Expo Go). Alternativ fester Link:
   `https://qr.expo.dev/eas-update?projectId=5818aa52-1b43-4e14-a175-00ddce2732fa&runtimeVersion=exposdk:57.0.0&channel=preview` (QR-Bild)
   bzw. `exp://u.expo.dev/5818aa52-1b43-4e14-a175-00ddce2732fa?channel-name=preview&runtime-version=exposdk:57.0.0` direkt in Safari.
3. Danach steht das Projekt in Expo Go unter „Recently opened“; neue Updates lädt es beim nächsten Kaltstart.
Hinweis Login: Google-OAuth braucht `exp://u.expo.dev/**` bzw. `exp://**` in Supabase Redirect URLs (kein IP-Host → funktioniert).

## Tester
- Expo Go: Tester bekommen den Link/QR oben; ein eigenes Expo-Konto ist nicht nötig, solange das Projekt nicht privat geschaltet ist
  (sonst als Mitglied in die Expo-Organisation einladen).

## Stufe 2 (nur vorbereitet, nicht ausgeführt)
- `eas.json` enthält Build-Profile development (dev client, intern), preview (intern), production (Store) mit Channels.
- Benötigt Apple Developer Program (99 $/Jahr) und Google Play Console (25 $ einmalig).
- Dann: `expo-dev-client`, `runtimeVersion: {"policy":"fingerprint"}`, `eas build -p ios --profile preview`,
  `eas submit -p ios` (TestFlight) / `eas submit -p android --track internal` (Play Internal), CI-Job bei Tags.
