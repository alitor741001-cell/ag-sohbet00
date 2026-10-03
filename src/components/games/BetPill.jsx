import { Minus, Plus } from 'lucide-react';
import { formatCoins } from '@/components/games/gameHelpers';
import { sounds } from '@/components/games/gameSounds';

const STONE = 'flex items-center justify-center border border-game-gold/40 bg-black/45 text-game-cream transition-transform active:scale-90 disabled:opacity-30';

/** Taş kaplamalı bahis şeridi: -, değer, + ve MAX. */
export default function BetPill({ value, onChange, allowed = [], label = 'TOTAL BET', compact = false }) {
  const max = allowed.length ? allowed[allowed.length - 1] : 0;
  const min = allowed.length ? allowed[0] : 0;

  const shift = (direction) => {
    if (!allowed.length) return;
    sounds.play('click');
    const index = allowed.indexOf(value);
    const nextIndex = index < 0
      ? (direction > 0 ? 0 : allowed.length - 1)
      : Math.min(allowed.length - 1, Math.max(0, index + direction));
    onChange(allowed[nextIndex]);
  };

  const steppers = (
    <>
      <button type="button" aria-label="Bahsi düşür" className={`${STONE} rounded-xl ${compact ? 'h-9 w-8' : 'h-10 w-9'}`} disabled={!allowed.length || value <= min} onClick={() => shift(-1)}>
        <Minus className="h-4 w-4" />
      </button>
      <button type="button" aria-label="Bahsi artır" className={`${STONE} rounded-xl ${compact ? 'h-9 w-8' : 'h-10 w-9'}`} disabled={!allowed.length || value >= max} onClick={() => shift(1)}>
        <Plus className="h-4 w-4" />
      </button>
    </>
  );

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-1.5 rounded-full border border-game-gold/40 bg-black/60 px-1.5 py-1">
          <button type="button" aria-label="Bahsi düşür" className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-game-cream disabled:opacity-30" disabled={!allowed.length || value <= min} onClick={() => shift(-1)}>
            <Minus className="h-3.5 w-3.5" />
          </button>
          <div className="min-w-[46px] text-center">
            <p className="text-[8px] font-black tracking-[0.18em] text-white/70">{label}</p>
            <p className="text-sm font-black tabular-nums text-white">{formatCoins(value)}</p>
          </div>
          <button type="button" aria-label="Bahsi artır" className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-game-cream disabled:opacity-30" disabled={!allowed.length || value >= max} onClick={() => shift(1)}>
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        <button
          type="button"
          className={`${STONE} rounded-xl h-9 px-2.5 text-[11px] font-black`}
          disabled={max <= 0 || value >= max}
          onClick={() => { sounds.play('click'); onChange(max); }}
        >
          MAX
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 rounded-2xl border border-game-gold/35 bg-black/40 p-1.5">
      {steppers}
      <div className="min-w-0 flex-1 rounded-xl bg-black/55 px-2 py-1 text-center">
        <p className="text-[8px] font-black tracking-[0.18em] text-game-gold/85">{label}</p>
        <p className="truncate text-base font-black tabular-nums text-white">{formatCoins(value)}</p>
      </div>
      <button
        type="button"
        className={`${STONE} h-10 rounded-xl px-2.5 text-[11px] font-black`}
        disabled={max <= 0 || value >= max}
        onClick={() => { sounds.play('click'); onChange(max); }}
      >
        MAX
      </button>
    </div>
  );
}