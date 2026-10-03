import React, { useMemo } from 'react';

const randomBetween = (min, max) => min + Math.random() * (max - min);

/** Sohbet üzerinde tek seferlik kutlama efekti: dökülen coinler + ödül bandı. */
export default function SlotWinCelebration({ text }) {
  const coins = useMemo(
    () => Array.from({ length: 16 }, (_, index) => ({
      id: index,
      left: randomBetween(2, 94),
      size: randomBetween(16, 30),
      delay: randomBetween(0, 1.6),
      duration: randomBetween(1.8, 3),
    })),
    []
  );

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
      <span className="absolute inset-0 bg-gradient-to-t from-amber-500/25 via-transparent to-amber-300/10" />
      {coins.map((coin) => (
        <span
          key={coin.id}
          className="animate-slot-win-coin absolute top-0 leading-none"
          style={{
            left: `${coin.left}%`,
            fontSize: `${coin.size}px`,
            animationDelay: `${coin.delay}s`,
            animationDuration: `${coin.duration}s`,
          }}
        >
          🪙
        </span>
      ))}
      <div className="animate-slot-win-pop relative z-10 mx-4 rounded-2xl border-2 border-amber-300 bg-black/75 px-4 py-3 text-center shadow-[0_0_30px_rgba(251,191,36,0.6)]">
        <p className="text-base font-black tracking-widest text-amber-300 [text-shadow:0_0_14px_rgba(251,191,36,0.9)]">BÜYÜK ÖDÜL!</p>
        <p className="mt-1 max-w-[16rem] text-[11px] font-bold leading-snug text-amber-100">{text}</p>
      </div>
    </div>
  );
}