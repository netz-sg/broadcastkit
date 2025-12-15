import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const { ipcRenderer } = window.require('electron');

interface Props {
  config: any;
  fullWidth?: boolean;
}

interface StreamScene {
  id: string;
  name: string;
  title: string;
  subtitle: string;
  showCountdown: boolean;
  countdownMinutes: number;
  style: 'minimal' | 'gaming' | 'elegant';
  backgroundType: 'gradient' | 'animated' | 'solid';
  backgroundColor: string;
  accentColor: string;
  showSocials: boolean;
}

type SceneId = 'starting' | 'brb' | 'ending' | 'technical';

const sceneInfo: Record<SceneId, { icon: JSX.Element; defaultColor: string; description: string }> = {
  starting: {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    defaultColor: '#6366f1',
    description: 'Zeige vor dem Stream'
  },
  brb: {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    defaultColor: '#f59e0b',
    description: 'Kurze Pause'
  },
  ending: {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    defaultColor: '#ec4899',
    description: 'Stream Ende'
  },
  technical: {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    defaultColor: '#ef4444',
    description: 'Technische Probleme'
  }
};

// Default scenes für Initialisierung
const defaultScenes: Record<SceneId, StreamScene> = {
  starting: {
    id: 'starting',
    name: 'Starting Soon',
    title: 'Stream startet gleich',
    subtitle: 'Mach es dir bequem!',
    showCountdown: true,
    countdownMinutes: 5,
    style: 'gaming',
    backgroundType: 'animated',
    backgroundColor: '#0a0a0f',
    accentColor: '#6366f1',
    showSocials: true,
  },
  brb: {
    id: 'brb',
    name: 'Be Right Back',
    title: 'Gleich zurück',
    subtitle: 'Kurze Pause...',
    showCountdown: true,
    countdownMinutes: 5,
    style: 'gaming',
    backgroundType: 'animated',
    backgroundColor: '#0a0a0f',
    accentColor: '#f59e0b',
    showSocials: true,
  },
  ending: {
    id: 'ending',
    name: 'Stream Ending',
    title: 'Danke fürs Zuschauen!',
    subtitle: 'Bis zum nächsten Mal',
    showCountdown: false,
    countdownMinutes: 0,
    style: 'gaming',
    backgroundType: 'animated',
    backgroundColor: '#0a0a0f',
    accentColor: '#ec4899',
    showSocials: true,
  },
  technical: {
    id: 'technical',
    name: 'Technical Difficulties',
    title: 'Technische Probleme',
    subtitle: 'Wir sind gleich zurück!',
    showCountdown: false,
    countdownMinutes: 0,
    style: 'gaming',
    backgroundType: 'animated',
    backgroundColor: '#0a0a0f',
    accentColor: '#ef4444',
    showSocials: false,
  }
};

