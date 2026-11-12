import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import GamePoolCard from '@/components/admin/pools/GamePoolCard';

/** Admin panel: Dede, Elimin Slot, Meyve ve Şekerli Meyve havuz ayarları ve muhasebesi. */
export default function AdminGamePools() {
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const response = await base44.functions.invoke('game-pool-admin', { action: 'list' });
    setPools(response.data?.pools || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const replace = (pool) => setPools((list) => list.map((item) => (item.id === pool.id ? pool : item)));

  return (
    <div className="mx-auto w-full max-w-3xl pb-6">
      <div className="mb-4 py-1">
        <h1 className="text-2xl font-extrabold text-white">Oyun Havuzları</h1>
        <p className="mt-1 text-xs text-white/60">
          Her oyunun havuzu ayrıdır. Alınan her bahis bir kez bölünür: kesinti + RTP (ödeme fonu) + rezerv = %100.
          Kazanma ihtimali değişmez; ayarlar ödeme tutarlarına ve sınırlara uygulanır.
        </p>
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-red-400" /></div>
      ) : (
        <div className="grid gap-4">
          {pools.map((pool) => <GamePoolCard key={pool.id} pool={pool} onSaved={replace} onRefresh={load} />)}
        </div>
      )}
    </div>
  );
}