import Store from 'electron-store';

interface ObsConfig {
  address: string;
  password: string;
  autoConnect: boolean;
}

interface RawgConfig {
  apiKey: string;
}

interface LowerThirdConfig {
  lastUsedName: string;
  lastUsedTitle: string;
  theme: string;
  style: 'clean' | 'broadcast' | 'esports';  // Design Style
  avatar: string;               // Base64 Avatar oder leer
  displayDuration: number;      // Sekunden
  autoShowEnabled: boolean;     // Auto-Anzeige aktiviert?
  autoShowInterval: number;     // Interval in Minuten
}

interface NowPlayingConfig {
  lastUsedTitle: string;        // Game/Song title
  lastUsedSubtitle: string;     // Mode/Artist
  cover: string;                // Cover image URL or base64
  style: 'card' | 'fullwidth';  // Now Playing Style
  displayDuration: number;      // Sekunden
  autoShowEnabled: boolean;     // Auto-Anzeige aktiviert?
  autoShowInterval: number;     // Interval in Minuten
  autoDetectEnabled: boolean;   // Auto-detect running game
  autoDetectInterval: number;   // How often to check (seconds)
}

interface SocialLink {
  id: string;
  platform: 'website' | 'twitter' | 'youtube' | 'instagram' | 'tiktok' | 'discord' | 'twitch';
  label: string;
  enabled: boolean;
}

interface SocialWidgetConfig {
  links: SocialLink[];
  style: 'clean' | 'broadcast' | 'esports';
  displayDuration: number;      // Sekunden pro Social Link
  isRunning: boolean;           // Widget läuft gerade
}

// Stream Scenes (Fullscreen Overlays)
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

interface StreamScenesConfig {
  scenes: {
    starting: StreamScene;
    brb: StreamScene;
    ending: StreamScene;
    technical: StreamScene;
  };
  globalStyle: 'minimal' | 'gaming' | 'elegant';
}

// Reaction Overlays für Video-Reactions
interface ReactionSource {
  id: string;
  name: string;
  channelName: string;
  channelAvatar: string;  // URL oder Base64
  videoTitle: string;
  videoThumbnail: string; // URL oder Base64
  platform: 'youtube' | 'twitch' | 'tiktok' | 'twitter';
}

interface ReactionConfig {
  sources: ReactionSource[];
  activeSourceId: string;
  style: 'clean' | 'broadcast' | 'esports';
  displayDuration: number;        // Sekunden (0 = dauerhaft)
  repeatEnabled: boolean;         // Wiederholung aktiviert
  repeatInterval: number;         // Wiederholungsintervall in Sekunden
  repeatCount: number;            // Anzahl Wiederholungen (0 = unendlich)
  showChannelInfo: boolean;
  showVideoTitle: boolean;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

interface OverlayConfig {
  lowerThird: LowerThirdConfig;
  nowPlaying: NowPlayingConfig;
  socialWidget: SocialWidgetConfig;
  streamScenes: StreamScenesConfig;
  reaction: ReactionConfig;
}

interface AppConfig {
  obs: ObsConfig;
  rawg: RawgConfig;
  overlays: OverlayConfig;
}

const defaultConfig: AppConfig = {
  obs: {
    address: 'ws://127.0.0.1:4455',
    password: '',
    autoConnect: true,
  },
  rawg: {
    apiKey: '',
  },
  overlays: {
    lowerThird: {
      lastUsedName: '',
      lastUsedTitle: '',
      theme: 'neon-blue',
      style: 'clean',
      avatar: '',
      displayDuration: 8,
      autoShowEnabled: false,
      autoShowInterval: 15,
    },
    nowPlaying: {
      lastUsedTitle: '',
      lastUsedSubtitle: '',
      cover: '',
      style: 'card',
      displayDuration: 10,
      autoShowEnabled: false,
      autoShowInterval: 15,
      autoDetectEnabled: false,
      autoDetectInterval: 30,
    },
    socialWidget: {
      links: [
        { id: 'website', platform: 'website', label: 'www.mystream.gg', enabled: true },
        { id: 'twitter', platform: 'twitter', label: '@myhandle', enabled: true },
        { id: 'youtube', platform: 'youtube', label: '/MeinKanal', enabled: true },
        { id: 'instagram', platform: 'instagram', label: '@mein.insta', enabled: false },
        { id: 'tiktok', platform: 'tiktok', label: '@meintiktok', enabled: false },
        { id: 'discord', platform: 'discord', label: 'discord.gg/xyz', enabled: false },
        { id: 'twitch', platform: 'twitch', label: '/meintwitch', enabled: false },
      ],
      style: 'clean',
      displayDuration: 5,
      isRunning: true,
    },
    streamScenes: {
      scenes: {
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
        },
      },
      globalStyle: 'gaming',
    },
    reaction: {
      sources: [],
      activeSourceId: '',
      style: 'clean',
      displayDuration: 0,       // 0 = dauerhaft bis manuell ausgeblendet
      repeatEnabled: false,     // Wiederholung deaktiviert
      repeatInterval: 60,       // Alle 60 Sekunden wiederholen
      repeatCount: 0,           // 0 = unendlich
      showChannelInfo: true,
      showVideoTitle: true,
      position: 'top-right',
    },
  },
};

