import { Minus, Plus } from 'lucide-react';
import { allowedBets, formatCoins } from '@/components/games/gameHelpers';
import { sounds } from '@/components/games/gameSounds';

/** Kademeli bahis paneli: -, + ve MAX. Bahis kullanıcının seviyesi ve coinine göre sınırlanır. */
export default function BetControls({ value, onChange, steps = [], minBet = 100, maxBet = 0, coins = 0, label = 'BAHİS' }) {
  const allowed = allowedBets(steps, { minBet, maxBet: maxBet || Infinity, coins });
  const max = allowed.length ? allowed[allowed.length - 1] : 0;
  const limit = Math.min(maxBet || Infinity, coins);

  const shift = (direction) => {
    if (!allowed.length) return;
    sounds.play('click');
    const index = allowed.indexOf(value);
    const nextIndex = index < 0
      ? (direction > 0 ? 0 : allowed.length - 1)
      : Math.min(allowed.length - 1, Math.max(0, index + direction));
    onChange(allowed[nextIndex]);
  };

  const buttonStyle = 'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-game-gold/35 bg-black/40 text-game-gold transition-transform active:scale-90 disabled:opacity-30';

  return (
    <div className="rounded-2xl border border-game-gold/25 bg-black/45 p-2">
      <div className="flex items-center justify-between gap-2 text-[9px] font-black tracking-[0.2em] text-game-gold/80">
        <span>{label}</span>
        <span className="tabular-nums">{limit > 0 ? `kullanılabilir ${formatCoins(limit)}` : 'coin yok'}</span>
      </div>
      <div className="mt-1.5 flex items-center gap-1.5">
        <button type="button" aria-label="Bahsi düşür" className={buttonStyle} disabled={!allowed.length || value <= allowed[0]} onClick={() => shift(-1)}>
          <Minus className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1 rounded-xl border border-game-gold/30 bg-black/60 px-2 py-2 text-center text-base font-black tabular-nums text-white">
          {formatCoins(value)}
        </div>
        <button type="button" aria-label="Bahsi artır" className={buttonStyle} disabled={!allowed.length || value >= max} onClick={() => shift(1)}>
          <Plus className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={`${buttonStyle} w-auto px-2.5 text-[11px] font-black`}
          disabled={max <= 0 || value >= max}
          onClick={() => { sounds.play('click'); onChange(max); }}
        >
          MAX
        </button>
      </div>
    </div>
  );
}