import React from 'react';

/** Ücretsiz çevirme hakkı: AUTO düğmesinin solunda duran yeşil rozet. */
export default function FreeSpinBadge({ count }) {
  if (!count) return null;

  return (
    <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-full border border-slot-green/70 bg-black/85 leading-none shadow-[0_0_16px_rgba(34,197,94,0.55)]">
      <span className="text-[9px] font-black tracking-[0.1em] text-slot-green">FREE</span>
      <span className="mt-1 font-mono text-base font-black tabular-nums text-slot-gold">
        {Math.max(0, Math.round(count))}
      </span>
    </span>
  );
}