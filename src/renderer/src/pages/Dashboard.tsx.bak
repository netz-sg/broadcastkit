import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LowerThirdControl from '../components/LowerThirdControl';
import NowPlayingControl from '../components/NowPlayingControl';
import SocialWidgetControl from '../components/SocialWidgetControl';
import StreamScenesControl from '../components/StreamScenesControl';
import ReactionControl from '../components/ReactionControl';

const { ipcRenderer } = window.require('electron');

type TabType = 'overview' | 'lower-third' | 'now-playing' | 'social' | 'stream-scenes' | 'reaction';

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
    color: 'text-indigo-400',
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
    color: 'text-purple-400',
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
    color: 'text-green-400',
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
    color: 'text-pink-400',
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
    color: 'text-amber-400',
    description: 'Fullscreen Szenen'
  },
  {
    id: 'reaction',
    label: 'Reaction',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    color: 'text-red-400',
    description: 'Video Reactions'
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
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab config={config} onNavigate={setActiveTab} />;
      case 'lower-third':
        return <LowerThirdControl config={config} />;
      case 'now-playing':
        return <NowPlayingControl config={config} />;
      case 'social':
        return <SocialWidgetControl config={config} />;
      case 'stream-scenes':
        return <StreamScenesControl config={config} />;
      case 'reaction':
        return <ReactionControl config={config} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full overflow-hidden bg-transparent text-zinc-100 font-sans">
      {/* Sidebar Navigation */}
      <div className="w-72 flex-shrink-0 flex flex-col border-r border-white/5 bg-[#09090b] relative z-20">
        {/* Sidebar Header */}
        <div className="h-16 flex items-center px-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="font-bold text-white tracking-tight leading-none text-base">BroadcastKit</h1>
              <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">v1.4.5</span>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-8 overflow-y-auto custom-scrollbar flex-1">
          {/* Main Navigation */}
          <div>
            <h3 className="px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Modules</h3>
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                    activeTab === tab.id 
                      ? 'bg-indigo-500/10 text-indigo-400 shadow-sm ring-1 ring-indigo-500/20' 
                      : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                  }`}
                >
                  <span className={`transition-colors duration-200 ${
                    activeTab === tab.id ? 'text-indigo-400' : 'text-zinc-500 group-hover:text-zinc-300'
                  }`}>
                    {tab.icon}
                  </span>
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="active-pill"
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Quick Links / Browser Sources */}
          <div>
            <h3 className="px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Quick Links</h3>
            <div className="space-y-1">
               {[
                 { name: 'Lower Third', url: '/overlay/lower-third', color: 'bg-purple-500' },
                 { name: 'Now Playing', url: '/overlay/now-playing', color: 'bg-green-500' },
                 { name: 'Social Widget', url: '/overlay/social-widget', color: 'bg-pink-500' },
               ].map((link) => (
                 <div key={link.url} className="group flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 transition-colors cursor-help" title="Copy URL">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-2 h-2 rounded-full ${link.color} flex-shrink-0`} />
                      <span className="text-xs text-zinc-400 font-medium truncate group-hover:text-zinc-300">{link.name}</span>
                    </div>
                    <code className="text-[10px] text-zinc-600 font-mono bg-black/20 px-1.5 py-0.5 rounded border border-white/5 group-hover:border-white/10 transition-colors select-all">
                      {link.url}
                    </code>
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* User / Status Footer */}
        <div className="p-4 border-t border-white/5 bg-black/20">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center border border-white/10">
                <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">Streamer</div>
                <div className="text-xs text-zinc-500 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  Online
                </div>
              </div>
           </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Top Bar */}
        <header className="h-16 flex-shrink-0 border-b border-white/5 bg-zinc-900/10 backdrop-blur-sm flex items-center justify-between px-6">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              {tabs.find(t => t.id === activeTab)?.icon}
              {tabs.find(t => t.id === activeTab)?.label}
            </h2>
            <p className="text-xs text-zinc-400">
              {tabs.find(t => t.id === activeTab)?.description}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-[10px] font-medium text-green-400 uppercase tracking-wide">System Online</span>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <div className="w-full h-full">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full h-full"
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
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
    <div className="space-y-6 w-full">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 p-8 shadow-2xl shadow-indigo-500/20 border border-white/10"
      >
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-white mb-2">Willkommen zurück</h2>
          <p className="text-indigo-100 max-w-xl text-sm leading-relaxed">
            Dein Broadcast Control Center ist bereit. Wähle ein Modul aus, um deine Overlays zu steuern.
          </p>
        </div>
      </motion.div>

      {/* Overlay Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {/* Lower Third Card */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={() => onNavigate('lower-third')}
          className="glass-panel p-6 text-left h-full flex flex-col group hover:bg-zinc-800/50 hover:border-purple-500/30 transition-all duration-300"
        >
          <div className="flex items-start justify-between mb-4 gap-4">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform border border-purple-500/20 group-hover:border-purple-500/40">
              <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span className="px-2 py-1 rounded-md bg-zinc-900 border border-white/5 text-[10px] font-medium text-zinc-400">3 Styles</span>
          </div>
          <h3 className="font-bold text-white text-lg mb-1 group-hover:text-purple-400 transition-colors">Lower Third</h3>
          <p className="text-sm text-zinc-400 mb-4 flex-1 leading-relaxed">
            Professionelle Namenseinblendungen mit Avatar-Support und Animationen.
          </p>
          <div className="flex items-center text-purple-400 text-sm font-medium group-hover:translate-x-1 transition-transform">
            Konfigurieren <span className="ml-1">→</span>
          </div>
        </motion.button>

        {/* Now Playing Card */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={() => onNavigate('now-playing')}
          className="glass-panel p-6 text-left h-full flex flex-col group hover:bg-zinc-800/50 hover:border-green-500/30 transition-all duration-300"
        >
          <div className="flex items-start justify-between mb-4 gap-4">
            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform border border-green-500/20 group-hover:border-green-500/40">
              <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="px-2 py-1 rounded-md bg-zinc-900 border border-white/5 text-[10px] font-medium text-zinc-400">Auto-Detect</span>
          </div>
          <h3 className="font-bold text-white text-lg mb-1 group-hover:text-green-400 transition-colors">Now Playing</h3>
          <p className="text-sm text-zinc-400 mb-4 flex-1 leading-relaxed">
            Automatische Erkennung von Spielen und Musik mit Cover-Art via RAWG API.
          </p>
          <div className="flex items-center text-green-400 text-sm font-medium group-hover:translate-x-1 transition-transform">
            Konfigurieren <span className="ml-1">→</span>
          </div>
        </motion.button>

        {/* Social Media Card */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={() => onNavigate('social')}
          className="glass-panel p-6 text-left h-full flex flex-col group hover:bg-zinc-800/50 hover:border-pink-500/30 transition-all duration-300"
        >
          <div className="flex items-start justify-between mb-4 gap-4">
            <div className="w-12 h-12 bg-pink-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform border border-pink-500/20 group-hover:border-pink-500/40">
              <svg className="w-6 h-6 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
            </div>
            <span className="px-2 py-1 rounded-md bg-zinc-900 border border-white/5 text-[10px] font-medium text-zinc-400">Rotator</span>
          </div>
          <h3 className="font-bold text-white text-lg mb-1 group-hover:text-pink-400 transition-colors">Social Media</h3>
          <p className="text-sm text-zinc-400 mb-4 flex-1 leading-relaxed">
            Rotierende Social Media Links mit individuellen Anzeigedauern und Icons.
          </p>
          <div className="flex items-center text-pink-400 text-sm font-medium group-hover:translate-x-1 transition-transform">
            Konfigurieren <span className="ml-1">→</span>
          </div>
        </motion.button>

        {/* Stream Scenes Card */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          onClick={() => onNavigate('stream-scenes')}
          className="glass-panel p-6 text-left h-full flex flex-col group hover:bg-zinc-800/50 hover:border-amber-500/30 transition-all duration-300"
        >
          <div className="flex items-start justify-between mb-4 gap-4">
            <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform border border-amber-500/20 group-hover:border-amber-500/40">
              <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="px-2 py-1 rounded-md bg-zinc-900 border border-white/5 text-[10px] font-medium text-zinc-400">Fullscreen</span>
          </div>
          <h3 className="font-bold text-white text-lg mb-1 group-hover:text-amber-400 transition-colors">Stream Scenes</h3>
          <p className="text-sm text-zinc-400 mb-4 flex-1 leading-relaxed">
            Vollbild-Szenen für Start, Pause, Ende und technische Probleme.
          </p>
          <div className="flex items-center text-amber-400 text-sm font-medium group-hover:translate-x-1 transition-transform">
            Konfigurieren <span className="ml-1">→</span>
          </div>
        </motion.button>

        {/* Reaction Card */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          onClick={() => onNavigate('reaction')}
          className="glass-panel p-6 text-left h-full flex flex-col group hover:bg-zinc-800/50 hover:border-red-500/30 transition-all duration-300"
        >
          <div className="flex items-start justify-between mb-4 gap-4">
            <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform border border-red-500/20 group-hover:border-red-500/40">
              <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="px-2 py-1 rounded-md bg-zinc-900 border border-white/5 text-[10px] font-medium text-zinc-400">Interactive</span>
          </div>
          <h3 className="font-bold text-white text-lg mb-1 group-hover:text-red-400 transition-colors">Reaction</h3>
          <p className="text-sm text-zinc-400 mb-4 flex-1 leading-relaxed">
            Zeige auf welches Video du reagierst mit Badge, Banner oder PiP.
          </p>
          <div className="flex items-center text-red-400 text-sm font-medium group-hover:translate-x-1 transition-transform">
            Konfigurieren <span className="ml-1">→</span>
          </div>
        </motion.button>
      </div>
    </div>
  );
}

export default Dashboard;
