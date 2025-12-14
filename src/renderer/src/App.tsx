import { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import { motion, AnimatePresence } from 'framer-motion';

const { ipcRenderer } = window.require('electron');

function App() {
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'settings'>('dashboard');
  const [obsConnected, setObsConnected] = useState(false);
  const [obsMessage, setObsMessage] = useState('Prüfe Verbindung...');

  useEffect(() => {
    // Listen for OBS status updates
    ipcRenderer.on('obs-status', (event: any, status: any) => {
      console.log('OBS Status Update:', status);
      setObsConnected(status.connected);
      setObsMessage(status.message);
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
    };
  }, []);

  return (
    <div className="min-h-screen bg-dark-bg">
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
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        <AnimatePresence mode="wait">
          {currentPage === 'dashboard' ? (
            <Dashboard key="dashboard" />
          ) : (
            <Settings key="settings" />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
