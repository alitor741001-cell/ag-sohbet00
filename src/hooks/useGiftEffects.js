import { useEffect, useState } from 'react';

const KEY = 'fk-gift-effects';

const read = () => {
  try {
    const stored = window.localStorage.getItem(KEY);
    return stored === null ? true : stored === '1';
  } catch {
    return true;
  }
};

// Aynı cihazdaki tüm ekranlar tercihi paylaşır: aç/kapat anında uygulanır.
const listeners = new Set();

/** Hediye efektleri tercihi — kapalıyken atılan hediyelerin görselleri gösterilmez. */
export default function useGiftEffects() {
  const [giftEffects, setGiftEffects] = useState(read);

  useEffect(() => {
    const listener = (value) => setGiftEffects(value);
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);

  const update = (next) => {
    try {
      window.localStorage.setItem(KEY, next ? '1' : '0');
    } catch {
      // Depolama kapalıysa tercih yalnızca bu oturumda geçerli olur.
    }
    listeners.forEach((listener) => listener(next));
  };

  return { giftEffects, setGiftEffects: update };
}