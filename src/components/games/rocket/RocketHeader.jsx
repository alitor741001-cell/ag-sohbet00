import React from 'react';
import { ArrowLeft, Crown, Film, Wallet, X } from 'lucide-react';

/** Üst şerit: geri tuşu, FiLMKEYFi logosu, oyun defteri ve kapatma tuşu. */
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
        <div className="flex items-center gap-1">
          <Film className="h-3.5 w-3.5 text-[#00d4ff]" />
          <span className="text-[15px] font-black tracking-tight text-white">
            FiLMKEY<span className="text-red-500">Fi</span>
          </span>
          <Crown className="h-2.5 w-2.5 text-[#ffb800]" />
        </div>
        <span className="mt-0.5 text-[6px] font-bold tracking-[0.3em] text-white/50">
          FİLMİN EN KEYİFLİ HALİ
        </span>
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