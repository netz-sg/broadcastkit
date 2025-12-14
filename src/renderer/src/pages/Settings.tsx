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
      setRefreshMessage(`✓ Refreshed ${result.clients} overlay(s)`);
    } else {
      setRefreshMessage('✗ No overlays connected');
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
      setSaveMessage('✓ Settings saved and connected successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } else {
      setSaveMessage(`✗ Error: ${result.error}`);
    }
  };

  const handleDisconnect = async () => {
    await ipcRenderer.invoke('disconnect-obs');
    setSaveMessage('Disconnected from OBS');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleSaveRawgKey = async () => {
    setIsValidatingKey(true);
    setRawgMessage('');

    if (!rawgApiKey.trim()) {
      await ipcRenderer.invoke('save-rawg-settings', { apiKey: '' });
      setRawgMessage('✓ API Key cleared');
      setIsValidatingKey(false);
      setTimeout(() => setRawgMessage(''), 3000);
      return;
    }

    const result = await ipcRenderer.invoke('validate-rawg-key', rawgApiKey.trim());
    
    if (result.valid) {
      await ipcRenderer.invoke('save-rawg-settings', { apiKey: rawgApiKey.trim() });
      setRawgMessage('✓ API Key saved and validated!');
    } else {
      setRawgMessage('✗ Invalid API Key');
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
    >
      <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="card bg-gradient-to-br from-accent-purple/10 to-accent-blue/10 border-accent-purple/20">
          <h2 className="text-xl sm:text-2xl font-bold mb-2">Einstellungen</h2>
          <p className="text-sm text-gray-400">OBS WebSocket & API Konfiguration</p>
        </div>

        {/* OBS Connection Settings */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-accent-blue/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            OBS WebSocket Configuration
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                WebSocket Address
              </label>
              <input
                type="text"
                value={obsAddress}
                onChange={(e) => setObsAddress(e.target.value)}
                className="input w-full"
                placeholder="ws://127.0.0.1:4455"
              />
              <p className="text-xs text-gray-500 mt-1">
                Default: ws://127.0.0.1:4455 (OBS WebSocket v5)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Password
              </label>
              <input
                type="password"
                value={obsPassword}
                onChange={(e) => setObsPassword(e.target.value)}
                className="input w-full"
                placeholder="Enter OBS WebSocket password"
              />
              <p className="text-xs text-gray-500 mt-1">
                Set in OBS: Tools → WebSocket Server Settings
              </p>
            </div>

            <div className="flex items-center gap-3 p-4 bg-dark-hover rounded-lg">
              <input
                type="checkbox"
                id="autoConnect"
                checked={autoConnect}
                onChange={(e) => setAutoConnect(e.target.checked)}
                className="w-5 h-5 text-accent-blue bg-dark-card border-gray-600 rounded focus:ring-2 focus:ring-accent-blue"
              />
              <label htmlFor="autoConnect" className="flex-1">
                <div className="font-medium">Auto-Connect on Startup</div>
                <div className="text-xs text-gray-400">
                  Automatically connect to OBS when the app starts
                </div>
              </label>
            </div>
          </div>

          {/* Save Message */}
          {saveMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-4 p-3 rounded-lg ${
                saveMessage.startsWith('✓')
                  ? 'bg-accent-green/20 text-accent-green border border-accent-green/30'
                  : 'bg-accent-red/20 text-accent-red border border-accent-red/30'
              }`}
            >
              {saveMessage}
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn btn-primary flex-1"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  Connecting...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save & Connect
                </>
              )}
            </button>
            <button
              onClick={handleDisconnect}
              className="btn btn-secondary"
            >
              Disconnect
            </button>
          </div>
        </motion.div>

        {/* Browser Sources */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="card"
        >
          <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            Browser Sources
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-dark-hover rounded-lg">
              <div>
                <div className="font-medium">Connected Overlays</div>
                <div className="text-sm text-gray-400">
                  {connectedClients > 0 
                    ? `${connectedClients} browser source(s) connected`
                    : 'No browser sources connected'}
                </div>
              </div>
              <div className={`w-3 h-3 rounded-full ${connectedClients > 0 ? 'bg-green-500' : 'bg-gray-500'}`} />
            </div>

            <p className="text-sm text-gray-400">
              Changed settings? Click refresh to update all connected browser sources in OBS without removing them.
            </p>

            {refreshMessage && (
              <div className={`p-3 rounded-lg text-sm ${
                refreshMessage.includes('✓') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
              }`}>
                {refreshMessage}
              </div>
            )}

            <button
              onClick={handleRefreshOverlays}
              disabled={connectedClients === 0}
              className="btn w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh All Overlays
            </button>
          </div>
        </motion.div>

        {/* Help Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="card bg-dark-hover/50"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            How to enable OBS WebSocket
          </h3>
          <ol className="space-y-2 text-sm text-gray-400 list-decimal list-inside">
            <li>Open OBS Studio</li>
            <li>Go to <span className="text-gray-300 font-medium">Tools → WebSocket Server Settings</span></li>
            <li>Check <span className="text-gray-300 font-medium">"Enable WebSocket server"</span></li>
            <li>Set a password (optional but recommended)</li>
            <li>Note the Server Port (default: 4455)</li>
            <li>Click "Apply" and "OK"</li>
          </ol>
        </motion.div>

        {/* RAWG API Settings */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-accent-purple/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-accent-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            RAWG API (Game Detection)
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                RAWG API Key
              </label>
              <input
                type="password"
                value={rawgApiKey}
                onChange={(e) => setRawgApiKey(e.target.value)}
                className="input w-full"
                placeholder="Enter your RAWG API key"
              />
              <p className="text-xs text-gray-500 mt-1">
                Get your free API key at{' '}
                <a 
                  href="https://rawg.io/apidocs" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-accent-blue hover:underline"
                >
                  rawg.io/apidocs
                </a>
              </p>
            </div>

            <div className="p-4 bg-dark-hover rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">Auto Game Detection</span>
              </div>
              <p className="text-xs text-gray-400">
                With a RAWG API key, the Now Playing feature can automatically detect which game you're playing 
                and fetch cover art, genre, and other details.
              </p>
            </div>
          </div>

          {/* RAWG Save Message */}
          {rawgMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-4 p-3 rounded-lg ${
                rawgMessage.startsWith('✓')
                  ? 'bg-accent-green/20 text-accent-green border border-accent-green/30'
                  : 'bg-accent-red/20 text-accent-red border border-accent-red/30'
              }`}
            >
              {rawgMessage}
            </motion.div>
          )}

          <div className="mt-6">
            <button
              onClick={handleSaveRawgKey}
              disabled={isValidatingKey}
              className="btn btn-primary"
            >
              {isValidatingKey ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  Validating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save API Key
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default Settings;
