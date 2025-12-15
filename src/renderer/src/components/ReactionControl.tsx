import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const { ipcRenderer } = window.require('electron');

interface Props {
  config: any;
  fullWidth?: boolean;
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

function ReactionControl({ config, fullWidth = false }: Props) {
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
    <div className={`space-y-4 ${fullWidth ? '' : 'max-w-2xl'}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Reaction Overlay</h2>
          <p className="text-sm text-gray-400">Zeige an, auf welches Video du reagierst</p>
        </div>
        {isVisible && (
          <span className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 border border-red-500/30 rounded-full">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            <span className="text-red-400 text-sm font-medium">Live</span>
          </span>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column - Sources */}
        <div className="space-y-4">
          {/* Source List */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Gespeicherte Quellen</h3>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-blue/20 hover:bg-accent-blue/30 text-accent-blue border border-accent-blue/30 rounded-lg text-sm font-medium transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Hinzufügen
              </button>
            </div>

            {/* Add Source Form */}
            <AnimatePresence>
              {showAddForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mb-4"
                >
                  <div className="p-4 bg-dark-hover rounded-lg border border-white/5 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Plattform</label>
                        <select
                          value={newSource.platform}
                          onChange={(e) => setNewSource(prev => ({ ...prev, platform: e.target.value as any }))}
                          className="w-full bg-dark-card border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent-blue/50"
                        >
                          <option value="youtube">YouTube</option>
                          <option value="twitch">Twitch</option>
                          <option value="tiktok">TikTok</option>
                          <option value="twitter">X / Twitter</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Bezeichnung</label>
                        <input
                          type="text"
                          value={newSource.name || ''}
                          onChange={(e) => setNewSource(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="z.B. MrBeast Reaction"
                          className="w-full bg-dark-card border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent-blue/50"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Kanal-Name</label>
                        <input
                          type="text"
                          value={newSource.channelName || ''}
                          onChange={(e) => setNewSource(prev => ({ ...prev, channelName: e.target.value }))}
                          placeholder="@MrBeast"
                          className="w-full bg-dark-card border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent-blue/50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Video-Titel</label>
                        <input
                          type="text"
                          value={newSource.videoTitle || ''}
                          onChange={(e) => setNewSource(prev => ({ ...prev, videoTitle: e.target.value }))}
                          placeholder="$1,000,000 Challenge"
                          className="w-full bg-dark-card border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent-blue/50"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Kanal-Avatar</label>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full flex items-center justify-center gap-2 bg-dark-card border border-white/10 hover:border-white/20 rounded-lg px-3 py-2 text-gray-400 text-sm transition-all"
                        >
                          {newSource.channelAvatar ? (
                            <>
                              <img src={newSource.channelAvatar} className="w-5 h-5 rounded-full" />
                              <span className="text-white">Bild gewählt</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span>Bild hochladen</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Video-Thumbnail</label>
                        <input
                          ref={thumbnailInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleThumbnailUpload}
                          className="hidden"
                        />
                        <button
                          onClick={() => thumbnailInputRef.current?.click()}
                          className="w-full flex items-center justify-center gap-2 bg-dark-card border border-white/10 hover:border-white/20 rounded-lg px-3 py-2 text-gray-400 text-sm transition-all"
                        >
                          {newSource.videoThumbnail ? (
                            <>
                              <img src={newSource.videoThumbnail} className="w-8 h-5 rounded object-cover" />
                              <span className="text-white">Thumbnail gewählt</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              <span>Thumbnail</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => setShowAddForm(false)}
                        className="px-4 py-2 text-gray-400 hover:text-white text-sm transition-colors"
                      >
                        Abbrechen
                      </button>
                      <button
                        onClick={addSource}
                        disabled={!newSource.name || !newSource.channelName}
                        className="px-4 py-2 bg-accent-blue hover:bg-accent-blue/80 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-all"
                      >
                        Speichern
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Source List */}
            {sources.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p className="text-sm">Keine Quellen vorhanden</p>
                <p className="text-xs mt-1">Füge eine Reaction-Quelle hinzu</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sources.map((source) => (
                  <div
                    key={source.id}
                    onClick={() => setActiveSourceId(source.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                      activeSourceId === source.id
                        ? 'bg-accent-blue/20 border border-accent-blue/30'
                        : 'bg-dark-hover hover:bg-dark-hover/80 border border-transparent'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      {source.channelAvatar ? (
                        <img 
                          src={source.channelAvatar} 
                          alt={source.name} 
                          className="w-10 h-10 rounded-full object-cover" 
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
                          <span className="text-white text-sm font-bold">{source.name.charAt(0)}</span>
                        </div>
                      )}
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center ${
                        source.platform === 'youtube' ? 'bg-red-600' :
                        source.platform === 'twitch' ? 'bg-purple-600' :
                        source.platform === 'tiktok' ? 'bg-black' : 'bg-black'
                      }`}>
                        <span className="scale-75">{platformIcons[source.platform]}</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-medium truncate">{source.name}</div>
                      <div className="text-gray-400 text-xs truncate">{source.channelName}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditing(source);
                        }}
                        className="p-1.5 text-gray-500 hover:text-accent-blue transition-colors"
                        title="Bearbeiten"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSource(source.id);
                        }}
                        className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"
                        title="Löschen"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Edit Source Modal */}
            <AnimatePresence>
              {editingSourceId && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                  onClick={cancelEditing}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-dark-card border border-white/10 rounded-xl p-6 max-w-md w-full space-y-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h3 className="text-lg font-semibold text-white">Quelle bearbeiten</h3>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Plattform</label>
                        <select
                          value={editSource.platform || 'youtube'}
                          onChange={(e) => setEditSource(prev => ({ ...prev, platform: e.target.value as any }))}
                          className="w-full bg-dark-hover border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent-blue/50"
                        >
                          <option value="youtube">YouTube</option>
                          <option value="twitch">Twitch</option>
                          <option value="tiktok">TikTok</option>
                          <option value="twitter">X / Twitter</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Bezeichnung</label>
                        <input
                          type="text"
                          value={editSource.name || ''}
                          onChange={(e) => setEditSource(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full bg-dark-hover border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent-blue/50"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Kanal-Name</label>
                        <input
                          type="text"
                          value={editSource.channelName || ''}
                          onChange={(e) => setEditSource(prev => ({ ...prev, channelName: e.target.value }))}
                          className="w-full bg-dark-hover border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent-blue/50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Video-Titel</label>
                        <input
                          type="text"
                          value={editSource.videoTitle || ''}
                          onChange={(e) => setEditSource(prev => ({ ...prev, videoTitle: e.target.value }))}
                          className="w-full bg-dark-hover border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent-blue/50"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Kanal-Avatar</label>
                        <input
                          ref={editAvatarInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleEditAvatarUpload}
                          className="hidden"
                        />
                        <button
                          onClick={() => editAvatarInputRef.current?.click()}
                          className="w-full flex items-center justify-center gap-2 bg-dark-hover border border-white/10 hover:border-white/20 rounded-lg px-3 py-2 text-gray-400 text-sm transition-all"
                        >
                          {editSource.channelAvatar ? (
                            <>
                              <img src={editSource.channelAvatar} className="w-5 h-5 rounded-full" />
                              <span className="text-white">Ändern</span>
                            </>
                          ) : (
                            <span>Bild hochladen</span>
                          )}
                        </button>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Video-Thumbnail</label>
                        <input
                          ref={editThumbnailInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleEditThumbnailUpload}
                          className="hidden"
                        />
                        <button
                          onClick={() => editThumbnailInputRef.current?.click()}
                          className="w-full flex items-center justify-center gap-2 bg-dark-hover border border-white/10 hover:border-white/20 rounded-lg px-3 py-2 text-gray-400 text-sm transition-all"
                        >
                          {editSource.videoThumbnail ? (
                            <>
                              <img src={editSource.videoThumbnail} className="w-8 h-5 rounded object-cover" />
                              <span className="text-white">Ändern</span>
                            </>
                          ) : (
                            <span>Thumbnail</span>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={cancelEditing}
                        className="px-4 py-2 text-gray-400 hover:text-white text-sm transition-colors"
                      >
                        Abbrechen
                      </button>
                      <button
                        onClick={saveEditedSource}
                        disabled={!editSource.name || !editSource.channelName}
                        className="px-4 py-2 bg-accent-blue hover:bg-accent-blue/80 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-all"
                      >
                        Speichern
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Settings */}
          <div className="card">
            <h3 className="text-sm font-semibold text-white mb-4">Einstellungen</h3>
            
            {/* Style Selection */}
            <div className="mb-4">
              <label className="block text-xs text-gray-400 mb-2">Design-Stil</label>
              <div className="grid grid-cols-3 gap-2">
                {styles.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStyle(s.id)}
                    className={`p-3 rounded-lg border transition-all ${
                      style === s.id
                        ? `bg-gradient-to-br ${s.color} border-white/20`
                        : 'bg-dark-hover border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="text-white text-xs font-medium">{s.name}</div>
                    <div className="text-gray-400 text-[10px]">{s.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Position Selection */}
            <div className="mb-4">
              <label className="block text-xs text-gray-400 mb-2">Position</label>
              <div className="grid grid-cols-2 gap-2">
                {positions.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPosition(p.id as PositionType)}
                    className={`px-3 py-2 rounded-lg border text-xs transition-all ${
                      position === p.id
                        ? 'bg-accent-blue/20 border-accent-blue/30 text-white'
                        : 'bg-dark-hover border-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggle Options */}
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-gray-300">Kanal-Info anzeigen</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={showChannelInfo}
                    onChange={(e) => setShowChannelInfo(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-10 h-6 rounded-full transition-colors ${showChannelInfo ? 'bg-accent-blue' : 'bg-gray-600'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${showChannelInfo ? 'translate-x-5' : 'translate-x-1'}`}></div>
                  </div>
                </div>
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-gray-300">Video-Titel anzeigen</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={showVideoTitle}
                    onChange={(e) => setShowVideoTitle(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-10 h-6 rounded-full transition-colors ${showVideoTitle ? 'bg-accent-blue' : 'bg-gray-600'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${showVideoTitle ? 'translate-x-5' : 'translate-x-1'}`}></div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Timer Settings */}
          <div className="card">
            <h3 className="text-sm font-semibold text-white mb-4">Timer & Wiederholung</h3>
            
            {/* Permanent Toggle */}
            <div className="mb-4">
              <label className="flex items-center justify-between cursor-pointer p-3 bg-dark-hover rounded-lg">
                <div>
                  <span className="text-sm text-white font-medium">Dauerhaft einblenden</span>
                  <p className="text-xs text-gray-500">Overlay bleibt bis manuell ausgeblendet</p>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={isPermanent}
                    onChange={(e) => setIsPermanent(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-10 h-6 rounded-full transition-colors ${isPermanent ? 'bg-accent-green' : 'bg-gray-600'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${isPermanent ? 'translate-x-5' : 'translate-x-1'}`}></div>
                  </div>
                </div>
              </label>
            </div>

            {/* Display Duration (only if not permanent) */}
            {!isPermanent && (
              <div className="mb-4">
                <label className="block text-xs text-gray-400 mb-2">Anzeigedauer (Sekunden)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="3"
                    max="60"
                    value={displayDuration || 10}
                    onChange={(e) => setDisplayDuration(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-accent-blue"
                  />
                  <span className="text-white font-mono text-sm w-12 text-right">{displayDuration || 10}s</span>
                </div>
              </div>
            )}

            {/* Repeat Settings */}
            <div className="border-t border-white/5 pt-4 mt-4">
              <label className="flex items-center justify-between cursor-pointer mb-3">
                <div>
                  <span className="text-sm text-white font-medium">Wiederholung aktivieren</span>
                  <p className="text-xs text-gray-500">Overlay automatisch wiederholen</p>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={repeatEnabled}
                    onChange={(e) => setRepeatEnabled(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-10 h-6 rounded-full transition-colors ${repeatEnabled ? 'bg-accent-purple' : 'bg-gray-600'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${repeatEnabled ? 'translate-x-5' : 'translate-x-1'}`}></div>
                  </div>
                </div>
              </label>

              {repeatEnabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  {/* Repeat Interval */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-2">Wiederholungsintervall (Sekunden)</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="10"
                        max="300"
                        step="5"
                        value={repeatInterval}
                        onChange={(e) => setRepeatInterval(parseInt(e.target.value))}
                        className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-accent-purple"
                      />
                      <span className="text-white font-mono text-sm w-16 text-right">{repeatInterval}s</span>
                    </div>
                  </div>

                  {/* Repeat Count */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-2">Anzahl Wiederholungen</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[0, 3, 5, 10].map((count) => (
                        <button
                          key={count}
                          onClick={() => setRepeatCount(count)}
                          className={`px-3 py-2 rounded-lg border text-xs transition-all ${
                            repeatCount === count
                              ? 'bg-accent-purple/20 border-accent-purple/30 text-white'
                              : 'bg-dark-hover border-white/5 text-gray-400 hover:text-white'
                          }`}
                        >
                          {count === 0 ? '∞' : `${count}x`}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {repeatCount === 0 ? 'Unendlich wiederholen' : `${repeatCount} mal wiederholen`}
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Preview & Controls */}
        <div className="space-y-4">
          {/* Preview */}
          <div className="card">
            <h3 className="text-sm font-semibold text-white mb-4">Vorschau</h3>
            <div className="bg-gradient-to-br from-gray-900 to-black p-6 rounded-lg border border-white/5 min-h-[120px] flex items-center justify-center">
              {renderPreview()}
            </div>
          </div>

          {/* Overlay Type Buttons */}
          <div className="card">
            <h3 className="text-sm font-semibold text-white mb-4">Overlay anzeigen</h3>
            <div className="grid grid-cols-1 gap-3">
              {overlayTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => triggerShow(type.id)}
                  disabled={!activeSource}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                    activeOverlay === type.id
                      ? 'bg-accent-green/20 border-accent-green/30'
                      : 'bg-dark-hover border-white/5 hover:border-white/10 disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  <div className={`p-3 rounded-lg ${activeOverlay === type.id ? 'bg-accent-green/20 text-accent-green' : 'bg-white/5 text-gray-400'}`}>
                    {type.icon}
                  </div>
                  <div className="text-left">
                    <div className="text-white font-medium">{type.name}</div>
                    <div className="text-gray-400 text-xs">{type.description}</div>
                  </div>
                  {activeOverlay === type.id && (
                    <div className="ml-auto">
                      <span className="flex items-center gap-1.5 px-2 py-1 bg-accent-green/20 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse"></span>
                        <span className="text-accent-green text-xs">Aktiv</span>
                      </span>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Hide Button */}
            {isVisible && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={triggerHide}
                className="w-full mt-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-xl font-medium transition-all"
              >
                Overlay ausblenden
              </motion.button>
            )}
          </div>

          {/* Browser Sources Info */}
          <div className="card bg-gradient-to-br from-dark-card to-dark-hover">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Browser Source</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 p-2 bg-black/30 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <code className="text-gray-300">:3000/overlay/reaction</code>
                <span className="text-gray-500 ml-auto">Alle Layouts</span>
              </div>
              <p className="text-gray-500 text-xs mt-2">
                Ein Overlay für alle Layouts (Badge, Banner, PiP). Wähle oben das gewünschte Layout.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReactionControl;
