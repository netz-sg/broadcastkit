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
4. **Control Component**: Create `src/renderer/src/components/[Name]Control.tsx` with `fullWidth?: boolean` prop
5. **Overlay HTML**: Create `src/renderer/overlays/[name].html` with Socket.io listener
6. **Dashboard Updates** (CRITICAL - do ALL of these):
   - Add new tab to `tabs` array in `Dashboard.tsx`
   - Add case to `renderContent()` switch statement
   - Add overlay card to `OverviewTab` component
   - Add Browser Source URL to sidebar
   - Update Quick Stats numbers if needed

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

## Release Process

### Automated Release Script
```powershell
# Patch release (1.0.0 → 1.0.1)
.\scripts\release.ps1 -Type patch

# Minor release (1.0.0 → 1.1.0)
.\scripts\release.ps1 -Type minor

# Major release (1.0.0 → 2.0.0)
.\scripts\release.ps1 -Type major

# Beta release (1.0.0 → 1.0.1-beta.1)
.\scripts\release.ps1 -Type beta

# Specific version
.\scripts\release.ps1 -Version "1.2.0"

# Dry run (preview without changes)
.\scripts\release.ps1 -Type minor -DryRun
```

### What the Release Script Does
1. Updates `package.json` version
2. Updates `build/license.txt` version header
3. Runs `npm run build`
4. Creates installer via `npm run dist:installer`
5. Commits changes with message `chore: release vX.X.X`
6. Creates annotated git tag
7. Pushes to GitHub (main + tag)
8. Creates GitHub Release with:
   - Auto-generated release notes from commits
   - Installer .exe as download asset
   - Pre-release flag for beta versions

### Manual Release (Alternative)
If you need to create a release manually:
```powershell
# 1. Update version in package.json
# 2. Build and create installer
npm run dist:installer

# 3. Commit and tag
git add -A
git commit -m "chore: release v1.x.x"
git tag -a v1.x.x -m "BroadcastKit v1.x.x"

# 4. Push
git push origin main
git push origin v1.x.x

# 5. Create GitHub release
gh release create v1.x.x --title "BroadcastKit v1.x.x" --generate-notes "installer/BroadcastKit Setup 1.x.x.exe"
```

## Installer
- Update everytime if i add new features or change files:
  - `build/installer.nsh`
  - `package.json` build config `extraResources`
  - Run release script to update version automatically