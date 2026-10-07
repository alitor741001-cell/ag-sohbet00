import { useEffect, useState } from 'react';

// Ağır katmanlar (arama ekranı, küçültülmüş oda balonu) ilk boyamayı beklemez:
// tarayıcı boşa çıkınca yüklenir, açılış paketi hafif kalır.
export default function useDeferredMount(timeout = 2000) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(() => setReady(true), { timeout });
      return () => window.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(() => setReady(true), 600);
    return () => window.clearTimeout(id);
  }, [timeout]);

  return ready;
}