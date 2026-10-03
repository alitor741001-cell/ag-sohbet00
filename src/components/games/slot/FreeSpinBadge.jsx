import React from 'react';

/** Ücretsiz çevirme hakkı: üstte "FREE 3 ÇEVİRME" şeklinde görünür, her turda azalır. */
export default function FreeSpinBadge({ count, top = 0 }) {
  if (!count) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 z-30 flex justify-center" style={{ top }}>
      <span className="flex items-center gap-2 rounded-full border border-slot-green/70 bg-black/85 px-5 py-1 text-sm font-black tracking-[0.18em] text-slot-green shadow-[0_0_22px_rgba(34,197,94,0.6)]">
        FREE
        <span className="text-lg text-slot-gold">{Math.max(0, Math.round(count))}</span>
        ÇEVİRME
      </span>
    </div>
  );
}