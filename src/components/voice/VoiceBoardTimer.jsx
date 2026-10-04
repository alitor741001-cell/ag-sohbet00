import { useEffect, useState } from 'react';

export default function VoiceBoardTimer({ active, startedAt }) {
  const startedMs = Date.parse(startedAt || '');
  const [seconds, setSeconds] = useState(1);
  useEffect(() => {
    if (!active || !Number.isFinite(startedMs)) return;
    const tick = () => setSeconds(Math.max(1, Math.floor((Date.now() - startedMs) / 1000) + 1));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [active, startedMs]);
  if (!active || !Number.isFinite(startedMs)) return null;
  return (
    <div className="flex shrink-0 items-center justify-center gap-2 border-t border-border bg-card px-3 py-2 text-card-foreground" aria-label={`Devam ediyor, ${seconds} saniye`}>
      <span className="text-xs font-bold">Devam Ediyor</span>
      <span className="min-w-8 text-center text-sm font-black tabular-nums">{seconds}</span>
    </div>
  );
}