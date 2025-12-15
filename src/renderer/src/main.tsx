import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Error boundary for production
const rootElement = document.getElementById('root');

if (rootElement) {
  try {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error('Failed to render app:', error);
    rootElement.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100vh; flex-direction: column; gap: 20px; background: #09090b; color: white; font-family: sans-serif;">
        <h2>BroadcastKit konnte nicht geladen werden</h2>
        <p style="color: #6b7280;">Bitte starte die App neu.</p>
        <button onclick="location.reload()" style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer;">
          Neu laden
        </button>
      </div>
    `;
  }
} else {
  console.error('Root element not found');
}
