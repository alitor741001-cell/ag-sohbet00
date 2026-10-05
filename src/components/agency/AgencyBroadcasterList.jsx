import { Gem, Mic2, Wallet } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { formatDiamonds, formatMoney, formatShortDiamonds } from '@/lib/agency';

/** Ajans sahibinin yayıncı listesi: elmas, tamamlanan kota, kazanç ve durum. */
export default function AgencyBroadcasterList({ members = [] }) {
  if (!members.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 py-8 text-center">
        <Mic2 className="mx-auto h-6 w-6 text-white/30" />
        <p className="mt-2 text-xs font-semibold text-white/60">Henüz yayıncı yok</p>
        <p className="text-[11px] text-white/40">Ajansına yayıncı davet ederek başla.</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {members.map((member) => (
        <div key={member.user_id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-black/50">
              {member.avatar
                ? <Image src={member.avatar} className="h-full w-full object-cover" fittingType="fill" />
                : <span className="text-xs font-bold">{(member.name || 'Y')[0]}</span>}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-white">{member.name}</p>
              <p className="truncate text-[10px] text-white/40">#{member.member_id}</p>
            </div>
            <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${member.status === 'active' ? 'border-[#4ade80]/45 text-[#4ade80]' : 'border-white/20 text-white/50'}`}>
              {member.status === 'active' ? 'Aktif' : 'Pasif'}
            </span>
          </div>
          <div className="mt-2.5 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-black/40 px-1 py-1.5">
              <p className="text-[9px] uppercase tracking-wider text-white/40">Elmas</p>
              <p className="flex items-center justify-center gap-1 text-xs font-black text-white"><Gem className="h-3 w-3 text-[#5AB8FF]" />{formatShortDiamonds(member.diamonds)}</p>
            </div>
            <div className="rounded-xl bg-black/40 px-1 py-1.5">
              <p className="text-[9px] uppercase tracking-wider text-white/40">Kota</p>
              <p className="text-xs font-black" style={{ color: '#F5C542' }}>{member.quota ? `${formatShortDiamonds(member.quota)} ✓` : '—'}</p>
            </div>
            <div className="rounded-xl bg-black/40 px-1 py-1.5">
              <p className="text-[9px] uppercase tracking-wider text-white/40">Kazanç</p>
              <p className="flex items-center justify-center gap-1 text-xs font-black text-white"><Wallet className="h-3 w-3 text-[#F5C542]" />{formatMoney(member.earnings)}</p>
            </div>
          </div>
          {member.pending > 0 && (
            <p className="mt-1.5 text-[10px] text-white/45">Bekleyen ödeme: <span className="font-bold" style={{ color: '#F5C542' }}>{formatMoney(member.pending)}</span></p>
          )}
          <p className="mt-1 text-[10px] text-white/35">Aylık elmas: {formatDiamonds(member.diamonds)} • Toplam elmas: {formatDiamonds(member.total_diamonds)}</p>
        </div>
      ))}
    </div>
  );
}