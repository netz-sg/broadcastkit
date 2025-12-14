# BroadcastKit

Professionelle Stream Overlays für OBS - Ein modernes Electron-Tool mit Auto-Connect und persistenter Konfiguration.

## Features

- 🔌 **Auto-Connect** - Verbindet sich automatisch mit OBS beim Start
- 💾 **Persistente Settings** - Speichert OBS-Zugangsdaten und letzte Eingaben
- 🎨 **Modernes dunkles Design** - Tailwind CSS mit animierten Komponenten
- ⚡ **Real-Time** - Socket.io für sofortige Overlay-Updates
- 🎬 **Lower Third** - Animierte Bauchbinde mit Partikel-Effekten

## Installation

```bash
# Dependencies installieren
npm install

# Entwicklung starten
npm run dev

# Produktions-Build
npm run build
npm start
```

## OBS WebSocket einrichten

1. OBS Studio öffnen
2. Gehe zu **Tools → WebSocket Server Settings**
3. Aktiviere "Enable WebSocket server"
4. Setze ein Passwort (optional)
5. Notiere den Port (Standard: 4455)

## Verwendung

### 1. App starten
Die App verbindet sich automatisch mit OBS, wenn die Einstellungen gespeichert sind.

### 2. Lower Third verwenden
- Browser Source in OBS hinzufügen
- URL: `http://localhost:3000/overlay/lower-third`
- Größe: 1920x1080
- Im Dashboard Name/Titel eingeben und "Show" klicken

## Projekt-Struktur

```
/src
  /main              # Electron Main Process (Backend)
    index.ts         # App Entry Point
    store.ts         # Konfigurationsspeicher
    obsHandler.ts    # OBS WebSocket Verbindung
    server.ts        # Express + Socket.io Server
  /renderer          # React Frontend (Dock)
    /src
      /pages         # Dashboard & Settings
      /components    # UI Komponenten
    /overlays        # Browser Source Overlays
```

## Technologien

- **Electron** - Desktop App Framework
- **React + TypeScript** - UI Framework
- **Tailwind CSS** - Styling
- **Framer Motion** - Animationen
- **Socket.io** - Real-Time Kommunikation
- **obs-websocket-js** - OBS Integration
- **electron-store** - Persistente Konfiguration

## Lizenz

MIT
