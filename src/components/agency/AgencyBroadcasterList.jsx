import { ChevronRight, Gem, Mic2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Image } from '@/components/ui/image';
import BroadcasterQuotaBar from '@/components/agency/BroadcasterQuotaBar';
import { formatMoney, formatShortDiamonds } from '@/lib/agency';

/** Ajans sahibinin yayıncı listesi: profil, kimlik, canlı kota ilerlemesi ve aylık elmas. */
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
          <div className="flex items-center gap-2">
            <Link to={`/kullanici/${member.user_id}`} className="flex min-w-0 flex-1 items-center gap-3 active:scale-[0.99]">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-black/50">
                {member.avatar
                  ? <Image src={member.avatar} className="h-full w-full object-cover" fittingType="fill" />
                  : <span className="text-xs font-bold">{(member.name || 'Y')[0]}</span>}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-white">{member.name}</p>
                <p className="truncate text-[10px] text-white/40">#{member.member_id}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-white/30" />
            </Link>
            <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${member.status === 'active' ? 'border-[#4ade80]/45 text-[#4ade80]' : 'border-white/20 text-white/50'}`}>
              {member.status === 'active' ? 'Aktif' : 'Pasif'}
            </span>
          </div>
          <BroadcasterQuotaBar diamonds={member.diamonds} nextQuota={member.next_quota} completedQuota={member.quota} />
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-white/50">
            <span className="flex items-center gap-1">
              Bu ayki elmas:
              <Gem className="h-3 w-3 text-[#5AB8FF]" />
              <span className="font-black text-white">{formatShortDiamonds(member.diamonds)}</span>
            </span>
            <span>
              Ajans kazancı:
              <span className="ml-1 font-black text-[#4ade80]">{formatMoney(member.month_commission)}</span>
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}