function StreamScenesControl({ config, fullWidth = false }: Props) {
  // Merge config scenes with defaults to ensure all fields exist
  const scenesConfig = config.overlays?.streamScenes?.scenes || {};
  const initialScenes: Record<SceneId, StreamScene> = {
    starting: { ...defaultScenes.starting, ...scenesConfig.starting },
    brb: { ...defaultScenes.brb, ...scenesConfig.brb },
    ending: { ...defaultScenes.ending, ...scenesConfig.ending },
    technical: { ...defaultScenes.technical, ...scenesConfig.technical },
  };
  
  const [scenes, setScenes] = useState<Record<SceneId, StreamScene>>(initialScenes);
  const [selectedScene, setSelectedScene] = useState<SceneId>('starting');
  const [activeCountdowns, setActiveCountdowns] = useState<Record<SceneId, number | null>>({
    starting: null,
    brb: null,
    ending: null,
    technical: null
  });
  const countdownRefs = useRef<Record<SceneId, NodeJS.Timeout | null>>({
    starting: null,
    brb: null,
    ending: null,
    technical: null
  });

  const currentScene = scenes[selectedScene];

  // Cleanup timers
  useEffect(() => {
    return () => {
      Object.values(countdownRefs.current).forEach(ref => {
        if (ref) clearInterval(ref);
      });
    };
  }, []);

  const updateScene = (field: keyof StreamScene, value: any) => {
    const updated = { ...scenes[selectedScene], [field]: value };
    setScenes(prev => ({ ...prev, [selectedScene]: updated }));
  };

  const saveSettings = async () => {
    await ipcRenderer.invoke('save-stream-scene', selectedScene, scenes[selectedScene]);
  };

  // Auto-save on changes
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (currentScene) saveSettings();
    }, 500);
    return () => clearTimeout(timeout);
  }, [scenes]);

  const startCountdown = (sceneId: SceneId) => {
    const scene = scenes[sceneId];
    
    if (!scene.showCountdown || scene.countdownMinutes <= 0) {
      // Show without countdown - use -1 to indicate "active but no countdown"
      setActiveCountdowns(prev => ({ ...prev, [sceneId]: -1 }));
      triggerScene(sceneId, 'SHOW', 0);
      return;
    }

    const totalSeconds = scene.countdownMinutes * 60;
    setActiveCountdowns(prev => ({ ...prev, [sceneId]: totalSeconds }));

    // Send initial show with countdown
    triggerScene(sceneId, 'SHOW', totalSeconds);

    // Start countdown
    countdownRefs.current[sceneId] = setInterval(() => {
      setActiveCountdowns(prev => {
        const current = prev[sceneId];
        if (current === null || current <= 1) {
          if (countdownRefs.current[sceneId]) {
            clearInterval(countdownRefs.current[sceneId]!);
            countdownRefs.current[sceneId] = null;
          }
          // Keep active state, just stop countdown
          return { ...prev, [sceneId]: -1 };
        }
        const newValue = current - 1;
        // Update overlay countdown
        triggerScene(sceneId, 'UPDATE_COUNTDOWN', newValue);
        return { ...prev, [sceneId]: newValue };
      });
    }, 1000);
  };

  const stopScene = (sceneId: SceneId) => {
    if (countdownRefs.current[sceneId]) {
      clearInterval(countdownRefs.current[sceneId]!);
      countdownRefs.current[sceneId] = null;
    }
    setActiveCountdowns(prev => ({ ...prev, [sceneId]: null }));
    triggerScene(sceneId, 'HIDE', 0);
  };

  const triggerScene = (sceneId: SceneId, action: string, countdown: number) => {
    const scene = scenes[sceneId];
    ipcRenderer.invoke('trigger-overlay', {
      module: `SCENE_${sceneId.toUpperCase()}`,
      payload: {
        action,
        countdown,
        ...scene
      }
    });
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 0) return ''; // No countdown display
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isSceneActive = (sceneId: SceneId) => activeCountdowns[sceneId] !== null;

  if (!currentScene) {
    return <div className="card">Loading...</div>;
  }

  return (
    <div className="card w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Stream Scenes</h3>
            <p className="text-xs text-gray-400">Fullscreen Overlays</p>
          </div>
        </div>
      </div>

      {/* Scene Selector Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {(Object.keys(scenes) as SceneId[]).map((sceneId) => {
          const info = sceneInfo[sceneId];
          const scene = scenes[sceneId];
          const isActive = isSceneActive(sceneId);
          return (
            <button
              key={sceneId}
              onClick={() => setSelectedScene(sceneId)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                selectedScene === sceneId
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'bg-dark-hover text-gray-400 hover:text-white border border-transparent'
              } ${isActive ? 'ring-2 ring-green-500' : ''}`}
              style={selectedScene === sceneId ? { borderColor: scene.accentColor + '50' } : {}}
            >
              <span style={{ color: selectedScene === sceneId ? scene.accentColor : undefined }}>
                {info.icon}
              </span>
              <span className="text-sm font-medium">{scene.name}</span>
              {isActive && (
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* Scene Editor */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedScene}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-6"
        >
          {/* Preview Card */}
          <div 
            className="relative rounded-xl overflow-hidden h-40"
            style={{ 
              background: currentScene.backgroundType === 'gradient' 
                ? `linear-gradient(135deg, ${currentScene.backgroundColor} 0%, ${currentScene.accentColor}30 100%)`
                : currentScene.backgroundColor
            }}
          >
            {currentScene.backgroundType === 'animated' && (
              <div className="absolute inset-0 opacity-20">
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:20px_20px] animate-pulse" />
              </div>
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
              <h2 className="text-2xl font-bold text-white mb-1">{currentScene.title}</h2>
              <p className="text-gray-300 text-sm">{currentScene.subtitle}</p>
              {currentScene.showCountdown && activeCountdowns[selectedScene] !== null && activeCountdowns[selectedScene]! > 0 && (
                <div 
                  className="mt-3 text-3xl font-mono font-bold"
                  style={{ color: currentScene.accentColor }}
                >
                  {formatTime(activeCountdowns[selectedScene]!)}
                </div>
              )}
              {currentScene.showCountdown && activeCountdowns[selectedScene] === null && (
                <div className="mt-3 text-xl font-mono text-gray-500">
                  {currentScene.countdownMinutes}:00
                </div>
              )}
              {isSceneActive(selectedScene) && (
                <div className="mt-2 flex items-center gap-2 text-green-400 text-xs">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  LIVE
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-3">
            {!isSceneActive(selectedScene) ? (
              <button
                onClick={() => startCountdown(selectedScene)}
                className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                </svg>
                Scene Aktivieren
              </button>
            ) : (
              <button
                onClick={() => stopScene(selectedScene)}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
                Scene Stoppen
              </button>
            )}
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Einstellungen</h4>
            
            {/* Title & Subtitle */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-2">Titel</label>
                <input
                  type="text"
                  value={currentScene.title}
                  onChange={(e) => updateScene('title', e.target.value)}
                  className="input w-full"
                  placeholder="Stream startet gleich..."
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-2">Untertitel</label>
                <input
                  type="text"
                  value={currentScene.subtitle}
                  onChange={(e) => updateScene('subtitle', e.target.value)}
                  className="input w-full"
                  placeholder="Mach es dir bequem!"
                />
              </div>
            </div>

            {/* Countdown Settings */}
            <div className="p-4 bg-dark-hover rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium">Countdown anzeigen</span>
                </div>
                <button
                  onClick={() => updateScene('showCountdown', !currentScene.showCountdown)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    currentScene.showCountdown ? 'bg-green-600' : 'bg-gray-600'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    currentScene.showCountdown ? 'translate-x-7' : 'translate-x-1'
                  }`} />
                </button>
              </div>
              {currentScene.showCountdown && (
                <div className="flex items-center gap-3">
                  <label className="text-xs text-gray-500">Minuten:</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={currentScene.countdownMinutes}
                    onChange={(e) => updateScene('countdownMinutes', parseInt(e.target.value) || 5)}
                    className="input w-20 text-center"
                  />
                  <div className="flex gap-1">
                    {[1, 3, 5, 10].map(mins => (
                      <button
                        key={mins}
                        onClick={() => updateScene('countdownMinutes', mins)}
                        className={`px-2 py-1 text-xs rounded ${
                          currentScene.countdownMinutes === mins
                            ? 'bg-accent-blue text-white'
                            : 'bg-dark-bg text-gray-400 hover:text-white'
                        }`}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Colors */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-2">Akzentfarbe</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={currentScene.accentColor}
                    onChange={(e) => updateScene('accentColor', e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent"
                  />
                  <div className="flex gap-1 flex-wrap">
                    {['#6366f1', '#f59e0b', '#ec4899', '#ef4444', '#10b981', '#3b82f6'].map(color => (
                      <button
                        key={color}
                        onClick={() => updateScene('accentColor', color)}
                        className={`w-6 h-6 rounded-full ${currentScene.accentColor === color ? 'ring-2 ring-white' : ''}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-2">Hintergrund</label>
                <select
                  value={currentScene.backgroundType}
                  onChange={(e) => updateScene('backgroundType', e.target.value)}
                  className="input w-full"
                >
                  <option value="animated">Animiert</option>
                  <option value="gradient">Gradient</option>
                  <option value="solid">Einfarbig</option>
                </select>
              </div>
            </div>

            {/* Show Socials Toggle */}
            <div className="flex items-center justify-between p-4 bg-dark-hover rounded-xl">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
                <span className="text-sm font-medium">Social Links anzeigen</span>
              </div>
              <button
                onClick={() => updateScene('showSocials', !currentScene.showSocials)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  currentScene.showSocials ? 'bg-green-600' : 'bg-gray-600'
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  currentScene.showSocials ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>

          {/* Browser Source URL */}
          <div className="p-4 bg-dark-hover rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Browser Source URL</p>
                <code className="text-sm text-accent-blue">
                  http://localhost:3000/overlay/scene/{selectedScene}
                </code>
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(`http://localhost:3000/overlay/scene/${selectedScene}`)}
                className="p-2 bg-dark-bg rounded-lg hover:bg-white/10 transition-colors"
                title="URL kopieren"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default StreamScenesControl;
