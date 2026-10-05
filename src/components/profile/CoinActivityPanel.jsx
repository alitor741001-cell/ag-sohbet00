import { useEffect, useState } from 'react';
import { ChevronLeft, Coins, Gift, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';
import GiftSendersPanel from '@/components/profile/GiftSendersPanel';

const formatCoins = (value) => Math.max(0, Math.round(Number(value) || 0)).toLocaleString('tr-TR');
const formatK = (value) => `${Math.max(0, Number(value) || 0).toLocaleString('tr-TR', { maximumFractionDigits: 2 })}K`;

/** Hareket tarihi ve saati: 04.10.2026 20:53 */
const formatWhen = (iso) => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('tr-TR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

/**
 * Coin Hareketleri: hesaba yüklenen coinler (sistem/yönetici), karşı tarafın profili,
 * kimlik numarası, hediye/coin tutarı ve tarih-saat tek listede.
 * Gönderimler hesaptan çıktığı için eksi (-), hesaba girenler artı (+) görünür.
 */
export default function CoinActivityPanel({ open, onClose }) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [view, setView] = useState('feed');

  useEffect(() => { if (open) setView('feed'); }, [open]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    base44.functions.invoke('gift-box', { action: 'activity' })
      .then((response) => setItems(response.data?.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  // Hediye gönderenler listesi kendi geri tuşuyla coin hareketlerine döner.
  if (view === 'senders') return <GiftSendersPanel open onClose={() => setView('feed')} />;

  return (
    <div className="fixed inset-0 z-[300] flex flex-col bg-[#0F0F14] text-white">
      <header className="flex shrink-0 items-center gap-2 border-b border-white/10 px-3 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Geri"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 transition-transform active:scale-95"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="flex min-w-0 flex-1 items-center gap-2 text-sm font-bold text-white">
          <Coins className="h-4 w-4 shrink-0 text-amber-400" /> <span className="truncate">Coin Hareketleri</span>
        </p>
        <button
          type="button"
          onClick={() => setView('senders')}
          className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-sky-400/30 bg-sky-400/10 px-3 text-[11px] font-bold text-sky-300 transition-transform active:scale-95"
        >
          <Gift className="h-3.5 w-3.5" /> Hediye Gönderenler
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto w-full max-w-[430px]">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : items.length === 0 ? (
            <p className="py-10 text-center text-sm text-white/50">Henüz coin hareketi yok.</p>
          ) : (
            items.map((item) => {
              const isLoad = item.kind === 'load';
              const incoming = isLoad || item.direction === 'received';
              const person = item.counterpart || null;
              // Hesaptan çıkan tutar eksi, hesaba giren tutar artı gösterilir.
              const amountText = isLoad
                ? `+${formatCoins(item.coins)}`
                : item.kind === 'gift'
                  ? `${incoming ? '+' : '-'}${formatK(Number(item.total_k) || item.k_value)}`
                  : `${incoming ? '+' : '-'}${formatCoins(item.coins)}`;
              // Yükleme satırı "Sistem tarafından 50K yüklendi" olarak okunur.
              const title = isLoad
                ? `${item.source === 'admin' ? 'Yönetici' : 'Sistem'} tarafından ${formatK((Number(item.coins) || 0) / 1000)} yüklendi`
                : item.title;
              const detail = isLoad
                ? [item.source === 'system' ? item.detail : '', formatWhen(item.created_date)].filter(Boolean).join(' • ')
                : [`Kimlik: ${person?.member_id || '—'}`, `${item.gift_emoji ? `${item.gift_emoji} ` : ''}${item.detail}`, formatWhen(item.created_date)].filter(Boolean).join(' • ');

              return (
                <div key={item.id} className="mb-2 flex items-center gap-3 rounded-2xl border border-white/10 bg-gradient-to-r from-white/[0.07] to-white/[0.03] px-3 py-2.5">
                  <span className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/10">
                    {isLoad ? (
                      <span className="flex h-full w-full items-center justify-center bg-amber-400/15">
                        <Coins className="h-5 w-5 text-amber-400" />
                      </span>
                    ) : person?.avatar ? (
                      <Image src={person.avatar} alt={person.name} className="h-full w-full" fittingType="fill" draggable={false} />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-sm font-bold text-white/70">
                        {String(person?.name || '?').trim().charAt(0).toUpperCase()}
                      </span>
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold text-white">{title}</p>
                    <p className="truncate text-[10px] text-white/45">{detail}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={`text-sm font-black tabular-nums ${incoming ? 'text-amber-400' : 'text-red-400'}`}>{amountText}</p>
                    {!isLoad && <p className="text-[10px] font-semibold text-white/40">{item.kind === 'gift' ? 'hediye' : 'coin'}</p>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}