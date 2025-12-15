import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const { ipcRenderer } = window.require('electron');

interface Props {
  config: any;
  fullWidth?: boolean;
}

type StyleType = 'card' | 'fullwidth';

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

function NowPlayingControl({ config, fullWidth = false }: Props) {
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
    ipcRenderer.invoke('save-now-playing-settings', {
      displayDuration,
      autoShowEnabled,
      autoShowInterval,
      autoDetectEnabled,
      autoDetectInterval,
      style,
      cover,
      lastUsedTitle: title,
      lastUsedSubtitle: subtitle,
    });
  };

  useEffect(() => {
    saveSettings();
  }, [displayDuration, autoShowEnabled, autoShowInterval, autoDetectEnabled, autoDetectInterval, style, cover, title, subtitle]);

  const styles = [
    {
      id: 'card' as StyleType,
      name: '3D Card',
      description: 'Vinyl Style, Floating',
      color: 'from-blue-500 to-cyan-500',
      borderColor: 'border-blue-500',
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
  ];

  // Preview - 3D Card Style
  const renderCardPreview = () => {
    const previewCover = cover || 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1r7x.png';
    return (
      <div className="flex items-center gap-0 scale-75 origin-left">
        {/* Cover Art */}
        <div className="relative z-20 w-16 aspect-[9/16] rounded-lg shadow-2xl bg-gray-900 border border-white/10 overflow-hidden">
          <img src={previewCover} alt="Cover" className="w-full h-full object-cover" />
        </div>
        
        {/* Info Block */}
        <div className="relative z-10 -ml-3 pl-6 pr-6 py-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-r-xl h-20 flex flex-col justify-center min-w-[180px]">
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500 to-purple-600"></div>
          <span className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20 w-fit mb-1">Now Playing</span>
          <h1 className="text-white text-sm font-bold leading-tight truncate">{title || 'Game Title'}</h1>
          <span className="text-gray-400 text-[10px] font-medium uppercase tracking-wide mt-0.5">{subtitle || 'Mode'}</span>
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
        <div className="flex-1 bg-[#09090b] border-t border-b border-indigo-500/50 relative flex items-center h-16 overflow-hidden rounded-r-xl rounded-bl-xl pl-8 pr-6 min-w-[400px]">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.5)_0%,transparent_70%)]"></div>
          
          <div className="flex flex-col justify-center relative z-10 flex-1 ml-2">
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                <span className="w-0.5 h-2 bg-indigo-500 rounded-sm"></span>
                <span className="w-0.5 h-2 bg-indigo-500/50 rounded-sm"></span>
                <span className="w-0.5 h-2 bg-indigo-500/20 rounded-sm"></span>
              </div>
              <span className="text-indigo-400 text-[8px] font-bold uppercase tracking-[0.15em]">Current</span>
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="card w-full"
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold">Now Playing</h3>
            <p className="text-xs sm:text-sm text-gray-400">Game / Music Display</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {autoShowEnabled && nextAutoShow && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-xs text-blue-400 font-medium">
              ⏱ {nextAutoShow}
            </motion.div>
          )}
          {isVisible && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-xs text-green-400 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              LIVE
            </motion.div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* Cover Image Upload */}
        <div className="p-4 bg-dark-hover/50 rounded-lg border border-dark-border">
          <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2 mb-3">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Cover Image (9:16)
          </h4>
          <div className="flex items-start gap-4">
            <div className="relative group">
              {cover ? (
                <img src={cover} alt="Cover" className="w-16 h-28 rounded-lg object-cover border-2 border-blue-500" />
              ) : (
                <div className="w-16 h-28 rounded-lg bg-dark-bg border-2 border-dashed border-dark-border flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              {cover && (
                <button onClick={removeCover} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <div className="flex-1">
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" id="cover-upload" />
              <label htmlFor="cover-upload" className="btn bg-dark-bg border border-dark-border hover:border-blue-500 cursor-pointer inline-flex items-center gap-2 text-sm mb-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload Cover
              </label>
              <p className="text-xs text-gray-500">Or paste URL:</p>
              <input
                type="text"
                value={cover.startsWith('data:') ? '' : cover}
                onChange={(e) => setCover(e.target.value)}
                className="input w-full mt-1 text-xs"
                placeholder="https://..."
              />
            </div>
          </div>
        </div>

        {/* Auto Game Detection */}
        <div className="p-4 bg-dark-hover/50 rounded-lg border border-dark-border space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Auto Game Detection
            </h4>
            {hasRawgKey && (
              <span className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20">
                RAWG ✓
              </span>
            )}
          </div>

          {/* Info wenn kein RAWG Key */}
          {!hasRawgKey && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg mb-3">
              <p className="text-xs text-blue-400">
                💡 Optional: Füge einen <span className="font-medium">RAWG API Key</span> in den Settings hinzu für Cover-Bilder und Genre-Infos.
              </p>
            </div>
          )}

          {/* Detection Status */}
          <div className="flex items-center gap-3 p-3 bg-dark-bg rounded-lg">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${detectedGame ? 'bg-green-500/20' : 'bg-gray-500/20'}`}>
              {isDetecting || isFetchingRawg ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-purple-500"></div>
              ) : detectedGame ? (
                <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-white">
                {isDetecting ? 'Suche...' : isFetchingRawg ? 'Lade RAWG Daten...' : detectedGame ? detectedGame.gameName : 'Kein Spiel erkannt'}
              </div>
              <div className="text-xs text-gray-500">
                {detectedGame ? detectedGame.processName : 'Starte ein Spiel oder aktiviere Auto-Detect'}
              </div>
            </div>
            <button
              onClick={handleManualDetect}
              disabled={isDetecting || isFetchingRawg}
              className="btn bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:bg-purple-500/30 text-sm disabled:opacity-50"
            >
              {isDetecting || isFetchingRawg ? (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-purple-400"></div>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Detect
                </>
              )}
            </button>
          </div>

          {/* Auto Detection Toggle */}
          <div className="flex items-center justify-between p-3 bg-dark-bg rounded-lg">
            <div>
              <div className="font-medium text-sm">Auto-Detect</div>
              <div className="text-xs text-gray-400">Automatisch Spiel erkennen</div>
            </div>
            <button
              onClick={() => setAutoDetectEnabled(!autoDetectEnabled)}
              className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${autoDetectEnabled ? 'bg-purple-500' : 'bg-dark-border'}`}
            >
              <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow transition duration-200 ${autoDetectEnabled ? 'translate-x-7' : 'translate-x-0'}`} />
            </button>
          </div>

          <AnimatePresence>
            {autoDetectEnabled && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <label className="block text-sm mb-2 text-gray-400">
                  Check alle: <span className="text-white font-medium">{autoDetectInterval}s</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {[10, 15, 30, 45, 60, 120].map((secs) => (
                    <button
                      key={secs}
                      onClick={() => setAutoDetectInterval(secs)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${autoDetectInterval === secs ? 'bg-purple-500 text-white' : 'bg-dark-bg text-gray-400 hover:text-white hover:bg-dark-border'}`}
                    >
                      {secs}s
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Title & Subtitle Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Game / Song Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="input w-full" placeholder="z.B. Cyberpunk 2077" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Mode / Artist</label>
            <input type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="input w-full" placeholder="z.B. Ranked Mode" />
          </div>
        </div>

        {/* Design Style Selection */}
        <div className="p-4 bg-dark-hover/50 rounded-lg border border-dark-border">
          <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2 mb-3">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" />
            </svg>
            Display Style
          </h4>
          <div className="grid grid-cols-1 gap-2">
            {styles.map((s) => (
              <button
                key={s.id}
                onClick={() => setStyle(s.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                  style === s.id
                    ? `bg-dark-card ${s.borderColor} ring-1 ring-opacity-50`
                    : 'bg-dark-bg border-white/5 hover:border-white/20'
                }`}
              >
                <div className={`p-2 bg-gradient-to-br ${s.color} rounded-lg text-white shadow-lg`}>
                  {s.icon}
                </div>
                <div>
                  <div className="text-white text-sm font-bold">{s.name}</div>
                  <div className="text-gray-500 text-xs">{s.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Timing Settings */}
        <div className="p-4 bg-dark-hover/50 rounded-lg border border-dark-border space-y-4">
          <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Timing
          </h4>
          
          <div>
            <label className="block text-sm mb-2 text-gray-400">
              Duration: <span className="text-white font-medium">{displayDuration}s</span>
            </label>
            <input type="range" min="5" max="60" value={displayDuration} onChange={(e) => setDisplayDuration(parseInt(e.target.value))} className="w-full h-2 bg-dark-border rounded-lg appearance-none cursor-pointer accent-blue-500" />
          </div>

          <div className="flex items-center justify-between p-3 bg-dark-bg rounded-lg">
            <div>
              <div className="font-medium text-sm">Auto-Show</div>
              <div className="text-xs text-gray-400">Show at regular intervals</div>
            </div>
            <button
              onClick={() => setAutoShowEnabled(!autoShowEnabled)}
              className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${autoShowEnabled ? 'bg-blue-500' : 'bg-dark-border'}`}
            >
              <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow transition duration-200 ${autoShowEnabled ? 'translate-x-7' : 'translate-x-0'}`} />
            </button>
          </div>

          <AnimatePresence>
            {autoShowEnabled && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <label className="block text-sm mb-2 text-gray-400">
                  Interval: <span className="text-white font-medium">{autoShowInterval} min</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {[1, 5, 10, 15, 20, 30, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => setAutoShowInterval(mins)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${autoShowInterval === mins ? 'bg-blue-500 text-white' : 'bg-dark-bg text-gray-400 hover:text-white hover:bg-dark-border'}`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Preview */}
        <div className="p-4 bg-[#0a0a0a] rounded-lg border border-dark-border overflow-hidden">
          <p className="text-xs text-gray-500 mb-3">Preview:</p>
          <div className="min-h-[100px] flex items-center overflow-hidden">
            {style === 'card' ? renderCardPreview() : renderFullwidthPreview()}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button onClick={handleShow} disabled={!title} className="btn flex-1 disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            Launch
          </button>
          <button onClick={handleHide} className="btn bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" /></svg>
            Stop
          </button>
        </div>

        {/* Browser Source Info */}
        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-xs text-gray-400">
            <span className="font-medium text-blue-400">OBS Browser Source:</span><br />
            <code className="text-gray-300 select-all text-[10px] sm:text-xs break-all">http://localhost:3000/overlay/now-playing</code>
            <span className="text-gray-500 ml-1 sm:ml-2 text-[10px] sm:text-xs">(1920x1080)</span>
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default NowPlayingControl;
