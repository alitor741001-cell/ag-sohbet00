import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
export default function useVipPreferences() {
  const [data, setData] = useState({ features: [], expires_at: '' });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    setLoading(true);
    try { const response = await base44.functions.invoke('vip-cosmetics', { action: 'settings' }); setData(response.data); setError(''); }
    catch (failure) { setError(failure.response?.data?.error || 'VIP ayarları yüklenemedi.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    refresh();
    window.addEventListener('vip-cosmetics-changed', refresh);
    const focus = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', focus);
    return () => { window.removeEventListener('vip-cosmetics-changed', refresh); document.removeEventListener('visibilitychange', focus); };
  }, [refresh]);
  useEffect(() => {
    const expiry = Date.parse(data.expires_at);
    if (!Number.isFinite(expiry) || expiry <= Date.now()) return;
    const timer = setTimeout(refresh, Math.min(expiry - Date.now() + 100, 2147483647));
    return () => clearTimeout(timer);
  }, [data.expires_at, refresh]);
  const toggle = async (key, enabled) => {
    if (busy) return;
    setBusy(key); setError('');
    try {
      const response = await base44.functions.invoke('vip-cosmetics', { action: 'setSetting', key, enabled });
      setData(response.data); window.dispatchEvent(new Event('vip-cosmetics-changed'));
    } catch (failure) { setError(failure.response?.data?.error || 'VIP ayarı kaydedilemedi.'); }
    finally { setBusy(''); }
  };
  return { ...data, loading, busy, error, toggle, refresh };
}