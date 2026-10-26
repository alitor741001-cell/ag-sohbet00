import { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import subscribeEntity from '@/components/data/entitySubscriptions';

export default function useMemberSupportMessages(ticketId, setMessages, onReceived) {
  const received = useRef(onReceived), older = useRef(null);
  received.current = onReceived;
  const [state, setState] = useState({ hasOlder: false, loading: false, error: false });
  useEffect(() => {
    setState({ hasOlder: false, loading: false, error: false });
    if (!ticketId) return;
    let alive = true, busy = false, pending = false, cursor;
    const load = async (more = false) => {
      if (busy) { if (!more) pending = true; return; }
      if (more && !cursor) return;
      busy = true;
      setState(value => ({ ...value, loading: true, error: false }));
      try {
        const { data } = await base44.functions.invoke('officialSupport', { action: 'messages', ticket_id: ticketId, ...(more ? { cursor } : {}) });
        if (!alive) return;
        if (more || cursor === undefined) cursor = data.has_more ? data.next_cursor : null;
        setMessages(current => {
          const items = new Map(current.map(item => [item.id, item]));
          data.items.forEach(item => items.set(item.id, item));
          return [...items.values()].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
        });
        setState({ hasOlder: !!cursor, loading: false, error: false });
        if (!more) received.current?.();
      } catch { if (alive) setState(value => ({ ...value, loading: false, error: true })); }
      finally { busy = false; if (alive && pending) { pending = false; load(); } }
    };
    older.current = () => load(true);
    const off = subscribeEntity('SupportMessage', event => {
      if (event.type === 'delete') setMessages(current => current.filter(item => item.id !== (event.data?.id || event.id)));
      else if (event.data?.ticket_id === ticketId) load();
    });
    const visible = () => { if (document.visibilityState === 'visible') load(); };
    const poll = setInterval(visible, 15000);
    window.addEventListener('online', visible); document.addEventListener('visibilitychange', visible);
    load();
    return () => { alive = false; older.current = null; off(); clearInterval(poll); window.removeEventListener('online', visible); document.removeEventListener('visibilitychange', visible); };
  }, [ticketId, setMessages]);
  return { ...state, loadOlder: () => older.current?.() };
}