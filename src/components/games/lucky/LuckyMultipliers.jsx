import React from 'react';

/** Ücretsiz dönüşte biriken çarpanlar: DÖNDÜR'ün sağında toplanır. */
export default function LuckyMultipliers({ multipliers, merged }) {
  const visible = multipliers.slice(-6);
  return (
    <div className="flex h-full min-w-0 flex-col items-center justify-center gap-1">
      <span className="text-[0.55rem] font-black tracking-wide text-slot-gold/80">BİRİKEN ÇARPAN</span>
      <div className="flex min-h-[1.6rem] flex-wrap items-center justify-center gap-1">
        {visible.length === 0 && merged.length === 0 && (
          <span className="text-[0.6rem] font-bold text-slot-gold/50">ücretsiz dönüşte</span>
        )}
        {visible.map((value, index) => (
          <span
            key={`${value}-${index}`}
            className="flex h-6 w-6 items-center justify-center rounded-full border border-sky-300/70 bg-gradient-to-b from-cyan-400 to-blue-900 text-[0.6rem] font-black text-white"
          >
            x{value}
          </span>
        ))}
        {merged.map((item, index) => (
          <span
            key={`merged-${index}-${item.value}`}
            className="lucky-merging flex h-6 items-center justify-center rounded-full border border-slot-green/80 bg-black/70 px-1.5 text-[0.6rem] font-black text-slot-green"
          >
            x{item.merged}
          </span>
        ))}
      </div>
    </div>
  );
}