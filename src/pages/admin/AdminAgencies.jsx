import { useCallback, useEffect, useState } from 'react';
import { Building2, Camera, Gem, Loader2, Mic2, MoveRight, Table2, Wallet } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { agencyApi } from '@/lib/agency';
import useAutoRefresh from '@/hooks/useAutoRefresh';
import AdminAgencyList from '@/components/admin/agency/AdminAgencyList';
import AdminBroadcasterTable from '@/components/admin/agency/AdminBroadcasterTable';
import AdminQuotaTiers from '@/components/admin/agency/AdminQuotaTiers';
import AdminRewardTable from '@/components/admin/agency/AdminRewardTable';
import AdminTransferTable from '@/components/admin/agency/AdminTransferTable';
import AdminManualTransferTable from '@/components/admin/agency/AdminManualTransferTable';

const TABS = [
  { key: 'agencies', label: 'Ajanslar', icon: Building2 },
  { key: 'broadcasters', label: 'Yayıncılar', icon: Mic2 },
  { key: 'tiers', label: 'Kota Tablosu', icon: Table2 },
  { key: 'rewards', label: 'Kazançlar', icon: Wallet },
  { key: 'transfers', label: 'Transferler', icon: MoveRight },
  { key: 'manual', label: 'Normal Transfer', icon: Camera },
];

/** Yönetim paneli — Ajans & Yayıncı yönetimi. */
export default function AdminAgencies() {
  const { toast } = useToast();
  const [tab, setTab] = useState('agencies');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    agencyApi('admin-list')
      .then((result) => setData(result))
      .catch((error) => toast({ title: 'Ajans verisi yüklenemedi', description: error.response?.data?.error || error.message, variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // Ajans paneli 5 saniyede bir sessizce tazelenir.
  useAutoRefresh(load);

  // Canlı güncelleme: ödeme işareti var olan kaydı günceller, yeni tamamlanan kota
  // kaydı listeye eklenir — panelin tamamı yeniden yüklenmez.
  const patchReward = useCallback((id, patch) => {
    setData((prev) => {
      if (!prev?.rewards) return prev;
      const known = prev.rewards.some((row) => row.id === id);
      const rewards = known
        ? prev.rewards.map((row) => (row.id === id ? { ...row, ...patch } : row))
        : [patch, ...prev.rewards];
      return { ...prev, rewards };
    });
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-red-400" /></div>;
  }

  return (
    <div className="text-white">
      <header className="mb-4 flex items-center gap-2">
        <Gem className="h-5 w-5 text-[#F5C542]" />
        <div>
          <h1 className="text-lg font-black">Ajans & Yayıncı Yönetimi</h1>
          <p className="text-xs text-gray-400">Ajanslar, yayıncılar, kota tablosu, kazançlar ve transferler.</p>
        </div>
      </header>

      <div className="mb-4 flex gap-1 overflow-x-auto rounded-2xl border border-white/12 bg-black/40 p-1 no-scrollbar">
        {TABS.map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-bold transition-colors ${tab === item.key ? 'text-black' : 'text-white/60'}`}
            style={tab === item.key ? { background: '#F5C542' } : {}}
          >
            <item.icon className="h-3.5 w-3.5" /> {item.label}
          </button>
        ))}
      </div>

      {!data ? (
        <p className="rounded-2xl border border-white/10 bg-white/5 py-12 text-center text-sm text-white/50">Veri alınamadı.</p>
      ) : (
        <>
          {tab === 'agencies' && <AdminAgencyList data={data} reload={load} />}
          {tab === 'broadcasters' && <AdminBroadcasterTable data={data} reload={load} />}
          {tab === 'tiers' && <AdminQuotaTiers data={data} reload={load} />}
          {tab === 'rewards' && <AdminRewardTable data={data} onPatch={patchReward} />}
          {tab === 'transfers' && <AdminTransferTable data={data} />}
          {tab === 'manual' && <AdminManualTransferTable data={data} reload={load} />}
        </>
      )}
    </div>
  );
}