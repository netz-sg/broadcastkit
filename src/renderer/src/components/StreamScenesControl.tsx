import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const { ipcRenderer } = window.require('electron');

interface SceneConfig {
  id: string;
  title: string;
  subtitle: string;
  showCountdown: boolean;
  countdownMinutes: number;
  accentColor: string;
  backgroundType: string;
  showSocials: boolean;
}

const defaultScenes: Record<string, SceneConfig> = {
  starting: {
    id: 'starting',
    title: 'STREAM STARTET',
    subtitle: 'Hol dir was zu trinken, es geht gleich los!',
    showCountdown: true,
    countdownMinutes: 5,
    accentColor: '#6366f1', // Indigo
    backgroundType: 'animated',
    showSocials: true
  },
  brb: {
    id: 'brb',
    title: 'BIN GLEICH ZURÜCK',
    subtitle: 'Kurze Pause, bleib dran!',
    showCountdown: true,
    countdownMinutes: 3,
    accentColor: '#f59e0b', // Amber
    backgroundType: 'animated',
    showSocials: true
  },
  ending: {
    id: 'ending',
    title: 'STREAM ENDET',
    subtitle: 'Danke fürs Zuschauen! Bis zum nächsten Mal.',
    showCountdown: false,
    countdownMinutes: 0,
    accentColor: '#ec4899', // Pink
    backgroundType: 'animated',
    showSocials: true
  },
  technical: {
    id: 'technical',
    title: 'TECHNISCHE PROBLEME',
    subtitle: 'Wir sind sofort wieder da.',
    showCountdown: false,
    countdownMinutes: 0,
    accentColor: '#ef4444', // Red
    backgroundType: 'static',
    showSocials: false
  }
};