class ConfigStore {
  private store: Store<AppConfig>;

  constructor() {
    this.store = new Store<AppConfig>({
      name: 'config', // Explicitly name the file config.json
      defaults: defaultConfig,
      clearInvalidConfig: false, // IMPORTANT: Never wipe config on schema mismatch
      migrations: {
        // Example migration if needed in future
        // '1.0.0': store => {
        //   store.set('debugPhase', true);
        // }
      }
    });
    
    // Log config path for debugging/verification
    console.log('[ConfigStore] Settings saved to:', this.store.path);
  }

  // OBS Settings
  getObsConfig(): ObsConfig {
    return this.store.get('obs');
  }

  setObsConfig(config: Partial<ObsConfig>): void {
    const current = this.getObsConfig();
    this.store.set('obs', { ...current, ...config });
  }

  // RAWG Settings
  getRawgConfig(): RawgConfig {
    return this.store.get('rawg');
  }

  setRawgConfig(config: Partial<RawgConfig>): void {
    const current = this.getRawgConfig();
    this.store.set('rawg', { ...current, ...config });
  }

  // Overlay Settings
  getOverlayConfig(): OverlayConfig {
    return this.store.get('overlays');
  }

  setLowerThirdConfig(config: Partial<LowerThirdConfig>): void {
    const current = this.getOverlayConfig().lowerThird;
    this.store.set('overlays.lowerThird', { ...current, ...config });
  }

  setLowerThirdData(name: string, title: string): void {
    const current = this.getOverlayConfig();
    this.store.set('overlays.lowerThird', {
      ...current.lowerThird,
      lastUsedName: name,
      lastUsedTitle: title,
    });
  }

  setNowPlayingConfig(config: Partial<NowPlayingConfig>): void {
    const current = this.getOverlayConfig().nowPlaying;
    this.store.set('overlays.nowPlaying', { ...current, ...config });
  }

  setNowPlayingData(title: string, subtitle: string, cover: string): void {
    const current = this.getOverlayConfig();
    this.store.set('overlays.nowPlaying', {
      ...current.nowPlaying,
      lastUsedTitle: title,
      lastUsedSubtitle: subtitle,
      cover: cover,
    });
  }

  setSocialWidgetConfig(config: Partial<SocialWidgetConfig>): void {
    const current = this.getOverlayConfig().socialWidget;
    this.store.set('overlays.socialWidget', { ...current, ...config });
  }

  setStreamScenesConfig(config: Partial<StreamScenesConfig>): void {
    const current = this.getOverlayConfig().streamScenes || {};
    this.store.set('overlays.streamScenes', { ...current, ...config });
  }

  setStreamScene(sceneId: 'starting' | 'brb' | 'ending' | 'technical', scene: Partial<StreamScene>): void {
    const overlayConfig = this.getOverlayConfig();
    const streamScenes = overlayConfig.streamScenes || { scenes: {} };
    const currentScene = streamScenes.scenes?.[sceneId] || {};
    this.store.set(`overlays.streamScenes.scenes.${sceneId}`, { ...currentScene, ...scene });
  }

  // Reaction Settings
  getReactionConfig(): ReactionConfig {
    return this.getOverlayConfig().reaction;
  }

  setReactionConfig(config: Partial<ReactionConfig>): void {
    const current = this.getReactionConfig() || {};
    this.store.set('overlays.reaction', { ...current, ...config });
  }

  addReactionSource(source: ReactionSource): void {
    const current = this.getReactionConfig();
    const sources = current.sources || [];
    this.store.set('overlays.reaction.sources', [...sources, source]);
  }

  updateReactionSource(sourceId: string, updates: Partial<ReactionSource>): void {
    const current = this.getReactionConfig();
    const sources = (current.sources || []).map(s => 
      s.id === sourceId ? { ...s, ...updates } : s
    );
    this.store.set('overlays.reaction.sources', sources);
  }

  removeReactionSource(sourceId: string): void {
    const current = this.getReactionConfig();
    const sources = (current.sources || []).filter(s => s.id !== sourceId);
    this.store.set('overlays.reaction.sources', sources);
  }

  // Full Config
  getAll(): AppConfig {
    return this.store.store;
  }
}

export const configStore = new ConfigStore();
export type { ObsConfig, OverlayConfig, AppConfig, LowerThirdConfig, NowPlayingConfig, RawgConfig, SocialWidgetConfig, SocialLink, StreamScenesConfig, StreamScene, ReactionConfig, ReactionSource };
