import { useEffect, useState } from 'react';
import { ChevronRight, Gem, Loader2, Trophy, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import pkApi from '@/lib/pkApi';
import formatCoinAmount from '@/components/voice/formatCoinAmount';

const MEDALS = ['🥇', '🥈', '🥉'];

/**
 * Saatlik sıralama: bu odada son bir saatte en çok hediye alan kişiler.
 * Sıralama backend'den gelir; satıra dokununca kişinin profiline gidilir.
 */
export default function PkRankingSheet({ open, roomId, onClose }) {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !roomId) return undefined;
    let alive = true;
    setLoading(true);
    pkApi('ranking', { room_id: roomId })
      .then((data) => { if (alive) setRows(Array.isArray(data?.ranking) ? data.ranking : []); })
      .catch(() => { if (alive) setRows([]); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [open, roomId]);

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-end bg-black/60" onClick={onClose}>
      <div
        className="w-full rounded-t-2xl bg-[#17121e] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] ring-1 ring-white/12"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-1.5">
          <Trophy className="h-4 w-4 text-amber-300" />
          <p className="text-[13px] font-black text-white">Saatlik Sıralama</p>
          <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9.5px] font-bold text-white/60">Son 1 saat</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="ml-auto flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/75 active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {loading && (
          <p className="flex items-center justify-center gap-1.5 py-6 text-[11.5px] font-semibold text-white/55">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Sıralama yükleniyor…
          </p>
        )}

        {!loading && rows.length === 0 && (
          <p className="px-2 py-6 text-center text-[11.5px] leading-relaxed text-white/45">
            Bu saat içinde hediyeyle sıralamaya giren olmadı. İlk hediye gönderen sen ol.
          </p>
        )}

        <div className="mt-1.5 space-y-1">
          {rows.map((row, index) => (
            <button
              key={row.user_id}
              type="button"
              onClick={() => { onClose?.(); navigate(`/kullanici/${row.user_id}`); }}
              className="flex w-full items-center gap-2 rounded-xl bg-white/[0.06] px-2 py-1.5 text-left active:scale-[0.99]"
            >
              <span className="w-5 shrink-0 text-center text-[12px] font-black text-white/70">
                {MEDALS[index] || index + 1}
              </span>
              {row.avatar
                ? <img src={row.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                : <span className="h-8 w-8 rounded-full bg-white/15" />}
              <span className="min-w-0 flex-1 truncate text-[12px] font-bold text-white">{row.name}</span>
              <span className="flex shrink-0 items-center gap-0.5 text-[11px] font-black tabular-nums text-cyan-300">
                <Gem className="h-3 w-3" /> {formatCoinAmount(row.score)}
              </span>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-white/40" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}