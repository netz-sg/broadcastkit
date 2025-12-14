import React, { useState, useEffect } from 'react';
import { Play, Square, Settings2, Twitter, Globe, Youtube, Instagram, Sparkles, Monitor, Zap } from 'lucide-react';

export default function App() {
  const [isVisible, setIsVisible] = useState(true);
  const [config, setConfig] = useState({
    style: 'esports', // 'clean', 'broadcast', 'esports'
  });

  // Social Media Daten (Editierbar)
  const [socials, setSocials] = useState([
    { id: 'web', icon: Globe, label: 'www.stream.gg', color: 'text-blue-400', placeholder: 'Website URL' },
    { id: 'twitter', icon: Twitter, label: '@cyber_stream', color: 'text-sky-400', placeholder: 'Twitter Handle' },
    { id: 'yt', icon: Youtube, label: '/CyberStream', color: 'text-red-500', placeholder: 'YouTube Channel' },
    { id: 'insta', icon: Instagram, label: '@cyber.official', color: 'text-pink-500', placeholder: 'Instagram' }
  ]);
  
  const [activeSocialIndex, setActiveSocialIndex] = useState(0);

  // Rotation Logic
  useEffect(() => {
    if (!isVisible) return;
    const interval = setInterval(() => {
      setActiveSocialIndex((prev) => (prev + 1) % socials.length);
    }, 5000); // Alle 5 Sekunden wechseln
    return () => clearInterval(interval);
  }, [socials.length, isVisible]);

  // Handler zum Aktualisieren der Social Labels
  const updateSocialLabel = (index, newLabel) => {
    const newSocials = [...socials];
    newSocials[index].label = newLabel;
    setSocials(newSocials);
  };

  const updateConfig = (key, value) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const CurrentIcon = socials[activeSocialIndex].icon;

  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] relative overflow-hidden font-sans selection:bg-indigo-500 selection:text-white">
      {/* GLOBAL STYLES & ANIMATIONS */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Rajdhani:wght@500;600;700;800&display=swap');

        .font-inter { font-family: 'Inter', sans-serif; }
        .font-tech { font-family: 'Rajdhani', sans-serif; }

        /* Animations */
        @keyframes slideIn { from { transform: translateX(-100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        
        @keyframes glitch {
          0% { clip-path: inset(10% 0 80% 0); transform: translate(-2px, 1px); }
          20% { clip-path: inset(80% 0 5% 0); transform: translate(2px, -1px); }
          40% { clip-path: inset(40% 0 40% 0); transform: translate(-1px, 2px); }
          100% { clip-path: inset(0 0 0 0); transform: translate(0); }
        }

        @keyframes socialFlipIn {
            0% { transform: rotateX(-90deg); opacity: 0; }
            100% { transform: rotateX(0deg); opacity: 1; }
        }
        @keyframes socialSlideUp {
            0% { transform: translateY(100%); opacity: 0; }
            100% { transform: translateY(0); opacity: 1; }
        }

        .animate-glitch { animation: glitch 0.4s linear forwards; }
        .animate-social-flip { animation: socialFlipIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .animate-social-slide { animation: socialSlideUp 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        
        .clip-tech { clip-path: polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px); }
        .clip-arrow { clip-path: polygon(0% 0%, 90% 0%, 100% 50%, 90% 100%, 0% 100%); }
      `}</style>

      {/* SIMULATED BACKGROUND */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2670&auto=format&fit=crop" 
          className="w-full h-full object-cover opacity-30 grayscale contrast-125" 
          alt="Background"
        />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.5)_1px,transparent_1px)] bg-[size:20px_20px] opacity-20"></div>
      </div>

      {/* =========================================
          ROTATING SOCIAL WIDGET (Fixed Position)
         ========================================= */}
      <div className="absolute bottom-16 right-16 z-20">
        {isVisible && (
            <div className="w-[300px] h-[60px] relative perspective-[1000px]">
                
                {/* STYLE: CLEAN */}
                {config.style === 'clean' && (
                    <div key={activeSocialIndex} className="animate-social-slide w-full h-full bg-black/60 backdrop-blur-xl border border-white/10 rounded-full flex items-center px-2 shadow-2xl font-inter">
                        <div className={`w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mr-4 ${socials[activeSocialIndex].color}`}>
                            <CurrentIcon size={20} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Follow Me</span>
                            <span className="text-white font-bold text-lg leading-none">{socials[activeSocialIndex].label}</span>
                        </div>
                    </div>
                )}

                {/* STYLE: BROADCAST */}
                {config.style === 'broadcast' && (
                    <div key={activeSocialIndex} className="animate-social-flip w-full h-full flex items-stretch font-inter drop-shadow-2xl">
                        <div className="w-16 bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white clip-arrow relative z-10">
                            <CurrentIcon size={24} />
                        </div>
                        <div className="flex-1 bg-slate-900 border-t-2 border-b-2 border-r-2 border-orange-500/50 flex flex-col justify-center pl-6 pr-4 -ml-4 rounded-r-md relative">
                            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%,transparent_100%)] bg-[length:4px_4px]"></div>
                            <span className="text-[10px] text-orange-400 uppercase font-black tracking-widest">Social Media</span>
                            <span className="text-white font-bold text-xl tracking-tight leading-none">{socials[activeSocialIndex].label}</span>
                        </div>
                    </div>
                )}

                {/* STYLE: ESPORTS */}
                {config.style === 'esports' && (
                    <div key={activeSocialIndex} className="animate-glitch w-full h-full font-tech transform skew-x-[-10deg]">
                        <div className="w-full h-full bg-[#0f0f0f] border border-purple-500/50 clip-tech relative flex items-center px-6 overflow-hidden">
                            {/* Animated Background */}
                            <div className="absolute inset-0 opacity-10 bg-[linear-gradient(90deg,transparent_0%,rgba(168,85,247,0.4)_50%,transparent_100%)] animate-[slideIn_2s_infinite]"></div>
                            
                            <div className="w-1 h-full bg-purple-500 absolute left-0 top-0"></div>
                            
                            <div className={`mr-4 ${socials[activeSocialIndex].color} transform skew-x-[10deg]`}>
                                <CurrentIcon size={28} strokeWidth={2.5} />
                            </div>
                            
                            <div className="flex flex-col transform skew-x-[10deg] z-10">
                                <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-sm animate-pulse"></span>
                                    <span className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold">Connect</span>
                                </div>
                                <span className="text-white font-bold text-2xl uppercase tracking-tighter drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">
                                    {socials[activeSocialIndex].label}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        )}
      </div>

      {/* CONTROLS (Hidden on Stream) */}
      <div className="fixed top-6 right-6 z-50 bg-[#121212]/95 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-2xl w-80 max-h-[90vh] overflow-y-auto scrollbar-hide font-inter">
        <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
          <h2 className="text-white font-bold flex items-center gap-2">
            <Settings2 size={18} className="text-indigo-500" /> 
            <span>Social Widget</span>
          </h2>
          <div className="flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
             <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Active</span>
          </div>
        </div>

        {/* MAIN TOGGLE */}
        <button 
          onClick={() => setIsVisible(!isVisible)}
          className={`w-full font-bold py-4 rounded-xl transition-all transform active:scale-[0.98] mb-8 shadow-lg flex items-center justify-center gap-3 text-sm tracking-wide uppercase group ${
            isVisible 
              ? 'bg-green-600 hover:bg-green-500 text-white shadow-green-500/20' 
              : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
          }`}
        >
          {isVisible ? <Square size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
          <span>{isVisible ? 'Widget An' : 'Widget Aus'}</span>
        </button>

        {/* SOCIAL LINKS EDITOR */}
        <div className="space-y-4 mb-8">
            <h3 className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-2">Social Links</h3>
            {socials.map((social, index) => (
                <div key={social.id} className="group">
                    <div className="relative">
                        <input 
                        type="text" 
                        value={social.label}
                        onChange={(e) => updateSocialLabel(index, e.target.value)}
                        className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg p-2 pl-9 text-white text-xs focus:border-indigo-500 focus:outline-none transition-all placeholder:text-gray-600"
                        placeholder={social.placeholder}
                        />
                        <social.icon size={14} className={`absolute left-3 top-2.5 ${social.color}`} />
                    </div>
                </div>
            ))}
        </div>

        {/* THEME SELECTOR */}
        <div>
          <label className="block text-[10px] text-gray-500 mb-3 uppercase tracking-widest font-bold">Design Style</label>
          <div className="grid grid-cols-1 gap-2.5">
            
            <button onClick={() => updateConfig('style', 'clean')} className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left group ${config.style === 'clean' ? 'bg-[#1a1a1a] border-indigo-500 ring-1 ring-indigo-500/50' : 'bg-[#1a1a1a] border-white/5 hover:border-white/20'}`}>
              <div className="p-2 bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg text-white shadow-inner"><Sparkles size={16} /></div>
              <div><div className="text-white text-sm font-bold">Clean</div><div className="text-gray-500 text-[10px]">Modern Glass</div></div>
            </button>

            <button onClick={() => updateConfig('style', 'broadcast')} className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left group ${config.style === 'broadcast' ? 'bg-[#1a1a1a] border-orange-500 ring-1 ring-orange-500/50' : 'bg-[#1a1a1a] border-white/5 hover:border-white/20'}`}>
              <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg text-white shadow-lg"><Monitor size={16} /></div>
              <div><div className="text-white text-sm font-bold">Broadcast</div><div className="text-gray-500 text-[10px]">News Ticker</div></div>
            </button>

            <button onClick={() => updateConfig('style', 'esports')} className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left group ${config.style === 'esports' ? 'bg-[#1a1a1a] border-purple-500 ring-1 ring-purple-500/50' : 'bg-[#1a1a1a] border-white/5 hover:border-white/20'}`}>
              <div className="p-2 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg text-white shadow-lg clip-tech"><Zap size={16} fill="currentColor" /></div>
              <div><div className="text-white text-sm font-bold">Esports</div><div className="text-gray-500 text-[10px]">Cyberpunk/Glitch</div></div>
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}