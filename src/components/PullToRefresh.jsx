import { useRef, useState, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';

const THRESHOLD = 70;

export default function PullToRefresh({ onRefresh, children }) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);

  const onTouchStart = useCallback((e) => {
    if (window.scrollY <= 0 && !refreshing) startY.current = e.touches[0].clientY;
  }, [refreshing]);

  const onTouchMove = useCallback((e) => {
    if (startY.current === null || refreshing) return;
    const diff = e.touches[0].clientY - startY.current;
    if (diff > 0 && window.scrollY <= 0) setPull(Math.min(diff * 0.5, THRESHOLD * 1.5));
  }, [refreshing]);

  const onTouchEnd = useCallback(async () => {
    if (startY.current === null) return;
    if (pull >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPull(THRESHOLD);
      try { await onRefresh(); } finally { setRefreshing(false); setPull(0); }
    } else setPull(0);
    startY.current = null;
  }, [pull, refreshing, onRefresh]);

  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <div style={{ height: pull, overflow: 'hidden' }} className="flex items-end justify-center">
        <RefreshCw className={`w-5 h-5 text-primary ${refreshing ? 'animate-spin' : ''}`} style={{ opacity: Math.min(pull / THRESHOLD, 1), marginBottom: 8 }} />
      </div>
      {children}
    </div>
  );
}