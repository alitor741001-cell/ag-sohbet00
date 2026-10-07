import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import '@/styles/giftMotions.css'

// Uygulama her zaman karanlık tema kullanır: tema değiştirme katmanı kaldırıldı.
document.documentElement.classList.add('dark');

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'));
}