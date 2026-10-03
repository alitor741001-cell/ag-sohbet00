import React from 'react';
import { Crown, PartyPopper } from 'lucide-react';

const COINS = Array.from({ length: 16 });

const format = (value) => new Intl.NumberFormat('tr-TR').format(Math.max(0, Math.round(value || 0)));

/** Büyük kazanç ve jackpot kutlama ekranı: ödül miktarı ve altta "KABUL ET" onayı. */
export default function SlotWinOverlay({ open, jackpot, amount, winner, onAccept }) {
  if (!open) return null;

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-between bg-black/85 px-6 py-8">
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {COINS.map((_, index) => (
          <span
            key={index}
            className="absolute top-0 animate-slot-win-coin text-xl"
            style={{ left: `${(index * 6.5) % 96}%`, animationDelay: `${index * 0.12}s` }}
          >
            🪙
          </span>
        ))}
      </span>

      <div className="relative flex min-h-0 flex-1 animate-slot-win-pop flex-col items-center justify-center text-center">
        {jackpot ? <Crown className="mb-3 h-14 w-14 text-slot-gold" /> : <PartyPopper className="mb-3 h-12 w-12 text-slot-gold" />}
        <p className="slot-gold-text text-3xl font-black tracking-[0.18em]">{jackpot ? 'JACKPOT' : 'BÜYÜK KAZANÇ'}</p>
        <p className="mt-4 font-mono text-4xl font-black tabular-nums text-white">{format(amount)}</p>
        <p className="mt-1 text-[10px] font-black tracking-[0.35em] text-slot-gold/80">COIN KAZANDIN</p>
        {winner && <p className="mt-4 text-xs font-bold text-white/70">Kazanan: {winner}</p>}
      </div>

      <button
        type="button"
        onClick={onAccept}
        className="relative w-full rounded-2xl border border-slot-gold/70 bg-gradient-to-b from-slot-gold to-slot-gold-deep py-4 text-sm font-black tracking-[0.2em] text-slot active:brightness-110"
      >
        KABUL ET
      </button>
    </div>
  );
}