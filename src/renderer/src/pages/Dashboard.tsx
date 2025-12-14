import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LowerThirdControl from '../components/LowerThirdControl';
import NowPlayingControl from '../components/NowPlayingControl';
import SocialWidgetControl from '../components/SocialWidgetControl';
import StreamScenesControl from '../components/StreamScenesControl';

const { ipcRenderer } = window.require('electron');

type TabType = 'overview' | 'lower-third' | 'now-playing' | 'social' | 'stream-scenes';

interface TabInfo {
  id: TabType;
  label: string;
  icon: JSX.Element;
  color: string;
  description: string;
}

const tabs: TabInfo[] = [
  {
    id: 'overview',
    label: 'Übersicht',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
    color: 'accent-blue',
    description: 'Alle Overlays auf einen Blick'
  },
  {
    id: 'lower-third',
    label: 'Lower Third',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    color: 'accent-purple',
    description: 'Name & Titel Einblendung'
  },
  {
    id: 'now-playing',
    label: 'Now Playing',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'accent-green',
    description: 'Spiel / Song Anzeige'
  },
  {
    id: 'social',
    label: 'Social Media',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
      </svg>
    ),
    color: 'pink-500',
    description: 'Social Links Rotation'
  },
  {
    id: 'stream-scenes',
    label: 'Stream Scenes',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    color: 'amber-500',
    description: 'Fullscreen Szenen'
  }
];

