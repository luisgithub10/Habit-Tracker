import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Force trailing slash for subdirectory on GitHub Pages to prevent scope hijacking
if (typeof window !== 'undefined' && window.location) {
  const path = window.location.pathname;
  if (path === '/Habit-Tracker' || path === '/habit-tracker') {
    window.location.replace(window.location.origin + '/Habit-Tracker/' + window.location.search + window.location.hash);
  }
}

// Register Cache-First Service Worker for complete offline capabilities and iOS persistence
if ('serviceWorker' in navigator) {
  const isPwaSubfolderScope = window.location.hostname.includes('github.io') || window.location.pathname.includes('/Habit-Tracker');
  
  if (isPwaSubfolderScope) {
    // Clear any service workers registered at the absolute root (e.g., https://luisgithub10.github.io/)
    // which might hijack pages in the /Habit-Tracker/ subdirectory.
    navigator.serviceWorker.getRegistrations().then(async (registrations) => {
      let rootSWFound = false;
      for (const reg of registrations) {
        const scope = reg.scope;
        const expectedScope = window.location.origin + '/Habit-Tracker/';
        const isIncorrectScope = scope !== expectedScope && (scope === window.location.origin + '/' || scope === window.location.origin);
        
        if (isIncorrectScope) {
          console.log('Detected hijacking root-level service worker:', scope);
          await reg.unregister();
          console.log('Unregistered root service worker successfully to restore subdirectory control.');
          rootSWFound = true;
        }
      }
      if (rootSWFound) {
        // Clear all cache storage to prevent the old root scope fallback from loading offline
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map(key => caches.delete(key)));
          console.log('Cleared all caches successfully after unregistering root service worker.');
        }
        // Reload page to clear any intercepts and fetch from network
        window.location.reload();
      }
    }).catch((err) => {
      console.warn('Error querying service worker registrations:', err);
    });
  }

  window.addEventListener('load', () => {
    const isGitHubPages = window.location.hostname.includes('github.io') || window.location.pathname.includes('/Habit-Tracker');
    const swPath = isGitHubPages ? '/Habit-Tracker/sw.js' : './sw.js';
    const swScope = isGitHubPages ? '/Habit-Tracker/' : './';

    navigator.serviceWorker.register(swPath, { scope: swScope })
      .then((reg) => {
        console.log('Subdirectory Service Worker registered successfully:', reg.scope);
      })
      .catch((err) => {
        console.warn('Subdirectory Service worker registration failed, trying relative:', err);
        // Fallback to simpler relative registration
        navigator.serviceWorker.register('./sw.js')
          .then((r) => console.log('Fallback relative SW registered:', r.scope));
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

