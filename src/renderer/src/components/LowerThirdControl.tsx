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
      color: 'from-gray-700 to-gray-900',
      borderColor: 'border-indigo-500',
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
              <div className="flex items-center gap-1.5 text-gray-400 text-[10px] font-semibold tracking-wide uppercase">
                <span className="bg-indigo-500/20 px-1 py-0.5 rounded text-indigo-400 border border-indigo-500/30 text-[8px]">Host</span>
                <span>{previewTitle}</span>
              </div>
            </div>
          </div>
        );

      case 'broadcast':
        return (
          <div className="flex flex-col items-start scale-90 origin-left">
            <div className="w-16 h-0.5 bg-gradient-to-r from-orange-500 to-yellow-500 mb-0.5 rounded-full"></div>
            <div className="flex bg-slate-900 border-l-2 border-orange-500 rounded-r-md overflow-hidden">
              <div className="px-4 py-2">
                <h1 className="text-lg font-black text-white uppercase tracking-tighter leading-none">{previewName}</h1>
              </div>
            </div>
            <div className="mt-[-2px] ml-3 bg-white text-slate-900 px-3 py-0.5 rounded-b-md font-bold text-[10px] tracking-wide flex items-center gap-1.5">
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
                  <h2 className="text-gray-400 font-medium tracking-widest text-[10px] uppercase">{previewTitle}</h2>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="card"
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold">Lower Third</h3>
            <p className="text-xs sm:text-sm text-gray-400">Name & Title Overlay</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {autoShowEnabled && nextAutoShow && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-xs text-indigo-400 font-medium">
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
        {/* Avatar Upload - Only for Clean style */}
        {style === 'clean' && (
          <div className="p-4 bg-dark-hover/50 rounded-lg border border-dark-border">
            <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2 mb-3">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Avatar
            </h4>
            <div className="flex items-center gap-4">
              <div className="relative group">
                {avatar ? (
                  <img src={avatar} alt="Avatar" className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-dark-bg border-2 border-dashed border-dark-border flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
                {avatar && (
                  <button onClick={removeAvatar} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <div className="flex-1">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" id="avatar-upload" />
                <label htmlFor="avatar-upload" className="btn bg-dark-bg border border-dark-border hover:border-indigo-500 cursor-pointer inline-flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Upload
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Name & Title Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input w-full" placeholder="z.B. Alex Rivera" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Subtitle / Handle</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="input w-full" placeholder="z.B. @username" />
          </div>
        </div>

        {/* Design Style Selection */}
        <div className="p-4 bg-dark-hover/50 rounded-lg border border-dark-border">
          <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2 mb-3">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
            Design Theme
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
            <input type="range" min="3" max="30" value={displayDuration} onChange={(e) => setDisplayDuration(parseInt(e.target.value))} className="w-full h-2 bg-dark-border rounded-lg appearance-none cursor-pointer accent-indigo-500" />
          </div>

          <div className="flex items-center justify-between p-3 bg-dark-bg rounded-lg">
            <div>
              <div className="font-medium text-sm">Auto-Show</div>
              <div className="text-xs text-gray-400">Automatic interval display</div>
            </div>
            <button
              onClick={() => setAutoShowEnabled(!autoShowEnabled)}
              className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${autoShowEnabled ? 'bg-indigo-500' : 'bg-dark-border'}`}
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
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${autoShowInterval === mins ? 'bg-indigo-500 text-white' : 'bg-dark-bg text-gray-400 hover:text-white hover:bg-dark-border'}`}
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
          <div className="min-h-[80px] flex items-center">{renderPreview()}</div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button onClick={handleShow} disabled={!name && !title} className="btn flex-1 disabled:opacity-50 disabled:cursor-not-allowed bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            Launch
          </button>
          <button onClick={handleHide} className="btn bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" /></svg>
            Stop
          </button>
        </div>

        {/* Browser Source Info */}
        <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
          <p className="text-xs text-gray-400">
            <span className="font-medium text-indigo-400">OBS Browser Source:</span><br />
            <code className="text-gray-300 select-all text-[10px] sm:text-xs break-all">http://localhost:3000/overlay/lower-third</code>
            <span className="text-gray-500 ml-1 sm:ml-2 text-[10px] sm:text-xs">(1920x1080)</span>
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default LowerThirdControl;
