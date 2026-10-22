import { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
export default function useCosmeticStore(action = 'catalog', category = 'seat-frame') {
  const [data, setData] = useState({ items: [], owned_ids: [], selection: {} });
  const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const sequence = useRef(0); const inFlight = useRef(false);
  const load = useCallback(async (cursor) => {
    const id = ++sequence.current; setLoading(true);
    try {
      const { data: next } = await base44.functions.invoke('cosmeticStore', { action, category, cursor });
      if (sequence.current !== id) return;
      setData(old => ({ ...next, items: cursor ? [...old.items, ...next.items] : next.items })); setError('');
    } catch (e) { if (sequence.current === id) setError(e.response?.data?.error || 'Mağaza yüklenemedi.'); }
    finally { if (sequence.current === id) setLoading(false); }
  }, [action, category]);
  useEffect(() => { setData({ items: [], owned_ids: [], selection: {} }); load(); return () => { sequence.current++; }; }, [load]);
  const mutate = async (operation, payload) => {
    if (inFlight.current) return false;
    inFlight.current = true; setBusy(true); setError('');
    try {
      await base44.functions.invoke('cosmeticStore', { action: operation, ...payload });
      await load(); window.dispatchEvent(new Event('cosmetic-store-changed')); return true;
    } catch (e) { setError(e.response?.data?.error || 'İşlem tamamlanamadı. Tekrar deneyebilirsin.'); return false; }
    finally { inFlight.current = false; setBusy(false); }
  };
  return { ...data, loading, busy, error, load, mutate };
}