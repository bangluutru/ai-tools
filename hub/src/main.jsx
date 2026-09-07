import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import './print.css';
import { initTheme } from '@ai-tools/core';

// Initialize theme from storage/system before mounting
initTheme();

// Tự động làm mới trang khi Vite phát hiện chunk module cũ bị 404 sau khi deploy
window.addEventListener('vite:preloadError', (event) => {
  event?.preventDefault?.();
  const retryKey = 'ai_tools_vite_preload_retry';
  const lastRetry = sessionStorage.getItem(retryKey);
  const now = Date.now();
  if (!lastRetry || now - parseInt(lastRetry, 10) > 15000) {
    sessionStorage.setItem(retryKey, String(now));
    window.location.reload();
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
