# Tippety

Tippety ist eine Tippspiel-App für **Fußball und Eishockey**, just for fun und ohne Echtgeld. Man tippt Ergebnisse, sammelt Punkte und misst sich mit Freunden oder der ganzen Community.

## Idee

- **Zwei Sportarten in einer App:** Fußball und Eishockey, umschaltbar per freistehendem Button rechts unten. Die App passt ihren Look an die Sportart an (Rasen bzw. Eis).
- **Ligen zum Start:**
  - Fußball: Premier League, La Liga, Bundesliga, Serie A, Ligue 1, österreichische Bundesliga
  - Eishockey: Schweizer National League (Fokus)
- **Tippen:** Ergebnis-Tipp pro Spiel bis zum Anstoß, Spiele als vertikale Zeitleiste nach Anstoßzeit.
- **Ranglisten:** eine globale Rangliste und private Tippgruppen unter Freunden (Beitritt per Code oder Link).
- **Profil:** Statistiken, Trefferquote, Abzeichen, Erinnerungen vor Tippschluss.

## Design

Dunkles, edles Design im iOS-Liquid-Glass-Stil, clean und minimal, aber sportlich. Im Footer sitzt eine kompakte Glas-Toolbar (Spiele, Tipps, Gruppen, Rangliste), rechts daneben der Sport-Umschalter.

## Tech

- React Native (iOS und Android)
- Backend und Datenquelle für Spielpläne und Ergebnisse: noch offen

## Status

Konzeptphase. Punktesystem, Datenquellen und Roadmap werden als Nächstes festgelegt.

## App (Expo / React Native) – `mobile/`

Aktueller Stand: **Light Mode UI mit Beispieldaten**, noch kein Backend.

### Setup
```bash
cd mobile
nvm use            # Node 22 LTS (>= 22.13)
npm install
npx expo start     # i = iOS-Simulator, a = Android, w = Web
```

Checks:
```bash
npm run typecheck  # tsc --noEmit
npm run lint       # expo lint
npm run export:web # statischer Web-Build nach mobile/dist (für Screenshots)
```

### Struktur
- `src/app/` – Routen (Expo Router): `index` (Home), `spiele`, `rangliste`, `gruppen`, `spiel/[id]` (Spieldetail/Tippen)
- `src/components/` – Header mit Spielfeld/Eisfläche (react-native-svg), Toolbar-Pill + Sport-Button, Match-Card, Wappen-Platzhalter
- `src/theme/` – Design-Tokens & ThemeProvider (dark-fähig strukturiert, Dark Mode folgt)
- `src/sport/` – globaler Sport-Context (Fußball ⇄ Eishockey)
- `src/data/` – typisierter Datenlayer: `TippetyRepository`-Interface + `mockRepository`. Für das Backend nur `repo` in `src/data/index.ts` austauschen.

Screenshots: `docs/screenshots/`.
