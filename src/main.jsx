import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import '@/styles/giftMotions.css'
import '@/styles/accessibility.css'
import initSystemTheme from '@/lib/themeMode'

// Tema cihazın sistem tercihine göre canlı ayarlanır; tercih okunamazsa koyu sinema teması.
initSystemTheme();

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'));
}