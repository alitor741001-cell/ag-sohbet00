import React from 'react';
import { ArrowLeft, Wallet, X } from 'lucide-react';

/** Üst şerit: geri tuşu, oyun adı, oyun defteri ve kapatma tuşu. */
export default function RocketHeader({ onBack, onExit, onLedger }) {
  return (
    <header className="flex items-center gap-2 px-2 pb-1 pt-[max(0.5rem,env(safe-area-inset-top))]">
      <button
        type="button"
        onClick={onBack}
        aria-label="Oyun listesine dön"
        className="rk-icon-btn"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>

      <div className="flex min-w-0 flex-1 flex-col items-center leading-none">
        <span className="text-[15px] font-black tracking-tight text-white">CRASH ROCKET</span>
      </div>

      <button
        type="button"
        onClick={onLedger}
        aria-label="Oyun defterini aç"
        className="rk-icon-btn"
      >
        <Wallet className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onExit}
        aria-label="Oyunu kapat"
        className="rk-icon-btn"
      >
        <X className="h-4 w-4" />
      </button>
    </header>
  );
}