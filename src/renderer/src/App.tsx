import { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import { motion, AnimatePresence } from 'framer-motion';

const { ipcRenderer } = window.require('electron');

interface UpdateStatus {
  status: 'idle' | 'checking' | 'available' | 'downloading' | 'progress' | 'ready' | 'error';
  version?: string;
  percent?: number;
  error?: string;
}

function App() {
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'settings'>('dashboard');
  const [obsConnected, setObsConnected] = useState(false);
  const [obsMessage, setObsMessage] = useState('Prüfe Verbindung...');
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({ status: 'idle' });
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);
  const [appVersion, setAppVersion] = useState('...');

  useEffect(() => {
    // Get app version from main process
    ipcRenderer.invoke('get-app-version').then((version: string) => {
      setAppVersion(version);
    });

    // Listen for OBS status updates
    ipcRenderer.on('obs-status', (event: any, status: any) => {
      console.log('OBS Status Update:', status);
      setObsConnected(status.connected);
      setObsMessage(status.message);
    });

    // Listen for update status
    ipcRenderer.on('update-status', (event: any, status: UpdateStatus) => {
      console.log('Update Status:', status);
      setUpdateStatus(status);
      if (status.status === 'available' || status.status === 'ready' || status.status === 'downloading' || status.status === 'progress') {
        setShowUpdateBanner(true);
      }
    });

    // Get initial status
    ipcRenderer.invoke('get-obs-status').then((status: any) => {
      console.log('Initial OBS Status:', status);
      setObsConnected(status.connected);
      if (status.connected) {
        setObsMessage('Verbunden mit OBS');
      } else {
        setObsMessage('Nicht verbunden');
      }
    });

    return () => {
      ipcRenderer.removeAllListeners('obs-status');
      ipcRenderer.removeAllListeners('update-status');
    };
  }, []);

  const handleCheckUpdate = () => {
    setUpdateStatus({ status: 'checking' });
    ipcRenderer.invoke('check-for-updates');
  };

  const handleInstallUpdate = () => {
    ipcRenderer.invoke('install-update');
  };

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col">
      {/* Update Banner */}
      <AnimatePresence>
        {showUpdateBanner && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="bg-gradient-to-r from-accent-blue to-accent-purple text-white px-4 py-2 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              {updateStatus.status === 'downloading' || updateStatus.status === 'progress' ? (
                <span className="text-sm font-medium">
                  Downloading v{updateStatus.version}... {updateStatus.percent}%
                </span>
              ) : updateStatus.status === 'ready' ? (
                <span className="text-sm font-medium">
                  Update v{updateStatus.version} bereit zur Installation!
                </span>
              ) : (
                <span className="text-sm font-medium">
                  Neue Version v{updateStatus.version} verfügbar!
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {updateStatus.status === 'ready' ? (
                <button
                  onClick={handleInstallUpdate}
                  className="px-3 py-1 bg-white text-accent-blue rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
                >
                  Jetzt installieren
                </button>
              ) : updateStatus.status === 'downloading' || updateStatus.status === 'progress' ? (
                <div className="w-32 h-2 bg-white/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white transition-all duration-300"
                    style={{ width: `${updateStatus.percent || 0}%` }}
                  />
                </div>
              ) : null}
              <button
                onClick={() => setShowUpdateBanner(false)}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="glass border-b border-dark-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:justify-between">
            {/* Logo & Title */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-accent-blue to-accent-purple rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-accent-blue to-accent-purple bg-clip-text text-transparent">
                  BroadcastKit
                </h1>
                <p className="text-xs text-gray-400 hidden sm:block">Stream Control Center</p>
              </div>
            </motion.div>

            {/* Navigation & Status Row */}
            <div className="flex items-center justify-between w-full sm:w-auto gap-2 sm:gap-4">
              {/* Navigation */}
              <nav className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={() => setCurrentPage('dashboard')}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 text-sm rounded-lg transition-all duration-200 ${
                    currentPage === 'dashboard'
                      ? 'bg-accent-blue text-white'
                      : 'text-gray-400 hover:text-gray-100 hover:bg-dark-hover'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setCurrentPage('settings')}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 text-sm rounded-lg transition-all duration-200 ${
                    currentPage === 'settings'
                      ? 'bg-accent-blue text-white'
                      : 'text-gray-400 hover:text-gray-100 hover:bg-dark-hover'
                  }`}
                >
                  Settings
                </button>
              </nav>

              {/* OBS Status */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 sm:gap-3 glass px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg"
              >
                <div
                  className={`status-dot ${
                    obsConnected ? 'bg-accent-green' : 'bg-accent-red'
                  }`}
                />
                <div className="text-xs sm:text-sm">
                  <div className="font-medium hidden sm:block">{obsConnected ? 'OBS Connected' : 'OBS Disconnected'}</div>
                  <div className="font-medium sm:hidden">{obsConnected ? 'OBS' : 'Offline'}</div>
                  <div className="text-xs text-gray-400 hidden md:block">{obsMessage}</div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8 flex-1">
        <AnimatePresence mode="wait">
          {currentPage === 'dashboard' ? (
            <Dashboard key="dashboard" />
          ) : (
            <Settings key="settings" />
          )}
        </AnimatePresence>
      </main>

      {/* Footer with Version */}
      <footer className="border-t border-dark-border py-3 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span>BroadcastKit</span>
            <span className="px-2 py-0.5 bg-dark-hover rounded text-gray-400">v{appVersion}</span>
          </div>
          <button
            onClick={handleCheckUpdate}
            disabled={updateStatus.status === 'checking'}
            className="flex items-center gap-1.5 hover:text-gray-300 transition-colors disabled:opacity-50"
          >
            {updateStatus.status === 'checking' ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Prüfe...</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span>Nach Updates suchen</span>
              </>
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}

export default App;
