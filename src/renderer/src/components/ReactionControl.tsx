import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const { ipcRenderer } = window.require('electron');

interface Props {
  config: any;
}

interface ReactionSource {
  id: string;
  name: string;
  channelName: string;
  channelAvatar: string;
  videoTitle: string;
  videoThumbnail: string;
  platform: 'youtube' | 'twitch' | 'tiktok' | 'twitter';
}

type StyleType = 'clean' | 'broadcast' | 'esports';
type PositionType = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
type OverlayType = 'badge' | 'banner' | 'pip';

const platformIcons = {
  youtube: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  ),
  twitch: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
    </svg>
  ),
  tiktok: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
    </svg>
  ),
  twitter: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  ),
};

function ReactionControl({ config }: Props) {
  const reactionConfig = config.overlays?.reaction || {
    sources: [],
    activeSourceId: '',
    style: 'clean',
    displayDuration: 0,
    showChannelInfo: true,
    showVideoTitle: true,
    position: 'top-right',
    repeatEnabled: false,
    repeatInterval: 60,
    repeatCount: 0,
  };

  const [sources, setSources] = useState<ReactionSource[]>(reactionConfig.sources || []);
  const [activeSourceId, setActiveSourceId] = useState(reactionConfig.activeSourceId || '');
  const [style, setStyle] = useState<StyleType>(reactionConfig.style || 'clean');
  const [position, setPosition] = useState<PositionType>(reactionConfig.position || 'top-right');
  const [showChannelInfo, setShowChannelInfo] = useState(reactionConfig.showChannelInfo !== false);
  const [showVideoTitle, setShowVideoTitle] = useState(reactionConfig.showVideoTitle !== false);
  const [isVisible, setIsVisible] = useState(false);
  const [activeOverlay, setActiveOverlay] = useState<OverlayType | null>(null);
  
  // Timer Settings
  const [displayDuration, setDisplayDuration] = useState(reactionConfig.displayDuration || 0);
  const [repeatEnabled, setRepeatEnabled] = useState(reactionConfig.repeatEnabled || false);
  const [repeatInterval, setRepeatInterval] = useState(reactionConfig.repeatInterval || 60);
  const [repeatCount, setRepeatCount] = useState(reactionConfig.repeatCount || 0);
  const [isPermanent, setIsPermanent] = useState((reactionConfig.displayDuration || 0) === 0);
  
  // Repeat timer refs
  const repeatTimerRef = useRef<NodeJS.Timeout | null>(null);
  const repeatCounterRef = useRef(0);
  
  // Edit Mode
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
  const [editSource, setEditSource] = useState<Partial<ReactionSource>>({});
  
  // New Source Form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSource, setNewSource] = useState<Partial<ReactionSource>>({
    platform: 'youtube',
    name: '',
    channelName: '',
    channelAvatar: '',
    videoTitle: '',
    videoThumbnail: '',
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const editAvatarInputRef = useRef<HTMLInputElement>(null);
  const editThumbnailInputRef = useRef<HTMLInputElement>(null);

  const activeSource = sources.find(s => s.id === activeSourceId);

  // Save settings when changed
  useEffect(() => {
    saveSettings();
  }, [style, position, showChannelInfo, showVideoTitle, displayDuration, repeatEnabled, repeatInterval, repeatCount]);

  // Cleanup repeat timer on unmount
  useEffect(() => {
    return () => {
      if (repeatTimerRef.current) {
        clearInterval(repeatTimerRef.current);
      }
    };
  }, []);

  const saveSettings = () => {
    ipcRenderer.invoke('save-reaction-settings', {
      sources,
      activeSourceId,
      style,
      position,
      showChannelInfo,
      showVideoTitle,
      displayDuration: isPermanent ? 0 : displayDuration,
      repeatEnabled,
      repeatInterval,
      repeatCount,
    });
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setNewSource(prev => ({ ...prev, channelAvatar: event.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setNewSource(prev => ({ ...prev, videoThumbnail: event.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  // Edit Mode Handlers
  const handleEditAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setEditSource(prev => ({ ...prev, channelAvatar: event.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleEditThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setEditSource(prev => ({ ...prev, videoThumbnail: event.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const startEditing = (source: ReactionSource) => {
    setEditingSourceId(source.id);
    setEditSource({ ...source });
  };

  const cancelEditing = () => {
    setEditingSourceId(null);
    setEditSource({});
  };

  const saveEditedSource = () => {
    if (!editingSourceId || !editSource.name || !editSource.channelName) return;
    
    const updated = sources.map(s => 
      s.id === editingSourceId 
        ? { ...s, ...editSource } as ReactionSource 
        : s
    );
    setSources(updated);
    ipcRenderer.invoke('update-reaction-source', { id: editingSourceId, ...editSource });
    setEditingSourceId(null);
    setEditSource({});
  };

  const addSource = () => {
    if (!newSource.name || !newSource.channelName) return;
    
    const source: ReactionSource = {
      id: `reaction-${Date.now()}`,
      name: newSource.name || '',
      channelName: newSource.channelName || '',
      channelAvatar: newSource.channelAvatar || '',
      videoTitle: newSource.videoTitle || '',
      videoThumbnail: newSource.videoThumbnail || '',
      platform: newSource.platform || 'youtube',
    };
    
    const updated = [...sources, source];
    setSources(updated);
    ipcRenderer.invoke('add-reaction-source', source);
    
    // Reset form
    setNewSource({
      platform: 'youtube',
      name: '',
      channelName: '',
      channelAvatar: '',
      videoTitle: '',
      videoThumbnail: '',
    });
    setShowAddForm(false);
    
    // Auto-select if first source
    if (updated.length === 1) {
      setActiveSourceId(source.id);
    }
  };

  const removeSource = (sourceId: string) => {
    const updated = sources.filter(s => s.id !== sourceId);
    setSources(updated);
    ipcRenderer.invoke('remove-reaction-source', sourceId);
    
    if (activeSourceId === sourceId) {
      setActiveSourceId(updated.length > 0 ? updated[0].id : '');
    }
  };

  const triggerShow = (overlayType: OverlayType) => {
    if (!activeSource) return;
    
    // Stop any existing repeat timer
    if (repeatTimerRef.current) {
      clearInterval(repeatTimerRef.current);
      repeatTimerRef.current = null;
    }
    repeatCounterRef.current = 0;
    
    const sendShowEvent = () => {
      ipcRenderer.invoke('trigger-overlay', {
        action: 'SHOW',
        module: 'REACTION',
        payload: {
          layout: overlayType,
          style,
          channel: activeSource.channelName,
          title: activeSource.videoTitle,
          avatar: activeSource.channelAvatar,
          thumbnail: activeSource.videoThumbnail,
          platform: activeSource.platform,
          category: activeSource.name,
          displayDuration: isPermanent ? 0 : displayDuration,
        },
      });
    };
    
    // Initial show
    sendShowEvent();
    setIsVisible(true);
    setActiveOverlay(overlayType);
    
    // Set up repeat timer if enabled
    if (repeatEnabled && repeatInterval > 0) {
      repeatTimerRef.current = setInterval(() => {
        repeatCounterRef.current += 1;
        
        // Check if we've reached the repeat limit
        if (repeatCount > 0 && repeatCounterRef.current >= repeatCount) {
          if (repeatTimerRef.current) {
            clearInterval(repeatTimerRef.current);
            repeatTimerRef.current = null;
          }
          return;
        }
        
        sendShowEvent();
      }, repeatInterval * 1000);
    }
  };

  const triggerHide = () => {
    // Stop repeat timer
    if (repeatTimerRef.current) {
      clearInterval(repeatTimerRef.current);
      repeatTimerRef.current = null;
    }
    repeatCounterRef.current = 0;
    
    ipcRenderer.invoke('trigger-overlay', {
      action: 'HIDE',
      module: 'REACTION',
      payload: {},
    });
    setIsVisible(false);
    setActiveOverlay(null);
  };

  const styles = [
    {
      id: 'clean' as StyleType,
      name: 'Clean',
      description: 'Minimalistisch',
      color: 'from-gray-700 to-gray-900',
      borderColor: 'border-indigo-500',
    },
    {
      id: 'broadcast' as StyleType,
      name: 'Broadcast',
      description: 'TV-Style',
      color: 'from-orange-500 to-red-600',
      borderColor: 'border-orange-500',
    },
    {
      id: 'esports' as StyleType,
      name: 'Esports',
      description: 'Gaming',
      color: 'from-purple-600 to-indigo-600',
      borderColor: 'border-purple-500',
    },
  ];

  const positions = [
    { id: 'top-left', label: 'Oben Links' },
    { id: 'top-right', label: 'Oben Rechts' },
    { id: 'bottom-left', label: 'Unten Links' },
    { id: 'bottom-right', label: 'Unten Rechts' },
  ];

  const overlayTypes = [
    {
      id: 'badge' as OverlayType,
      name: 'Badge',
      description: 'Kompaktes Badge mit Kanal-Info',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
    },
    {
      id: 'banner' as OverlayType,
      name: 'Banner',
      description: 'Breites Banner mit Video-Thumbnail',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" />
        </svg>
      ),
    },
    {
      id: 'pip' as OverlayType,
      name: 'Picture-in-Picture',
      description: 'Großes Overlay mit allen Details',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  // Preview Component
  const renderPreview = () => {
    const preview = activeSource || {
      id: 'preview',
      name: 'Creator Name',
      channelName: '@channel',
      channelAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=React',
      videoTitle: 'Amazing Video Title Here',
      videoThumbnail: '',
      platform: 'youtube' as const,
    };

    return (
      <div className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-black/60 backdrop-blur-xl">
        <div className="relative flex-shrink-0">
          {preview.channelAvatar ? (
            <img 
              src={preview.channelAvatar} 
              alt="Avatar" 
              className="w-10 h-10 rounded-full object-cover border-2 border-white/30" 
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
              <span className="text-white text-sm font-bold">{preview.name.charAt(0)}</span>
            </div>
          )}
          <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${
            preview.platform === 'youtube' ? 'bg-red-600' :
            preview.platform === 'twitch' ? 'bg-purple-600' :
            preview.platform === 'tiktok' ? 'bg-black' : 'bg-black'
          }`}>
            {platformIcons[preview.platform]}
          </div>
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-white text-sm font-bold truncate">{preview.name}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 font-medium">REACTION</span>
          </div>
          <span className="text-gray-400 text-xs truncate">{preview.channelName}</span>
          {showVideoTitle && preview.videoTitle && (
            <span className="text-gray-500 text-[10px] truncate mt-0.5">📺 {preview.videoTitle}</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Browser Source URL */}
      <div className="glass-panel p-4 flex items-center justify-between bg-black/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-white">Browser Source URL</h3>
            <p className="text-xs text-zinc-400">Füge diese URL in OBS als Browser Source hinzu</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-black/40 rounded-lg border border-white/5 px-3 py-2">
          <code className="text-xs font-mono text-red-400 select-all">/overlay/reaction</code>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        {/* Left Column: Preview & Actions */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Preview Area */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 relative overflow-hidden flex-1 min-h-[300px] flex flex-col">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
            <div className="absolute inset-0 opacity-30 bg-[url('https://images.unsplash.com/photo-1542751371-adc38448a05e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')] bg-cover bg-center"></div>
            
            <div className="relative z-10 flex-1 flex items-center justify-center">
              <div className="transform scale-110 transition-transform">
                {renderPreview()}
              </div>
            </div>

            {/* Live Indicator */}
            {isVisible && (
              <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full z-20">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                <span className="text-xs font-medium text-red-400 tracking-wide">LIVE</span>
              </div>
            )}
          </div>

          {/* Overlay Controls */}
          <div className="grid grid-cols-3 gap-4">
            {overlayTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => triggerShow(type.id)}
                disabled={!activeSource}
                className={`relative p-4 rounded-xl border transition-all duration-200 text-left group overflow-hidden ${
                  activeOverlay === type.id
                    ? 'bg-indigo-500/20 border-indigo-500/50 shadow-lg shadow-indigo-500/10'
                    : 'glass-panel border-white/5 hover:bg-zinc-800/50 hover:border-white/10 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                <div className={`mb-3 p-2 rounded-lg w-fit ${
                  activeOverlay === type.id ? 'bg-indigo-500 text-white' : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {type.icon}
                </div>
                <div className="font-medium text-sm text-zinc-200">{type.name}</div>
                <div className="text-xs text-zinc-500 mt-1">{type.description}</div>
              </button>
            ))}
          </div>

          {isVisible && (
            <button
              onClick={triggerHide}
              className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/50 text-red-400 font-bold rounded-xl transition-all flex items-center justify-center gap-2 group"
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
              Overlay Ausblenden
            </button>
          )}
        </div>

        {/* Right Column: Settings & Sources */}
        <div className="lg:col-span-5 space-y-6 flex flex-col">
          {/* Sources List */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Quellen
              </h3>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="p-2 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            {/* Add Form */}
            <AnimatePresence>
              {showAddForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mb-4"
                >
                  <div className="p-4 bg-zinc-900/50 rounded-xl border border-white/10 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Plattform</label>
                        <select
                          value={newSource.platform}
                          onChange={(e) => setNewSource(prev => ({ ...prev, platform: e.target.value as any }))}
                          className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500/50"
                        >
                          <option value="youtube">YouTube</option>
                          <option value="twitch">Twitch</option>
                          <option value="tiktok">TikTok</option>
                          <option value="twitter">X / Twitter</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Bezeichnung</label>
                        <input
                          type="text"
                          value={newSource.name || ''}
                          onChange={(e) => setNewSource(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="z.B. MrBeast"
                          className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500/50"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Kanal-Name</label>
                        <input
                          type="text"
                          value={newSource.channelName || ''}
                          onChange={(e) => setNewSource(prev => ({ ...prev, channelName: e.target.value }))}
                          placeholder="@MrBeast"
                          className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-400 mb-1">Video-Titel</label>
                        <input
                          type="text"
                          value={newSource.videoTitle || ''}
                          onChange={(e) => setNewSource(prev => ({ ...prev, videoTitle: e.target.value }))}
                          placeholder="Video Titel"
                          className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500/50"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center justify-center gap-2 bg-zinc-900 border border-white/10 hover:border-white/20 rounded-lg px-3 py-2 text-zinc-400 text-sm transition-all"
                      >
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                        {newSource.channelAvatar ? <span className="text-green-400">Avatar OK</span> : <span>Avatar Upload</span>}
                      </button>
                      <button
                        onClick={() => thumbnailInputRef.current?.click()}
                        className="flex items-center justify-center gap-2 bg-zinc-900 border border-white/10 hover:border-white/20 rounded-lg px-3 py-2 text-zinc-400 text-sm transition-all"
                      >
                        <input ref={thumbnailInputRef} type="file" accept="image/*" onChange={handleThumbnailUpload} className="hidden" />
                        {newSource.videoThumbnail ? <span className="text-green-400">Thumb OK</span> : <span>Thumb Upload</span>}
                      </button>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => setShowAddForm(false)}
                        className="px-3 py-1.5 text-zinc-400 hover:text-white text-sm"
                      >
                        Abbrechen
                      </button>
                      <button
                        onClick={addSource}
                        disabled={!newSource.name || !newSource.channelName}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
                      >
                        Speichern
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar min-h-[200px]">
              {sources.length === 0 ? (
                <div className="text-center py-8 text-zinc-500">
                  <p className="text-sm">Keine Quellen vorhanden</p>
                </div>
              ) : (
                sources.map((source) => (
                  <div
                    key={source.id}
                    onClick={() => setActiveSourceId(source.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                      activeSourceId === source.id
                        ? 'bg-indigo-500/10 border-indigo-500/30'
                        : 'bg-zinc-900/30 border-transparent hover:bg-zinc-900/50'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      {source.channelAvatar ? (
                        <img src={source.channelAvatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-white font-bold">
                          {source.name.charAt(0)}
                        </div>
                      )}
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center ${
                        source.platform === 'youtube' ? 'bg-red-600' :
                        source.platform === 'twitch' ? 'bg-purple-600' :
                        source.platform === 'tiktok' ? 'bg-black' : 'bg-black'
                      }`}>
                        <span className="scale-75 text-white">{platformIcons[source.platform]}</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-medium truncate">{source.name}</div>
                      <div className="text-zinc-400 text-xs truncate">{source.channelName}</div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeSource(source.id); }}
                      className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Settings */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Einstellungen</h3>
            
            <div className="space-y-4">
              {/* Style & Position */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-zinc-500 mb-2">Stil</label>
                  <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value as StyleType)}
                    className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50"
                  >
                    {styles.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-2">Position</label>
                  <select
                    value={position}
                    onChange={(e) => setPosition(e.target.value as PositionType)}
                    className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50"
                  >
                    {positions.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Toggles */}
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showChannelInfo}
                    onChange={(e) => setShowChannelInfo(e.target.checked)}
                    className="rounded border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-indigo-500/50"
                  />
                  <span className="text-sm text-zinc-300">Kanal-Info</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showVideoTitle}
                    onChange={(e) => setShowVideoTitle(e.target.checked)}
                    className="rounded border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-indigo-500/50"
                  />
                  <span className="text-sm text-zinc-300">Video-Titel</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReactionControl;
