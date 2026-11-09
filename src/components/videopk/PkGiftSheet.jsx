import { Loader2, X } from 'lucide-react';
import { useGiftCatalog } from '@/hooks/useGiftCatalog';
import { formatK } from '@/lib/giftTone';

/** PK hediyeleri: gönderilen hediye puanı sunucuda işlenir, iki tarafta da aynı görünür. */
export default function PkGiftSheet({ open, onClose, onSend, busy }) {
  const { gifts, loading } = useGiftCatalog();
  if (!open) return null;

  const list = [...gifts].sort((a, b) => (Number(a.k_value) || 0) - (Number(b.k_value) || 0));

  return (
    <div className="fixed inset-0 z-[300] flex flex-col justify-end">
      <button type="button" aria-label="Kapat" className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="animate-sheet-up relative flex max-h-[68vh] flex-col overflow-hidden rounded-t-[26px] bg-[#170d20] ring-1 ring-fuchsia-400/25">
        <div className="flex shrink-0 items-center justify-between px-4 pb-2 pt-4">
          <p className="text-[13px] font-black text-white">Hediye gönder</p>
          <button type="button" onClick={onClose} aria-label="Kapat" className="rounded-full p-1.5 text-white/60 hover:bg-white/10">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {loading ? (
            <p className="flex items-center justify-center gap-1.5 py-8 text-[11.5px] text-white/50">
              <Loader2 className="h-4 w-4 animate-spin" /> Hediyeler yükleniyor…
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-1.5">
              {list.map((gift) => (
                <button
                  key={gift.id}
                  type="button"
                  disabled={busy}
                  onClick={() => onSend?.(gift)}
                  className="flex flex-col items-center gap-0.5 rounded-xl bg-white/[0.06] px-1 py-2 ring-1 ring-white/10 active:scale-95 disabled:opacity-50"
                >
                  {gift.image_url
                    ? <img src={gift.image_url} alt="" className="h-9 w-9 object-contain" />
                    : <span className="text-2xl leading-none">{gift.emoji || '🎁'}</span>}
                  <span className="w-full truncate text-[9px] font-bold text-white/85">{gift.name}</span>
                  <span className="text-[9px] font-black text-amber-300">{formatK(gift.k_value)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}