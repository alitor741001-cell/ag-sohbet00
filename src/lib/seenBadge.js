import { useEffect, useState } from 'react';

// Rozet "görüldü" zamanı: sayfa açılınca işaret kaybolur, yeni öğe gelince geri gelir.
const EVENT = 'seen-badge';
const keyOf = (name, userId) => `seen:${name}:${userId}`;

export const getSeen = (name, userId) => Number(localStorage.getItem(keyOf(name, userId)) || 0);

export function markSeen(name, userId) {
  if (!userId) return;
  localStorage.setItem(keyOf(name, userId), String(Date.now()));
  window.dispatchEvent(new Event(EVENT));
}

/** Görüldü zamanı değiştikçe yeniden çizilmek için sayaç döndürür. */
export function useSeenTick() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const bump = () => setTick((t) => t + 1);
    window.addEventListener(EVENT, bump);
    return () => window.removeEventListener(EVENT, bump);
  }, []);
  return tick;
}