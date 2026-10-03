import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCoins } from '@/components/games/gameHelpers';
import { sounds } from '@/components/games/gameSounds';

const TARGETS = [1.2, 1.5, 2, 3, 5, 10];

const TONES = {
  blue: 'border-game-gold/40 bg-gradient-to-b from-game-blue to-[hsl(209_62%_25%)] text-white',
  gold: 'border-game-gold/70 bg-gradient-to-b from-game-gold-soft via-game-gold to-[hsl(40_58%_32%)] text-[hsl(40_45%_14%)]',
};

/** Crash bahis modülü: hedef çarpan, coin seçimi ve ana düğme. */
export default function CrashBetPanel({ bet, onBetChange, allowed = [], target, onTargetChange, primary, subtitle, tone = 'blue', disabled = false, onClick }) {
  const max = allowed.length ? allowed[allowed.length - 1] : 0;
  const min = allowed.length ? allowed[0] : 0;

  const shiftBet = (direction) => {
    if (!allowed.length) return;
    sounds.play('click');
    const index = allowed.indexOf(bet);
    const next = index < 0
      ? (direction > 0 ? 0 : allowed.length - 1)
      : Math.min(allowed.length - 1, Math.max(0, index + direction));
    onBetChange(allowed[next]);
  };

  const shiftTarget = (direction) => {
    sounds.play('click');
    const index = TARGETS.indexOf(Number(target));
    const safe = index < 0 ? 0 : index;
    onTargetChange(TARGETS[Math.min(TARGETS.length - 1, Math.max(0, safe + direction))]);
  };

  return (
    <div className="flex min-w-0 flex-col gap-1.5 rounded-2xl border border-game-gold/25 bg-black/45 p-1.5">
      <div className="flex items-center justify-between gap-1 rounded-xl border border-game-gold/25 bg-game-space/70 px-1 py-1">
        <button type="button" onClick={() => shiftTarget(-1)} aria-label="Hedef çarpanı düşür" className="flex h-6 w-6 items-center justify-center rounded-full text-white/70 active:scale-90">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-[12px] font-black tabular-nums text-game-gold">{Number(target).toFixed(2)} x</span>
        <button type="button" onClick={() => shiftTarget(1)} aria-label="Hedef çarpanı artır" className="flex h-6 w-6 items-center justify-center rounded-full text-white/70 active:scale-90">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-1 rounded-xl bg-game-space-light/70 px-1.5 py-1">
        <button type="button" onClick={() => shiftBet(-1)} disabled={!allowed.length || bet <= min} aria-label="Coin düşür" className="px-1 text-sm font-black text-white/85 disabled:opacity-30">−</button>
        <span className="min-w-0 flex-1 truncate text-center text-[11px] font-black tabular-nums text-white">{formatCoins(bet)} Coinler</span>
        <button type="button" onClick={() => shiftBet(1)} disabled={!allowed.length || bet >= max} aria-label="Coin artır" className="px-1 text-sm font-black text-white/85 disabled:opacity-30">+</button>
      </div>

      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`rounded-full border py-2 text-[12px] font-black shadow-[0_4px_0_-2px_rgba(0,0,0,0.45)] transition-transform active:translate-y-0.5 active:scale-95 disabled:opacity-45 ${TONES[tone] || TONES.blue}`}
      >
        {primary}
      </button>
      {subtitle && <p className="truncate text-center text-[9px] font-bold text-game-cream/70">{subtitle}</p>}
    </div>
  );
}