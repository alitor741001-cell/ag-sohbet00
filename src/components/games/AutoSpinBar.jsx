import { useState } from 'react';
import { RotateCw, Square } from 'lucide-react';
import { sounds } from '@/components/games/gameSounds';

const PRESETS = [10, 25, 50, 100];

/** Otomatik oynatma düğmesi: dokununca tur sayısı seçilir, çalışırken DURDUR'a dönüşür. */
export default function AutoSpinBar({ running, remaining, onStart, onStop, disabled = false, presets = PRESETS, label = 'Otomatik' }) {
  const [open, setOpen] = useState(false);

  const handleClick = () => {
    sounds.play('click');
    if (running) { setOpen(false); onStop(); return; }
    setOpen((value) => !value);
  };

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled && !running}
        className="gold-plate flex h-[74px] w-[86px] shrink-0 flex-col items-center justify-center gap-0.5 rounded-2xl border-2 border-game-gold/60 text-[11px] font-black text-[hsl(40_45%_16%)] shadow-[0_4px_0_-1px_hsl(40_45%_28%)] transition-transform active:translate-y-0.5 active:scale-95 disabled:opacity-45"
      >
        {running ? <Square className="h-4 w-4 fill-current" /> : <RotateCw className="h-4 w-4" />}
        <span className="px-1 text-center leading-tight">{running ? `DURDUR${remaining > 0 ? ` (${remaining})` : ''}` : label}</span>
      </button>
      {open && !running && (
        <div className="absolute bottom-full left-0 z-20 mb-1.5 flex gap-1 rounded-xl border border-game-gold/40 bg-game-deepest/95 p-1.5 shadow-xl">
          {presets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => { sounds.play('click'); setOpen(false); onStart(preset); }}
              className="rounded-lg border border-game-gold/30 bg-black/40 px-2 py-1 text-[11px] font-bold text-game-gold"
            >
              {preset}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}