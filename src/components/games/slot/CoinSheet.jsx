import React from 'react';
import { X } from 'lucide-react';

const format = (value) => new Intl.NumberFormat('tr-TR').format(Math.max(0, Math.round(value || 0)));

export default function CoinSheet({ open, onClose, coins, bonusReady, bonusAmount, message, onClaim }) {
  if (!open) return null;

  return (
    <div className="absolute inset-0 z-[190] flex items-end bg-black/70 p-3" onClick={onClose} role="presentation">
      <div
        className="slot-panel-3d w-full rounded-2xl border border-slot-gold/50 p-4"
        onClick={(event) => event.stopPropagation()}
        role="presentation"
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-black tracking-widest text-slot-gold">COIN YÜKLE</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Coin panelini kapat"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slot-panel"
          >
            <X className="h-4 w-4 text-white" />
          </button>
        </div>

        <p className="mt-2 text-center font-mono text-3xl font-black tabular-nums text-slot-text">{format(coins)}</p>
        <p className="text-center text-[10px] font-black tracking-widest text-slot-gold/80">MEVCUT BAKİYE</p>

        <button
          type="button"
          onClick={onClaim}
          disabled={!bonusReady}
          className="slot-auto mt-4 w-full rounded-xl py-3 text-xs font-black tracking-widest text-slot disabled:opacity-60"
        >
          {bonusReady ? `GÜNLÜK BONUS  +${format(bonusAmount)}` : 'BONUS HAZIR DEĞİL'}
        </button>

        <p className="mt-2 text-center text-[10px] leading-relaxed text-white/60">
          Bonus 6 saatte bir yenilenir ve coinler hesabına eklenir.
        </p>

        {message && <p className="mt-2 text-center text-[11px] font-bold text-slot-green">{message}</p>}
      </div>
    </div>
  );
}