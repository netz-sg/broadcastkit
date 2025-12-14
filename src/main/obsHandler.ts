import OBSWebSocket from 'obs-websocket-js';
import { configStore, ObsConfig } from './store';
import { EventEmitter } from 'events';

export class ObsConnector extends EventEmitter {
  private obs: OBSWebSocket;
  private isConnected: boolean = false;
  private reconnectTimer?: NodeJS.Timeout;
  private isConnecting: boolean = false;

  constructor() {
    super();
    this.obs = new OBSWebSocket();
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.obs.on('ConnectionOpened', () => {
      console.log('[OBS] Connection opened');
    });

    this.obs.on('Identified', () => {
      console.log('[OBS] Identified - Connected successfully');
      this.isConnected = true;
      this.isConnecting = false;
      this.emit('status', { connected: true, message: 'Verbunden mit OBS' });
    });

    this.obs.on('ConnectionClosed', () => {
      console.log('[OBS] Connection closed');
      this.isConnected = false;
      this.isConnecting = false;
      this.emit('status', { connected: false, message: 'Verbindung zu OBS getrennt' });
      this.scheduleReconnect();
    });

    this.obs.on('ConnectionError', (error: any) => {
      console.error('[OBS] Connection error:', error);
      this.isConnected = false;
      this.isConnecting = false;
      this.emit('status', { connected: false, message: `Fehler: ${error.message || 'Verbindung fehlgeschlagen'}` });
    });
  }

  async autoConnect(): Promise<void> {
    const config = configStore.getObsConfig();
    
    if (!config.autoConnect) {
      console.log('[OBS] Auto-connect ist deaktiviert');
      this.emit('status', { connected: false, message: 'Auto-Connect deaktiviert' });
      return;
    }

    // Prüfe ob Adresse konfiguriert ist
    if (!config.address) {
      console.log('[OBS] Keine OBS Adresse konfiguriert');
      this.emit('status', { connected: false, message: 'Keine OBS Adresse konfiguriert' });
      return;
    }

    console.log('[OBS] Auto-connect startet...');
    this.emit('status', { connected: false, message: 'Verbinde mit OBS...' });

    try {
      await this.connect(config);
    } catch (error: any) {
      console.log('[OBS] Auto-connect fehlgeschlagen, versuche erneut in 5s...');
      this.scheduleReconnect();
    }
  }

  async connect(config?: ObsConfig): Promise<void> {
    if (this.isConnected) {
      console.log('[OBS] Bereits verbunden');
      return;
    }

    if (this.isConnecting) {
      console.log('[OBS] Verbindungsversuch läuft bereits...');
      return;
    }

    this.isConnecting = true;
    const obsConfig = config || configStore.getObsConfig();

    try {
      console.log(`[OBS] Verbinde zu ${obsConfig.address}...`);
      this.emit('status', { connected: false, message: `Verbinde zu ${obsConfig.address}...` });
      
      await this.obs.connect(obsConfig.address, obsConfig.password || undefined, {
        rpcVersion: 1,
      });

      // Connection successful - save config
      if (config) {
        configStore.setObsConfig(config);
      }
    } catch (error: any) {
      this.isConnecting = false;
      console.error('[OBS] Verbindung fehlgeschlagen:', error.message);
      this.emit('status', { 
        connected: false, 
        message: `Verbindung fehlgeschlagen: ${error.message}` 
      });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }

    if (this.isConnected) {
      await this.obs.disconnect();
      this.isConnected = false;
    }
    this.isConnecting = false;
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    const config = configStore.getObsConfig();
    if (config.autoConnect && config.address) {
      console.log('[OBS] Reconnect geplant in 5 Sekunden...');
      this.reconnectTimer = setTimeout(() => {
        console.log('[OBS] Versuche erneut zu verbinden...');
        this.autoConnect();
      }, 5000);
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  getOBS(): OBSWebSocket {
    return this.obs;
  }
}

export const obsConnector = new ObsConnector();
