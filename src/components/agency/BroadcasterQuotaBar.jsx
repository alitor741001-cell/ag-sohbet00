import { Gem } from 'lucide-react';
import { formatShortDiamonds } from '@/lib/agency';

/**
 * Yayıncının bu ayki elmasını bir sonraki kota hedefine göre gösteren ilerleme çubuğu.
 * Hedef kalmadıysa çubuk tamamlanır; aksi halde kalan elmas miktarı yazılır.
 */
export default function BroadcasterQuotaBar({ diamonds = 0, nextQuota = 0, completedQuota = 0 }) {
  const current = Math.max(0, Number(diamonds) || 0);
  const target = Math.max(0, Number(nextQuota) || 0);
  const finished = target === 0;
  const percent = finished ? 100 : Math.min(100, Math.round((current / target) * 100));
  const remaining = finished ? 0 : Math.max(0, target - current);
  const completed = Number(completedQuota) || 0;

  return (
    <div className="mt-2.5">
      <div className="flex items-center justify-between gap-2 text-[10px] font-semibold">
        <span className="flex min-w-0 items-center gap-1 text-white/50">
          <Gem className="h-3 w-3 shrink-0 text-[#5AB8FF]" />
          {finished ? (
            <span className="truncate">Tüm kotalar tamamlandı</span>
          ) : (
            <span className="truncate">
              {formatShortDiamonds(current)} / {formatShortDiamonds(target)} elmas
            </span>
          )}
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          {completed > 0 && (
            <span
              className="rounded-full border px-1.5 py-0.5 text-[9px] font-black"
              style={{ color: '#F5C542', borderColor: 'rgba(245,197,66,0.45)' }}
            >
              {formatShortDiamonds(completed)} ✓
            </span>
          )}
          <span className="font-black text-white/75">{percent}%</span>
        </span>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-black/60">
        <div
          className={`h-full rounded-full transition-[width] duration-700 ease-out ${finished ? 'bg-gradient-to-r from-[#4ade80] to-[#a3e635]' : 'bg-gradient-to-r from-[#5AB8FF] via-[#C084FC] to-[#F5C542]'}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {!finished && (
        <p className="mt-1 text-right text-[10px] text-white/40">
          Sonraki kotaya {formatShortDiamonds(remaining)} elmas kaldı
        </p>
      )}
    </div>
  );
}