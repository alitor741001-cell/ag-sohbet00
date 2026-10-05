import { useEffect, useState } from 'react';
import { Gem, Loader2, Mic2, Wallet } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Image } from '@/components/ui/image';
import AgencySheet from '@/components/agency/AgencySheet';
import QuotaProgressCard from '@/components/agency/QuotaProgressCard';
import QuotaTierGrid from '@/components/agency/QuotaTierGrid';
import EarningsHistory from '@/components/agency/EarningsHistory';
import { AGENCY_GOLD, agencyApi, formatDiamonds } from '@/lib/agency';

/** Yayıncı paneli: kota ilerlemesi, kota tablosu ve kazanç geçmişi. */
export default function BroadcasterPanel({ open, onClose, tab = 'quota' }) {
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(tab);

  useEffect(() => { setActive(tab); }, [tab]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    agencyApi('broadcaster')
      .then((result) => setData(result))
      .catch((error) => toast({ title: 'Yayıncı paneli açılamadı', description: error.response?.data?.error || error.message, variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, [open]);

  const tabs = [
    { key: 'quota', label: 'Kota Tablosu' },
    { key: 'earnings', label: 'Kazançlarım' },
  ];

  return (
    <AgencySheet open={open} tall onClose={onClose} icon={Mic2} title="🎤 Yayıncı Panelim" subtitle="Kota, kazanç ve ajans bilgilerin">
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" style={{ color: AGENCY_GOLD }} /></div>
      ) : !data ? (
        <p className="py-16 text-center text-sm text-white/50">Panel yüklenemedi.</p>
      ) : (
        <div className="space-y-4 pb-2">
          <div className="flex items-center gap-3 rounded-2xl border border-white/12 bg-white/5 p-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#F5C542]/40 bg-black/50">
              {data.profile?.avatar
                ? <Image src={data.profile.avatar} className="h-full w-full object-cover" fittingType="fill" />
                : <span className="text-sm font-bold">{(data.profile?.name || 'Y')[0]}</span>}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black">{data.profile?.name}</p>
              <p className="truncate text-[11px] text-white/50">
                {data.agency ? `${data.agency.name} • ${data.agency.agency_id}` : 'Bağımsız yayıncı'}
              </p>
            </div>
            <span className="flex shrink-0 items-center gap-1 rounded-full border border-[#F5C542]/45 bg-[#F5C542]/10 px-2.5 py-1 text-[10px] font-black" style={{ color: AGENCY_GOLD }}>
              <Mic2 className="h-3 w-3" /> YAYINCI
            </span>
          </div>

          {data.profile?.broadcaster_status !== 'active' && (
            <p className="rounded-2xl border border-[#F5C542]/35 bg-[#F5C542]/10 px-4 py-3 text-center text-[11px] font-semibold" style={{ color: AGENCY_GOLD }}>
              Yayıncılığın şu anda pasif — kota kazançları işlenmiyor.
            </p>
          )}

          <QuotaProgressCard month={data.diamonds?.month || 0} total={data.diamonds?.total || 0} nextTier={data.next_tier} />

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-[10px] uppercase tracking-wider text-white/45">Aylık elmas</p>
              <p className="flex items-center gap-1 text-sm font-black text-white"><Gem className="h-3.5 w-3.5 text-[#5AB8FF]" />{formatDiamonds(data.diamonds?.month || 0)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-[10px] uppercase tracking-wider text-white/45">Kazanç</p>
              <p className="flex items-center gap-1 text-sm font-black text-white"><Wallet className="h-3.5 w-3.5 text-[#F5C542]" />${data.totals?.total || 0}</p>
            </div>
          </div>

          <div className="flex gap-1 rounded-2xl border border-white/12 bg-black/40 p-1">
            {tabs.map((item) => (
              <button
                key={item.key}
                onClick={() => setActive(item.key)}
                className={`flex-1 rounded-xl py-2 text-xs font-bold transition-colors ${active === item.key ? 'text-black' : 'text-white/60'}`}
                style={active === item.key ? { background: AGENCY_GOLD } : {}}
              >
                {item.label}
              </button>
            ))}
          </div>

          {active === 'quota' ? (
            <QuotaTierGrid tiers={data.tiers || []} monthDiamonds={data.diamonds?.month || 0} nextTier={data.next_tier} />
          ) : (
            <EarningsHistory rewards={data.rewards || []} totals={data.totals || {}} />
          )}
        </div>
      )}
    </AgencySheet>
  );
}