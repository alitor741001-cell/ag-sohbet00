import { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
export default function useSocialList(open, kind) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cursor, setCursor] = useState(null);
  const request = useRef(0);
  const load = useCallback(async (next = null) => {
    const ticket = ++request.current;
    setLoading(true); setError('');
    try {
      const payload = kind === 'visitors' ? { action: 'visitors', ...(next ? { cursor: next } : {}) } : { action: 'list', kind };
      let response;
      try {
        response = await base44.functions.invoke('social-service', payload);
      } catch (retry) {
        if (retry?.response?.status === 429 || retry?.message?.includes('429')) {
          await new Promise(r => setTimeout(r, 1200));
          response = await base44.functions.invoke('social-service', payload);
        } else throw retry;
      }
      const { data } = response;
      if (ticket !== request.current) return;
      setItems(previous => next ? [...new Map([...previous, ...(data.items || [])].map(person => [person.id, person])).values()] : data.items || []);
      setCursor(data.has_more ? data.next_cursor : null);
    } catch (failure) { if (ticket === request.current) setError(failure.response?.data?.error || 'Liste yüklenemedi.'); }
    finally { if (ticket === request.current) setLoading(false); }
  }, [kind]);
  useEffect(() => {
    if (!open || !kind) return;
    setItems([]); setCursor(null); load();
    return () => { request.current += 1; };
  }, [open, kind, load]);
  return { items, loading, error, hasMore: !!cursor, loadMore: () => load(cursor), retry: () => load() };
}