import { Handshake, Gem } from 'lucide-react';
import { Image } from '@/components/ui/image';
import AgencyBroadcasterList from '@/components/agency/AgencyBroadcasterList';
import { AGENCY_GOLD, formatMoney, formatShortDiamonds } from '@/lib/agency';

/** Bir asistanın kartı: kimlik, payı, kazancı ve davet ettiği yayıncıların kota durumu. */
export default function AgencyAssistantCard({ assistant }) {
  const members = assistant?.members || [];
  return (
    <div className="rounded-2xl border border-[#F5C542]/25 bg-white/5 p-3">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#F5C542]/45 bg-black/40">
          {assistant?.avatar
            ? <Image src={assistant.avatar} className="h-full w-full object-cover" fittingType="fill" />
            : <span className="text-sm font-black" style={{ color: AGENCY_GOLD }}>{(assistant?.name || 'A')[0]}</span>}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-white">{assistant?.name || 'Asistan'}</p>
          <p className="text-[10px] text-white/45">#{assistant?.member_id} • %{assistant?.share} pay • {assistant?.broadcaster_count || 0} yayıncı</p>
        </div>
        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${assistant?.status === 'active' ? 'border-[#4ade80]/45 text-[#4ade80]' : 'border-white/20 text-white/50'}`}>
          {assistant?.status === 'active' ? 'Aktif' : assistant?.status === 'invited' ? 'Davet bekliyor' : 'Süresi doldu'}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-white/50">
        <span className="flex items-center gap-1">
          <Gem className="h-3 w-3 text-[#5AB8FF]" /> Yayıncı elması:
          <span className="font-black text-white">{formatShortDiamonds(members.reduce((sum, row) => sum + (Number(row.diamonds) || 0), 0))}</span>
        </span>
        <span>
          <Handshake className="mr-1 inline h-3 w-3" style={{ color: AGENCY_GOLD }} />
          Asistan kazancı:
          <span className="ml-1 font-black text-[#4ade80]">{formatMoney(assistant?.earnings || 0)}</span>
        </span>
      </div>

      <div className="mt-2.5">
        {members.length === 0 ? (
          <p className="rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-center text-[11px] text-white/45">
            Bu asistanın henüz yayıncısı yok.
          </p>
        ) : (
          <AgencyBroadcasterList members={members} share={Number(assistant?.share) || 0} />
        )}
      </div>
    </div>
  );
}