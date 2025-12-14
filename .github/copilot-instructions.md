# Copilot Instructions - BroadcastKit

## Project Overview
**BroadcastKit** is an **Electron + React + TypeScript** desktop app for OBS streamers. It provides real-time overlays (Lower Third, Now Playing, Social Widget) via a local Express/Socket.io server that OBS Browser Sources connect to.

## Architecture

### Process Model (Critical)
```
Main Process (src/main/)     Renderer Process (src/renderer/)     OBS Browser Sources
┌─────────────────────┐      ┌──────────────────────────┐        ┌─────────────────────┐
│ index.ts (IPC hub)  │◄────►│ React UI (Dashboard/    │        │ HTML overlays       │
│ store.ts (persist)  │      │ Settings pages)          │        │ (lower-third.html)  │
│ server.ts (Express) │◄─────┼──────────────────────────┼────────┤ Connect via         │
│ obsHandler.ts (WS)  │      │ Components trigger       │        │ Socket.io           │
│ services/ (RAWG)    │      │ events via IPC           │        │ localhost:3000      │
└─────────────────────┘      └──────────────────────────┘        └─────────────────────┘
```

### Communication Flow
1. **Renderer → Main**: `ipcRenderer.invoke('trigger-overlay', data)` - see `src/main/index.ts` for all IPC handlers
2. **Main → Overlays**: `expressServer.broadcast('overlay-event', data)` via Socket.io
3. **Overlay HTML**: Listens to `socket.on('overlay-event', ...)` and animates CSS

### Key Files
- `src/main/store.ts` - All config interfaces (`ObsConfig`, `LowerThirdConfig`, `NowPlayingConfig`, `SocialWidgetConfig`). Modify here when adding new settings.
- `src/main/server.ts` - `getOverlaysPath()` handles dev vs production overlay paths (extraResources)
- `src/renderer/overlays/*.html` - Standalone HTML/CSS/JS files, NO React. Must include Socket.io client inline.
- `src/main/services/gameDetector.ts` - Uses PowerShell `-EncodedCommand` for Windows process detection

## Development Commands
```bash
npm run dev           # Concurrent main+renderer (use this for development)
npm run build         # Build both processes
npm run dist:installer # Create Windows NSIS installer (outputs to /installer folder)
```

## Coding Patterns

### Adding a New Overlay
1. **Config Interface**: Add to `src/main/store.ts` → `OverlayConfig` interface with defaults
2. **IPC Handler**: Add `ipcMain.handle('save-[name]-settings', ...)` in `src/main/index.ts`
3. **Server Route**: Add `app.get('/overlay/[name]', ...)` in `src/main/server.ts`
4. **Control Component**: Create `src/renderer/src/components/[Name]Control.tsx`
5. **Overlay HTML**: Create `src/renderer/overlays/[name].html` with Socket.io listener
6. **Dashboard**: Import and add component to `src/renderer/src/pages/Dashboard.tsx` grid

### Overlay HTML Structure (Template)
```html
<script src="/socket.io/socket.io.js"></script>
<script>
  const socket = io();
  socket.on('overlay-event', (data) => {
    if (data.module === 'YOUR_MODULE') {
      if (data.payload.action === 'SHOW') { /* animate in */ }
      if (data.payload.action === 'HIDE') { /* animate out */ }
    }
  });
</script>
```

### IPC Event Pattern
```typescript
// Renderer (trigger)
ipcRenderer.invoke('trigger-overlay', {
  module: 'LOWER_THIRD',
  payload: { action: 'SHOW', name: '...', title: '...' }
});

// Main (broadcast to overlays)
expressServer.broadcast('overlay-event', data);
```

### Windows Process Detection (Game Detector)
Uses Base64-encoded PowerShell to avoid parsing issues:
```typescript
const psScript = 'Get-Process | Where-Object { $_.MainWindowHandle -ne 0 }...';
const encodedCommand = Buffer.from(psScript, 'utf16le').toString('base64');
exec(`powershell -NoProfile -EncodedCommand ${encodedCommand}`);
```

## Important Conventions
- **Styling**: Tailwind CSS + Framer Motion for React UI; inline CSS + @keyframes for overlay HTML
- **Overlay Styles**: Each overlay supports multiple design themes (`clean`, `broadcast`, `esports`)
- **Menu Bar**: Disabled via `Menu.setApplicationMenu(null)` - do not re-add
- **Persistence**: All settings auto-persist via `electron-store` - no manual save needed
- **Responsive**: UI supports `minWidth: 480px` with Tailwind breakpoints (sm:, md:, lg:, xl:)

## External APIs
- **RAWG API** (`src/main/services/rawgApi.ts`): Game metadata + cover images. Requires API key in Settings.
- **OBS WebSocket** (`src/main/obsHandler.ts`): Default `ws://127.0.0.1:4455`

## Build/Packaging
- Installer outputs to `/installer` folder (not `/release`)
- Overlays copied via `extraResources` in `package.json` build config
- NSIS installer uses `build/installer.nsh` for custom wizard steps

## Installer
- Update everytime if i add new features or change files:
  - `build/installer.nsh`
  - `package.json` build config `extraResources`
  - add a new version number in the installer