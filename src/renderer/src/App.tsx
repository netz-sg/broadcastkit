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
    <div className="h-screen bg-zinc-950 flex flex-col overflow-hidden text-zinc-100 font-sans selection:bg-indigo-500/30">
      {/* Update Banner */}
      <AnimatePresence>
        {showUpdateBanner && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 flex items-center justify-between shadow-lg z-50"
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              {updateStatus.status === 'downloading' || updateStatus.status === 'progress' ? (
                <span className="text-sm font-medium">
                  Lade v{updateStatus.version}... {updateStatus.percent?.toFixed(0)}%
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
            <div className="flex items-center gap-3">
              {updateStatus.status === 'ready' ? (
                <button
                  onClick={handleInstallUpdate}
                  className="px-3 py-1 bg-white text-indigo-600 rounded-lg text-sm font-bold hover:bg-gray-100 transition-colors shadow-sm"
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
      <header className="glass-panel border-b border-white/5 z-40 relative">
        <div className="max-w-[1920px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-6">
            {/* Logo & Title */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/20 border border-white/10">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">
                  BroadcastKit
                </h1>
                <p className="text-xs text-zinc-400 font-medium">Stream Control Center</p>
              </div>
            </motion.div>

            {/* Navigation & Status Row */}
            <div className="flex items-center gap-6">
              {/* Navigation */}
              <nav className="flex items-center p-1 bg-zinc-900/50 rounded-xl border border-white/5">
                <button
                  onClick={() => setCurrentPage('dashboard')}
                  className={`px-5 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    currentPage === 'dashboard'
                      ? 'bg-zinc-800 text-white shadow-sm border border-white/5'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setCurrentPage('settings')}
                  className={`px-5 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    currentPage === 'settings'
                      ? 'bg-zinc-800 text-white shadow-sm border border-white/5'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                  }`}
                >
                  Einstellungen
                </button>
              </nav>

              {/* OBS Status */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition-colors ${
                  obsConnected 
                    ? 'bg-green-500/10 border-green-500/20' 
                    : 'bg-red-500/10 border-red-500/20'
                }`}
              >
                <div className="relative flex h-3 w-3">
                  {obsConnected && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  )}
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${
                    obsConnected ? 'bg-green-500' : 'bg-red-500'
                  }`}></span>
                </div>
                <div className="flex flex-col">
                  <span className={`text-xs font-bold ${
                    obsConnected ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {obsConnected ? 'OBS Verbunden' : 'OBS Getrennt'}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-medium hidden md:block leading-none mt-0.5">
                    {obsMessage}
                  </span>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative">
        {/* Background Noise/Gradient */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]"></div>
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[128px]"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[128px]"></div>
        </div>

        <div className="h-full w-full relative z-10">
          <AnimatePresence mode="wait">
            {currentPage === 'dashboard' ? (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <Dashboard />
              </motion.div>
            ) : (
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <Settings />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer with Version */}
      <footer className="border-t border-white/5 py-2 px-6 bg-zinc-950/50 backdrop-blur-sm z-40">
        <div className="max-w-[1920px] mx-auto flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-3">
            <span className="font-medium">BroadcastKit</span>
            <span className="px-2 py-0.5 bg-zinc-900 border border-white/5 rounded text-zinc-400 font-mono">v{appVersion}</span>
          </div>
          <button
            onClick={handleCheckUpdate}
            disabled={updateStatus.status === 'checking'}
            className="flex items-center gap-2 hover:text-zinc-300 transition-colors disabled:opacity-50"
          >
            {updateStatus.status === 'checking' ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Prüfe auf Updates...</span>
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
