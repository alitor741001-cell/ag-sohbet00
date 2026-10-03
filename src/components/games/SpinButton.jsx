import { Crown, Loader2 } from 'lucide-react';

const SHAPES = {
  pill: 'h-[74px] w-[128px] rounded-2xl',
  square: 'h-[62px] w-[62px] rounded-2xl',
};

/** Yeşil metalik DÖNDÜR düğmesi. */
export default function SpinButton({ spinning, disabled, onClick, label = 'SPIN', shape = 'pill' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`relative flex shrink-0 flex-col items-center justify-center gap-0.5 border-2 border-game-gold/80 bg-gradient-to-b from-game-spin-light via-game-spin to-[hsl(141_45%_22%)] text-white shadow-[0_6px_0_-2px_hsl(141_45%_16%),0_0_26px_-6px_hsl(var(--game-gold))] transition-transform active:translate-y-0.5 active:scale-95 disabled:opacity-45 ${SHAPES[shape] || SHAPES.pill}`}
    >
      {spinning ? <Loader2 className="h-5 w-5 animate-spin text-game-gold" /> : <Crown className="h-4 w-4 text-game-gold" />}
      <span className="text-[12px] font-black tracking-[0.14em]">{spinning ? 'DÖNÜYOR' : label}</span>
    </button>
  );
}