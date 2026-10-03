import { RotateCw, Square } from 'lucide-react';
import { sounds } from '@/components/games/gameSounds';

const PRESETS = [10, 25, 50, 100];

/** Otomatik oynat çubuğu: AUTO, tur seçenekleri ve AUTO DURDUR. */
export default function AutoSpinBar({ running, remaining, onStart, onStop, disabled = false, presets = PRESETS, label = 'AUTO' }) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        disabled={running || disabled}
        onClick={() => { sounds.play('click'); onStart(remaining > 0 ? remaining : presets[0]); }}
        className="flex shrink-0 items-center gap-1 rounded-xl border border-game-neon/40 bg-game-neon/10 px-2.5 py-2 text-[11px] font-black text-game-neon transition-transform active:scale-95 disabled:opacity-35"
      >
        <RotateCw className="h-3.5 w-3.5" />
        {label}
      </button>
      {presets.map((preset) => (
        <button
          key={preset}
          type="button"
          disabled={running || disabled}
          onClick={() => { sounds.play('click'); onStart(preset); }}
          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 py-2 text-[11px] font-bold text-white/80 transition-transform active:scale-95 disabled:opacity-35"
        >
          {preset}
        </button>
      ))}
      {running && (
        <button
          type="button"
          onClick={() => { sounds.play('click'); onStop(); }}
          className="flex shrink-0 items-center gap-1 rounded-xl border border-game-red/50 bg-game-red/15 px-2.5 py-2 text-[11px] font-black text-game-red transition-transform active:scale-95"
        >
          <Square className="h-3 w-3 fill-current" />
          DURDUR{remaining > 0 ? ` (${remaining})` : ''}
        </button>
      )}
    </div>
  );
}