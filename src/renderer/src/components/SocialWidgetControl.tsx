import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const { ipcRenderer } = window.require('electron');

interface Props {
  config: any;
  fullWidth?: boolean;
}

interface SocialLink {
  id: string;
  platform: 'website' | 'twitter' | 'youtube' | 'instagram' | 'tiktok' | 'discord' | 'twitch';
  label: string;
  enabled: boolean;
}

type StyleType = 'clean' | 'broadcast' | 'esports';

const platformConfig = {
  website: { icon: 'globe', color: 'text-blue-400', bgColor: 'bg-blue-500', label: 'Website' },
  twitter: { icon: 'twitter', color: 'text-sky-400', bgColor: 'bg-sky-500', label: 'Twitter/X' },
  youtube: { icon: 'youtube', color: 'text-red-500', bgColor: 'bg-red-600', label: 'YouTube' },
  instagram: { icon: 'instagram', color: 'text-pink-500', bgColor: 'bg-gradient-to-br from-purple-600 to-pink-500', label: 'Instagram' },
  tiktok: { icon: 'tiktok', color: 'text-white', bgColor: 'bg-black', label: 'TikTok' },
  discord: { icon: 'discord', color: 'text-indigo-400', bgColor: 'bg-indigo-600', label: 'Discord' },
  twitch: { icon: 'twitch', color: 'text-purple-400', bgColor: 'bg-purple-600', label: 'Twitch' },
};

