import { Crown } from 'lucide-react';
import { formatCoins } from '@/components/games/gameHelpers';

/** Jackpot kazanıldığında tam ekran kutlama katmanı. */
export default function JackpotOverlay({ jackpot }) {
  if (!jackpot) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 overflow-hidden bg-gradient-to-b from-game-deep/80 via-black/80 to-game-deepest/90">
      <div className="game-jackpot flex flex-col items-center gap-1">
        <Crown className="h-12 w-12 text-game-gold" />
        <p className="text-3xl font-black tracking-[0.2em] text-game-gold [text-shadow:0_0_22px_hsl(var(--game-gold))]">JACKPOT!</p>
        <p className="text-sm font-black tracking-[0.24em] text-game-cream/90">{jackpot.label?.toUpperCase()}</p>
        <p className="mt-1 text-2xl font-black tabular-nums text-game-gold">+{formatCoins(jackpot.amount)} 🪙</p>
      </div>
    </div>
  );
}