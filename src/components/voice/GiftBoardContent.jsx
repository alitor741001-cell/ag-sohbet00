import { useMemo, useState } from 'react';
import { Coins, Plus } from 'lucide-react';
import GiftCard from '@/components/voice/GiftCard';
import GiftRecipientRow from '@/components/voice/GiftRecipientRow';
import GiftLevelTicker from '@/components/voice/GiftLevelTicker';
import { K_UNIT, coinToK, formatCoins, formatK, formatPrice, tierForK, toneColor } from '@/lib/giftTone';

/** Hediye Tahtası içeriği: kategoriler, hediyeler (K değeriyle) ve çoklu alıcı seçimi. */
export default function GiftBoardContent({ gifts = [], tiers = [], people = [], selectedIds = [], giftId, coins, onSelectGift, onTogglePerson, onSelectAll, onClear, onOpenCoins }) {
  const [category, setCategory] = useState('Tümü');

  const categories = useMemo(() => ['Tümü', ...new Set(gifts.map((gift) => gift.category || 'Diğer'))], [gifts]);
  const shown = useMemo(
    () => (category === 'Tümü' ? gifts : gifts.filter((gift) => (gift.category || 'Diğer') === category)),
    [gifts, category]
  );

  const gift = gifts.find((item) => item.id === giftId) || null;
  const tone = tierForK(tiers, gift?.k_value || 0);
  const color = toneColor(tone);
  const count = selectedIds.length;
  const totalK = (Number(gift?.k_value) || 0) * count;
  const balanceK = coins === null || coins === undefined ? null : coinToK(coins);
  // Fiyat karşılaştırması coin üzerinden yapılır: 1K altındaki hediyeler de doğru hesaplanır.
  const totalCoins = (Number(gift?.k_value) || 0) * K_UNIT * count;
  const insufficient = !!gift && count > 0 && coins !== null && coins !== undefined && totalCoins > coins;

  return (
    // Alt boşluk: sağ alttaki yuvarlak "Gönder" düğmesi son hediye satırını kapatmasın.
    <div className="pb-24">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-xs font-black tabular-nums text-amber-300">
          <Coins className="h-4 w-4" /> {coins === null || coins === undefined ? '—' : formatCoins(coins)}
          {balanceK !== null && <span className="text-[10px] font-bold text-amber-300/60">({formatK(balanceK)})</span>}
        </span>
        <button
          type="button"
          onClick={onOpenCoins}
          className="flex shrink-0 items-center gap-1 rounded-full bg-amber-300/15 px-3 py-1.5 text-[11px] font-black text-amber-300 transition-transform active:scale-95"
        >
          <Plus className="h-3.5 w-3.5" /> Coins Yükle
        </button>
        <span className="rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-bold text-white/80">{count} alıcı</span>
        {gift && <span className="min-w-0 flex-1 truncate text-right text-[11px] font-bold" style={{ color }}>{tone?.name || 'Standart'} seviye</span>}
      </div>

      <GiftRecipientRow
        people={people}
        selectedIds={selectedIds}
        color={color}
        onToggle={onTogglePerson}
        onSelectAll={onSelectAll}
        onClear={onClear}
      />

      {/* "Tümü" kategorisinin üstünde dönüşümlü seviye şeridi: atış LVL → hediye alma LVL. */}
      <GiftLevelTicker />

      <div className="no-scrollbar my-3 flex gap-2 overflow-x-auto pb-1">
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setCategory(item)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-transform active:scale-95 ${category === item ? 'bg-primary text-primary-foreground' : 'bg-white/10 text-white'}`}
          >
            {item}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="rounded-xl bg-white/5 px-3 py-3 text-center text-xs text-white/50">Bu kategoride hediye yok.</p>
      ) : (
        <div className="grid max-h-[32vh] grid-cols-3 gap-2 overflow-y-auto pb-1">
          {shown.map((item) => (
            <GiftCard
              key={item.id}
              gift={item}
              color={tierForK(tiers, item.k_value)?.color || '#ef4444'}
              selected={giftId === item.id}
              onSelect={onSelectGift}
            />
          ))}
        </div>
      )}

      {insufficient && (
        <p className="mt-2 rounded-xl bg-red-500/15 px-3 py-2 text-center text-[11px] font-bold text-red-300">
          Yetersiz bakiye — gereken {formatPrice(totalK)}, bakiyen {formatCoins(coins)} coin
        </p>
      )}

    </div>
  );
}