function SocialWidgetControl({ config, fullWidth = false }: Props) {
  const socialConfig = config.overlays.socialWidget || {};
  
  const [links, setLinks] = useState<SocialLink[]>(socialConfig.links || [
    { id: 'website', platform: 'website', label: 'www.mystream.gg', enabled: true },
    { id: 'twitter', platform: 'twitter', label: '@myhandle', enabled: true },
    { id: 'youtube', platform: 'youtube', label: '/MeinKanal', enabled: true },
    { id: 'instagram', platform: 'instagram', label: '@mein.insta', enabled: false },
    { id: 'tiktok', platform: 'tiktok', label: '@meintiktok', enabled: false },
    { id: 'discord', platform: 'discord', label: 'discord.gg/xyz', enabled: false },
    { id: 'twitch', platform: 'twitch', label: '/meintwitch', enabled: false },
  ]);
  const [style, setStyle] = useState<StyleType>(socialConfig.style || 'clean');
  const [displayDuration, setDisplayDuration] = useState(socialConfig.displayDuration || 5);
  const [isRunning, setIsRunning] = useState(socialConfig.isRunning !== false); // Default to true
  const [previewIndex, setPreviewIndex] = useState(0);
  
  const previewTimerRef = useRef<NodeJS.Timeout | null>(null);

  const enabledLinks = links.filter(l => l.enabled);

  // Auto-start widget on mount if there are enabled links
  useEffect(() => {
    if (enabledLinks.length > 0 && isRunning) {
      ipcRenderer.invoke('trigger-overlay', {
        action: 'SHOW',
        module: 'SOCIAL_WIDGET',
        payload: { 
          links: enabledLinks, 
          style, 
          displayDuration,
          running: true 
        },
      });
    }
  }, []); // Only on mount

  // Preview Rotation
  useEffect(() => {
    if (enabledLinks.length === 0) return;
    
    if (previewTimerRef.current) clearInterval(previewTimerRef.current);
    
    previewTimerRef.current = setInterval(() => {
      setPreviewIndex(prev => (prev + 1) % enabledLinks.length);
    }, displayDuration * 1000);
    
    return () => {
      if (previewTimerRef.current) clearInterval(previewTimerRef.current);
    };
  }, [enabledLinks.length, displayDuration]);

  const updateLink = (id: string, field: keyof SocialLink, value: any) => {
    setLinks(prev => prev.map(link => 
      link.id === id ? { ...link, [field]: value } : link
    ));
  };

  const handleStart = () => {
    ipcRenderer.invoke('trigger-overlay', {
      action: 'SHOW',
      module: 'SOCIAL_WIDGET',
      payload: { 
        links: enabledLinks, 
        style, 
        displayDuration,
        running: true 
      },
    });
    setIsRunning(true);
  };

  const handleStop = () => {
    ipcRenderer.invoke('trigger-overlay', {
      action: 'HIDE',
      module: 'SOCIAL_WIDGET',
      payload: {},
    });
    setIsRunning(false);
  };

  const saveSettings = () => {
    ipcRenderer.invoke('save-social-widget-settings', {
      links,
      style,
      displayDuration,
      isRunning,
    });
  };

  useEffect(() => {
    saveSettings();
  }, [links, style, displayDuration]);

  // Update overlay when running and settings change
  useEffect(() => {
    if (isRunning) {
      ipcRenderer.invoke('trigger-overlay', {
        action: 'UPDATE',
        module: 'SOCIAL_WIDGET',
        payload: { 
          links: enabledLinks, 
          style, 
          displayDuration,
          running: true 
        },
      });
    }
  }, [links, style, displayDuration, isRunning]);

  const styles = [
    {
      id: 'clean' as StyleType,
      name: 'Clean Glass',
      description: 'Frosted, Modern',
      color: 'from-gray-700 to-gray-900',
      borderColor: 'border-indigo-500',
    },
    {
      id: 'broadcast' as StyleType,
      name: 'Broadcast',
      description: 'News Ticker Style',
      color: 'from-orange-500 to-red-600',
      borderColor: 'border-orange-500',
    },
    {
      id: 'esports' as StyleType,
      name: 'Esports',
      description: 'Cyberpunk/Glitch',
      color: 'from-purple-600 to-indigo-600',
      borderColor: 'border-purple-500',
    },
  ];

  const renderIcon = (platform: string, size: string = 'w-5 h-5') => {
    switch (platform) {
      case 'website':
        return <svg className={size} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>;
      case 'twitter':
        return <svg className={size} fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>;
      case 'youtube':
        return <svg className={size} fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>;
      case 'instagram':
        return <svg className={size} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>;
      case 'tiktok':
        return <svg className={size} fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>;
      case 'discord':
        return <svg className={size} fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg>;
      case 'twitch':
        return <svg className={size} fill="currentColor" viewBox="0 0 24 24"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/></svg>;
      default:
        return null;
    }
  };

  // Preview Component
  const renderPreview = () => {
    if (enabledLinks.length === 0) {
      return (
        <div className="text-center text-gray-500 text-sm py-4">
          Aktiviere mindestens einen Social Link
        </div>
      );
    }

    const currentLink = enabledLinks[previewIndex % enabledLinks.length];
    const pConfig = platformConfig[currentLink.platform];

    switch (style) {
      case 'clean':
        return (
          <motion.div
            key={currentLink.id + previewIndex}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center gap-3 p-2 pr-5 rounded-full border border-white/10 bg-black/60 backdrop-blur-xl"
          >
            <div className={`w-10 h-10 rounded-full bg-white/10 flex items-center justify-center ${pConfig.color}`}>
              {renderIcon(currentLink.platform, 'w-5 h-5')}
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Follow Me</span>
              <span className="text-white font-bold text-sm leading-none">{currentLink.label}</span>
            </div>
          </motion.div>
        );

      case 'broadcast':
        return (
          <motion.div
            key={currentLink.id + previewIndex}
            initial={{ rotateX: -90, opacity: 0 }}
            animate={{ rotateX: 0, opacity: 1 }}
            className="flex items-stretch scale-90 origin-left"
          >
            <div className={`w-12 ${pConfig.bgColor} flex items-center justify-center text-white`} style={{ clipPath: 'polygon(0% 0%, 90% 0%, 100% 50%, 90% 100%, 0% 100%)' }}>
              {renderIcon(currentLink.platform, 'w-5 h-5')}
            </div>
            <div className="flex-1 bg-slate-900 border-t-2 border-b-2 border-r-2 border-orange-500/50 flex flex-col justify-center pl-5 pr-3 -ml-3 rounded-r-md relative">
              <span className="text-[9px] text-orange-400 uppercase font-black tracking-widest">Social Media</span>
              <span className="text-white font-bold text-base tracking-tight leading-none">{currentLink.label}</span>
            </div>
          </motion.div>
        );

      case 'esports':
        return (
          <motion.div
            key={currentLink.id + previewIndex}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="transform -skew-x-6 scale-90 origin-left"
          >
            <div className="bg-[#0f0f0f] border border-purple-500/50 px-5 py-2 relative overflow-hidden" style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}>
              <div className="absolute left-0 top-0 w-1 h-full bg-purple-500"></div>
              <div className="transform skew-x-6 flex items-center gap-3">
                <div className={pConfig.color}>
                  {renderIcon(currentLink.platform, 'w-6 h-6')}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-sm animate-pulse"></span>
                    <span className="text-[8px] text-gray-500 uppercase tracking-[0.15em] font-bold">Connect</span>
                  </div>
                  <span className="text-white font-bold text-lg uppercase tracking-tighter">{currentLink.label}</span>
                </div>
              </div>
            </div>
          </motion.div>
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
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold">Social Widget</h3>
            <p className="text-xs sm:text-sm text-gray-400">Rotierende Social Links</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isRunning && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-xs text-green-400 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              RUNNING
            </motion.div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* Social Links Editor */}
        <div className="p-4 bg-dark-hover/50 rounded-lg border border-dark-border">
          <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2 mb-3">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Social Links
          </h4>
          <div className="space-y-2 max-h-[280px] overflow-y-auto pr-2">
            {links.map((link) => {
              const pConfig = platformConfig[link.platform];
              return (
                <div key={link.id} className={`flex items-center gap-3 p-2 rounded-lg transition-all ${link.enabled ? 'bg-dark-bg' : 'bg-dark-bg/50 opacity-50'}`}>
                  <button
                    onClick={() => updateLink(link.id, 'enabled', !link.enabled)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${link.enabled ? pConfig.bgColor + ' text-white' : 'bg-dark-border text-gray-500'}`}
                  >
                    {renderIcon(link.platform, 'w-4 h-4')}
                  </button>
                  <input
                    type="text"
                    value={link.label}
                    onChange={(e) => updateLink(link.id, 'label', e.target.value)}
                    className="input flex-1 text-sm py-1.5"
                    placeholder={pConfig.label}
                    disabled={!link.enabled}
                  />
                  <button
                    onClick={() => updateLink(link.id, 'enabled', !link.enabled)}
                    className={`w-10 h-6 rounded-full transition-all flex-shrink-0 ${link.enabled ? 'bg-pink-500' : 'bg-dark-border'}`}
                  >
                    <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform ${link.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            {enabledLinks.length} von {links.length} aktiv
          </p>
        </div>

        {/* Design Style Selection */}
        <div className="p-4 bg-dark-hover/50 rounded-lg border border-dark-border">
          <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2 mb-3">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
            Design Style
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
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                </div>
                <div>
                  <div className="text-white text-sm font-bold">{s.name}</div>
                  <div className="text-gray-500 text-xs">{s.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Timing */}
        <div className="p-4 bg-dark-hover/50 rounded-lg border border-dark-border">
          <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2 mb-3">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Anzeigedauer pro Link
          </h4>
          <div>
            <label className="block text-sm mb-2 text-gray-400">
              Duration: <span className="text-white font-medium">{displayDuration}s</span>
            </label>
            <input
              type="range"
              min="2"
              max="15"
              value={displayDuration}
              onChange={(e) => setDisplayDuration(parseInt(e.target.value))}
              className="w-full h-2 bg-dark-border rounded-lg appearance-none cursor-pointer accent-pink-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>2s</span>
              <span>15s</span>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="p-4 bg-[#0a0a0a] rounded-lg border border-dark-border overflow-hidden">
          <p className="text-xs text-gray-500 mb-3">Preview (rotiert alle {displayDuration}s):</p>
          <div className="min-h-[60px] flex items-center">
            <AnimatePresence mode="wait">
              {renderPreview()}
            </AnimatePresence>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleStart}
            disabled={enabledLinks.length === 0}
            className="btn flex-1 disabled:opacity-50 disabled:cursor-not-allowed bg-pink-600 hover:bg-pink-500 text-white shadow-lg shadow-pink-500/20"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            Start Widget
          </button>
          <button onClick={handleStop} className="btn bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" /></svg>
            Stop
          </button>
        </div>

        {/* Browser Source Info */}
        <div className="p-3 bg-pink-500/10 border border-pink-500/20 rounded-lg">
          <p className="text-xs text-gray-400">
            <span className="font-medium text-pink-400">OBS Browser Source:</span><br />
            <code className="text-gray-300 select-all text-[10px] sm:text-xs break-all">http://localhost:3000/overlay/social-widget</code>
            <span className="text-gray-500 ml-1 sm:ml-2 text-[10px] sm:text-xs">(400x100)</span>
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default SocialWidgetControl;
