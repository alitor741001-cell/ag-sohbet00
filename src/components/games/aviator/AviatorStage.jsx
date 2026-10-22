import React from 'react';
import { Image } from '@/components/ui/image';
import { AVIATOR_PLANE, AVIATOR_SKY } from '../rocketAssets';
import { formatMult } from '../rocket/rocketConfig';

// Çarpan büyüdükçe uçak sağa-yukarı ilerler ve tepeye yaklaşınca orada süzülür.
const travel = (m) => 1 - 1 / (1 + Math.log(Math.max(1, m)) / 1.2);

/** Uçuş sahnesi: kırmızı bulutlu gökyüzü, parlayan eğri, uçak ve dev çarpan. */
export default function AviatorStage({ game }) {
  const { phase } = game;
  const crashed = phase === 'crashed';
  const flying = phase === 'running';
  const mult = crashed ? game.round?.crash_at || 1 : flying ? game.displayMult : 1;
  const p = flying || crashed ? travel(mult) : 0;
  const x = 4 + p * 80;
  const y = 92 - p * 70;
  const path = `M 4 92 Q ${4 + (x - 4) * 0.6} 92 ${x} ${y}`;

  return (
    <div className="av-panel av-panel-red relative min-h-0 flex-1 overflow-hidden">
      <Image src={AVIATOR_SKY} alt="" className="absolute inset-0 h-full w-full opacity-90" fittingType="fill" />
      <div className="absolute left-2 right-2 top-2 z-10 flex items-center justify-between text-[11px] text-white">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />SONUÇ: {formatMult(mult)}</span>
        <span className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/60 px-2 py-0.5"><span className="h-2 w-2 rounded-full bg-red-500" />{flying ? 'Oyun Devam Ediyor' : crashed ? 'Uçtu!' : 'Bahisler Açık'}</span>
      </div>

      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        {p > 0 && <path d={`${path} L ${x} 92 Z`} fill="rgba(220,20,40,0.25)" />}
        {p > 0 && <path d={path} fill="none" stroke="#ff2a3d" strokeWidth="0.9" vectorEffect="non-scaling-stroke" style={{ filter: 'drop-shadow(0 0 4px #ff2a3d)' }} />}
      </svg>

      {(flying || phase === 'betting') && (
        <Image src={AVIATOR_PLANE} alt="Uçak"
          className={`av-plane absolute z-10 w-[24%] max-w-[7rem] mix-blend-screen ${flying ? 'av-plane-fly' : ''}`}
          style={{ left: `${x}%`, top: `${y}%` }} fittingType="fit" />
      )}
      {crashed && <Image key={game.round?.round_no} src={AVIATOR_PLANE} alt="" className="av-plane av-plane-away absolute z-10 w-[24%] max-w-[7rem] mix-blend-screen" style={{ left: `${x}%`, top: `${y}%` }} fittingType="fit" />}

      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center">
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