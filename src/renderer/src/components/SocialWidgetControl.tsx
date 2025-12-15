import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const { ipcRenderer } = window.require('electron');

interface Props {
  config: any;
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

function SocialWidgetControl({ config }: Props) {
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
        <div className="text-center text-zinc-500 text-sm py-4">
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
              <span className="text-[9px] text-zinc-400 uppercase tracking-widest font-bold">Follow Me</span>
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
            <div className="flex-1 bg-zinc-900 border-t-2 border-b-2 border-r-2 border-orange-500/50 flex flex-col justify-center pl-5 pr-3 -ml-3 rounded-r-md relative">
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
                    <span className="text-[8px] text-zinc-500 uppercase tracking-[0.15em] font-bold">Connect</span>
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
    <div className="space-y-6 w-full max-w-4xl mx-auto">
      {/* Browser Source URL */}
      <div className="glass-panel p-4 flex items-center justify-between bg-black/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-white">Browser Source URL</h3>
            <p className="text-xs text-zinc-400">Füge diese URL in OBS als Browser Source hinzu</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-black/40 rounded-lg border border-white/5 px-3 py-2">
          <code className="text-xs font-mono text-pink-400 select-all">/overlay/social-widget</code>
        </div>
      </div>

      {/* Preview Card */}
      <div className="glass-panel p-6 relative overflow-hidden">
        <div className="flex items-center justify-between mb-6 relative z-10">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Live Preview</h3>
          <div className="flex items-center gap-2">
            {isRunning && (
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
          <AnimatePresence mode="wait">
            {renderPreview()}
          </AnimatePresence>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Social Links Editor */}
          <div className="glass-panel p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white">Social Links</h3>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {links.map((link) => {
                const pConfig = platformConfig[link.platform];
                return (
                  <div key={link.id} className={`flex items-center gap-3 p-3 rounded-xl transition-all border ${link.enabled ? 'bg-zinc-900/50 border-white/10' : 'bg-zinc-900/20 border-transparent opacity-60 hover:opacity-100'}`}>
                    <button
                      onClick={() => updateLink(link.id, 'enabled', !link.enabled)}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${link.enabled ? pConfig.bgColor + ' text-white shadow-lg' : 'bg-zinc-800 text-zinc-500'}`}
                    >
                      {renderIcon(link.platform, 'w-5 h-5')}
                    </button>
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={link.label}
                        onChange={(e) => updateLink(link.id, 'label', e.target.value)}
                        className="bg-transparent border-none text-sm text-white placeholder-zinc-600 focus:ring-0 w-full p-0"
                        placeholder={pConfig.label}
                        disabled={!link.enabled}
                      />
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium mt-0.5">{pConfig.label}</div>
                    </div>
                    <button
                      onClick={() => updateLink(link.id, 'enabled', !link.enabled)}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${link.enabled ? 'bg-accent-blue' : 'bg-zinc-700'}`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${link.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
              <p className="text-xs text-zinc-500">
                <span className="text-white font-medium">{enabledLinks.length}</span> active links
              </p>
              <p className="text-xs text-zinc-600">Drag to reorder (Coming Soon)</p>
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
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
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
                <label className="label">Duration per Link</label>
                <span className="text-xs font-mono text-accent-blue bg-accent-blue/10 px-2 py-0.5 rounded">{displayDuration}s</span>
              </div>
              <input 
                type="range" 
                min="2" 
                max="15" 
                value={displayDuration} 
                onChange={(e) => setDisplayDuration(parseInt(e.target.value))} 
                className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-accent-blue" 
              />
              <div className="flex justify-between text-[10px] text-zinc-600 mt-2 font-mono">
                <span>FAST (2s)</span>
                <span>SLOW (15s)</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="glass-panel p-4 space-y-3">
            <button 
              onClick={handleStart} 
              disabled={enabledLinks.length === 0}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              Start Widget
            </button>
            <button 
              onClick={handleStop} 
              className="btn-danger w-full flex items-center justify-center gap-2 py-3 text-sm"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" /></svg>
              Stop Widget
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SocialWidgetControl;
