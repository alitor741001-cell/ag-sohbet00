import { useMemo, useState } from 'react';
import { Crown, Gem, Heart, Star } from 'lucide-react';
import GiftCard from '@/components/voice/GiftCard';
import GiftRecipientRow from '@/components/voice/GiftRecipientRow';
import GiftLevelTicker from '@/components/voice/GiftLevelTicker';
import GiftBoardFooter from '@/components/voice/GiftBoardFooter';
import { K_UNIT, formatCoins, tierForK, toneColor } from '@/lib/giftTone';

// Kategori sırası ve simgeleri; listede olmayan kategoriler sona eklenir.
const CATEGORY_ORDER = ['Tümü', 'Normal', 'Romantik', 'Premium', 'Efsanevi'];
const CATEGORY_ICON = { Tümü: Star, Normal: Heart, Romantik: Heart, Premium: Crown, Efsanevi: Gem };
const categoryRank = (name) => {
  const index = CATEGORY_ORDER.indexOf(name);
  return index === -1 ? CATEGORY_ORDER.length : index;
};

/** Hediye Tahtası içeriği: kategori sekmeleri, hediye ızgarası, alıcılar ve alt gönderim çubuğu. */
export default function GiftBoardContent({
  user, gifts = [], tiers = [], people = [], selectedIds = [], giftId, coins, giftTick = 0,
  onSelectGift, onTogglePerson, onSelectAll, onClear, onOpenCoins, onClose, onSend, sendDisabled,
}) {
  const [category, setCategory] = useState('Tümü');

  const categories = useMemo(
    () => ['Tümü', ...new Set(gifts.map((gift) => gift.category || 'Diğer'))].sort((a, b) => categoryRank(a) - categoryRank(b)),
    [gifts]
  );
  const shown = useMemo(
    () => (category === 'Tümü' ? gifts : gifts.filter((gift) => (gift.category || 'Diğer') === category)),
    [gifts, category]
  );

  const gift = gifts.find((item) => item.id === giftId) || null;
  // Alıcı seçiminin rengi seçilen hediyenin seviyesinden gelir.
  const color = toneColor(tierForK(tiers, gift?.k_value || 0));
  const totalK = (Number(gift?.k_value) || 0) * selectedIds.length;
  const totalCoins = totalK * K_UNIT;
  const insufficient = !!gift && selectedIds.length > 0 && coins !== null && coins !== undefined && totalCoins > coins;

  return (
    // h-full: panelin kalan yüksekliği içeriğe geçer, böylece yalnızca hediye ızgarası kayar
    // ve alttaki satırlar (alıcılar, gönderim çubuğu) her zaman görünür kalır.
    <div className="gift-palace flex min-h-0 flex-1 flex-col">
      {/* Atış ve alış seviyesinin ilerlemesi. */}
      <div className="shrink-0">
        <GiftLevelTicker giftTick={giftTick} />
      </div>

      {/* Alıcılar: seviye barının hemen altında durur — kutu açıldığında kime gönderileceği
          ilk bakışta görünür, hediye ızgarası arada kalan alanı doldurur. */}
      <div className="shrink-0 pt-1">
        <GiftRecipientRow
          people={people}
          selectedIds={selectedIds}
          color={color}
          onToggle={onTogglePerson}
          onSelectAll={onSelectAll}
          onClear={onClear}
        />
      </div>

      {/* Üst sekmeler: hediye kategorileri. Soldaki çember kendi profilimiz, sağdaki ok kapatır. */}
      <div className="gift-palace-tabs flex shrink-0 items-center gap-2">
        <span className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10 ring-1 ring-[#45d6c8]/60">
          {user?.avatar ? (
            <img src={user.avatar} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" draggable={false} />
          ) : (
            <span className="text-[11px] font-black text-white">{(user?.full_name || '?').trim().charAt(0).toUpperCase()}</span>
          )}
        </span>
        <div className="no-scrollbar flex min-w-0 flex-1 gap-1.5 overflow-x-auto pb-1">
          {categories.map((item) => {
            const Icon = CATEGORY_ICON[item];
            const active = category === item;
            return (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                aria-pressed={active}
                className={`gift-palace-tab flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1.5 text-[12px] transition ${
                  active
                    ? 'border-[#ffcc00] bg-white/[0.08] font-black text-white shadow-[0_0_12px_rgba(255,204,0,0.35)]'
                    : 'border-white/10 bg-white/[0.05] font-semibold text-white/60'
                }`}
              >
                {Icon && <Icon className="h-3.5 w-3.5" fill={item === 'Normal' ? 'currentColor' : 'none'} />}
                {item}
              </button>
            );
          })}
        </div>
      </div>

      {/* Hediye ızgarası kendi alanında kayar; kalan yüksekliği doldurur. */}
      <div className="no-scrollbar mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {shown.length === 0 ? (
          <p className="rounded-xl bg-white/5 px-3 py-3 text-center text-xs text-white/50">Bu kategoride hediye yok.</p>
        ) : (
          <div className="gift-palace-grid grid grid-cols-4 gap-2 pb-2">
            {shown.map((item) => (
              <GiftCard key={item.id} gift={item} selected={giftId === item.id} onSelect={onSelectGift} />
            ))}
          </div>
        )}
      </div>

      {insufficient && (
        <p className="mt-1.5 shrink-0 rounded-xl bg-red-500/15 px-3 py-1.5 text-center text-[11px] font-bold text-red-300">
          Yetersiz bakiye — gereken {formatCoins(totalCoins)} coin, bakiyen {formatCoins(coins)} coin
        </p>
      )}

      <GiftBoardFooter
        coins={coins}
        count={selectedIds.length}
        onOpenCoins={onOpenCoins}
        onSend={onSend}
        sendDisabled={sendDisabled}
      />
    </div>
  );
}