import { useCallback, useEffect, useState } from 'react';
import { Building2, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import AgencySheet from '@/components/agency/AgencySheet';
import AgencyStatsGrid from '@/components/agency/AgencyStatsGrid';
import AgencyBroadcasterList from '@/components/agency/AgencyBroadcasterList';
import AgencyInviteSender from '@/components/agency/AgencyInviteSender';
import AgencyTransfers from '@/components/agency/AgencyTransfers';
import AgencySettingsForm from '@/components/agency/AgencySettingsForm';
import AgencyQuotaBoard from '@/components/agency/AgencyQuotaBoard';
import AgencyInfoCard from '@/components/agency/AgencyInfoCard';
import { AGENCY_GOLD, agencyApi, formatMoney } from '@/lib/agency';

/** Ajans yönetim paneli: kazançlar, yayıncılar, davetler, transferler ve ayarlar. */
export default function AgencyPanel({ open, onClose, tab = 'stats', userId }) {
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(tab);
  const [busyId, setBusyId] = useState('');

  useEffect(() => setActive(tab), [tab]);

  const load = useCallback(() => {
    setLoading(true);
    agencyApi('agency-panel')
      .then((result) => setData(result))
      .catch((error) => toast({ title: 'Ajans paneli açılamadı', description: error.response?.data?.error || error.message, variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { if (open) load(); }, [open, load]);

  const decide = async (transfer, accept) => {
    setBusyId(transfer.id);
    try {
      const result = await agencyApi('transfer-respond', { transfer_id: transfer.id, accept });
      toast(accept
        ? { title: result.status === 'completed' ? 'Transfer tamamlandı' : 'Onay kaydedildi', description: result.status === 'completed' ? 'Yayıncı yeni ajansa geçti.' : 'Diğer tarafın onayı bekleniyor.' }
        : { title: 'Transfer reddedildi' });
      load();
    } catch (error) {
      toast({ title: 'İşlem başarısız', description: error.response?.data?.error || error.message, variant: 'destructive' });
    } finally {
      setBusyId('');
    }
  };

  const tabs = [
    { key: 'stats', label: 'Kazançlarım' },
    { key: 'broadcasters', label: 'Yayıncı Paneli' },
    { key: 'invites', label: 'Davetler' },
    { key: 'transfers', label: 'Transferler' },
    { key: 'settings', label: 'Ajansım' },
  ];

  const agency = data?.agency || {};
  const isOwner = agency.owner_id === userId;

  return (
    <AgencySheet open={open} tall onClose={onClose} icon={Building2} title={agency.name ? `🏢 ${agency.name}` : '🏢 Ajansım'} subtitle={agency.agency_id ? `Ajans ID: ${agency.agency_id}` : 'Ajans bilgileri'}>
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" style={{ color: AGENCY_GOLD }} /></div>
      ) : !data?.agency ? (
        <p className="py-16 text-center text-sm text-white/50">Ajans bilgisi yüklenemedi.</p>
      ) : (
        <div className="space-y-4 pb-2">
          <div className="flex gap-1 overflow-x-auto rounded-2xl border border-white/12 bg-black/40 p-1 no-scrollbar">
            {tabs.map((item) => (
              <button
                key={item.key}
                onClick={() => setActive(item.key)}
                className={`shrink-0 rounded-xl px-3 py-2 text-[11px] font-bold transition-colors ${active === item.key ? 'text-black' : 'text-white/60'}`}
                style={active === item.key ? { background: AGENCY_GOLD } : {}}
              >
                {item.label}
              </button>
            ))}
          </div>

          {active === 'stats' && (
            <div className="space-y-3">
              <AgencyStatsGrid agency={agency} />
              <AgencyQuotaBoard
                members={data.members || []}
                tiers={data.tiers || []}
                monthDiamonds={agency.month_diamonds || 0}
                monthEarnings={agency.month_earnings || 0}
              />
              <div className="rounded-2xl border border-[#F5C542]/25 bg-[#F5C542]/5 p-3">
                <p className="text-[11px] font-black uppercase tracking-wider" style={{ color: AGENCY_GOLD }}>Komisyon Sistemi</p>
                <p className="mt-1 text-[11px] leading-relaxed text-white/60">
                  Yayıncıların tamamladığı her kota için ajansına 200.000 elmas başına
                  <span className="font-bold text-white"> ${agency.commission_per_200k || 3}</span> komisyon işlenir.
                  Bu ayki toplam komisyonun: <span className="font-bold" style={{ color: AGENCY_GOLD }}>{formatMoney(agency.month_earnings || 0)}</span>
                </p>
              </div>
            </div>
          )}
          {active === 'broadcasters' && <AgencyBroadcasterList members={data.members || []} />}

          {active === 'invites' && <AgencyInviteSender invites={data.invites || []} onChanged={load} />}

          {active === 'transfers' && (
            <AgencyTransfers
              transfers={data.transfers || []}
              userId={userId}
              approveRole={isOwner}
              busyId={busyId}
              onDecide={decide}
            />
          )}

          {active === 'settings' && (
            <div className="space-y-3">
              <AgencyInfoCard agency={agency} />
              {isOwner
                ? <AgencySettingsForm agency={agency} onSaved={load} />
                : <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-center text-xs text-white/50">Yalnızca ajans sahibi ayarları değiştirebilir.</p>}
            </div>
          )}
        </div>
      )}
    </AgencySheet>
  );
}