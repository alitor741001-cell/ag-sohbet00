import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import '@/components/layout/stableViewport.css'
import '@/components/layout/responsiveScreens.css'
import '@/styles/giftMotions.css'
import '@/styles/accessibility.css'
import '@/styles/slot.css'
import initSystemTheme from '@/lib/themeMode'
import initAppViewport from '@/lib/appViewport'
import initEdgeSwipeGuard from '@/lib/edgeSwipeGuard'

initEdgeSwipeGuard()

// Tema cihazın sistem tercihine göre canlı ayarlanır; tercih okunamazsa koyu sinema teması.
initSystemTheme();
// Uygulama her cihazda o cihazın gerçek ekran yüksekliğini kaplar.
initAppViewport();

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'));
}