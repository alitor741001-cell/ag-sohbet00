import { useEffect, useState } from 'react';
import { ChevronDown, ChevronLeft, Gift, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';

const formatTl = (value) => `${(Number(value) || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`;
const formatK = (value) => `${(Number(value) || 0).toLocaleString('tr-TR', { maximumFractionDigits: 2 })} K`;

/** Gönderim tarih ve saati: 04.10.2026 19:15 */
const formatWhen = (iso) => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('tr-TR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

/**
 * Hediye gönderenler: kişi başına tek satır (profil, isim, kimlik numarası ve toplam hediye).
 * Satıra dokununca o kişinin tüm gönderimleri tarih ve saatleriyle liste hâlinde açılır.
 */
export default function GiftSendersPanel({ open, onClose }) {
  const [loading, setLoading] = useState(false);
  const [senders, setSenders] = useState([]);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (!open) return;
    setExpanded(null);
    setLoading(true);
    base44.functions.invoke('gift-box', { action: 'received' })
      .then((response) => setSenders(response.data?.senders || []))
      .catch(() => setSenders([]))
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

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
        <p className="flex min-w-0 items-center gap-2 text-sm font-bold text-white">
          <Gift className="h-4 w-4 shrink-0 text-sky-400" /> <span className="truncate">Hediye Gönderenler</span>
        </p>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto w-full max-w-[430px]">
          <p className="mb-2.5 text-center text-[10px] font-semibold text-white/45">
            Bu ayın listesi • her ayın 1'inde otomatik sıfırlanır
          </p>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : senders.length === 0 ? (
            <p className="py-10 text-center text-sm text-white/50">Bu ay henüz hediye almamışsın.</p>
          ) : (
            senders.map((sender) => {
              const isOpen = expanded === sender.sender_id;
              return (
                <div key={sender.sender_id} className="mb-2 overflow-hidden rounded-xl bg-white/5">
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : sender.sender_id)}
                    className="flex w-full items-center gap-2.5 px-2.5 py-2.5 text-left"
                  >
                    <span className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/10">
                      {sender.avatar ? (
                        <Image src={sender.avatar} alt={sender.name} className="h-full w-full" fittingType="fill" draggable={false} />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-sm font-bold text-white/70">
                          {String(sender.name || '?').trim().charAt(0).toUpperCase()}
                        </span>
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-white">{sender.name}</p>
                      <p className="truncate text-[10px] text-white/45">
                        Kimlik: {sender.member_id || '—'} • {sender.count} hediye
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold tabular-nums text-amber-400">{formatK(sender.total_k)}</p>
                      <p className="text-[10px] font-semibold tabular-nums text-white/45">
                        {sender.dollars.toLocaleString('tr-TR')} $ • {formatTl(sender.tl)}
                      </p>
                    </div>
                    <ChevronDown className={`h-4 w-4 shrink-0 text-white/40 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isOpen && (
                    <div className="border-t border-white/10 px-2.5 py-1.5">
                      {sender.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-2 py-1.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/10 text-base">
                            {item.gift_image_url
                              ? <Image src={item.gift_image_url} alt={item.gift_name} className="h-full w-full" fittingType="fit" draggable={false} />
                              : <span>{item.gift_emoji}</span>}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-bold text-white">
                              {item.gift_name}{item.count > 1 ? ` • ${item.count} kişiye` : ''}
                            </p>
                            <p className="text-[10px] tabular-nums text-white/45">{formatWhen(item.created_date)}</p>
                          </div>
                          <span className="shrink-0 text-xs font-bold tabular-nums text-white/80">{formatK(item.k_value)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}