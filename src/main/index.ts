import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import path from 'path';
import { obsConnector } from './obsHandler';
import { expressServer } from './server';
import { configStore } from './store';
import { getAllGameCandidates } from './services/gameDetector';
import { searchGame, validateApiKey } from './services/rawgApi';
// Import updater early to register IPC handlers
import './updater';
import { initAutoUpdater } from './updater';

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  // Entferne Standard-Menüleiste
  Menu.setApplicationMenu(null);

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 480,
    minHeight: 600,
    backgroundColor: '#0a0a0f',
    show: false, // Don't show until ready
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js'),
    },
    frame: true,
    titleBarStyle: 'default',
    autoHideMenuBar: true,
    icon: process.env.NODE_ENV === 'development' 
      ? path.join(__dirname, '../../assets/icon.png')
      : path.join(process.resourcesPath, 'assets/icon.png'),
  });

  // Show window when ready to prevent white/gray flash
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Handle load failures
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('[Main] Failed to load:', errorCode, errorDescription);
    // Try to reload once
    setTimeout(() => {
      mainWindow?.loadFile(path.join(__dirname, '../renderer/index.html'));
    }, 1000);
  });

  // Load the React app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function initializeApp(): Promise<void> {
  // Start Express server
  await expressServer.start();

  // Setup OBS event forwarding
  obsConnector.on('status', (status) => {
    console.log('[Main] OBS Status:', status);
    mainWindow?.webContents.send('obs-status', status);
    expressServer.broadcast('obs-status', status);
  });

  // Auto-connect to OBS
  try {
    await obsConnector.autoConnect();
  } catch (error) {
    console.error('[Main] Auto-connect failed:', error);
  }
}

// IPC Handlers
ipcMain.handle('get-config', async () => {
  return configStore.getAll();
});

ipcMain.handle('get-app-version', async () => {
  return app.getVersion();
});

ipcMain.handle('update-obs-config', async (event, config) => {
  try {
    await obsConnector.disconnect();
    await obsConnector.connect(config);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-obs-status', () => {
  return {
    connected: obsConnector.getConnectionStatus(),
  };
});

ipcMain.handle('trigger-overlay', (event, data) => {
  expressServer.broadcast('overlay-event', data);
  
  // Save last used data
  if (data.module === 'LOWER_THIRD') {
    configStore.setLowerThirdData(
      data.payload.name || '',
      data.payload.title || ''
    );
  }
  
  return { success: true };
});

// Refresh all connected browser sources
ipcMain.handle('refresh-overlays', () => {
  expressServer.refreshAllOverlays();
  return { 
    success: true, 
    clients: expressServer.getConnectedClients() 
  };
});

// Get connected overlay count
ipcMain.handle('get-overlay-status', () => {
  return {
    connectedClients: expressServer.getConnectedClients(),
  };
});

ipcMain.handle('save-lower-third-settings', (event, settings) => {
  configStore.setLowerThirdConfig(settings);
  return { success: true };
});

ipcMain.handle('save-now-playing-settings', (event, settings) => {
  configStore.setNowPlayingConfig(settings);
  return { success: true };
});

ipcMain.handle('save-social-widget-settings', (event, settings) => {
  configStore.setSocialWidgetConfig(settings);
  return { success: true };
});

ipcMain.handle('save-stream-scenes-settings', (event, settings) => {
  configStore.setStreamScenesConfig(settings);
  return { success: true };
});

ipcMain.handle('save-stream-scene', (event, sceneId, scene) => {
  configStore.setStreamScene(sceneId, scene);
  return { success: true };
});

// Reaction Overlay handlers
ipcMain.handle('save-reaction-settings', (event, settings) => {
  configStore.setReactionConfig(settings);
  return { success: true };
});

ipcMain.handle('add-reaction-source', (event, source) => {
  configStore.addReactionSource(source);
  return { success: true };
});

ipcMain.handle('update-reaction-source', (event, updates) => {
  configStore.updateReactionSource(updates.id, updates);
  return { success: true };
});

ipcMain.handle('remove-reaction-source', (event, sourceId) => {
  configStore.removeReactionSource(sourceId);
  return { success: true };
});

ipcMain.handle('save-rawg-settings', (event, settings) => {
  configStore.setRawgConfig(settings);
  return { success: true };
});

ipcMain.handle('validate-rawg-key', async (event, apiKey: string) => {
  const valid = await validateApiKey(apiKey);
  return { valid };
});

ipcMain.handle('detect-game', async () => {
  // Get all process candidates
  const candidates = await getAllGameCandidates();
  
  if (candidates.length === 0) {
    console.log('[Main] No game candidates found');
    return null;
  }
  
  console.log(`[Main] Checking ${candidates.length} candidates against RAWG...`);
  
  // Check each candidate against RAWG API
  for (const candidate of candidates) {
    console.log(`[Main] Checking: ${candidate.processName} -> "${candidate.searchName}"`);
    
    try {
      const gameInfo = await searchGame(candidate.searchName);
      
      if (gameInfo && gameInfo.name) {
        console.log(`[Main] Found game via RAWG: ${gameInfo.name}`);
        return {
          processName: candidate.processName,
          gameName: gameInfo.name,
          windowTitle: gameInfo.name,
          rawgData: gameInfo,
        };
      }
    } catch (error) {
      console.log(`[Main] RAWG search failed for "${candidate.searchName}":`, error);
    }
  }
  
  console.log('[Main] No games found in RAWG');
  return null;
});

ipcMain.handle('search-rawg-game', async (event, gameName: string) => {
  const gameInfo = await searchGame(gameName);
  return gameInfo;
});

ipcMain.handle('disconnect-obs', async () => {
  await obsConnector.disconnect();
  return { success: true };
});

// App lifecycle
app.whenReady().then(async () => {
  await initializeApp();
  createWindow();

  // Initialize auto-updater after window is created
  if (mainWindow) {
    initAutoUpdater(mainWindow);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async () => {
  await obsConnector.disconnect();
});
