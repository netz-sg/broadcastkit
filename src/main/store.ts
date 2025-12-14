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

interface OverlayConfig {
  lowerThird: LowerThirdConfig;
  nowPlaying: NowPlayingConfig;
  socialWidget: SocialWidgetConfig;
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
      isRunning: false,
    },
  },
};

class ConfigStore {
  private store: Store<AppConfig>;

  constructor() {
    this.store = new Store<AppConfig>({
      defaults: defaultConfig,
    });
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

  // Full Config
  getAll(): AppConfig {
    return this.store.store;
  }
}

export const configStore = new ConfigStore();
export type { ObsConfig, OverlayConfig, AppConfig, LowerThirdConfig, NowPlayingConfig, RawgConfig, SocialWidgetConfig, SocialLink };
