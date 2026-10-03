import React from 'react';
import { Trophy } from 'lucide-react';
import { plainText } from '@/components/voice/voiceText';

/** Sohbet akışında büyük slot ödülü için özel kutlama satırı. */
export default function SlotWinMessage({ message }) {
  return (
    <div className="animate-slot-win-pop relative mx-auto overflow-hidden rounded-2xl border-2 border-amber-300/80 bg-gradient-to-r from-amber-500/25 via-amber-200/15 to-amber-500/25 px-3 py-2 shadow-[0_0_22px_rgba(251,191,36,0.45)]">
      <span className="animate-slot-win-sheen pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-white/25 blur-md" />
      <div className="relative flex items-center gap-2">
        <Trophy className="h-4 w-4 shrink-0 text-amber-300" />
        <p className="text-[12px] font-black leading-snug text-amber-200 [overflow-wrap:anywhere] [text-shadow:0_0_10px_rgba(251,191,36,0.8)]">
          {plainText(message.text)}
        </p>
      </div>
    </div>
  );
}