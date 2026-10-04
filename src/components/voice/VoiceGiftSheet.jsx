import { Coins } from 'lucide-react';
import VoiceSheet from '@/components/voice/VoiceSheet';
import { GIFTS } from '@/lib/gifts';

/** Hediye paneli: 4x2 ızgarada hediyeler, dokununca odaya gönderilir. */
export default function VoiceGiftSheet({ open, onClose, onSend }) {
  return (
    <VoiceSheet open={open} onClose={onClose} title="Hediye gönder">
      <p className="mb-3 text-center text-xs text-white/60">Bir hediye seç — odadaki herkesin ekranında belirir.</p>
      <div className="grid grid-cols-4 gap-2">
        {GIFTS.map((gift) => (
          <button
            key={gift.id}
            type="button"
            onClick={() => onSend(gift.id)}
            className="flex flex-col items-center gap-1 rounded-2xl border border-white/10 bg-gradient-to-b from-white/12 to-white/5 px-1.5 py-2.5 transition-transform active:scale-95"
          >
            <span className="text-[30px] leading-none">{gift.emoji}</span>
            <span className="w-full truncate text-center text-[10px] font-semibold text-white/85">{gift.name}</span>
            <span className="flex items-center gap-0.5 rounded-full bg-black/45 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
              <Coins className="h-3 w-3" /> {gift.coins}
            </span>
          </button>
        ))}
      </div>
    </VoiceSheet>
  );
}