import { ChevronLeft, Rocket } from 'lucide-react';
import CrashPlayers from '@/components/games/CrashPlayers';

/** Crash oyun alanı: oyuncu listesi solda, çarpan ortada, roket tırmanırken sağda. */
export default function CrashField({ round, multiplier, crashed, countdown, notice, currentUserId }) {
  const value = Math.max(1, Number(multiplier) || 1);
  const progress = Math.min(1, Math.log(Math.max(1.01, value)) / Math.log(20));

  return (
    <div className="relative min-h-[240px] flex-1 overflow-hidden rounded-2xl border border-game-gold/25 bg-game-space/70">
      <div className="game-stars pointer-events-none absolute inset-0 opacity-70" />

      <div className="absolute inset-y-1.5 left-1.5 w-[76px]">
        <CrashPlayers players={round?.players || []} currentUserId={currentUserId} />
      </div>

      <p className="absolute left-[88px] top-3 text-[12px] font-black tracking-[0.35em] text-game-gold [writing-mode:vertical-rl] [text-shadow:0_0_10px_rgba(0,0,0,0.9)]">
        CRASH ROCKET
      </p>

      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 pl-[112px] pr-7 text-center">
        <p className={`text-4xl font-black tabular-nums ${crashed ? 'text-game-red' : value >= 2 ? 'text-game-gold' : 'text-game-neon-blue'} [text-shadow:0_0_18px_currentColor]`}>
          {value.toFixed(2)}x
        </p>
        {notice && <p className="mt-1 text-[10px] font-bold leading-tight text-game-cream/85">{notice}</p>}
        {countdown > 0 && !crashed && <p className="mt-1 text-[11px] font-black text-game-gold">Yeni tur {countdown} sn</p>}
      </div>

      <div className="absolute right-[16px] transition-[bottom] duration-300" style={{ bottom: `${8 + progress * 58}%` }}>
        <div className="rocket-flame absolute left-1/2 top-full h-16 w-3 -translate-x-1/2 rounded-full bg-gradient-to-b from-game-orange via-game-gold/70 to-transparent blur-[2px]" />
        <Rocket className="relative h-9 w-9 -rotate-45 text-white drop-shadow-[0_0_12px_hsl(var(--game-orange))]" />
      </div>

      <div className="absolute inset-y-4 right-0.5 flex flex-col items-center justify-center gap-1.5 text-white/40">
        {[0, 1, 2, 3, 4, 5].map((key) => <ChevronLeft key={key} className="h-3.5 w-3.5" />)}
      </div>
    </div>
  );
}