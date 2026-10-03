import React from 'react';
import { Film } from 'lucide-react';

export default function SlotActionBar({ auto, spinning, disabled, onAuto, onSpin }) {
  return (
    <div className="flex items-center justify-between gap-3 pt-1">
      <button
        type="button"
        onClick={onAuto}
        aria-label="Otomatik tur"
        className={`slot-auto h-12 min-w-[5.5rem] rounded-xl text-xs font-black tracking-widest text-slot ${
          auto ? 'ring-2 ring-slot-green' : ''
        }`}
      >
        AUTO
      </button>

      <button
        type="button"
        onClick={onSpin}
        disabled={disabled || spinning}
        aria-label="Turu başlat"
        className="slot-spin flex h-20 w-20 flex-col items-center justify-center gap-0.5 rounded-full text-slot disabled:opacity-60"
      >
        <Film className={`h-6 w-6 ${spinning ? 'animate-spin' : ''}`} />
        <span className="text-[11px] font-black tracking-widest">SPIN</span>
      </button>
    </div>
  );
}