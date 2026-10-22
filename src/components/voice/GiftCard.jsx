import { useId } from 'react';
import GiftTransparencyFilter from '@/components/voice/GiftTransparencyFilter';
import { Coins } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { K_UNIT, formatCoins } from '@/lib/giftTone';
import { giftMotion } from '@/lib/giftMotion';

/**
 * Katalogdaki tek hediye: kare kutu, çerçeve ve etiket yok — hediye görseli siyah zeminde
 * serbest durur; altında adı ve altın coin fiyatı yazar.
 * Uzun basışta hiçbir şey açılmaz; dokunuş yalnızca hediyeyi seçer.
 */
export default function GiftCard({ gift, selected, onSelect }) {
  // Hediye sabit durur; yalnızca kendi rengindeki yumuşak ışık gösterilir.
  const { tone } = giftMotion(gift);
  const filterId = `gift-art-${useId().replace(/:/g, '')}`;

  return (
    <button
      type="button"
      onClick={() => onSelect(gift.id)}
      onContextMenu={(event) => event.preventDefault()}
      aria-pressed={selected}
      className="relative flex w-full flex-col items-center gap-0.5 py-1 active:scale-95"
    >
      <GiftTransparencyFilter id={filterId} />
      <span className="relative inline-flex h-[70px] w-full items-center justify-center">
        <span
          className="pointer-events-none absolute inset-0"
          style={{ background: `radial-gradient(circle at 50% 52%, ${tone}${selected ? '55' : '24'}, transparent 66%)` }}
        />
        {gift.image_url ? (
          <Image
            src={gift.image_url}
            alt={gift.name}
            fittingType="fit"
            originWidth={192}
            originHeight={192}
            className={`relative h-[62px] w-[62px] transition-transform duration-200 ${selected ? 'scale-110' : ''}`}
            blurPlaceholder={false}
            style={{ filter: `url(#${filterId})` }}
          />
        ) : (
          <span className="relative text-[38px] leading-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.6)]">{gift.emoji || '🎁'}</span>
        )}
      </span>
      <span className={`w-full truncate text-center text-[10.5px] font-bold leading-tight ${selected ? 'text-[#ffcc00]' : 'text-white'}`}>
        {gift.name}
      </span>
      <span className="flex items-center gap-0.5 text-[11px] font-black tabular-nums text-white/85">
        <Coins className="h-3 w-3 shrink-0 text-[#ffc025]" /> {formatCoins((Number(gift.k_value) || 0) * K_UNIT)}
      </span>
    </button>
  );
}