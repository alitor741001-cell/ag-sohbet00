import { Building2, Gem, ShieldCheck, Users } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { AGENCY_GOLD, formatMoney } from '@/lib/agency';

/** Ajans bilgi kartı: logo, ajans kimliği, sahip, yayıncı sayısı, açıklama ve kurallar. */
export default function AgencyInfoCard({ agency = {} }) {
  return (
    <div className="space-y-2">
      <div className="rounded-2xl border border-[#F5C542]/35 bg-gradient-to-br from-[#1a1305] via-[#0d0b16] to-[#140a1e] p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#F5C542]/45 bg-black/50">
            {agency.logo
              ? <Image src={agency.logo} className="h-full w-full object-cover" fittingType="fill" />
              : <Building2 className="h-5 w-5" style={{ color: AGENCY_GOLD }} />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black text-white">{agency.name || 'Ajans'}</p>
            <p className="truncate text-[11px]" style={{ color: AGENCY_GOLD }}>
              {agency.agency_id ? `Ajans ID: ${agency.agency_id}` : 'Ajans bilgileri'}
            </p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-black/40 px-1 py-2">
            <p className="text-[9px] uppercase tracking-wider text-white/40">Sahip</p>
            <p className="truncate text-[11px] font-black text-white">{agency.owner_name || '—'}</p>
          </div>
          <div className="rounded-xl bg-black/40 px-1 py-2">
            <p className="text-[9px] uppercase tracking-wider text-white/40">Yayıncı</p>
            <p className="flex items-center justify-center gap-1 text-[11px] font-black text-white">
              <Users className="h-3 w-3 text-[#5AB8FF]" />{agency.member_count || 0}
            </p>
          </div>
          <div className="rounded-xl bg-black/40 px-1 py-2">
            <p className="text-[9px] uppercase tracking-wider text-white/40">Komisyon</p>
            <p className="flex items-center justify-center gap-1 text-[11px] font-black" style={{ color: AGENCY_GOLD }}>
              <Gem className="h-3 w-3" />{formatMoney(agency.commission_per_200k ?? 3)}
            </p>
          </div>
        </div>

        <p className="mt-2 text-[10px] text-white/40">Komisyon, her 200.000 elmaslık tamamlanan kota için ödenir.</p>
      </div>

      {agency.description && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <p className="text-[10px] uppercase tracking-wider text-white/45">Açıklama</p>
          <p className="mt-1 whitespace-pre-wrap text-[11px] leading-relaxed text-white/70">{agency.description}</p>
        </div>
      )}

      {agency.rules && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/45">
            <ShieldCheck className="h-3 w-3" style={{ color: AGENCY_GOLD }} /> Ajans Kuralları
          </p>
          <p className="mt-1 whitespace-pre-wrap text-[11px] leading-relaxed text-white/70">{agency.rules}</p>
        </div>
      )}
    </div>
  );
}