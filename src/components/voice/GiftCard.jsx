import { useId } from 'react';
import GiftTransparencyFilter from '@/components/voice/GiftTransparencyFilter';
import { Check, Coins } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { K_UNIT, formatCoins } from '@/lib/giftTone';
import useGiftArtColor from '@/hooks/useGiftArtColor';

export default function GiftCard({ gift, selected, onSelect }) {
  // Hediye sabit durur; yalnızca kendi rengindeki yumuşak ışık gösterilir.
  const tone = useGiftArtColor(gift);
  const filterId = `gift-art-${useId().replace(/:/g, '')}`;

  return (
    <button
      type="button"
      onClick={() => onSelect(gift.id)}
      onContextMenu={(event) => event.preventDefault()}
      aria-pressed={selected}
      className="gift-palace-card relative flex w-full flex-col items-center gap-0.5 py-1 active:scale-95"
      style={{ '--gift-glow': tone }}
    >
      <GiftTransparencyFilter id={filterId} />
      <span className="gift-palace-art relative inline-flex w-full items-center justify-center">
        {selected && <span className="gift-palace-selected"><Check aria-hidden="true" /><span className="sr-only">Seçildi</span></span>}
        <span
        className="pointer-events-none absolute inset-0"
          style={{ background: `radial-gradient(ellipse at 50% 58%, ${tone}${selected ? '85' : '60'}, ${tone}22 42%, transparent 72%)` }}
        />
        {gift.image_url ? (
          <Image
            src={gift.image_url}
            alt={gift.name}
            fittingType="fit"
            originWidth={192}
            originHeight={192}
            className={`gift-palace-image relative h-full w-full ${selected ? 'scale-105' : ''}`}
            blurPlaceholder={false}
            style={{ filter: `url(#${filterId}) drop-shadow(0 4px 7px ${tone}99) drop-shadow(0 0 3px ${tone}66)` }}
          />
        ) : (
          <span className="relative text-[38px] leading-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.6)]">{gift.emoji || '🎁'}</span>
        )}
      </span>
      <span className={`w-full truncate text-center text-[10.5px] font-bold leading-tight ${selected ? 'text-[#ffcc00]' : 'text-white'}`}>
        {gift.name}
      </span>
      {/* Miktar her hediyede görünür: koyu zemin üzerinde tek satır, kesilmez. */}
      <span className="relative z-10 mt-0.5 flex max-w-full items-center gap-0.5 whitespace-nowrap rounded-full bg-black/55 px-1.5 py-[1px] text-[10.5px] font-black tabular-nums leading-tight text-[#ffd166]">
        <Coins className="h-2.5 w-2.5 shrink-0 text-[#ffc025]" /> {formatCoins((Number(gift.k_value) || 0) * K_UNIT)}
      </span>
    </button>
  );
}