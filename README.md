# Shortcut Atlas

Guida interattiva ai tasti rapidi per **Windows** e **Mac**, in italiano, inglese, spagnolo, francese e tedesco.

Ogni comando è raggruppato per sistema operativo, applicazione, categoria e sottocategoria, con esempio e risultato atteso.

## App coperte

Excel, Word, PowerPoint, Outlook, Windows/macOS, Chrome, Esplora file/Finder, VS Code.

## Avvio

```bash
npm install
npm run dev
```

Build di produzione:

```bash
npm run build
npm run preview
```

## Build mobile e monetizzazione

Il progetto include Capacitor per pubblicare la stessa app su Android e iOS e
Unity LevelPlay per la monetizzazione con Unity Ads.

1. Copia `.env.example` in `.env` e inserisci le chiavi reali:
   - `VITE_LEVELPLAY_APP_KEY`
   - `VITE_LEVELPLAY_BANNER_AD_UNIT_ID`
   - `VITE_LEVELPLAY_INTERSTITIAL_AD_UNIT_ID`
   - `VITE_LEVELPLAY_REWARDED_AD_UNIT_ID` se aggiungi annunci premiati.
2. Durante i test lascia `VITE_ADS_TEST_MODE=true`; prima della pubblicazione
   imposta `VITE_ADS_TEST_MODE=false`.
3. In Unity LevelPlay abilita la rete `unityads` e usa gli stessi ad unit ID
   configurati nell'app.
4. Esegui `npm run mobile:sync` dopo ogni modifica web o cambio degli ID ads.
5. Apri Android Studio con `npm run mobile:android` e Xcode con
   `npm run mobile:ios`.

Per Capacitor 8 serve Node.js 22 o superiore. Per Android serve anche Java 17+
e l'Android SDK configurato in `ANDROID_HOME` o in Android Studio. La build iOS
finale richiede macOS con Xcode e un account Apple Developer.

> Nota: sull'app gemella "Guida CMD" il linking reale dell'SDK nativo Unity
> Ads via SPM su iOS ha causato un crash all'avvio su device fisico e non è
> stato ancora risolto; il plugin resta quindi no-op su iOS (nessun crash, ma
> nessun annuncio reale) finché non viene investigato con Xcode/device log.
> Su Android la mediazione è collegata normalmente. Questo progetto eredita
> la stessa configurazione prudente.

## Codemagic

La pipeline `codemagic.yaml` contiene due workflow:

- `ios-app-store`: genera l'IPA, lo carica su App Store Connect e lo invia a
  TestFlight. La sottomissione App Store resta disattivata finché la scheda
  App Store Connect non è completa.
- `android-release`: genera un bundle Android release per Play Console.

Nel progetto Codemagic configura l'integrazione Apple Developer Portal con nome
`Ikonet Solutions` (o cambia il nome in `codemagic.yaml`). iOS e Android hanno
Game ID e ad unit LevelPlay distinti, quindi servono due gruppi di variabili
separati:

Gruppo `levelplay-ios` (usato dal workflow `ios-app-store`):
- `VITE_LEVELPLAY_APP_KEY` (Game ID iOS)
- `VITE_LEVELPLAY_BANNER_AD_UNIT_ID` (`Banner_iOS`)
- `VITE_LEVELPLAY_INTERSTITIAL_AD_UNIT_ID` (`Interstitial_iOS`)
- `VITE_LEVELPLAY_REWARDED_AD_UNIT_ID` (`Rewarded_iOS`)
- `VITE_PRIVACY_POLICY_URL`
- `VITE_LEGAL_NOTICE_URL`
- `APP_STORE_APPLE_ID` (facoltativa)

Gruppo `levelplay-android` (usato dal workflow `android-release`):
- `VITE_LEVELPLAY_APP_KEY` (Game ID Android)
- `VITE_LEVELPLAY_BANNER_AD_UNIT_ID` (`Banner_Android`)
- `VITE_LEVELPLAY_INTERSTITIAL_AD_UNIT_ID` (`Interstitial_Android`)
- `VITE_LEVELPLAY_REWARDED_AD_UNIT_ID` (`Rewarded_Android`)
- `VITE_PRIVACY_POLICY_URL`
- `VITE_LEGAL_NOTICE_URL`

## Contenuto

- Scorciatoie per Excel, Word, PowerPoint, Outlook
- Windows/macOS, Chrome, Esplora file/Finder, VS Code
- Confronto Windows ↔ Mac, quiz di allenamento, formule Excel, trucchi rapidi
