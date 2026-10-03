import { LifeBuoy } from 'lucide-react';
import { formatCoins } from '@/components/games/gameHelpers';

const POOLS = [
  { key: 'jackpot_mega', label: 'MEGA', tone: 'text-game-gold' },
  { key: 'jackpot_major', label: 'BIG', tone: 'text-game-green' },
  { key: 'jackpot_mini', label: 'MINI', tone: 'text-game-neon-blue' },
];

/** Jackpot başlığı: kayan yazı, havuz toplamı ve tur göstergesi. */
export default function JackpotHeader({ config, tickerItems = [], spins = 0, total = 20 }) {
  const values = POOLS.map((pool) => Number(config?.[pool.key] || 0));
  const pot = values.reduce((sum, value) => sum + value, 0);
  const progress = Math.min(total, Math.max(0, Math.floor(spins) % total));

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-lg border border-game-gold/20 bg-black/55 py-1">
        <div className="ticker-scroll flex w-max gap-6 whitespace-nowrap px-3">
          {[...tickerItems, ...tickerItems].map((item, index) => (
            <span key={`${item}-${index}`} className="text-[10px] font-bold text-game-cream/80">{item}</span>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-game-gold/30 bg-gradient-to-b from-game-deep/85 to-black/65 px-3 py-2 text-center">
        <p className="text-[11px] font-black tracking-[0.32em] text-white/85">JACKPOT</p>
        <p className="text-2xl font-black tabular-nums text-white [text-shadow:0_0_16px_hsl(var(--game-gold)/0.55)]">{formatCoins(pot)}</p>
        <div className="mt-1.5 grid grid-cols-3 gap-1.5">
          {POOLS.map((pool, index) => (
            <div key={pool.key} className="min-w-0 rounded-xl border border-white/10 bg-black/50 px-1 py-1">
              <p className={`text-[8px] font-black tracking-[0.18em] ${pool.tone}`}>{pool.label}</p>
              <p className="truncate text-[11px] font-black tabular-nums text-white/90">{formatCoins(values[index])}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="shrink-0 text-[10px] font-black tabular-nums text-white/70">{progress}/{total}</span>
        <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-black/60">
          <div className="gold-plate h-full rounded-full" style={{ width: `${Math.round((progress / total) * 100)}%` }} />
        </div>
        <LifeBuoy className="h-4 w-4 shrink-0 text-game-gold" />
      </div>
    </div>
  );
}