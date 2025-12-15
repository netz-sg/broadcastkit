import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const { ipcRenderer } = window.require('electron');

interface Props {
  config: any;
}

type StyleType = 'clean' | 'broadcast' | 'esports';

function LowerThirdControl({ config }: Props) {
  const [name, setName] = useState(config.overlays.lowerThird.lastUsedName || '');
  const [title, setTitle] = useState(config.overlays.lowerThird.lastUsedTitle || '');
  const [style, setStyle] = useState<StyleType>(config.overlays.lowerThird.style || 'clean');
  const [avatar, setAvatar] = useState<string>(config.overlays.lowerThird.avatar || '');
  const [isVisible, setIsVisible] = useState(false);
  
  // Timing Settings
  const [displayDuration, setDisplayDuration] = useState(config.overlays.lowerThird.displayDuration || 8);
  const [autoShowEnabled, setAutoShowEnabled] = useState(config.overlays.lowerThird.autoShowEnabled || false);
  const [autoShowInterval, setAutoShowInterval] = useState(config.overlays.lowerThird.autoShowInterval || 15);
  const [nextAutoShow, setNextAutoShow] = useState<string | null>(null);
  
  const autoShowTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const nextShowTimeRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-Show Timer
  useEffect(() => {
    if (autoShowEnabled && name) {
      startAutoShowTimer();
    } else {
      stopAutoShowTimer();
    }
    return () => stopAutoShowTimer();
  }, [autoShowEnabled, autoShowInterval, name, title]);

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

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setAvatar(event.target?.result as string);
    reader.readAsDataURL(file);
  };

  const removeAvatar = () => {
    setAvatar('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleShow = () => {
    ipcRenderer.invoke('trigger-overlay', {
      action: 'SHOW',
      module: 'LOWER_THIRD',
      payload: { name, title, style, avatar, duration: displayDuration },
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

  const handleHide = () => {
    ipcRenderer.invoke('trigger-overlay', {
      action: 'HIDE',
      module: 'LOWER_THIRD',
      payload: {},
    });
    setIsVisible(false);
  };

  const saveSettings = () => {
    ipcRenderer.invoke('save-lower-third-settings', {
      displayDuration,
      autoShowEnabled,
      autoShowInterval,
      style,
      avatar,
    });
  };

  useEffect(() => {
    saveSettings();
  }, [displayDuration, autoShowEnabled, autoShowInterval, style, avatar]);

  // New Pro Style Definitions
  const styles = [
    {
      id: 'clean' as StyleType,
      name: 'Clean Pro',
      description: 'Frosted Glass, Dark',
      color: 'from-zinc-700 to-zinc-900',
      borderColor: 'border-accent-blue',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
    },
    {
      id: 'broadcast' as StyleType,
      name: 'News Room',
      description: 'Motion Graphics',
      color: 'from-orange-500 to-red-600',
      borderColor: 'border-orange-500',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: 'esports' as StyleType,
      name: 'Tournament',
      description: 'Cyberpunk/Glitch',
      color: 'from-purple-600 to-indigo-600',
      borderColor: 'border-purple-500',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
  ];

  // Preview Component - New Pro Designs
  const renderPreview = () => {
    const previewName = name || 'Player Name';
    const previewTitle = title || '@handle';
    const previewAvatar = avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix';

    switch (style) {
      case 'clean':
        return (
          <div className="flex items-center gap-4 p-2 pr-6 rounded-full border border-white/10 bg-black/60 backdrop-blur-xl">
            <div className="relative">
              <div className="absolute inset-0 rounded-full animate-pulse bg-white/20"></div>
              <img src={previewAvatar} alt="Avatar" className="w-12 h-12 rounded-full object-cover border-2 border-white/80 relative z-10" />
              <div className="absolute bottom-0 right-0 bg-green-500 w-3 h-3 rounded-full border-2 border-black z-20 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-white text-sm font-bold tracking-tight">{previewName}</h1>
              <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] font-semibold tracking-wide uppercase">
                <span className="bg-accent-blue/20 px-1 py-0.5 rounded text-accent-blue border border-accent-blue/30 text-[8px]">Host</span>
                <span>{previewTitle}</span>
              </div>
            </div>
          </div>
        );

      case 'broadcast':
        return (
          <div className="flex flex-col items-start scale-90 origin-left">
            <div className="w-16 h-0.5 bg-gradient-to-r from-orange-500 to-yellow-500 mb-0.5 rounded-full"></div>
            <div className="flex bg-zinc-900 border-l-2 border-orange-500 rounded-r-md overflow-hidden">
              <div className="px-4 py-2">
                <h1 className="text-lg font-black text-white uppercase tracking-tighter leading-none">{previewName}</h1>
              </div>
            </div>
            <div className="mt-[-2px] ml-3 bg-white text-zinc-900 px-3 py-0.5 rounded-b-md font-bold text-[10px] tracking-wide flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></div>
              {previewTitle}
            </div>
          </div>
        );

      case 'esports':
        return (
          <div className="transform -skew-x-6 origin-bottom-left scale-90">
            <div className="relative p-[2px] bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600" style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}>
              <div className="bg-[#0f0f0f] px-6 py-3 relative overflow-hidden" style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}>
                <div className="absolute inset-0 opacity-20 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:8px_8px]"></div>
                <div className="transform skew-x-6 relative z-10">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-yellow-400 font-bold text-[8px] tracking-[0.15em] uppercase border border-yellow-400/30 px-1.5 py-0.5 rounded-sm">Player 01</span>
                  </div>
                  <h1 className="text-xl font-extrabold text-white uppercase tracking-tight drop-shadow-[0_1px_0_rgba(147,51,234,1)]">{previewName}</h1>
                  <h2 className="text-zinc-400 font-medium tracking-widest text-[10px] uppercase">{previewTitle}</h2>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 w-full max-w-4xl mx-auto">
      {/* Browser Source URL */}
      <div className="glass-panel p-4 flex items-center justify-between bg-black/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-white">Browser Source URL</h3>
            <p className="text-xs text-zinc-400">Füge diese URL in OBS als Browser Source hinzu</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-black/40 rounded-lg border border-white/5 px-3 py-2">
          <code className="text-xs font-mono text-purple-400 select-all">/overlay/lower-third</code>
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
          {renderPreview()}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Controls */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-accent-purple/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-accent-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white">Content</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="input w-full" 
                  placeholder="z.B. Alex Rivera" 
                />
              </div>
              <div>
                <label className="label">Subtitle / Handle</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  className="input w-full" 
                  placeholder="z.B. @username" 
                />
              </div>
            </div>

            {/* Avatar Upload - Only for Clean style */}
            {style === 'clean' && (
              <div className="p-4 bg-zinc-900/30 rounded-xl border border-white/5">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Avatar Image</h4>
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    {avatar ? (
                      <img src={avatar} alt="Avatar" className="w-14 h-14 rounded-full object-cover border-2 border-accent-blue shadow-lg shadow-accent-blue/20" />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-zinc-800/50 border-2 border-dashed border-zinc-700 flex items-center justify-center">
                        <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    {avatar && (
                      <button onClick={removeAvatar} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <div className="flex-1">
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" id="avatar-upload" />
                    <label htmlFor="avatar-upload" className="btn-secondary text-xs py-2 cursor-pointer inline-flex items-center gap-2">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Choose Image
                    </label>
                    <p className="text-[10px] text-zinc-500 mt-1.5">Recommended: 200x200px PNG or JPG</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Design Style Selection */}
          <div className="glass-panel p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                min="3" 
                max="30" 
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
              disabled={!name && !title} 
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

export default LowerThirdControl;
