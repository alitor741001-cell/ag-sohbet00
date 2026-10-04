import { useCallback, useEffect, useMemo, useState } from 'react';
import { Coins, Send } from 'lucide-react';
import VoiceSheet from '@/components/voice/VoiceSheet';
import GiftCard from '@/components/voice/GiftCard';
import GiftRecipientRow from '@/components/voice/GiftRecipientRow';
import { K_UNIT, coinToK, formatCoins, formatK, formatPrice, tierForK, toneColor } from '@/lib/giftTone';

/** Hediye Tahtası: kategoriler, hediyeler (K değeriyle) ve çoklu alıcı seçimi. */
export default function GiftBoard({ open, onClose, gifts = [], tiers = [], people = [], selectedIds = [], giftId, coins, sending, onSelectGift, onTogglePerson, onSelectAll, onClear, onSend }) {
  const [category, setCategory] = useState('Tümü');

  useEffect(() => { if (open) setCategory('Tümü'); }, [open]);

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
  const canSend = !!gift && count > 0 && !insufficient && !sending;

  return (
    <VoiceSheet open={open} onClose={onClose} title="Hediye Tahtası">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-xs font-black tabular-nums text-amber-300">
          <Coins className="h-4 w-4" /> {coins === null || coins === undefined ? '—' : formatCoins(coins)}
          {balanceK !== null && <span className="text-[10px] font-bold text-amber-300/60">({formatK(balanceK)})</span>}
        </span>
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

      <p className="mt-3 text-center text-[11px] text-white/50">
        Odadaki profillere dokunarak da alıcı seçebilirsin — seçilenler yalnızca bu listede işaretlenir, hediye seçilenlere gider.
      </p>

      {insufficient && (
        <p className="mt-2 rounded-xl bg-red-500/15 px-3 py-2 text-center text-[11px] font-bold text-red-300">
          Yetersiz bakiye — gereken {formatPrice(totalK)}, bakiyen {formatCoins(coins)} coin
        </p>
      )}

      <button
        type="button"
        disabled={!canSend}
        onClick={() => onSend(gift)}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-black text-black transition-transform active:scale-95 disabled:opacity-40"
        style={{ background: `linear-gradient(135deg, ${color}, ${tone?.glow || color})` }}
      >
        <Send className="h-4 w-4" />
        {gift ? (count > 1 ? `${gift.name} – ${count} kişiye gönder` : `${gift.name} gönder`) : 'Bir hediye seç'}
        {gift && count > 0 && <span className="tabular-nums opacity-80">{formatPrice(totalK)}</span>}
      </button>
    </VoiceSheet>
  );
}