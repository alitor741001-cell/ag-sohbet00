import { useRef } from 'react';
import { Coins } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { K_UNIT, formatCoins } from '@/lib/giftTone';
import { giftMotion } from '@/lib/giftMotion';

/**
 * Katalogdaki tek hediye: kare kutu, çerçeve ve etiket yok — hediye görseli siyah zeminde
 * serbest durur; altında adı ve altın coin fiyatı yazar.
 * Görsele uzun basıldığında 3D önizleme açılır (seçim değişmez).
 */
export default function GiftCard({ gift, selected, onSelect, onPreview }) {
  // Hediye sabit durur; yalnızca kendi rengindeki yumuşak ışık gösterilir.
  const { tone } = giftMotion(gift);
  const timer = useRef(null);

  const startPreview = () => {
    if (!onPreview) return;
    timer.current = setTimeout(() => onPreview(gift), 480);
  };

  const cancelPreview = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  return (
    <button
      type="button"
      onClick={() => onSelect(gift.id)}
      onPointerDown={startPreview}
      onPointerUp={cancelPreview}
      onPointerLeave={cancelPreview}
      onPointerCancel={cancelPreview}
      onContextMenu={(event) => event.preventDefault()}
      aria-pressed={selected}
      className="relative flex w-full flex-col items-center gap-0.5 py-1 active:scale-95"
    >
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
            className={`relative h-[62px] w-[62px] transition-transform duration-200 ${selected ? 'scale-110 drop-shadow-[0_0_12px_rgba(255,204,0,0.6)]' : 'drop-shadow-[0_4px_10px_rgba(0,0,0,0.6)]'}`}
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