import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const { ipcRenderer } = window.require('electron');

interface Props {
  config: any;
  onSaved?: () => void;
}

type StyleType = 'card' | 'fullwidth' | 'broadcast' | 'esports';

interface DetectedGame {
  processName: string;
  gameName: string;
  windowTitle: string;
}

interface RawgGameInfo {
  name: string;
  background_image: string | null;
  genres?: { name: string }[];
  released?: string;
}

function NowPlayingControl({ config, onSaved }: Props) {
  const nowPlayingConfig = config.overlays.nowPlaying || {};
  const hasRawgKey = !!config.rawg?.apiKey;
  
  const [title, setTitle] = useState(nowPlayingConfig.lastUsedTitle || '');
  const [subtitle, setSubtitle] = useState(nowPlayingConfig.lastUsedSubtitle || '');
  const [cover, setCover] = useState<string>(nowPlayingConfig.cover || '');
  const [style, setStyle] = useState<StyleType>(nowPlayingConfig.style || 'card');
  const [isVisible, setIsVisible] = useState(false);
  
  // Timing Settings
  const [displayDuration, setDisplayDuration] = useState(nowPlayingConfig.displayDuration || 10);
  const [autoShowEnabled, setAutoShowEnabled] = useState(nowPlayingConfig.autoShowEnabled || false);
  const [autoShowInterval, setAutoShowInterval] = useState(nowPlayingConfig.autoShowInterval || 15);
  const [nextAutoShow, setNextAutoShow] = useState<string | null>(null);
  
  // Auto Detection
  const [autoDetectEnabled, setAutoDetectEnabled] = useState(nowPlayingConfig.autoDetectEnabled || false);
  const [autoDetectInterval, setAutoDetectInterval] = useState(nowPlayingConfig.autoDetectInterval || 30);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedGame, setDetectedGame] = useState<DetectedGame | null>(null);
  const [isFetchingRawg, setIsFetchingRawg] = useState(false);
  
  const autoShowTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const autoDetectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const nextShowTimeRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);
  const pendingSave = useRef(false);
  
  // Keep refs updated with latest values for unmount save
  const latestValues = useRef({ title, subtitle, displayDuration, autoShowEnabled, autoShowInterval, autoDetectEnabled, autoDetectInterval, style, cover });
  useEffect(() => {
    latestValues.current = { title, subtitle, displayDuration, autoShowEnabled, autoShowInterval, autoDetectEnabled, autoDetectInterval, style, cover };
  }, [title, subtitle, displayDuration, autoShowEnabled, autoShowInterval, autoDetectEnabled, autoDetectInterval, style, cover]);

  // Auto-Show Timer
  useEffect(() => {
    if (autoShowEnabled && title) {
      startAutoShowTimer();
    } else {
      stopAutoShowTimer();
    }
    return () => stopAutoShowTimer();
  }, [autoShowEnabled, autoShowInterval, title, subtitle]);

  // Auto Detection Timer
  useEffect(() => {
    if (autoDetectEnabled) {
      startAutoDetection();
    } else {
      stopAutoDetection();
    }
    return () => stopAutoDetection();
  }, [autoDetectEnabled, autoDetectInterval]);

  const startAutoDetection = () => {
    stopAutoDetection();
    detectGame(); // Initial detection
    autoDetectTimerRef.current = setInterval(() => detectGame(), autoDetectInterval * 1000);
  };

  const stopAutoDetection = () => {
    if (autoDetectTimerRef.current) {
      clearInterval(autoDetectTimerRef.current);
      autoDetectTimerRef.current = null;
    }
  };

  const detectGame = async () => {
    setIsDetecting(true);
    try {
      const game = await ipcRenderer.invoke('detect-game');
      console.log('[NowPlaying] Detected game:', game);
      
      if (game && game.gameName) {
        setDetectedGame(game);
        
        // Check if this is a NEW game (different from current title)
        // Compare with both title and detected game name to handle RAWG name differences
        const currentGameLower = title.toLowerCase();
        const newGameLower = game.gameName.toLowerCase();
        const isNewGame = !currentGameLower.includes(newGameLower) && !newGameLower.includes(currentGameLower);
        
        console.log(`[NowPlaying] Comparing: "${title}" vs "${game.gameName}" - isNew: ${isNewGame}`);
        
        // Only update if game name changed
        if (isNewGame) {
          let newTitle = game.gameName;
          let newSubtitle = '';
          let newCover = '';
          
          // Try RAWG if we have a key
          if (hasRawgKey) {
            setIsFetchingRawg(true);
            const rawgInfo: RawgGameInfo | null = await ipcRenderer.invoke('search-rawg-game', game.gameName);
            
            if (rawgInfo) {
              newTitle = rawgInfo.name;
              if (rawgInfo.genres && rawgInfo.genres.length > 0) {
                newSubtitle = rawgInfo.genres.map(g => g.name).slice(0, 2).join(', ');
              }
              if (rawgInfo.background_image) {
                newCover = rawgInfo.background_image;
              }
            } else {
              // RAWG didn't find it, use detected name
              newSubtitle = game.windowTitle !== game.gameName ? game.windowTitle : '';
            }
            setIsFetchingRawg(false);
          } else {
            // No RAWG key, just use detected game info
            newSubtitle = game.windowTitle !== game.gameName ? game.windowTitle : '';
          }
          
          console.log(`[NowPlaying] New game data: title="${newTitle}", subtitle="${newSubtitle}", cover="${newCover ? 'yes' : 'no'}"`);
          
          // Apply the new game info to state
          setTitle(newTitle);
          setSubtitle(newSubtitle);
          setCover(newCover); // Always set new cover (even if empty - clears old one)
          
          // NEW GAME DETECTED → Show NOW PLAYING immediately with NEW data!
          console.log('[NowPlaying] New game detected! Showing overlay immediately...');
          
          // Show overlay directly with the new values (don't rely on state)
          handleShowOverlay(newTitle, newSubtitle, newCover);
        }
      } else {
        setDetectedGame(null);
      }
    } catch (error) {
      console.error('Error detecting game:', error);
    }
    setIsDetecting(false);
  };

  const handleManualDetect = async () => {
    await detectGame();
  };

  const startAutoShowTimer = () => {
    stopAutoShowTimer();
    const intervalMs = autoShowInterval * 60 * 1000;
    nextShowTimeRef.current = Date.now() + intervalMs;
    
    const updateCountdown = () => {
      const remaining = Math.max(0, nextShowTimeRef.current - Date.now());
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      setNextAutoShow(`${mins}:${secs.toString().padStart(2, '0')}`);
    };
    
    updateCountdown();
    countdownRef.current = setInterval(updateCountdown, 1000);
    autoShowTimerRef.current = setInterval(() => triggerAutoShow(), intervalMs);
  };

  const resetCountdown = () => {
    const intervalMs = autoShowInterval * 60 * 1000;
    nextShowTimeRef.current = Date.now() + intervalMs;
  };

  const triggerAutoShow = () => {
    handleShow();
    resetCountdown();
  };

  const stopAutoShowTimer = () => {
    if (autoShowTimerRef.current) clearInterval(autoShowTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    autoShowTimerRef.current = null;
    countdownRef.current = null;
    setNextAutoShow(null);
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setCover(event.target?.result as string);
    reader.readAsDataURL(file);
  };

  const removeCover = () => {
    setCover('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Show overlay with specific values (used when new game detected)
  const handleShowOverlay = (showTitle: string, showSubtitle: string, showCover: string) => {
    ipcRenderer.invoke('trigger-overlay', {
      action: 'SHOW',
      module: 'NOW_PLAYING',
      payload: { 
        title: showTitle, 
        subtitle: showSubtitle, 
        cover: showCover, 
        style, 
        duration: displayDuration 
      },
    });
    setIsVisible(true);
    
    if (autoShowEnabled) {
      resetCountdown();
      if (autoShowTimerRef.current) clearInterval(autoShowTimerRef.current);
      const intervalMs = autoShowInterval * 60 * 1000;
      autoShowTimerRef.current = setInterval(() => triggerAutoShow(), intervalMs);
    }
    
    setTimeout(() => setIsVisible(false), displayDuration * 1000);
  };

  const handleShow = () => {
    handleShowOverlay(title, subtitle, cover);
  };

  const handleHide = () => {
    ipcRenderer.invoke('trigger-overlay', {
      action: 'HIDE',
      module: 'NOW_PLAYING',
      payload: {},
    });
    setIsVisible(false);
  };

  const saveSettings = () => {
    const v = latestValues.current;
    console.log('[NowPlaying] Saving settings:', v);
    pendingSave.current = false;
    ipcRenderer.invoke('save-now-playing-settings', {
      displayDuration: v.displayDuration,
      autoShowEnabled: v.autoShowEnabled,
      autoShowInterval: v.autoShowInterval,
      autoDetectEnabled: v.autoDetectEnabled,
      autoDetectInterval: v.autoDetectInterval,
      style: v.style,
      cover: v.cover,
      lastUsedTitle: v.title,
      lastUsedSubtitle: v.subtitle,
    }).then(() => {
      console.log('[NowPlaying] Settings saved successfully');
      onSaved?.();
    });
  };

  // Debounced save - wait 500ms after last change before saving
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    pendingSave.current = true;
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveSettings();
    }, 500);
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [displayDuration, autoShowEnabled, autoShowInterval, autoDetectEnabled, autoDetectInterval, style, cover, title, subtitle]);
  
  // Save immediately on unmount if there are pending changes
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (pendingSave.current) {
        const v = latestValues.current;
        console.log('[NowPlaying] Saving on unmount:', v);
        ipcRenderer.invoke('save-now-playing-settings', {
          displayDuration: v.displayDuration,
          autoShowEnabled: v.autoShowEnabled,
          autoShowInterval: v.autoShowInterval,
          autoDetectEnabled: v.autoDetectEnabled,
          autoDetectInterval: v.autoDetectInterval,
          style: v.style,
          cover: v.cover,
          lastUsedTitle: v.title,
          lastUsedSubtitle: v.subtitle,
        });
      }
    };
  }, []);

  const styles = [
    {
      id: 'card' as StyleType,
      name: '3D Card',
      description: 'Vinyl Style, Floating',
      color: 'from-blue-500 to-cyan-500',
      borderColor: 'border-accent-blue',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      id: 'fullwidth' as StyleType,
      name: 'Cinematic HUD',
      description: 'Wide Tech Bar',
      color: 'from-emerald-500 to-teal-600',
      borderColor: 'border-emerald-500',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      ),
    },
    {
      id: 'broadcast' as StyleType,
      name: 'Broadcast',
      description: 'Professional News Style',
      color: 'from-red-500 to-orange-500',
      borderColor: 'border-red-500',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: 'esports' as StyleType,
      name: 'Esports',
      description: 'Competitive Gaming',
      color: 'from-orange-500 to-red-600',
      borderColor: 'border-orange-500',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
  ];

  // Preview - 3D Card Style
  const renderCardPreview = () => {
    const previewCover = cover || 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1r7x.png';
    return (
      <div className="flex items-center gap-0 scale-75 origin-left">
        {/* Cover Art */}
        <div className="relative z-20 w-16 aspect-[9/16] rounded-lg shadow-2xl bg-zinc-900 border border-white/10 overflow-hidden">
          <img src={previewCover} alt="Cover" className="w-full h-full object-cover" />
        </div>
        
        {/* Info Block */}
        <div className="relative z-10 -ml-3 pl-6 pr-6 py-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-r-xl h-20 flex flex-col justify-center min-w-[180px]">
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-accent-blue to-accent-purple"></div>
          <span className="text-[8px] font-bold text-accent-blue uppercase tracking-widest bg-accent-blue/10 px-1.5 py-0.5 rounded border border-accent-blue/20 w-fit mb-1">Now Playing</span>
          <h1 className="text-white text-sm font-bold leading-tight truncate">{title || 'Game Title'}</h1>
          <span className="text-zinc-400 text-[10px] font-medium uppercase tracking-wide mt-0.5">{subtitle || 'Mode'}</span>
        </div>
      </div>
    );
  };

  // Preview - Fullwidth Style
  const renderFullwidthPreview = () => {
    const previewCover = cover || 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1r7x.png';
    return (
      <div className="flex items-end scale-[0.4] origin-left -ml-4">
        {/* Cover Art */}
        <div className="relative z-30 w-20 aspect-[9/16] rounded-lg shadow-2xl -mr-6 mb-2 flex-shrink-0 border border-white/20 bg-black overflow-hidden">
          <img src={previewCover} alt="Cover" className="w-full h-full object-cover" />
        </div>
        
        {/* Main Bar */}
        <div className="flex-1 bg-[#09090b] border-t border-b border-accent-blue/50 relative flex items-center h-16 overflow-hidden rounded-r-xl rounded-bl-xl pl-8 pr-6 min-w-[400px]">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.5)_0%,transparent_70%)]"></div>
          
          <div className="flex flex-col justify-center relative z-10 flex-1 ml-2">
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                <span className="w-0.5 h-2 bg-accent-blue rounded-sm"></span>
                <span className="w-0.5 h-2 bg-accent-blue/50 rounded-sm"></span>
                <span className="w-0.5 h-2 bg-accent-blue/20 rounded-sm"></span>
              </div>
              <span className="text-accent-blue text-[8px] font-bold uppercase tracking-[0.15em]">Current</span>
            </div>
            <h1 className="text-2xl font-bold text-white uppercase italic tracking-tighter mt-0.5">{title || 'Game Title'}</h1>
          </div>
          
          <div className="relative z-10 flex flex-col items-end opacity-80">
            <span className="text-white font-mono text-sm font-medium border border-white/20 px-2 py-0.5 rounded bg-white/5">{subtitle || 'Mode'}</span>
          </div>
        </div>
      </div>
    );
  };

  // Preview - Broadcast Style
  const renderBroadcastPreview = () => {
    const previewCover = cover || 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1r7x.png';
    return (
      <div className="scale-[0.55] origin-left -ml-2">
        <div className="flex flex-col">
          {/* Top Bar */}
          <div className="flex items-center gap-0.5">
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-4 py-2 flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="text-white text-xs font-bold uppercase tracking-wider">Now Playing</span>
            </div>
            <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-transparent" style={{clipPath: 'polygon(0 0, 100% 0, 70% 100%, 0 100%)'}}></div>
          </div>
          {/* Main Content */}
          <div className="flex items-center gap-4 bg-gradient-to-r from-black/90 to-black/70 px-4 py-3 border-l-[3px] border-red-500 min-w-[350px]">
            <img src={previewCover} alt="Cover" className="w-12 h-12 rounded-lg object-cover border border-white/20" />
            <div className="flex-1">
              <h1 className="text-white text-lg font-bold leading-tight">{title || 'Game Title'}</h1>
              <span className="text-zinc-400 text-xs">{subtitle || 'Mode'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Preview - Esports Style
  const renderEsportsPreview = () => {
    const previewCover = cover || 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1r7x.png';
    return (
      <div className="scale-[0.55] origin-left -ml-2">
        <div className="flex items-stretch">
          {/* Side Accent */}
          <div className="w-1.5 bg-gradient-to-b from-red-500 to-orange-500" style={{transform: 'skewX(-8deg)', marginRight: '-2px'}}></div>
          {/* Main Content */}
          <div className="flex items-center gap-3 bg-gradient-to-r from-zinc-900/95 to-zinc-900/90 px-4 py-3 border-t border-white/5 min-w-[300px]" style={{transform: 'skewX(-8deg)'}}>
            <div style={{transform: 'skewX(8deg)'}} className="flex items-center gap-3">
              <img src={previewCover} alt="Cover" className="w-11 h-11 object-cover" style={{clipPath: 'polygon(10% 0, 100% 0, 90% 100%, 0 100%)'}} />
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-red-500 text-[9px] font-bold uppercase tracking-widest">Playing</span>
                </div>
                <h1 className="text-white text-base font-bold uppercase tracking-wide" style={{fontFamily: 'Rajdhani, sans-serif'}}>{title || 'Game Title'}</h1>
                <span className="text-zinc-400 text-[10px] uppercase tracking-wider">{subtitle || 'Mode'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 w-full max-w-4xl mx-auto">
      {/* Browser Source URL */}
      <div className="glass-panel p-4 flex items-center justify-between bg-black/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-white">Browser Source URL</h3>
            <p className="text-xs text-zinc-400">Füge diese URL in OBS als Browser Source hinzu</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-black/40 rounded-lg border border-white/5 px-3 py-2">
          <code className="text-xs font-mono text-green-400 select-all">/overlay/now-playing</code>
        </div>
      </div>

      {/* Preview Card */}
      <div className="glass-panel p-6 relative overflow-hidden">
        <div className="flex items-center justify-between mb-6 relative z-10">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Live Preview</h3>
          <div className="flex items-center gap-2">
            {autoShowEnabled && nextAutoShow && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="px-3 py-1 bg-accent-blue/10 border border-accent-blue/20 rounded-full text-xs text-accent-blue font-medium font-mono">
                ⏱ {nextAutoShow}
              </motion.div>
            )}
            {isVisible && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-xs text-green-500 font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                ON AIR
              </motion.div>
            )}
          </div>
        </div>
        
        <div className="bg-black/40 rounded-xl p-12 flex items-center justify-center min-h-[200px] relative overflow-hidden border border-white/5 shadow-inner">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20"></div>
          {style === 'card' && renderCardPreview()}
          {style === 'fullwidth' && renderFullwidthPreview()}
          {style === 'broadcast' && renderBroadcastPreview()}
          {style === 'esports' && renderEsportsPreview()}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Controls */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-accent-green/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white">Content</h3>
            </div>

            {/* Auto Game Detection */}
            <div className="p-4 bg-zinc-900/30 rounded-xl border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                  Auto Game Detection
                </h4>
                {hasRawgKey && (
                  <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                    RAWG API ACTIVE
                  </span>
                )}
              </div>

              {!hasRawgKey && (
                <div className="p-3 bg-accent-blue/10 border border-accent-blue/20 rounded-lg">
                  <p className="text-xs text-accent-blue">
                    💡 Add a <span className="font-bold">RAWG API Key</span> in Settings to automatically fetch cover art and genres.
                  </p>
                </div>
              )}

              {/* Detection Status */}
              <div className="flex items-center gap-3 p-3 bg-black/20 rounded-lg border border-white/5">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${detectedGame ? 'bg-green-500/20' : 'bg-zinc-800'}`}>
                  {isDetecting || isFetchingRawg ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-accent-purple"></div>
                  ) : detectedGame ? (
                    <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">
                    {isDetecting ? 'Scanning processes...' : isFetchingRawg ? 'Fetching metadata...' : detectedGame ? detectedGame.gameName : 'No game detected'}
                  </div>
                  <div className="text-xs text-zinc-500 truncate">
                    {detectedGame ? detectedGame.processName : 'Start a game or click Detect'}
                  </div>
                </div>
                <button
                  onClick={handleManualDetect}
                  disabled={isDetecting || isFetchingRawg}
                  className="btn-secondary text-xs py-1.5 px-3"
                >
                  {isDetecting || isFetchingRawg ? 'Scanning...' : 'Detect Now'}
                </button>
              </div>

              {/* Auto Detection Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-white">Auto-Detect Loop</div>
                  <div className="text-xs text-zinc-500">Automatically scan for games</div>
                </div>
                <button
                  onClick={() => setAutoDetectEnabled(!autoDetectEnabled)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${autoDetectEnabled ? 'bg-accent-purple' : 'bg-zinc-700'}`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${autoDetectEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              <AnimatePresence>
                {autoDetectEnabled && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <label className="label mb-2">Scan Interval (seconds)</label>
                    <div className="flex flex-wrap gap-2">
                      {[10, 15, 30, 45, 60, 120].map((secs) => (
                        <button
                          key={secs}
                          onClick={() => setAutoDetectInterval(secs)}
                          className={`px-2 py-1.5 rounded text-xs font-medium transition-all ${
                            autoDetectInterval === secs 
                              ? 'bg-accent-purple text-white shadow-lg shadow-accent-purple/20' 
                              : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                          }`}
                        >
                          {secs}s
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Game / Song Title</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  className="input w-full" 
                  placeholder="z.B. Cyberpunk 2077" 
                />
              </div>
              <div>
                <label className="label">Mode / Artist</label>
                <input 
                  type="text" 
                  value={subtitle} 
                  onChange={(e) => setSubtitle(e.target.value)} 
                  className="input w-full" 
                  placeholder="z.B. Ranked Mode" 
                />
              </div>
            </div>

            {/* Cover Image Upload */}
            <div className="p-4 bg-zinc-900/30 rounded-xl border border-white/5">
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Cover Art (9:16)</h4>
              <div className="flex items-start gap-4">
                <div className="relative group flex-shrink-0">
                  {cover ? (
                    <img src={cover} alt="Cover" className="w-16 h-28 rounded-lg object-cover border-2 border-accent-blue shadow-lg shadow-accent-blue/20" />
                  ) : (
                    <div className="w-16 h-28 rounded-lg bg-zinc-800/50 border-2 border-dashed border-zinc-700 flex items-center justify-center">
                      <svg className="w-6 h-6 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  {cover && (
                    <button onClick={removeCover} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md border-2 border-zinc-900">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" id="cover-upload" />
                  <label htmlFor="cover-upload" className="btn-secondary text-xs py-2 cursor-pointer inline-flex items-center gap-2 mb-3">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Upload Image
                  </label>
                  <div>
                    <label className="label text-[10px] mb-1">Or paste URL</label>
                    <input
                      type="text"
                      value={cover.startsWith('data:') ? '' : cover}
                      onChange={(e) => setCover(e.target.value)}
                      className="input w-full text-xs py-1.5"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Design Style Selection */}
          <div className="glass-panel p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white">Style</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {styles.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStyle(s.id)}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all text-left group relative overflow-hidden ${
                    style === s.id
                      ? `bg-zinc-800/80 ${s.borderColor} ring-1 ring-inset ring-white/10`
                      : 'bg-zinc-900/20 border-white/5 hover:bg-zinc-800/40 hover:border-white/10'
                  }`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-r ${s.color} opacity-0 ${style === s.id ? 'opacity-5' : 'group-hover:opacity-5'} transition-opacity`}></div>
                  <div className={`p-2.5 bg-gradient-to-br ${s.color} rounded-lg text-white shadow-lg relative z-10`}>
                    {s.icon}
                  </div>
                  <div className="relative z-10">
                    <div className="text-white text-sm font-bold">{s.name}</div>
                    <div className="text-zinc-500 text-xs">{s.description}</div>
                  </div>
                  {style === s.id && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-accent-blue">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="space-y-6">
          {/* Timing Settings */}
          <div className="glass-panel p-6 space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white">Timing</h3>
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <label className="label">Duration</label>
                <span className="text-xs font-mono text-accent-blue bg-accent-blue/10 px-2 py-0.5 rounded">{displayDuration}s</span>
              </div>
              <input 
                type="range" 
                min="5" 
                max="60" 
                value={displayDuration} 
                onChange={(e) => setDisplayDuration(parseInt(e.target.value))} 
                className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-accent-blue" 
              />
            </div>

            <div className="pt-4 border-t border-white/5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="font-bold text-sm text-white">Auto-Show</div>
                  <div className="text-xs text-zinc-500">Repeat periodically</div>
                </div>
                <button
                  onClick={() => setAutoShowEnabled(!autoShowEnabled)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${autoShowEnabled ? 'bg-accent-blue' : 'bg-zinc-700'}`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${autoShowEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              <AnimatePresence>
                {autoShowEnabled && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <label className="label mb-2">Interval (minutes)</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[1, 5, 10, 15, 20, 30, 45, 60].map((mins) => (
                        <button
                          key={mins}
                          onClick={() => setAutoShowInterval(mins)}
                          className={`px-2 py-1.5 rounded text-xs font-medium transition-all ${
                            autoShowInterval === mins 
                              ? 'bg-accent-blue text-white shadow-lg shadow-accent-blue/20' 
                              : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                          }`}
                        >
                          {mins}m
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="glass-panel p-4 space-y-3">
            <button 
              onClick={handleShow} 
              disabled={!title} 
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              Show Overlay
            </button>
            <button 
              onClick={handleHide} 
              className="btn-danger w-full flex items-center justify-center gap-2 py-3 text-sm"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" /></svg>
              Hide Overlay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NowPlayingControl;
