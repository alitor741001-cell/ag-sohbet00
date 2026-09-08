import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { FRAME_DEFINITIONS } from '@/lib/roles';
import { clearFrameCaches, makePreparedTransparent, makeTransparentFrame } from '@/components/xp/frameTransparency';

const FrameCatalogContext = createContext({ frames: FRAME_DEFINITIONS, refreshFrames: () => {} });

export function FrameCatalogProvider({ children }) {
  const [specialFrames, setSpecialFrames] = useState([]);
  const refreshFrames = useCallback(() => { clearFrameCaches(); return base44.entities.SpecialFrame.filter({ active: true }, '-created_date', 100).then(setSpecialFrames); }, []);
  useEffect(() => { refreshFrames(); const off = base44.entities.SpecialFrame.subscribe(refreshFrames); return off; }, [refreshFrames]);
  const frames = useMemo(() => {
    const custom = Object.fromEntries(specialFrames.map((item) => [`special:${item.id}`, {
      label: item.name, color: item.theme_color || '#f97316', image_url: item.image_url,
      opening: item.opening || [0.24, 0.24, 0.52, 0.52], prepared: true, group: 'custom',
    }]));
    return { ...FRAME_DEFINITIONS, ...custom };
  }, [specialFrames]);

  // Ağır canvas işlemlerini tek seferde yapmak yerine tarayıcının boş anlarına yay.
  useEffect(() => {
    const queue = Object.values(frames).filter((info) => info?.image_url);
    let cancelled = false;
    let idleId;
    let timeoutId;
    const prepareNext = () => {
      if (cancelled || document.hidden) return;
      const info = queue.shift();
      if (!info) return;
      const task = info.prepared
        ? makePreparedTransparent(info.image_url, info.opening)
        : info.sprite ? makeTransparentFrame(info.image_url, info.sprite) : null;
      Promise.resolve(task).catch(() => {}).finally(scheduleNext);
    };
    const scheduleNext = () => {
      if (cancelled || !queue.length) return;
      if (window.requestIdleCallback) idleId = window.requestIdleCallback(prepareNext);
      else timeoutId = window.setTimeout(prepareNext, 600);
    };
    scheduleNext();
    const resume = () => { if (!document.hidden && queue.length) scheduleNext(); };
    document.addEventListener('visibilitychange', resume);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', resume);
      if (idleId && window.cancelIdleCallback) window.cancelIdleCallback(idleId);
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [frames]);

  return <FrameCatalogContext.Provider value={{ frames, refreshFrames }}>{children}</FrameCatalogContext.Provider>;
}

export const useFrameCatalog = () => useContext(FrameCatalogContext);