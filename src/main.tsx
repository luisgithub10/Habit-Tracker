import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register Cache-First Service Worker for complete offline capabilities and iOS persistence
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Relative registration ensures compatibility with subdirectories e.g. GitHub Pages
    navigator.serviceWorker.register('./sw.js')
      .then((reg) => {
        console.log('Service Worker registered successfully:', reg.scope);
      })
      .catch((err) => {
        console.warn('Service Worker registration failed:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

