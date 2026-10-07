import { useMemo, useState } from 'react';
import { ChevronDown, ShoppingBag } from 'lucide-react';
import GiftCard from '@/components/voice/GiftCard';
import GiftRecipientRow from '@/components/voice/GiftRecipientRow';
import GiftLevelTicker from '@/components/voice/GiftLevelTicker';
import GiftBoardFooter from '@/components/voice/GiftBoardFooter';
import { K_UNIT, formatCoins, formatPrice, tierForK, toneColor } from '@/lib/giftTone';

// Hediye sıralaması: varsayılan diziliş ve K değerine göre popüler sıralama.
const SORTS = [{ key: 'default', label: 'Tüm' }, { key: 'popular', label: 'Popüler' }];

/** Hediye Tahtası içeriği: seviye barı, kategoriler, hediye ızgarası, alıcılar ve alt gönderim çubuğu. */
export default function GiftBoardContent({
  user, gifts = [], tiers = [], people = [], selectedIds = [], giftId, coins, giftTick = 0,
  multiplier = 1, onMultiplier, onSelectGift, onTogglePerson, onSelectAll, onClear, onOpenCoins, onClose,
  onSend, sendDisabled,
}) {
  const [category, setCategory] = useState('Tümü');
  const [sort, setSort] = useState('default');

  const categories = useMemo(() => ['Tümü', ...new Set(gifts.map((gift) => gift.category || 'Diğer'))], [gifts]);
  const shown = useMemo(() => {
    const list = category === 'Tümü' ? gifts : gifts.filter((gift) => (gift.category || 'Diğer') === category);
    return sort === 'popular' ? [...list].sort((a, b) => (Number(b.k_value) || 0) - (Number(a.k_value) || 0)) : list;
  }, [gifts, category, sort]);

  const gift = gifts.find((item) => item.id === giftId) || null;
  const tone = tierForK(tiers, gift?.k_value || 0);
  const color = toneColor(tone);
  const quantity = Math.max(1, Number(multiplier) || 1);
  const count = selectedIds.length;
  const totalK = (Number(gift?.k_value) || 0) * count * quantity;
  const totalCoins = totalK * K_UNIT;
  const insufficient = !!gift && count > 0 && coins !== null && coins !== undefined && totalCoins > coins;

  return (
    // Üst bölümler (seviye barı, sekmeler, filtreler, alıcılar, alt çubuk) sabit durur;
    // kaydırma yalnızca hediye ızgarasına aittir.
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-2">
        <div className="min-w-0 flex-1"><GiftLevelTicker giftTick={giftTick} /></div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Hediye kutusunu kapat"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/75 transition-transform active:scale-95"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {/* Üst sekmeler: hediye kategorileri. Soldaki çember kendi profilimiz, sağdaki çanta
          Coins Yükle mağazasını açar. */}
      <div className="mt-2 flex shrink-0 items-end gap-2 border-b border-white/10">
        <span className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10 ring-1 ring-[#45d6c8]/60">
          {user?.avatar ? (
            <img src={user.avatar} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" draggable={false} />
          ) : (
            <span className="text-[11px] font-black text-white">{(user?.full_name || '?').trim().charAt(0).toUpperCase()}</span>
          )}
        </span>
        <div className="no-scrollbar flex min-w-0 flex-1 gap-4 overflow-x-auto">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={`relative shrink-0 pb-2 text-[13px] transition-colors ${category === item ? 'font-black text-white' : 'font-semibold text-white/45'}`}
            >
              {item}
              {category === item && <span className="absolute inset-x-0.5 bottom-0 h-[2px] rounded-full bg-[#45d6c8]" />}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onOpenCoins}
          aria-label="Coins Yükle"
          className="mb-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/85 transition-transform active:scale-95"
        >
          <ShoppingBag className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-2 flex shrink-0 items-center gap-1.5">
        {SORTS.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => setSort(option.key)}
            className={`rounded-full px-3 py-1 text-[11px] font-bold transition-transform active:scale-95 ${sort === option.key ? 'bg-[#d9d9de] text-[#1b1226]' : 'border border-white/25 text-white/80'}`}
          >
            {option.label}
          </button>
        ))}
        {gift && (
          <span className="ml-auto shrink-0 truncate rounded-full border px-2.5 py-1 text-[10px] font-bold" style={{ borderColor: `${color}99`, color }}>
            {tone?.name || 'Standart'} seviye
          </span>
        )}
      </div>

      {shown.length === 0 ? (
        <p className="mt-2 shrink-0 rounded-xl bg-white/5 px-3 py-3 text-center text-xs text-white/50">Bu kategoride hediye yok.</p>
      ) : (
        <div className="no-scrollbar mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="grid grid-cols-3 gap-2 pb-1">
            {shown.map((item) => (
              <GiftCard key={item.id} gift={item} selected={giftId === item.id} onSelect={onSelectGift} />
            ))}
          </div>
        </div>
      )}

      <div className="shrink-0 pt-2">
        <GiftRecipientRow
          people={people}
          selectedIds={selectedIds}
          color={color}
          onToggle={onTogglePerson}
          onSelectAll={onSelectAll}
          onClear={onClear}
        />
      </div>

      {insufficient && (
        <p className="mt-1.5 shrink-0 rounded-xl bg-red-500/15 px-3 py-1.5 text-center text-[11px] font-bold text-red-300">
          Yetersiz bakiye — gereken {formatPrice(totalK)}, bakiyen {formatCoins(coins)} coin
        </p>
      )}

      <GiftBoardFooter
        coins={coins}
        multiplier={quantity}
        onMultiplier={onMultiplier}
        onOpenCoins={onOpenCoins}
        onSend={onSend}
        sendDisabled={sendDisabled}
      />
    </div>
  );
}