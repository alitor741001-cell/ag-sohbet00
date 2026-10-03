import { Crown, Loader2 } from 'lucide-react';

/** Büyük yuvarlak SPIN düğmesi. */
export default function SpinButton({ spinning, disabled, onClick, label = 'SPIN' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`relative flex h-[86px] w-[86px] shrink-0 flex-col items-center justify-center gap-0.5 rounded-full border-2 border-game-gold bg-gradient-to-b from-game-red to-[hsl(0_70%_32%)] text-white shadow-[0_0_28px_-6px_hsl(var(--game-gold))] transition-transform active:scale-95 disabled:opacity-45 sm:h-[96px] sm:w-[96px] ${disabled ? '' : 'game-ring'}`}
    >
      {spinning ? <Loader2 className="h-5 w-5 animate-spin text-game-gold" /> : <Crown className="h-5 w-5 text-game-gold" />}
      <span className="text-[11px] font-black tracking-[0.14em]">{spinning ? 'DÖNÜYOR' : label}</span>
    </button>
  );
}