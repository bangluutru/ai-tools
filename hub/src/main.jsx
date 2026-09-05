import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import './print.css';
import { initTheme } from '@ai-tools/core';

// Initialize theme from storage/system before mounting
initTheme();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
