import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import subscribeEntity from '@/components/data/entitySubscriptions';
export const VIP_COSMETIC_LABELS = { badge: 'VIP Rozeti', frame: 'Avatar Çerçevesi', banner: 'Giriş Efekti', mic: 'Ses Dalgası', bubble: 'Sohbet Balonu', card: 'Profil Kartı', name: 'İsim Rengi', avatar: 'Hareketli Avatar' };
export default function useVipCosmetics(enabled = true) {
  const [data, setData] = useState({ items: [], level: 0, catalog: null, expires_at: '' });
  const [loading, setLoading] = useState(enabled);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('vip-cosmetics', { action: 'list' });
      setData(response.data); setError('');
    } catch (failure) { setError(failure.response?.data?.error || 'VIP bilgileri yüklenemedi.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    if (!enabled) return;
    load();
    window.addEventListener('vip-cosmetics-changed', load);
    const onFocus = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onFocus);
    return () => { window.removeEventListener('vip-cosmetics-changed', load); document.removeEventListener('visibilitychange', onFocus); };
  }, [enabled, load]);
  useEffect(() => {
    const expiry = Date.parse(data.expires_at || '');
    if (!enabled || !Number.isFinite(expiry) || expiry <= Date.now()) return;
    let timer;
    const check = () => {
      if (Date.now() >= expiry) load();
      else timer = setTimeout(check, Math.min(expiry - Date.now() + 50, 2147483647));
    };
    check();
    return () => clearTimeout(timer);
  }, [enabled, data.expires_at, load]);
  useEffect(() => {
    if (!enabled || !data.owner_id) return;
    return subscribeEntity('VipAppearance', (event) => { if (event.data?.owner_id === data.owner_id) load(); });
  }, [enabled, data.owner_id, load]);
  const toggle = async (kind, active, selectedLevel) => {
    if (busy) return;
    setBusy(kind); setError('');
    try {
      const response = await base44.functions.invoke('vip-cosmetics', { action: 'toggle', kind, active, level: selectedLevel });
      setData(response.data);
      window.dispatchEvent(new Event('vip-cosmetics-changed'));
    } catch (failure) { setError(failure.response?.data?.error || 'Kozmetik kaydedilemedi.'); }
    finally { setBusy(''); }
  };
  return { ...data, loading, busy, error, toggle, refresh: load };
}