const StreamScenesControl: React.FC = () => {
  const [selectedScene, setSelectedScene] = useState<string>('starting');
  const [scenes, setScenes] = useState<Record<string, SceneConfig>>(defaultScenes);
  const [activeCountdowns, setActiveCountdowns] = useState<Record<string, number | null>>({
    starting: null,
    brb: null,
    ending: null,
    technical: null
  });
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);

  const countdownRefs = useRef<Record<string, NodeJS.Timeout | null>>({
    starting: null,
    brb: null,
    ending: null,
    technical: null
  });

  // Load saved settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // In a real app, we'd load from store here. For now using defaults.
        // const saved = await window.electron.ipcRenderer.invoke('get-scene-settings');
        // if (saved) setScenes(saved);
      } catch (error) {
        console.error('Failed to load scene settings:', error);
      }
    };
    loadSettings();
  }, []);

  const startCountdown = (sceneId: string) => {
    const scene = scenes[sceneId];
    
    // Clear existing interval for this scene if any
    if (countdownRefs.current[sceneId]) {
      clearInterval(countdownRefs.current[sceneId]!);
    }

    // Set active scene
    setActiveSceneId(sceneId);

    // Initial trigger
    ipcRenderer.invoke('trigger-overlay', {
      module: 'STREAM_SCENE',
      payload: {
        action: 'SHOW',
        sceneId: sceneId,
        config: {
          ...scene,
          remainingSeconds: scene.showCountdown ? scene.countdownMinutes * 60 : null
        }
      }
    });

    if (!scene.showCountdown) {
      setActiveCountdowns(prev => ({ ...prev, [sceneId]: null }));
      return;
    }

    // Start local countdown
    let remaining = scene.countdownMinutes * 60;
    setActiveCountdowns(prev => ({ ...prev, [sceneId]: remaining }));

    countdownRefs.current[sceneId] = setInterval(() => {
      remaining -= 1;
      setActiveCountdowns(prev => ({ ...prev, [sceneId]: remaining }));

      // Send update to overlay
      ipcRenderer.invoke('trigger-overlay', {
        module: 'STREAM_SCENE',
        payload: {
          action: 'UPDATE_COUNTDOWN',
          sceneId: sceneId,
          remainingSeconds: remaining
        }
      });
      
      if (remaining <= 0) {
        if (countdownRefs.current[sceneId]) {
          clearInterval(countdownRefs.current[sceneId]!);
        }
      }
    }, 1000);
  };

  const stopScene = (sceneId: string) => {
    if (countdownRefs.current[sceneId]) {
      clearInterval(countdownRefs.current[sceneId]!);
      countdownRefs.current[sceneId] = null;
    }
    
    setActiveCountdowns(prev => ({ ...prev, [sceneId]: null }));
    if (activeSceneId === sceneId) {
      setActiveSceneId(null);
    }

    ipcRenderer.invoke('trigger-overlay', {
      module: 'STREAM_SCENE',
      payload: {
        action: 'HIDE',
        sceneId: sceneId
      }
    });
  };

  const updateScene = (key: keyof SceneConfig, value: any) => {
    setScenes(prev => ({
      ...prev,
      [selectedScene]: {
        ...prev[selectedScene],
        [key]: value
      }
    }));
    
    // If live, update immediately
    if (activeSceneId === selectedScene) {
      ipcRenderer.invoke('trigger-overlay', {
        module: 'STREAM_SCENE',
        payload: {
          action: 'UPDATE',
          sceneId: selectedScene,
          config: {
            ...scenes[selectedScene],
            [key]: value
          }
        }
      });
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const currentScene = scenes[selectedScene];
  const isLive = activeSceneId === selectedScene;

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Browser Source URL */}
      <div className="glass-panel p-4 flex items-center justify-between bg-black/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-white">Browser Source URL</h3>
            <p className="text-xs text-zinc-400">Füge diese URL in OBS als Browser Source hinzu</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-black/40 rounded-lg border border-white/5 px-3 py-2">
          <code className="text-xs font-mono text-amber-400 select-all">/overlay/scene-{selectedScene}</code>
        </div>
      </div>

      {/* Scene Selector Tabs */}
      <div className="grid grid-cols-4 gap-3">
        {Object.values(scenes).map((scene) => (
          <button
            key={scene.id}
            onClick={() => setSelectedScene(scene.id)}
            className={`relative p-4 rounded-xl border transition-all duration-200 text-left group overflow-hidden ${
              selectedScene === scene.id
                ? 'bg-zinc-800/80 border-indigo-500/50 shadow-lg shadow-indigo-500/10'
                : 'bg-zinc-900/50 border-white/5 hover:bg-zinc-800/50 hover:border-white/10'
            }`}
          >
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-br from-${scene.accentColor} to-transparent`} />
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-2">
                <div className={`p-2 rounded-lg ${
                  selectedScene === scene.id ? 'bg-indigo-500/20 text-indigo-400' : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {getIconForScene(scene.id)}
                </div>
                {activeSceneId === scene.id && (
                  <span className="flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                )}
              </div>
              <div className="font-medium text-sm text-zinc-200">{scene.title}</div>
              <div className="text-xs text-zinc-500 mt-1 truncate">{scene.subtitle}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        {/* Left Column: Preview & Actions */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Preview Area */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 relative overflow-hidden flex-1 min-h-[300px] flex flex-col">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
            
            <div className="relative z-10 flex-1 flex items-center justify-center">
              <div 
                className="aspect-video w-full max-w-2xl bg-zinc-950 rounded-xl border border-white/5 shadow-2xl overflow-hidden relative group"
              >
                {/* Simulated Overlay Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                  {/* Background Simulation */}
                  <div 
                    className="absolute inset-0 opacity-30 transition-colors duration-500"
                    style={{ 
                      background: `radial-gradient(circle at center, ${currentScene.accentColor}40 0%, transparent 70%)` 
                    }} 
                  />
                  
                  <motion.h2 
                    key={currentScene.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl font-bold text-white mb-2 relative z-10"
                  >
                    {currentScene.title}
                  </motion.h2>
                  
                  <motion.p 
                    key={currentScene.subtitle}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-zinc-400 text-lg relative z-10"
                  >
                    {currentScene.subtitle}
                  </motion.p>

                  {currentScene.showCountdown && (
                    <div 
                      className="mt-6 text-5xl font-mono font-bold tabular-nums relative z-10"
                      style={{ color: currentScene.accentColor }}
                    >
                      {activeCountdowns[selectedScene] !== null && activeCountdowns[selectedScene]! > 0
                        ? formatTime(activeCountdowns[selectedScene]!)
                        : `${currentScene.countdownMinutes}:00`
                      }
                    </div>
                  )}

                  {isLive && (
                    <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                      <span className="text-xs font-medium text-red-400 tracking-wide">LIVE ON AIR</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="relative z-10 mt-6 flex gap-4">
              {!isLive ? (
                <button
                  onClick={() => startCountdown(selectedScene)}
                  className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 group"
                >
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  </svg>
                  Scene Starten
                </button>
              ) : (
                <button
                  onClick={() => stopScene(selectedScene)}
                  className="flex-1 py-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/50 text-red-400 font-bold rounded-xl transition-all flex items-center justify-center gap-2 group"
                >
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                  Scene Beenden
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Settings */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Einstellungen
            </h3>

            <div className="space-y-5">
              {/* Text Inputs */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Titel</label>
                  <input
                    type="text"
                    value={currentScene.title}
                    onChange={(e) => updateScene('title', e.target.value)}
                    className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                    placeholder="Stream startet gleich..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Untertitel</label>
                  <input
                    type="text"
                    value={currentScene.subtitle}
                    onChange={(e) => updateScene('subtitle', e.target.value)}
                    className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                    placeholder="Mach es dir bequem!"
                  />
                </div>
              </div>

              <div className="h-px bg-white/5 my-4" />

              {/* Countdown Config */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-zinc-300">Countdown Timer</label>
                  <button
                    onClick={() => updateScene('showCountdown', !currentScene.showCountdown)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                      currentScene.showCountdown ? 'bg-indigo-500' : 'bg-zinc-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        currentScene.showCountdown ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <AnimatePresence>
                  {currentScene.showCountdown && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-zinc-900/30 rounded-xl p-4 border border-white/5">
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <label className="block text-xs text-zinc-500 mb-1.5">Dauer (Minuten)</label>
                            <input
                              type="number"
                              min="1"
                              max="60"
                              value={currentScene.countdownMinutes}
                              onChange={(e) => updateScene('countdownMinutes', parseInt(e.target.value) || 5)}
                              className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white text-center focus:border-indigo-500/50 focus:outline-none"
                            />
                          </div>
                          <div className="flex gap-1 pt-5">
                            {[1, 3, 5, 10].map(mins => (
                              <button
                                key={mins}
                                onClick={() => updateScene('countdownMinutes', mins)}
                                className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                                  currentScene.countdownMinutes === mins
                                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                }`}
                              >
                                {mins}m
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="h-px bg-white/5 my-4" />

              {/* Appearance */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-2">Akzentfarbe</label>
                  <div className="flex flex-wrap gap-2">
                    {['#6366f1', '#f59e0b', '#ec4899', '#ef4444', '#10b981', '#3b82f6'].map(color => (
                      <button
                        key={color}
                        onClick={() => updateScene('accentColor', color)}
                        className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${
                          currentScene.accentColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900 scale-110' : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-2">Hintergrund</label>
                  <select
                    value={currentScene.backgroundType}
                    onChange={(e) => updateScene('backgroundType', e.target.value)}
                    className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50"
                  >
                    <option value="animated">Animiert</option>
                    <option value="gradient">Verlauf</option>
                    <option value="solid">Einfarbig</option>
                  </select>
                </div>
              </div>

              {/* Socials Toggle */}
              <div className="flex items-center justify-between pt-2">
                <label className="text-sm font-medium text-zinc-300">Social Media Links anzeigen</label>
                <button
                  onClick={() => updateScene('showSocials', !currentScene.showSocials)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    currentScene.showSocials ? 'bg-indigo-500' : 'bg-zinc-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      currentScene.showSocials ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function getIconForScene(id: string) {
  switch (id) {
    case 'starting':
      return (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'brb':
      return (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'ending':
      return (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      );
    case 'technical':
      return (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    default:
      return null;
  }
}

export default StreamScenesControl;
