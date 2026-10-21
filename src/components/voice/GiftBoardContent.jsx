import { useMemo, useState } from 'react';
import GiftCard from '@/components/voice/GiftCard';
import GiftRecipientRow from '@/components/voice/GiftRecipientRow';
import GiftLevelTicker from '@/components/voice/GiftLevelTicker';
import GiftBoardFooter from '@/components/voice/GiftBoardFooter';
import Gift3DPreview from '@/components/voice/Gift3DPreview';
import { K_UNIT, formatCoins, tierForK, toneColor } from '@/lib/giftTone';

/** Hediye Tahtası içeriği: kategori sekmeleri, hediye ızgarası, alıcılar ve alt gönderim çubuğu. */
export default function GiftBoardContent({
  user, gifts = [], tiers = [], people = [], selectedIds = [], giftId, coins, giftTick = 0,
  onSelectGift, onTogglePerson, onSelectAll, onClear, onOpenCoins, onClose, onSend, sendDisabled,
}) {
  const [category, setCategory] = useState('Tümü');
  const [preview, setPreview] = useState(null);

  const categories = useMemo(() => ['Tümü', ...new Set(gifts.map((gift) => gift.category || 'Diğer'))], [gifts]);
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
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Atış ve alış seviyesinin ilerlemesi. */}
      <div className="shrink-0">
        <GiftLevelTicker giftTick={giftTick} />
      </div>

      {/* Alıcılar: seviye barının hemen altında durur — kutu açıldığında kime gönderileceği
          ilk bakışta görünür, hediye ızgarası arada kalan alanı doldurur. */}
      <div className="shrink-0 pt-3">
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
      <div className="flex shrink-0 items-end gap-2 border-b border-white/10">
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
      </div>

      {/* Hediye ızgarası kendi alanında kayar; kalan yüksekliği doldurur. */}
      <div className="no-scrollbar mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {shown.length === 0 ? (
          <p className="rounded-xl bg-white/5 px-3 py-3 text-center text-xs text-white/50">Bu kategoride hediye yok.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2 pb-1">
            {shown.map((item) => (
              <GiftCard key={item.id} gift={item} selected={giftId === item.id} onSelect={onSelectGift} onPreview={setPreview} />
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

      <Gift3DPreview gift={preview} onClose={() => setPreview(null)} />
    </div>
  );
}