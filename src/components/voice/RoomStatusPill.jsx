import { useEffect, useMemo, useState } from 'react';
import useStatusPillImage from '@/hooks/useStatusPillImage';

const PILL_URL = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/e052cb92b_IMG_0264.jpg';
const W = 750;
const H = 123;

const pad = (v) => String(v).padStart(2, '0');

/** Oda durum şeridi: tasarım görseli + odanın açık kaldığı süre. */
export default function RoomStatusPill({ startedAt }) {
  const src = useStatusPillImage(PILL_URL);
  const start = useMemo(() => {
    const t = startedAt ? new Date(startedAt).getTime() : NaN;
    return Number.isFinite(t) ? t : Date.now();
  }, [startedAt]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const total = Math.max(0, Math.floor((now - start) / 1000));
  const clock = `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;

  return (
    <div className="relative w-full" style={{ aspectRatio: `${W} / ${H}` }}>
      {src && <img src={src} alt="" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full select-none" />}
      <span
        className="absolute flex items-center justify-center text-[clamp(9px,2.9vw,14px)] font-bold tabular-nums"
        style={{ left: '63%', top: '24%', width: '31%', height: '52%', color: '#FCE3A7' }}
      >
        {clock}
      </span>
    </div>
  );
}