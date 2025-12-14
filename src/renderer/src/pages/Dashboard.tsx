import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import LowerThirdControl from '../components/LowerThirdControl';
import NowPlayingControl from '../components/NowPlayingControl';
import SocialWidgetControl from '../components/SocialWidgetControl';

const { ipcRenderer } = window.require('electron');

function Dashboard() {
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    ipcRenderer.invoke('get-config').then((cfg: any) => {
      setConfig(cfg);
    });
  }, []);

  if (!config) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-blue"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="space-y-6">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card bg-gradient-to-br from-accent-blue/10 to-accent-purple/10 border-accent-blue/20"
        >
          <h2 className="text-xl sm:text-2xl font-bold mb-2">Willkommen bei BroadcastKit</h2>
          <p className="text-sm sm:text-base text-gray-400">
            Dein professionelles Overlay Control Center. Konfiguriere und triggere Animationen in Echtzeit.
          </p>
        </motion.div>

        {/* Overlays Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          <LowerThirdControl config={config} />
          <NowPlayingControl config={config} />
          <SocialWidgetControl config={config} />
        </div>

        {/* Quick Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <h3 className="text-lg font-semibold mb-4">Quick Tips</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-accent-blue/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-sm mb-1">Auto-Connect</h4>
                <p className="text-xs text-gray-400">Tool connects automatically to OBS on startup</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-accent-purple/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-accent-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-sm mb-1">Saved Settings</h4>
                <p className="text-xs text-gray-400">Your last used values are remembered</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-accent-green/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-sm mb-1">Real-Time</h4>
                <p className="text-xs text-gray-400">Changes appear instantly in OBS</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default Dashboard;
