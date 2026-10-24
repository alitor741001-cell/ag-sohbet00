import { useEffect, useState } from 'react';

const pad = (value) => String(value).padStart(2, '0');

/** Saniyeyi saat:dakika:saniye biçiminde yazar — sayı her saniye tek tek ilerler. */
const formatClock = (totalSeconds) => {
  const value = Math.max(0, Math.floor(totalSeconds) || 0);
  return `${pad(Math.floor(value / 3600))}:${pad(Math.floor((value % 3600) / 60))}:${pad(value % 60)}`;
};

/**
 * Sayı tahtası açıkken görünen süre kartı: altın sarısı-kırmızı çerçeve içinde
 * "Devam Ediyor" yazar ve süre 00:00:01'den başlayıp her saniye artar.
 */
export default function VoiceBoardTimer({ active, startedAt }) {
  const startedMs = Date.parse(startedAt || '');
  const [seconds, setSeconds] = useState(1);

  useEffect(() => {
    if (!active || !Number.isFinite(startedMs)) return undefined;
    const tick = () => setSeconds(Math.max(1, Math.floor((Date.now() - startedMs) / 1000) + 1));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [active, startedMs]);

  if (!active || !Number.isFinite(startedMs)) return null;
  const clock = formatClock(seconds);

  // Kart, sahnenin altındaki boşluk kadar yukarı taşınır: böylece her koltuk düzeninde
  // koltukların (sayı şeritlerinin) hemen altında durur. Kendi yerleşimi değişmediği için
  // koltukların yeri ve boyutu oynamaz; siyah katmanların üstünde kalır.
  return (
    <div
      className="relative z-30 flex shrink-0 justify-center px-3 pb-1.5"
      style={{ top: 'calc(-1 * var(--voice-board-lift, 0px) + 30px)' }}
    >
      <div
        className="flex w-fit items-center gap-1.5 rounded-lg border border-slot-gold/60 bg-gradient-to-r from-slot-red/25 via-slot-panel to-slot-red/25 px-2 py-1 shadow-[0_0_10px_rgba(239,68,68,0.22)]"
        aria-label={`Devam ediyor, ${clock}`}
      >
        <span className="text-[9px] font-bold tracking-wide text-slot-gold sm:text-[10px]">Devam Ediyor</span>
        <span className="slot-digits rounded border border-slot-gold/50 bg-slot-bg/70 px-1.5 py-px text-[11px] font-black leading-tight tabular-nums text-slot-gold">
          {clock}
        </span>
      </div>
    </div>
  );
}