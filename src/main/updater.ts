import { autoUpdater } from 'electron-updater';
import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import log from 'electron-log';

// Configure logging
autoUpdater.logger = log;
(autoUpdater.logger as any).transports.file.level = 'info';

// Disable auto download - we want user confirmation
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

let mainWindow: BrowserWindow | null = null;
let isCheckingForUpdates = false;

// Register IPC handlers immediately (before app is ready)
ipcMain.handle('check-for-updates', async () => {
  console.log('[Updater] Manual update check triggered');
  doCheckForUpdates();
  return { success: true };
});

ipcMain.handle('install-update', async () => {
  console.log('[Updater] Installing update...');
  autoUpdater.quitAndInstall(false, true);
});

export function initAutoUpdater(win: BrowserWindow): void {
  mainWindow = win;
  console.log('[Updater] Initializing auto-updater...');

  // Setup event handlers
  setupEventHandlers();

  // Check for updates on startup (always in packaged app)
  const isDev = !app.isPackaged;
  console.log('[Updater] Is Development:', isDev);
  
  if (!isDev) {
    console.log('[Updater] Will check for updates in 3 seconds...');
    setTimeout(() => {
      doCheckForUpdates();
    }, 3000);
  } else {
    console.log('[Updater] Skipping auto-update check in development mode');
  }
}

function setupEventHandlers(): void {
  // Checking for updates
  autoUpdater.on('checking-for-update', () => {
    console.log('[Updater] Checking for updates...');
    isCheckingForUpdates = true;
    mainWindow?.webContents.send('update-status', { status: 'checking' });
  });

  // Update available
  autoUpdater.on('update-available', (info) => {
    console.log('[Updater] Update available:', info.version);
    isCheckingForUpdates = false;
    
    // Send to renderer
    mainWindow?.webContents.send('update-status', { 
      status: 'available', 
      version: info.version 
    });
    
    // Show dialog
    dialog.showMessageBox(mainWindow!, {
      type: 'info',
      title: 'Update verfügbar',
      message: `Eine neue Version (v${info.version}) ist verfügbar!`,
      detail: `Aktuelle Version: v${app.getVersion()}\nNeue Version: v${info.version}\n\nMöchtest du das Update jetzt herunterladen?`,
      buttons: ['Jetzt herunterladen', 'Später'],
      defaultId: 0,
      cancelId: 1
    }).then(async (result) => {
      if (result.response === 0) {
        console.log('[Updater] User confirmed download, starting...');
        mainWindow?.webContents.send('update-status', { 
          status: 'downloading', 
          version: info.version 
        });
        try {
          await autoUpdater.downloadUpdate();
          console.log('[Updater] Download started successfully');
        } catch (err: any) {
          console.error('[Updater] Download failed:', err.message);
          mainWindow?.webContents.send('update-status', { 
            status: 'error', 
            error: err.message 
          });
          dialog.showErrorBox('Download fehlgeschlagen', `Das Update konnte nicht heruntergeladen werden:\n${err.message}`);
        }
      } else {
        console.log('[Updater] User postponed download');
      }
    });
  });

  // No update available
  autoUpdater.on('update-not-available', (info) => {
    console.log('[Updater] No update available. Current version is latest.');
    isCheckingForUpdates = false;
    mainWindow?.webContents.send('update-status', { status: 'idle' });
    
    // Show info dialog only on manual check
    dialog.showMessageBox(mainWindow!, {
      type: 'info',
      title: 'Kein Update verfügbar',
      message: 'Du verwendest bereits die neueste Version!',
      detail: `Version: v${app.getVersion()}`,
      buttons: ['OK']
    });
  });

  // Download progress
  autoUpdater.on('download-progress', (progress) => {
    const percent = Math.round(progress.percent);
    console.log(`[Updater] Download progress: ${percent}%`);
    mainWindow?.webContents.send('update-status', { 
      status: 'progress', 
      percent: percent 
    });
  });

  // Update downloaded
  autoUpdater.on('update-downloaded', (info) => {
    console.log('[Updater] Update downloaded:', info.version);
    
    mainWindow?.webContents.send('update-status', { 
      status: 'ready', 
      version: info.version 
    });
    
    dialog.showMessageBox(mainWindow!, {
      type: 'info',
      title: 'Update bereit',
      message: 'Update wurde heruntergeladen!',
      detail: `Version ${info.version} ist bereit zur Installation.\n\nDie App wird neu gestartet um das Update zu installieren.`,
      buttons: ['Jetzt neu starten', 'Später'],
      defaultId: 0,
      cancelId: 1
    }).then((result) => {
      if (result.response === 0) {
        console.log('[Updater] User confirmed install, quitting and installing...');
        // Set flag to prevent other close handlers from interfering
        setImmediate(() => {
          autoUpdater.quitAndInstall(false, true);
        });
      } else {
        console.log('[Updater] User postponed installation');
      }
    });
  });

  // Error handling
  autoUpdater.on('error', (error) => {
    console.error('[Updater] Error:', error.message);
    console.error('[Updater] Error stack:', error.stack);
    isCheckingForUpdates = false;
    mainWindow?.webContents.send('update-status', { 
      status: 'error', 
      error: error.message 
    });
    
    // Show error dialog for critical errors
    if (error.message && !error.message.includes('net::ERR_INTERNET_DISCONNECTED')) {
      dialog.showErrorBox('Update-Fehler', `Beim Update ist ein Fehler aufgetreten:\n${error.message}`);
    }
  });
}

function doCheckForUpdates(): void {
  if (isCheckingForUpdates) {
    console.log('[Updater] Already checking for updates...');
    return;
  }
  
  console.log('[Updater] Starting update check...');
  autoUpdater.checkForUpdates().catch((err) => {
    console.error('[Updater] Check failed:', err.message);
    mainWindow?.webContents.send('update-status', { 
      status: 'error', 
      error: err.message 
    });
  });
}
