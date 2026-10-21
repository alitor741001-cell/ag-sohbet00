import { Coins } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { K_UNIT, formatCoins } from '@/lib/giftTone';
import { giftMotion } from '@/lib/giftMotion';

/** Hediye tahtasındaki tek hediye: büyük görsel, ad ve altın coin fiyatı. Seçili hediye turkuaz çerçevelidir. */
export default function GiftCard({ gift, selected, onSelect, onPreview }) {
  const { motion, tone } = giftMotion(gift);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border transition-transform ${selected ? 'border-[#45d6c8] bg-[#45d6c8]/10' : 'border-white/[0.07] bg-[#0e0e15]'}`}
    >
      {/* Hediyenin kendi renginde yumuşak bir arka ışık. */}
      <span
        className="pointer-events-none absolute inset-0"
        style={{ background: `radial-gradient(circle at 50% 34%, ${tone}26, transparent 64%)` }}
      />

      <button
        type="button"
        onClick={() => onSelect(gift.id)}
        aria-pressed={selected}
        className="relative flex w-full flex-col items-center gap-1 px-1 pb-2 pt-2.5 active:scale-95"
      >
        <span className="gift-shine relative inline-flex h-14 w-14 items-center justify-center" style={{ '--gift-tone': tone }}>
          {gift.image_url ? (
            <Image
              src={gift.image_url}
              alt={gift.name}
              className={`${motion} h-14 w-14 drop-shadow-[0_4px_10px_rgba(0,0,0,0.55)]`}
              fittingType="fit"
              originWidth={192}
              originHeight={192}
            />
          ) : (
            <span className={`${motion} text-[34px] leading-none`}>{gift.emoji || '🎁'}</span>
          )}
        </span>
        <span className="w-full truncate text-center text-[10.5px] font-bold leading-tight text-white">{gift.name}</span>
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
          className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 py-[1px] text-[8px] font-black tracking-wide text-[#45d6c8] active:scale-90"
        >
          3D
        </button>
      )}
    </div>
  );
}