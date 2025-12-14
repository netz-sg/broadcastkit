# 🚀 OBS Overlay Tool - Schnellstart

## Starten der Anwendung

### Option 1: Development Mode (Empfohlen für Entwicklung)
```bash
npm run dev
```
Startet sowohl den Electron Main Process als auch den Vite Dev Server.

### Option 2: Build & Start (Produktiv)
```bash
npm run build
npm start
```

## ⚙️ Erste Schritte

### 1. OBS WebSocket aktivieren
- Öffne OBS Studio
- **Tools → WebSocket Server Settings**
- ✅ Enable WebSocket server
- Setze ein Passwort
- Merke dir Port: `4455` (Standard)

### 2. App konfigurieren
- Starte das Tool
- Gehe zu **Settings**
- Trage ein:
  - Address: `ws://127.0.0.1:4455`
  - Passwort: [dein OBS WebSocket Passwort]
  - ✅ Auto-Connect aktivieren
- Klicke **Save & Connect**

### 3. Lower Third in OBS einbinden
- In OBS: Neue **Browser** Source erstellen
- URL: `http://localhost:3000/overlay/lower-third`
- Breite: `1920`
- Höhe: `1080`
- ✅ Shutdown source when not visible
- ✅ Refresh browser when scene becomes active

### 4. Overlay nutzen
- Gehe im Tool zum **Dashboard**
- Trage Name und Titel ein
- Klicke **Show** → Overlay erscheint in OBS
- Klicke **Hide** → Overlay verschwindet

## 🎨 Features

### Auto-Connect
- Tool verbindet sich automatisch bei jedem Start
- Kein erneutes Eingeben von IP/Passwort nötig

### Persistente Daten
- Letzte Eingaben werden gespeichert
- OBS-Zugangsdaten werden verschlüsselt abgelegt

### Animationen
- Smooth Slide-In Animation
- Partikel-Effekte
- Pulsierender Glow
- Auto-Hide nach 8 Sekunden

## 🛠️ Entwicklung

### Projekt-Struktur verstehen
```
src/
├── main/              # Electron Backend
│   ├── index.ts       # App Entry
│   ├── store.ts       # Config Storage
│   ├── obsHandler.ts  # OBS Connection
│   └── server.ts      # Express Server
└── renderer/          # React Frontend
    ├── src/           # App UI
    └── overlays/      # Browser Sources
```

### Neue Overlays hinzufügen
1. HTML-Datei in `src/renderer/overlays/` erstellen
2. Route in `src/main/server.ts` registrieren
3. Control-Component in `src/renderer/src/components/` erstellen
4. Im Dashboard einbinden

## 🐛 Troubleshooting

### App startet nicht
- Prüfe ob Port 3000 frei ist
- Lösche `node_modules` und führe `npm install` erneut aus

### Keine Verbindung zu OBS
- Prüfe ob OBS WebSocket aktiv ist
- Prüfe IP und Port (Standard: ws://127.0.0.1:4455)
- Prüfe ob Passwort korrekt ist

### Overlay nicht sichtbar in OBS
- Prüfe Browser Source URL: `http://localhost:3000/overlay/lower-third`
- F12 in Browser Source → Console auf Fehler prüfen
- Stelle sicher, dass Express Server läuft (Port 3000)

## 📦 Build für Distribution

```bash
# Dependencies für Electron Builder installieren
npm install --save-dev electron-builder

# App bauen
npm run build

# Executable erstellen
electron-builder
```

## 💡 Nächste Schritte

- [ ] Chat Display Overlay
- [ ] Alert System
- [ ] Kill Counter
- [ ] Custom Themes
- [ ] Hotkey Support
