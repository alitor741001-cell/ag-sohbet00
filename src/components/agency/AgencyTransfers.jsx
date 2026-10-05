import { ArrowLeftRight, Loader2, MoveRight } from 'lucide-react';
import { TRANSFER_LABELS, dateText } from '@/lib/agency';

/**
 * Ajans değişikliği talepleri: eski ve yeni ajans sahibinin onayı,
 * talep eden kullanıcının iptal hakkı ve geçmiş kayıtlar.
 */
export default function AgencyTransfers({ transfers = [], userId = '', approveRole = false, busyId = '', onDecide, onCancel }) {
  if (!transfers.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 py-8 text-center">
        <ArrowLeftRight className="mx-auto h-6 w-6 text-white/30" />
        <p className="mt-2 text-xs font-semibold text-white/60">Transfer kaydı yok</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {transfers.map((transfer) => {
        const pending = transfer.status === 'pending';
        const isMine = transfer.user_id === userId;
        const waitingFrom = pending && !transfer.from_approved && transfer.from_owner_id === userId;
        const waitingTo = pending && !transfer.to_approved && transfer.to_owner_id === userId;
        const canDecide = approveRole && (waitingFrom || waitingTo);
        return (
          <div key={transfer.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-sm font-bold text-white">{isMine ? 'Transfer talebim' : transfer.user_name}</span>
              <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${pending ? 'border-[#F5C542]/45 text-[#F5C542]' : transfer.status === 'completed' ? 'border-[#4ade80]/45 text-[#4ade80]' : 'border-white/20 text-white/45'}`}>
                {TRANSFER_LABELS[transfer.status] || transfer.status}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-white/60">
              <span className="truncate">{transfer.from_agency_name || 'Bağımsız'}</span>
              <MoveRight className="h-3 w-3 shrink-0" style={{ color: '#F5C542' }} />
              <span className="truncate font-semibold text-white">{transfer.to_agency_name}</span>
            </div>
            {pending && (
              <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
                <span className={`rounded-full border px-2 py-0.5 ${transfer.from_approved ? 'border-[#4ade80]/45 text-[#4ade80]' : 'border-white/20 text-white/45'}`}>
                  Eski ajans {transfer.from_approved ? '✓ onayladı' : 'onay bekliyor'}
                </span>
                <span className={`rounded-full border px-2 py-0.5 ${transfer.to_approved ? 'border-[#4ade80]/45 text-[#4ade80]' : 'border-white/20 text-white/45'}`}>
                  Yeni ajans {transfer.to_approved ? '✓ onayladı' : 'onay bekliyor'}
                </span>
              </div>
            )}
            {transfer.decided_at && <p className="mt-1.5 text-[10px] text-white/35">{dateText(transfer.decided_at)}</p>}
            {canDecide && (
              <div className="mt-2.5 flex gap-2">
                <button onClick={() => onDecide?.(transfer, true)} disabled={busyId === transfer.id} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#4ade80]/50 bg-[#4ade80]/10 py-2 text-xs font-bold text-[#4ade80] disabled:opacity-50">
                  {busyId === transfer.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Onayla
                </button>
                <button onClick={() => onDecide?.(transfer, false)} disabled={busyId === transfer.id} className="flex-1 rounded-xl border border-[#FF8080]/50 bg-[#FF8080]/10 py-2 text-xs font-bold text-[#FF8080] disabled:opacity-50">
                  Reddet
                </button>
              </div>
            )}
            {pending && isMine && (
              <button onClick={() => onCancel?.(transfer)} disabled={busyId === transfer.id} className="mt-2.5 w-full rounded-xl border border-white/20 py-2 text-xs font-bold text-white/60 disabled:opacity-50">
                Talebi iptal et
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}