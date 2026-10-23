import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import useAutoRefresh from '@/hooks/useAutoRefresh';
import CoinStack from '@/components/admin/coins/CoinStack';
import CoinLoadForm from '@/components/admin/coins/CoinLoadForm';
import CoinRecentTable from '@/components/admin/coins/CoinRecentTable';
import CoinRequestList from '@/components/admin/coins/CoinRequestList';

/** Admin panel: kullanıcılara coin yükleme, geri çekme ve son işlemler. */
export default function AdminCoins() {
  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
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

  // Liste 5 saniyede bir sessizce tazelenir.
  useAutoRefresh(() => load(true));

  const refresh = () => setRefreshKey((value) => value + 1);

  return (
    <div className="mx-auto w-full max-w-2xl pb-6">
      {/* Başlık */}
      <div className="mb-4 flex items-center justify-between gap-2 py-1">
        <CoinStack />
        <div className="min-w-0 flex-1 text-center">
          <h1 className="text-2xl font-extrabold text-white">Coins Yükle</h1>
          <p className="mt-1 text-[11px] leading-relaxed text-white/55">
            Kullanıcılara hızlı ve güvenli şekilde coins yükleyebilirsiniz.
          </p>
        </div>
        <CoinStack flip />
      </div>

      <div className="space-y-4">
        <CoinRequestList onReviewed={refresh} />
        <CoinLoadForm onGranted={refresh} />
        <CoinRecentTable grants={grants} loading={loading} onReverted={refresh} />
      </div>
    </div>
  );
}