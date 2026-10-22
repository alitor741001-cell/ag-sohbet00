import React from 'react';
import { Image } from '@/components/ui/image';
import { AVIATOR_PLANE, AVIATOR_SKY } from '../rocketAssets';
import { formatMult } from '../rocket/rocketConfig';

// Çarpan büyüdükçe uçak sağa-yukarı ilerler ve tepeye yaklaşınca orada süzülür.
// Kalkıştan hemen sonra belirgin hareket etsin diye başlangıç hızlı tutulur.
const travel = (m) => 1 - 1 / (1 + Math.max(0, m - 1) * 1.6);
const STOPS = [[2, '#3b9bff'], [5, '#22e06b'], [10, '#ff9a1f'], [Infinity, '#ff2a3d']];

/** Uçuş sahnesi: kırmızı bulutlu gökyüzü, parlayan eğri, uçak ve dev çarpan. */
export default function AviatorStage({ game, children }) {
  const { phase } = game;
  const crashed = phase === 'crashed';
  const flying = phase === 'running';
  const mult = crashed ? game.round?.crash_at || 1 : flying ? game.displayMult : 1;
  const p = flying || crashed ? travel(mult) : 0;
  // Renk kademesi: 2x altı mavi, 5x altı yeşil, 10x altı turuncu, sonrası kırmızı.
  const tier = mult < 2 ? { c: '#3b9bff', h: 220 } : mult < 5 ? { c: '#22e06b', h: 130 } : mult < 10 ? { c: '#ff9a1f', h: 35 } : { c: '#ff2a3d', h: 0 };
  const planeStyle = { filter: `hue-rotate(${tier.h}deg) drop-shadow(0 0 10px ${tier.c})`, transition: 'filter .4s' };
  // Eğri ve uçak, içerideki oyuncu listesinin sağında kalır (listeyi kapatmaz).
  const x0 = 32;
  const x = x0 + p * 56;
  const y = 88 - p * 64;
  const path = `M ${x0} 88 Q ${x0 + (x - x0) * 0.6} 88 ${x} ${y}`;
  // Geçilen her renk bölümü çizgide kalır: mavi → yeşil → turuncu → kırmızı.
  const span = Math.max(0.01, x - x0);
  const segs = [];
  let from = 0;
  for (const [lim, c] of STOPS) {
    const to = Math.min(1, (travel(lim) * 56) / span);
    segs.push({ c, from, to });
    if (to >= 1) break;
    from = to;
  }

  return (
    <div className="av-panel av-panel-red relative min-h-0 flex-1 overflow-hidden">
      <Image src={AVIATOR_SKY} alt="" className="absolute inset-0 h-full w-full opacity-90" fittingType="fill" />
      <div className="absolute left-2 right-2 top-2 z-10 flex items-center justify-between text-[11px] text-white">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />SONUÇ: {formatMult(mult)}</span>
        <span className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/60 px-2 py-0.5"><span className="h-2 w-2 rounded-full bg-red-500" />{flying ? 'Oyun Devam Ediyor' : crashed ? 'Uçtu!' : 'Bahisler Açık'}</span>
      </div>

      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="av-trail" gradientUnits="userSpaceOnUse" x1={x0} y1="0" x2={x} y2="0">
            {segs.flatMap((s, i) => [<stop key={`a${i}`} offset={s.from} stopColor={s.c} />, <stop key={`b${i}`} offset={s.to} stopColor={s.c} />])}
          </linearGradient>
        </defs>
        {p > 0 && <path d={`${path} L ${x} 88 Z`} fill="url(#av-trail)" fillOpacity="0.22" />}
        {p > 0 && <path d={path} fill="none" stroke="url(#av-trail)" strokeWidth="0.9" vectorEffect="non-scaling-stroke" style={{ filter: `drop-shadow(0 0 4px ${tier.c})` }} />}
      </svg>

      {(flying || phase === 'betting') && (
        <Image src={AVIATOR_PLANE} alt="Uçak"
          className={`av-plane absolute z-30 aspect-[3/2] w-[26%] max-w-[8rem] mix-blend-screen ${flying ? 'av-plane-fly' : ''}`}
          style={{ left: `${x}%`, top: `${y}%`, ...planeStyle }} fittingType="fit" />
      )}
      {crashed && <Image key={game.round?.round_no} src={AVIATOR_PLANE} alt="" className="av-plane av-plane-away absolute z-10 aspect-[3/2] w-[26%] max-w-[8rem] mix-blend-screen" style={{ left: `${x}%`, top: `${y}%`, ...planeStyle }} fittingType="fit" />}

      {children}
      <div className="pointer-events-none absolute bottom-0 left-[28%] right-0 top-0 z-20 flex flex-col items-center justify-center">
        {phase === 'betting' ? (
          <>
            <p className="text-xs font-bold tracking-widest text-white/70">SONRAKİ TUR</p>
            <p className="av-mult">{game.countdown ?? 0}s</p>
          </>
        ) : (
          <>
            {crashed && <p className="text-sm font-black tracking-widest text-red-400">UÇTU!</p>}
            <p className={`av-mult ${crashed ? 'text-red-500' : ''}`}>{formatMult(mult)}</p>
          </>
        )}
      </div>
    </div>
  );
}