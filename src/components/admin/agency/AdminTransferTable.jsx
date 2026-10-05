import { MoveRight, ShieldCheck } from 'lucide-react';
import { TRANSFER_LABELS, dateText } from '@/lib/agency';

/** Yönetim paneli — ajans değişikliği kayıtları. */
export default function AdminTransferTable({ data = {} }) {
  const transfers = data.transfers || [];
  if (!transfers.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 py-10 text-center">
        <MoveRight className="mx-auto h-6 w-6 text-white/30" />
        <p className="mt-2 text-sm text-white/50">Transfer kaydı yok.</p>
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
      {transfers.map((transfer) => (
        <div key={transfer.id} className="border-b border-white/8 p-3 last:border-b-0">
          <div className="flex items-center gap-2">
            <p className="min-w-0 flex-1 truncate text-sm font-bold text-white">{transfer.user_name}</p>
            <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${transfer.status === 'completed' ? 'border-[#4ade80]/45 text-[#4ade80]' : transfer.status === 'pending' ? 'border-[#F5C542]/45 text-[#F5C542]' : 'border-white/20 text-white/45'}`}>
              {TRANSFER_LABELS[transfer.status] || transfer.status}
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-white/60">
            <span className="truncate">{transfer.from_agency_name || 'Bağımsız'}</span>
            <MoveRight className="h-3 w-3 shrink-0 text-[#F5C542]" />
            <span className="truncate font-semibold text-white">{transfer.to_agency_name}</span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] text-white/45">
            <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Eski ajans: {transfer.from_approved ? 'onayladı' : 'bekliyor'}</span>
            <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Yeni ajans: {transfer.to_approved ? 'onayladı' : 'bekliyor'}</span>
            {transfer.decided_at && <span>{dateText(transfer.decided_at)}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}