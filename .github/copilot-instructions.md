# Copilot Instructions - BroadcastKit

## Project Overview
**Electron + React + TypeScript** desktop app for OBS streamers. Provides real-time overlays (Lower Third, Now Playing, Social Widget, Stream Scenes, Reaction) via a local Express/Socket.io server on `localhost:3000` that OBS Browser Sources connect to.

## Architecture

### Three-Process Model
```
Main Process (src/main/)     Renderer Process (src/renderer/)     OBS Browser Sources
┌─────────────────────┐      ┌──────────────────────────┐        ┌─────────────────────┐
│ index.ts (IPC hub)  │◄────►│ React UI (Dashboard/    │        │ Standalone HTML     │
│ store.ts (persist)  │      │ Settings pages)          │        │ overlays in         │
│ server.ts (Express) │◄─────┼──────────────────────────┼────────┤ src/renderer/       │
│ obsHandler.ts (WS)  │      │ Components trigger       │        │ overlays/*.html     │
│ services/ (RAWG)    │      │ events via IPC           │        │ via Socket.io       │
└─────────────────────┘      └──────────────────────────┘        └─────────────────────┘
```

### Communication Flow
1. **Renderer → Main**: `ipcRenderer.invoke('trigger-overlay', data)` - all IPC handlers in `src/main/index.ts`
2. **Main → Overlays**: `expressServer.broadcast('overlay-event', data)` via Socket.io
3. **Overlay HTML**: Listens to `socket.on('overlay-event', ...)` and animates with CSS

### Key Files
| File | Purpose |
|------|---------|
| `src/main/store.ts` | All config interfaces + defaults. Add new settings here first. |
| `src/main/index.ts` | IPC handlers. Add `ipcMain.handle('save-[name]-settings', ...)` for new overlays. |
| `src/main/server.ts` | Express routes. `getOverlaysPath()` handles dev vs production paths. |
| `src/renderer/overlays/*.html` | Standalone HTML/CSS/JS files, **NO React**. Include Socket.io client inline. |
| `src/renderer/src/pages/Dashboard.tsx` | Tab navigation + sidebar Browser Source URLs. |

## Development Commands
```bash
npm run dev           # Concurrent main+renderer (primary dev command)
npm run build         # Build both processes
npm run dist:installer # Create Windows NSIS installer → /installer folder
```

## Adding a New Overlay (Checklist)
1. **Config**: Add interface + defaults to `src/main/store.ts` → `OverlayConfig`
2. **IPC**: Add `ipcMain.handle('save-[name]-settings', ...)` in `src/main/index.ts`
3. **Route**: Add `app.get('/overlay/[name]', ...)` in `src/main/server.ts`
4. **Component**: Create `src/renderer/src/components/[Name]Control.tsx` with `fullWidth?: boolean` prop
5. **Overlay HTML**: Create `src/renderer/overlays/[name].html` with Socket.io listener
6. **Dashboard.tsx** (do ALL):
   - Add to `tabs` array with id, label, icon, color, description
   - Add case to `renderContent()` switch statement
   - Add overlay card to `OverviewTab` component
   - Add Browser Source URL to sidebar

### Overlay HTML Template
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
// Renderer → Main
ipcRenderer.invoke('trigger-overlay', {
  module: 'LOWER_THIRD',  // or 'NOW_PLAYING', 'SOCIAL_WIDGET', 'STREAM_SCENE', 'REACTION'
  payload: { action: 'SHOW', name: '...', title: '...' }
});
```

## Available Overlays
| Overlay | Module Name | Browser Sources | Description |
|---------|-------------|-----------------|-------------|
| Lower Third | `LOWER_THIRD` | `/overlay/lower-third` | Name/title callout |
| Now Playing | `NOW_PLAYING` | `/overlay/now-playing` | Game/music display |
| Social Widget | `SOCIAL_WIDGET` | `/overlay/social-widget` | Social media handles |
| Stream Scenes | `STREAM_SCENE` | `/overlay/scene-*` | BRB, Starting, Ending, Technical |
| Reaction | `REACTION` | `/overlay/reaction` | Video reaction overlays (Badge, Banner, PiP layouts in one file) |

## Coding Conventions
- **React UI**: Tailwind CSS + Framer Motion. See `tailwind.config.js` for custom colors (`accent-blue`, `accent-purple`, etc.)
- **Overlay HTML**: Inline CSS + @keyframes animations. 1920x1080 canvas. Design themes: `clean`, `broadcast`, `esports`
- **Persistence**: `electron-store` auto-saves all settings. No manual save logic needed.
- **Menu Bar**: Disabled via `Menu.setApplicationMenu(null)` - intentional, do not re-add
- **Window Process Detection**: Uses Base64-encoded PowerShell to avoid parsing issues:
  ```typescript
  const encodedCommand = Buffer.from(psScript, 'utf16le').toString('base64');
  exec(`powershell -NoProfile -EncodedCommand ${encodedCommand}`);
  ```

## Build/Packaging
- Installer outputs to `/installer` folder (not `/release`)
- Overlays copied via `extraResources` in `package.json` build config
- NSIS installer customized in `build/installer.nsh`
- When adding features, update: `build/installer.nsh`, `package.json` extraResources

## Release Process
```powershell
.\scripts\release.ps1 -Type patch   # 1.0.0 → 1.0.1
.\scripts\release.ps1 -Type minor   # 1.0.0 → 1.1.0
.\scripts\release.ps1 -Type major   # 1.0.0 → 2.0.0
.\scripts\release.ps1 -Type beta    # 1.0.0 → 1.0.1-beta.1
.\scripts\release.ps1 -DryRun       # Preview changes without executing
```
Script auto-updates version, builds, creates installer, commits, tags, and creates GitHub Release with the .exe asset.

## External Integrations
- **RAWG API** (`src/main/services/rawgApi.ts`): Game metadata + covers. Requires API key in Settings.
- **OBS WebSocket** (`src/main/obsHandler.ts`): Default `ws://127.0.0.1:4455`. Auto-connects on startup.