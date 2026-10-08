import React from 'react';
import { Sparkles, Trophy } from 'lucide-react';
import { formatCoins } from './fruitConfig';

/** Büyük kazanç ekranı: toplam bahsin 10 katı ve üzeri kazançlarda açılır. */
export default function FruitWinOverlay({ open, amount, onAccept }) {
  if (!open) return null;
  return (
    <div className="fruit-overlay fixed inset-0 z-[190] flex flex-col items-center justify-center gap-4 px-6 text-center backdrop-blur-sm">
      <Trophy className="h-12 w-12 text-[#ffd873] drop-shadow-[0_0_16px_rgba(255,216,115,0.9)]" />
      <p className="fruit-bubble-text text-2xl">BÜYÜK KAZANÇ!</p>
      <p className="flex items-center gap-2 font-mono text-3xl font-black text-white drop-shadow-[0_0_18px_rgba(255,136,238,0.9)]">
        <Sparkles className="h-6 w-6 text-[#ffd873]" />
        {formatCoins(amount)}
      </p>
      <button
        type="button"
        onClick={onAccept}
        className="mt-2 rounded-full border border-white/90 bg-gradient-to-b from-[#ffb6f2] to-[#ff44aa] px-8 py-2.5 text-sm font-black tracking-[0.16em] text-white shadow-[0_10px_24px_-12px_rgba(0,0,0,0.9)] active:scale-95"
      >
        AL
      </button>
    </div>
  );
}