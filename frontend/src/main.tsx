import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { notificationService } from './services/notificationService'

// Register PWA service worker for offline shell & push notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    notificationService.registerServiceWorker();
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
