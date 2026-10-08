import React from 'react';
import { Sparkles, Trophy } from 'lucide-react';
import { formatCoins } from './dedeConfig';

/** Büyük kazanç ekranı: toplam bahsin 10 katı ve üzeri kazançlarda açılır. */
export default function DedeWinOverlay({ open, amount, title = 'BÜYÜK KAZANÇ!', subtitle = '', action = 'AL', onAccept }) {
  if (!open) return null;
  return (
    <div className="dede-overlay fixed inset-0 z-[190] flex flex-col items-center justify-center gap-4 px-6 text-center backdrop-blur-sm">
      <Trophy className="h-12 w-12 text-[#ffd35c] drop-shadow-[0_0_18px_rgba(255,190,60,0.95)]" />
      <p className="dede-title text-2xl">{title}</p>
      {subtitle && (
        <p className="-mt-2 text-[10px] font-black tracking-[0.18em] text-[#ffe9a8]/80">{subtitle}</p>
      )}
      <p className="flex items-center gap-2 font-mono text-3xl font-black text-white drop-shadow-[0_0_18px_rgba(255,190,60,0.9)]">
        <Sparkles className="h-6 w-6 text-[#ffd35c]" />
        {formatCoins(amount)}
      </p>
      <button
        type="button"
        onClick={onAccept}
        className="mt-2 rounded-full border border-[#fff6d0] bg-gradient-to-b from-[#ffe9a8] to-[#e0a012] px-8 py-2.5 text-sm font-black tracking-[0.16em] text-[#2a0c02] shadow-[0_10px_24px_-12px_rgba(0,0,0,0.9)] active:scale-95"
      >
        {action}
      </button>
    </div>
  );
}