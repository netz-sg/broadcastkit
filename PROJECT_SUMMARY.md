# 🎯 OBS Overlay Tool - Projekt Übersicht

## ✅ Fertiggestellt

### Backend (Electron Main Process)
- ✅ **store.ts** - Persistente Konfiguration mit electron-store
- ✅ **obsHandler.ts** - Auto-Connect zu OBS WebSocket mit Reconnect-Logik
- ✅ **server.ts** - Express Server (Port 3000) mit Socket.io
- ✅ **index.ts** - Electron App Entry Point mit IPC Handlers

### Frontend (React + Tailwind)
- ✅ **App.tsx** - Hauptkomponente mit Navigation & OBS Status
- ✅ **Dashboard** - Übersicht mit Lower Third Control
- ✅ **Settings** - OBS Konfiguration mit Save & Connect
- ✅ **LowerThirdControl** - Steuerung für Bauchbinde mit Preview

### Overlays
- ✅ **lower-third.html** - Animierte Bauchbinde mit:
  - Slide-In Animation (Cubic Bezier)
  - Partikel-Effekte
  - Glow Pulsierung
  - Auto-Hide nach 8 Sekunden
  - Gradient-Design (Blue → Purple)

## 🎨 Design Features

### Farbschema (Dunkles Theme)
```
Background:  #0a0a0f (dark-bg)
Cards:       #141419 (dark-card)
Borders:     #1f1f28 (dark-border)
Accent Blue: #3b82f6
Accent Purple: #8b5cf6
Accent Green: #10b981
Accent Red:  #ef4444
```

### Animationen
- Framer Motion für Page Transitions
- Custom Tailwind Animations (slide-in, fade-in, pulse-glow)
- CSS Transitions für Hover-Effekte
- Cubic Bezier für smooth Animations

## 🔧 Technische Details

### Architektur
```
┌─────────────────────────────────────────┐
│         Electron App (Desktop)          │
├─────────────────────────────────────────┤
│  Main Process (Node.js)                 │
│  ├── OBS WebSocket Connection           │
│  ├── Config Store (JSON)                │
│  └── Express Server + Socket.io         │
├─────────────────────────────────────────┤
│  Renderer Process (React)               │
│  ├── Dashboard (Control Center)         │
│  └── Settings (Configuration)           │
└─────────────────────────────────────────┘
           ↓ Socket.io Events
┌─────────────────────────────────────────┐
│    OBS Browser Source (Overlay)         │
│    localhost:3000/overlay/lower-third   │
└─────────────────────────────────────────┘
```

### Event Flow
```
User Input (React)
    ↓ IPC (ipcRenderer.invoke)
Main Process
    ↓ Socket.io Broadcast
Overlay (Browser Source)
    ↓ Animation
OBS Stream Output
```

## 🚀 Starten

### Development
```bash
npm run dev
```
Startet:
- Vite Dev Server (Port 5173) → React Hot Reload
- Electron Main Process → Auto-Reload bei Änderungen
- Express Server (Port 3000) → Overlay Serving

### Production
```bash
npm run build
npm start
```

## 📁 Wichtige Dateien

| Datei | Zweck |
|-------|-------|
| `src/main/index.ts` | Electron Entry Point |
| `src/main/store.ts` | Config Management |
| `src/main/obsHandler.ts` | OBS Connection |
| `src/main/server.ts` | Express + Socket.io |
| `src/renderer/src/App.tsx` | React Hauptkomponente |
| `src/renderer/overlays/lower-third.html` | Browser Source |
| `tailwind.config.js` | Design System |
| `package.json` | Dependencies & Scripts |

## 🎯 Nächste Features (Roadmap)

### Phase 2: Erweiterte Overlays
- [ ] Chat Display (Twitch/YouTube Integration)
- [ ] Alert System (Follower, Subscriber, Donations)
- [ ] Kill Counter / Score Tracker
- [ ] Timer & Countdown

### Phase 3: Advanced Features
- [ ] Custom Themes (User wählt Farben)
- [ ] Hotkey Support (Global Shortcuts)
- [ ] Scenes Management (Multiple Overlays)
- [ ] Animation Presets

### Phase 4: Distribution
- [ ] Electron Builder Setup
- [ ] Auto-Updater
- [ ] Windows Installer
- [ ] macOS/Linux Support

## 🔐 Gespeicherte Daten

Die App speichert folgende Daten lokal (electron-store):

```json
{
  "obs": {
    "address": "ws://127.0.0.1:4455",
    "password": "***",
    "autoConnect": true
  },
  "overlays": {
    "lowerThird": {
      "lastUsedName": "Max Mustermann",
      "lastUsedTitle": "Game Developer",
      "theme": "neon-blue"
    }
  }
}
```

**Speicherort:**
- Windows: `%APPDATA%/obs-overlay-tool/config.json`
- macOS: `~/Library/Application Support/obs-overlay-tool/config.json`
- Linux: `~/.config/obs-overlay-tool/config.json`

## 🐛 Bekannte Einschränkungen

1. **Port 3000 muss frei sein** - Express Server benötigt Port 3000
2. **OBS muss lokal laufen** - Remote OBS noch nicht getestet
3. **Nur ein Overlay aktiv** - Multi-Overlay Support kommt in Phase 3

## 💡 Entwickler-Tipps

### Debugging
```bash
# Main Process Logs
Die Console im Terminal zeigt Main Process Logs

# Renderer Process Logs
DevTools in Electron (öffnen mit dev:main)

# Overlay Logs
F12 in OBS Browser Source → Console
```

### Hot Reload
- React Components → Auto-Reload
- Main Process → Manueller Neustart nötig
- Overlays → F5 in Browser Source

### Performance
- Socket.io Events sind sehr schnell (<10ms)
- Overlays nutzen CSS Transforms (GPU-beschleunigt)
- Electron-store ist synchron → keine async/await nötig

## 📚 Dokumentation

- [Electron Docs](https://www.electronjs.org/docs)
- [OBS WebSocket](https://github.com/obsproject/obs-websocket)
- [Socket.io](https://socket.io/docs/v4/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Framer Motion](https://www.framer.com/motion/)

---

**Viel Erfolg beim Streamen! 🎮🎬**
