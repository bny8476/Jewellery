import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import { initToast } from './utils/toast.tsx'
import './i18n/config' // Initialize i18n

// Handle dynamic import / stale chunk mismatch after new deployments
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event: any) => {
    event?.preventDefault?.();
    const lastReload = sessionStorage.getItem('yazhini_last_chunk_reload');
    const now = Date.now();
    if (!lastReload || now - Number(lastReload) > 8000) {
      sessionStorage.setItem('yazhini_last_chunk_reload', String(now));
      window.location.reload();
    }
  });
}

// Initialize toast system
initToast();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
