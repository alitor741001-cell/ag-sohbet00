import { Check } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { formatPrice } from '@/lib/giftTone';
import { giftMotion } from '@/lib/giftMotion';

/** Hediye tahtasındaki tek hediye: görsel/ikon, ad ve K değeri. */
export default function GiftCard({ gift, color, selected, onSelect }) {
  const { motion, tone } = giftMotion(gift);

  return (
    <button
      type="button"
      onClick={() => onSelect(gift.id)}
      aria-pressed={selected}
      className="relative flex flex-col items-center gap-1 overflow-hidden rounded-2xl border bg-gradient-to-b from-white/12 to-white/5 px-1.5 py-2 transition-transform active:scale-95"
      style={{
        borderColor: selected ? color : 'rgba(255,255,255,0.12)',
        boxShadow: selected ? `0 0 0 2px ${color}, 0 0 18px ${color}` : undefined,
        transform: selected ? 'translateY(-2px)' : undefined,
      }}
    >
      <span className="gift-shine relative inline-flex items-center justify-center" style={{ '--gift-tone': tone }}>
        {gift.image_url ? (
          <Image src={gift.image_url} alt={gift.name} className={`${motion} h-9 w-9`} fittingType="fit" originWidth={96} originHeight={96} />
        ) : (
          <span className={`${motion} text-[28px] leading-none`}>{gift.emoji || '🎁'}</span>
        )}
      </span>
      <span className="w-full truncate text-center text-[10px] font-semibold text-white/85">{gift.name}</span>
      <span className="rounded-full bg-black/50 px-1.5 py-0.5 text-[10px] font-black tabular-nums" style={{ color }}>
        {formatPrice(gift.k_value)}
      </span>
      {selected && (
        <span className="gift-pop absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full" style={{ background: color }}>
          <Check className="h-3 w-3 text-black" />
        </span>
      )}
    </button>
  );
}