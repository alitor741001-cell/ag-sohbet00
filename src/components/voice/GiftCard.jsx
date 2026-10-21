import { Coins } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { K_UNIT, formatCoins } from '@/lib/giftTone';
import { giftMotion } from '@/lib/giftMotion';

/** Hediye tahtasındaki tek hediye: görsel/ikon, ad ve coin fiyatı. Seçili hediye turkuaz çerçevelidir. */
export default function GiftCard({ gift, selected, onSelect, onPreview }) {
  const { motion, tone } = giftMotion(gift);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border-2 transition-transform ${selected ? 'border-[#45d6c8] bg-[#45d6c8]/10' : 'border-white/10 bg-white/[0.05]'}`}
    >
      <button
        type="button"
        onClick={() => onSelect(gift.id)}
        aria-pressed={selected}
        className="flex w-full flex-col items-center gap-1 px-1.5 pb-1.5 pt-3 active:scale-95"
      >
        {gift.category && (
          <span className="absolute left-1 top-1 max-w-[calc(100%-2.6rem)] truncate rounded-full bg-[#1a1226]/85 px-1.5 py-[1px] text-[8px] font-bold text-white/70">
            {gift.category}
          </span>
        )}
        <span className="gift-shine relative inline-flex items-center justify-center" style={{ '--gift-tone': tone }}>
          {gift.image_url ? (
            <Image src={gift.image_url} alt={gift.name} className={`${motion} h-9 w-9`} fittingType="fit" originWidth={96} originHeight={96} />
          ) : (
            <span className={`${motion} text-[30px] leading-none`}>{gift.emoji || '🎁'}</span>
          )}
        </span>
        <span className="w-full truncate text-center text-[10px] font-semibold text-white/70">{gift.name}</span>
        <span className="flex items-center gap-0.5 text-[11px] font-black tabular-nums text-[#fbc02d]">
          <Coins className="h-3 w-3 shrink-0" /> {formatCoins((Number(gift.k_value) || 0) * K_UNIT)}
        </span>
      </button>

      {/* 3D önizleme: hediye seçimini değiştirmeden modeli açar. */}
      {onPreview && (
        <button
          type="button"
          onClick={() => onPreview(gift)}
          aria-label={`${gift.name} 3D önizleme`}
          className="absolute right-1 top-1 rounded-full bg-black/70 px-1.5 py-[1px] text-[8px] font-black tracking-wide text-[#45d6c8] active:scale-90"
        >
          3D
        </button>
      )}
    </div>
  );
}