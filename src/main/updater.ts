import { autoUpdater } from 'electron-updater';
import { BrowserWindow, dialog, ipcMain } from 'electron';
import log from 'electron-log';

// Configure logging
autoUpdater.logger = log;
(autoUpdater.logger as any).transports.file.level = 'info';

// Disable auto download - we want user confirmation
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

let mainWindow: BrowserWindow | null = null;

export function initAutoUpdater(win: BrowserWindow): void {
  mainWindow = win;

  // Check for updates on startup (only in production)
  if (process.env.NODE_ENV !== 'development') {
    // Wait a bit before checking for updates
    setTimeout(() => {
      checkForUpdates();
    }, 5000);
  }

  // Update available
  autoUpdater.on('update-available', (info) => {
    console.log('[Updater] Update available:', info.version);
    
    dialog.showMessageBox(mainWindow!, {
      type: 'info',
      title: 'Update verfügbar',
      message: `Eine neue Version (v${info.version}) ist verfügbar!`,
      detail: `Aktuelle Version: v${require('../../package.json').version}\nNeue Version: v${info.version}\n\nMöchtest du das Update jetzt herunterladen?`,
      buttons: ['Jetzt herunterladen', 'Später'],
      defaultId: 0,
      cancelId: 1
    }).then((result) => {
      if (result.response === 0) {
        // User wants to download
        mainWindow?.webContents.send('update-status', { 
          status: 'downloading', 
          version: info.version 
        });
        autoUpdater.downloadUpdate();
      }
    });
  });

  // No update available
  autoUpdater.on('update-not-available', (info) => {
    console.log('[Updater] No update available, current version is latest');
  });

  // Download progress
  autoUpdater.on('download-progress', (progress) => {
    console.log(`[Updater] Download progress: ${Math.round(progress.percent)}%`);
    mainWindow?.webContents.send('update-status', { 
      status: 'progress', 
      percent: Math.round(progress.percent) 
    });
  });

  // Update downloaded
  autoUpdater.on('update-downloaded', (info) => {
    console.log('[Updater] Update downloaded:', info.version);
    
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
        autoUpdater.quitAndInstall(false, true);
      } else {
        mainWindow?.webContents.send('update-status', { 
          status: 'ready', 
          version: info.version 
        });
      }
    });
  });

  // Error handling
  autoUpdater.on('error', (error) => {
    console.error('[Updater] Error:', error);
    mainWindow?.webContents.send('update-status', { 
      status: 'error', 
      error: error.message 
    });
  });
}

export function checkForUpdates(): void {
  console.log('[Updater] Checking for updates...');
  autoUpdater.checkForUpdates().catch((err) => {
    console.error('[Updater] Check failed:', err);
  });
}

// IPC handler for manual update check
ipcMain.handle('check-for-updates', async () => {
  checkForUpdates();
  return { success: true };
});

// IPC handler to install pending update
ipcMain.handle('install-update', async () => {
  autoUpdater.quitAndInstall(false, true);
});
