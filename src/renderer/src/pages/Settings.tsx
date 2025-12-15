import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const { ipcRenderer } = window.require('electron');

function Settings() {
  const [obsAddress, setObsAddress] = useState('ws://127.0.0.1:4455');
  const [obsPassword, setObsPassword] = useState('');
  const [autoConnect, setAutoConnect] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  
  // RAWG API
  const [rawgApiKey, setRawgApiKey] = useState('');
  const [isValidatingKey, setIsValidatingKey] = useState(false);
  const [rawgMessage, setRawgMessage] = useState('');
  
  // Browser Sources
  const [connectedClients, setConnectedClients] = useState(0);
  const [refreshMessage, setRefreshMessage] = useState('');

  useEffect(() => {
    ipcRenderer.invoke('get-config').then((config: any) => {
      setObsAddress(config.obs.address);
      setObsPassword(config.obs.password);
      setAutoConnect(config.obs.autoConnect);
      setRawgApiKey(config.rawg?.apiKey || '');
    });
    
    // Get overlay status
    updateOverlayStatus();
    const interval = setInterval(updateOverlayStatus, 5000);
    return () => clearInterval(interval);
  }, []);
  
  const updateOverlayStatus = async () => {
    const status = await ipcRenderer.invoke('get-overlay-status');
    setConnectedClients(status.connectedClients);
  };
  
  const handleRefreshOverlays = async () => {
    const result = await ipcRenderer.invoke('refresh-overlays');
    if (result.success) {
      setRefreshMessage(`✓ ${result.clients} Overlay(s) aktualisiert`);
    } else {
      setRefreshMessage('✗ Keine Overlays verbunden');
    }
    setTimeout(() => setRefreshMessage(''), 3000);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');

    const result = await ipcRenderer.invoke('update-obs-config', {
      address: obsAddress,
      password: obsPassword,
      autoConnect,
    });

    setIsSaving(false);

    if (result.success) {
      setSaveMessage('✓ Gespeichert & Verbunden!');
      setTimeout(() => setSaveMessage(''), 3000);
    } else {
      setSaveMessage(`✗ Fehler: ${result.error}`);
    }
  };

  const handleDisconnect = async () => {
    await ipcRenderer.invoke('disconnect-obs');
    setSaveMessage('Von OBS getrennt');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleSaveRawgKey = async () => {
    setIsValidatingKey(true);
    setRawgMessage('');

    if (!rawgApiKey.trim()) {
      await ipcRenderer.invoke('save-rawg-settings', { apiKey: '' });
      setRawgMessage('✓ API Key entfernt');
      setIsValidatingKey(false);
      setTimeout(() => setRawgMessage(''), 3000);
      return;
    }

    const result = await ipcRenderer.invoke('validate-rawg-key', rawgApiKey.trim());
    
    if (result.valid) {
      await ipcRenderer.invoke('save-rawg-settings', { apiKey: rawgApiKey.trim() });
      setRawgMessage('✓ API Key gespeichert & validiert!');
    } else {
      setRawgMessage('✗ Ungültiger API Key');
    }
    
    setIsValidatingKey(false);
    setTimeout(() => setRawgMessage(''), 3000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="h-full overflow-y-auto custom-scrollbar"
    >
      <div className="max-w-3xl mx-auto space-y-6 p-6 pb-10">
        {/* Header */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-500/10 to-purple-500/10">
          <h2 className="text-2xl font-bold text-white mb-2">Einstellungen</h2>
          <p className="text-sm text-zinc-400">Konfiguriere OBS WebSocket, API-Keys und Browser Sources.</p>
        </div>

        {/* OBS Connection Settings */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-6 rounded-2xl border border-white/10"
        >
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center flex-shrink-0 border border-indigo-500/30">
              <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            OBS WebSocket Verbindung
          </h3>

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-medium mb-2 text-zinc-400 uppercase tracking-wider">
                WebSocket Adresse
              </label>
              <input
                type="text"
                value={obsAddress}
                onChange={(e) => setObsAddress(e.target.value)}
                className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                placeholder="ws://127.0.0.1:4455"
              />
              <p className="text-xs text-zinc-500 mt-2">
                Standard: ws://127.0.0.1:4455 (OBS WebSocket v5)
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium mb-2 text-zinc-400 uppercase tracking-wider">
                Passwort
              </label>
              <input
                type="password"
                value={obsPassword}
                onChange={(e) => setObsPassword(e.target.value)}
                className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                placeholder="OBS WebSocket Passwort eingeben"
              />
              <p className="text-xs text-zinc-500 mt-2">
                In OBS einstellbar unter: Werkzeuge → WebSocket-Server-Einstellungen
              </p>
            </div>

            <div className="flex items-center gap-3 p-4 bg-zinc-900/30 rounded-xl border border-white/5">
              <input
                type="checkbox"
                id="autoConnect"
                checked={autoConnect}
                onChange={(e) => setAutoConnect(e.target.checked)}
                className="w-5 h-5 rounded border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-indigo-500/50"
              />
              <label htmlFor="autoConnect" className="flex-1 cursor-pointer">
                <div className="font-medium text-zinc-200">Automatisch verbinden</div>
                <div className="text-xs text-zinc-500">
                  Verbindet sich beim Start der App automatisch mit OBS
                </div>
              </label>
            </div>
          </div>

          {/* Save Message */}
          <AnimatePresence>
            {saveMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`mt-4 p-3 rounded-xl text-sm font-medium border ${
                  saveMessage.startsWith('✓')
                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                }`}
              >
                {saveMessage}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  Verbinde...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Speichern & Verbinden
                </>
              )}
            </button>
            <button
              onClick={handleDisconnect}
              className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-xl transition-all border border-white/5 hover:border-white/10"
            >
              Trennen
            </button>
          </div>
        </motion.div>

        {/* Browser Sources */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-panel p-6 rounded-2xl border border-white/10"
        >
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0 border border-green-500/30">
              <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            Browser Sources
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-zinc-900/30 rounded-xl border border-white/5">
              <div>
                <div className="font-medium text-zinc-200">Verbundene Overlays</div>
                <div className="text-sm text-zinc-500">
                  {connectedClients > 0 
                    ? `${connectedClients} Browser Source(s) aktiv`
                    : 'Keine Browser Sources verbunden'}
                </div>
              </div>
              <div className={`w-3 h-3 rounded-full shadow-lg ${connectedClients > 0 ? 'bg-green-500 shadow-green-500/50' : 'bg-zinc-600'}`} />
            </div>

            <p className="text-sm text-zinc-500 px-1">
              Einstellungen geändert? Klicke auf Aktualisieren, um alle verbundenen Browser Sources in OBS neu zu laden, ohne sie entfernen zu müssen.
            </p>

            <AnimatePresence>
              {refreshMessage && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`p-3 rounded-xl text-sm font-medium border ${
                    refreshMessage.includes('✓') 
                      ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                      : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}
                >
                  {refreshMessage}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={handleRefreshOverlays}
              disabled={connectedClients === 0}
              className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Alle Overlays aktualisieren
            </button>
          </div>
        </motion.div>

        {/* RAWG API Settings */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-panel p-6 rounded-2xl border border-white/10"
        >
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0 border border-purple-500/30">
              <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            RAWG API (Spiele-Erkennung)
          </h3>

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-medium mb-2 text-zinc-400 uppercase tracking-wider">
                RAWG API Key
              </label>
              <input
                type="password"
                value={rawgApiKey}
                onChange={(e) => setRawgApiKey(e.target.value)}
                className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                placeholder="RAWG API Key eingeben"
              />
              <p className="text-xs text-zinc-500 mt-2">
                Kostenlosen API Key erhalten auf{' '}
                <a 
                  href="https://rawg.io/apidocs" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 hover:underline"
                >
                  rawg.io/apidocs
                </a>
              </p>
            </div>

            <div className="p-4 bg-zinc-900/30 rounded-xl border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium text-zinc-200">Automatische Spiele-Erkennung</span>
              </div>
              <p className="text-xs text-zinc-500">
                Mit einem RAWG API Key kann das "Now Playing" Overlay automatisch erkennen, welches Spiel du gerade spielst, und das passende Cover-Bild sowie Infos laden.
              </p>
            </div>
          </div>

          {/* RAWG Save Message */}
          <AnimatePresence>
            {rawgMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`mt-4 p-3 rounded-xl text-sm font-medium border ${
                  rawgMessage.startsWith('✓')
                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                }`}
              >
                {rawgMessage}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-6">
            <button
              onClick={handleSaveRawgKey}
              disabled={isValidatingKey}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {isValidatingKey ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  Prüfe Key...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  API Key Speichern
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Help Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-panel p-6 rounded-2xl border border-white/10 bg-zinc-900/30"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            OBS WebSocket aktivieren
          </h3>
          <ol className="space-y-2 text-sm text-zinc-400 list-decimal list-inside">
            <li>Öffne OBS Studio</li>
            <li>Gehe zu <span className="text-zinc-200 font-medium">Werkzeuge → WebSocket-Server-Einstellungen</span></li>
            <li>Aktiviere <span className="text-zinc-200 font-medium">"WebSocket-Server aktivieren"</span></li>
            <li>Setze ein Passwort (optional, aber empfohlen)</li>
            <li>Merke dir den Server-Port (Standard: 4455)</li>
            <li>Klicke auf "Anwenden" und "OK"</li>
          </ol>
        </motion.div>
      </div>
    </motion.div>
  );
}

function AnimatePresence({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export default Settings;
