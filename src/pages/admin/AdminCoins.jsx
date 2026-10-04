import { useCallback, useEffect, useState } from 'react';
import { Crown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import CoinLoadForm from '@/components/admin/coins/CoinLoadForm';
import CoinRevertCard from '@/components/admin/coins/CoinRevertCard';
import CoinRecentTable from '@/components/admin/coins/CoinRecentTable';

/** Altın coin yığını illüstrasyonu */
function CoinStack() {
  const coin = { background: 'linear-gradient(180deg, #FFE68A, #E8A317)', boxShadow: '0 2px 6px rgba(0,0,0,0.45)' };
  return (
    <div className="relative h-16 w-24 shrink-0">
      <span className="absolute bottom-0 left-2 h-3.5 w-20 rounded-full" style={coin} />
      <span className="absolute bottom-3 left-2 h-3.5 w-20 rounded-full" style={coin} />
      <span className="absolute bottom-6 left-2 h-3.5 w-20 rounded-full" style={coin} />
      <span className="absolute bottom-9 left-2 h-3.5 w-20 rounded-full" style={coin} />
      <Crown className="absolute bottom-[3.1rem] left-1/2 h-6 w-6 -translate-x-1/2 text-amber-300" style={{ filter: 'drop-shadow(0 0 6px rgba(255,214,102,0.7))' }} />
    </div>
  );
}

/** Admin panel: kullanıcılara coin yükleme, geri çekme ve son işlemler. */
export default function AdminCoins() {
  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('coin-admin', { action: 'list', limit: 30 });
      setGrants(response.data?.grants || []);
    } catch {
      // Liste alınamazsa son bilinen kayıtlar kalır.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load, refreshKey]);

  const refresh = () => setRefreshKey((value) => value + 1);
  const lastActive = grants.find((grant) => grant.status === 'active') || null;

  return (
    <div className="mx-auto w-full max-w-2xl pb-6">
      <div
        className="mb-4 flex items-center justify-between gap-3 overflow-hidden rounded-2xl border border-white/10 p-4"
        style={{ background: 'linear-gradient(135deg, #2A2456, #1E1B39 65%)' }}
      >
        <div className="min-w-0">
          <h1 className="text-xl font-extrabold text-white">Coins Yükle</h1>
          <p className="mt-1 text-[11px] leading-relaxed text-white/60">
            Kullanıcılara hızlı ve güvenli şekilde coins yükleyebilirsiniz.
          </p>
        </div>
        <CoinStack />
      </div>

      <div className="space-y-4">
        <CoinLoadForm onGranted={refresh} />
        <CoinRevertCard grant={lastActive} onReverted={refresh} />
        <CoinRecentTable grants={grants} loading={loading} onReverted={refresh} />
      </div>
    </div>
  );
}