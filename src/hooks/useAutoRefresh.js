import { useEffect, useRef } from 'react';

/**
 * Uygulama geneli sessiz yenileme: 5 saniyede bir tek bir zamanlayıcı çalışır ve
 * tüm sayfa/bileşenler aynı turu paylaşır. Sekme arka plandayken ya da kullanıcı
 * bir form alanına yazarken tur atlanır; yazılan değer ve odak kaybolmaz.
 */
const REFRESH_MS = 5000;
const listeners = new Set();
let timer = null;

const isTyping = () => {
  const el = document.activeElement;
  const tag = el?.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el?.isContentEditable === true;
};

const start = () => {
  if (timer) return;
  timer = window.setInterval(() => {
    if (document.visibilityState === 'hidden' || isTyping()) return;
    listeners.forEach((listener) => {
      try { listener(); } catch { /* tek bir abone hata verse bile tur devam eder */ }
    });
  }, REFRESH_MS);
};

const stop = () => {
  if (!timer) return;
  window.clearInterval(timer);
  timer = null;
};

/** 5 saniyelik yenileme turuna abone olur; dönen fonksiyon aboneliği kaldırır. */
export function subscribeAutoRefresh(listener) {
  listeners.add(listener);
  start();
  return () => {
    listeners.delete(listener);
    if (!listeners.size) stop();
  };
}

/** Verilen işlevi 5 saniyede bir sessizce çalıştırır (yükleme göstergesi tetiklemez). */
export default function useAutoRefresh(callback, enabled = true) {
  const ref = useRef(callback);
  ref.current = callback;
  useEffect(() => {
    if (!enabled) return undefined;
    return subscribeAutoRefresh(() => ref.current?.());
  }, [enabled]);
}