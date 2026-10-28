import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './utils/seedDatabase' // Import to make seeding function available
import ErrorBoundary from './components/ErrorBoundary.tsx'
import 'react-toastify/dist/ReactToastify.css'
import { initToast } from './utils/toast.tsx'
import { toast } from 'react-toastify'
import './i18n/config' // Initialize i18n

// Initialize toast system
initToast(toast);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