function Dashboard() {
  const [config, setConfig] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

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

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab config={config} onNavigate={setActiveTab} />;
      case 'lower-third':
        return <LowerThirdControl config={config} fullWidth />;
      case 'now-playing':
        return <NowPlayingControl config={config} fullWidth />;
      case 'social':
        return <SocialWidgetControl config={config} fullWidth />;
      case 'stream-scenes':
        return <StreamScenesControl config={config} fullWidth />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* Sidebar Navigation - Fixed width, no animation */}
      <div className="lg:w-64 flex-shrink-0">
        <div className="card p-2 lg:p-3 lg:sticky lg:top-4">
          <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 whitespace-nowrap flex-shrink-0 lg:flex-shrink lg:w-full ${
                  activeTab === tab.id
                    ? `bg-${tab.color}/20 text-white border border-${tab.color}/30`
                    : 'text-gray-400 hover:text-white hover:bg-dark-hover'
                }`}
              >
                <span className={activeTab === tab.id ? `text-${tab.color}` : ''}>{tab.icon}</span>
                <div className="text-left hidden sm:block">
                  <div className="font-medium text-sm">{tab.label}</div>
                  <div className="text-xs text-gray-500 hidden lg:block">{tab.description}</div>
                </div>
                <span className="sm:hidden text-sm font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Browser Source URLs - Desktop Only */}
        <div className="card mt-4 hidden lg:block lg:sticky lg:top-48">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Browser Sources</h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2 p-2 bg-dark-hover rounded-lg">
              <div className="w-2 h-2 rounded-full bg-accent-purple"></div>
              <code className="text-gray-300 truncate">:3000/overlay/lower-third</code>
            </div>
            <div className="flex items-center gap-2 p-2 bg-dark-hover rounded-lg">
              <div className="w-2 h-2 rounded-full bg-accent-green"></div>
              <code className="text-gray-300 truncate">:3000/overlay/now-playing</code>
            </div>
            <div className="flex items-center gap-2 p-2 bg-dark-hover rounded-lg">
              <div className="w-2 h-2 rounded-full bg-pink-500"></div>
              <code className="text-gray-300 truncate">:3000/overlay/social-widget</code>
            </div>
          </div>
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 mt-4">Stream Scenes</h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2 p-2 bg-dark-hover rounded-lg">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <code className="text-gray-300 truncate">:3000/overlay/scene-starting</code>
            </div>
            <div className="flex items-center gap-2 p-2 bg-dark-hover rounded-lg">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <code className="text-gray-300 truncate">:3000/overlay/scene-brb</code>
            </div>
            <div className="flex items-center gap-2 p-2 bg-dark-hover rounded-lg">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <code className="text-gray-300 truncate">:3000/overlay/scene-ending</code>
            </div>
            <div className="flex items-center gap-2 p-2 bg-dark-hover rounded-lg">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <code className="text-gray-300 truncate">:3000/overlay/scene-technical</code>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// Overview Tab Component
interface OverviewTabProps {
  config: any;
  onNavigate: (tab: TabType) => void;
}

function OverviewTab({ config, onNavigate }: OverviewTabProps) {
  return (
    <div className="space-y-4">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card bg-gradient-to-br from-accent-blue/10 to-accent-purple/10 border-accent-blue/20"
      >
        <h2 className="text-xl font-bold mb-1">Willkommen bei BroadcastKit</h2>
        <p className="text-sm text-gray-400">
          Wähle ein Overlay aus der Sidebar oder klicke auf eine Karte unten.
        </p>
      </motion.div>

      {/* Overlay Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Lower Third Card */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={() => onNavigate('lower-third')}
          className="card group hover:border-accent-purple/50 transition-all duration-300 text-left"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-accent-purple/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-accent-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-white">Lower Third</h3>
              <p className="text-xs text-gray-500">3 Styles verfügbar</p>
            </div>
          </div>
          <p className="text-sm text-gray-400 mb-3">
            Zeige Name und Titel mit professionellen Animationen und Avatar-Support.
          </p>
          <div className="flex gap-2">
            <span className="px-2 py-1 bg-dark-hover rounded text-xs text-gray-400">Clean</span>
            <span className="px-2 py-1 bg-dark-hover rounded text-xs text-gray-400">Broadcast</span>
            <span className="px-2 py-1 bg-dark-hover rounded text-xs text-gray-400">Esports</span>
          </div>
        </motion.button>

        {/* Now Playing Card */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={() => onNavigate('now-playing')}
          className="card group hover:border-accent-green/50 transition-all duration-300 text-left"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-accent-green/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-white">Now Playing</h3>
              <p className="text-xs text-gray-500">Auto-Erkennung</p>
            </div>
          </div>
          <p className="text-sm text-gray-400 mb-3">
            Automatische Spielerkennung mit Cover-Art via RAWG API.
          </p>
          <div className="flex gap-2">
            <span className="px-2 py-1 bg-dark-hover rounded text-xs text-gray-400">3D Card</span>
            <span className="px-2 py-1 bg-dark-hover rounded text-xs text-gray-400">Fullwidth</span>
          </div>
        </motion.button>

        {/* Social Media Card */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={() => onNavigate('social')}
          className="card group hover:border-pink-500/50 transition-all duration-300 text-left"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-white">Social Media</h3>
              <p className="text-xs text-gray-500">6 Plattformen</p>
            </div>
          </div>
          <p className="text-sm text-gray-400 mb-3">
            Rotierende Social Links mit individuellen Anzeigedauern.
          </p>
          <div className="flex gap-2 flex-wrap">
            <span className="px-2 py-1 bg-purple-600/30 rounded text-xs text-purple-400">Twitch</span>
            <span className="px-2 py-1 bg-red-600/30 rounded text-xs text-red-400">YouTube</span>
            <span className="px-2 py-1 bg-pink-600/30 rounded text-xs text-pink-400">TikTok</span>
          </div>
        </motion.button>

        {/* Stream Scenes Card */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          onClick={() => onNavigate('stream-scenes')}
          className="card group hover:border-amber-500/50 transition-all duration-300 text-left"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-white">Stream Scenes</h3>
              <p className="text-xs text-gray-500">4 Szenen</p>
            </div>
          </div>
          <p className="text-sm text-gray-400 mb-3">
            Fullscreen Szenen für Start, Pause, Ende & technische Probleme.
          </p>
          <div className="flex gap-2 flex-wrap">
            <span className="px-2 py-1 bg-amber-600/30 rounded text-xs text-amber-400">Starting</span>
            <span className="px-2 py-1 bg-amber-600/30 rounded text-xs text-amber-400">BRB</span>
            <span className="px-2 py-1 bg-amber-600/30 rounded text-xs text-amber-400">Ending</span>
          </div>
        </motion.button>
      </div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="card"
      >
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Quick Info</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-dark-hover rounded-lg">
            <div className="text-2xl font-bold text-accent-blue">4</div>
            <div className="text-xs text-gray-500">Overlays</div>
          </div>
          <div className="text-center p-3 bg-dark-hover rounded-lg">
            <div className="text-2xl font-bold text-accent-purple">11</div>
            <div className="text-xs text-gray-500">Styles</div>
          </div>
          <div className="text-center p-3 bg-dark-hover rounded-lg">
            <div className="text-2xl font-bold text-amber-500">4</div>
            <div className="text-xs text-gray-500">Stream Scenes</div>
          </div>
          <div className="text-center p-3 bg-dark-hover rounded-lg">
            <div className="text-2xl font-bold text-pink-500">6</div>
            <div className="text-xs text-gray-500">Social Platforms</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default Dashboard;
