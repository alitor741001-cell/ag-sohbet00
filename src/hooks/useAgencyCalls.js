import { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import subscribeEntity from '@/components/data/entitySubscriptions';

const FRESH_MS = 60000;
const VISIBLE_MS = 15000;

/** Tüm sesli odalara düşen ajans çağrıları; aynı çağrı bir kez gösterilir. */
export default function useAgencyCalls() {
  const [call, setCall] = useState(null);
  const seen = useRef(new Set());

  const accept = useCallback((record) => {
    if (!record?.id || seen.current.has(record.id)) return;
    if (record.created_date && Date.now() - new Date(record.created_date).getTime() > FRESH_MS) return;
    seen.current.add(record.id);
    setCall(record);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeEntity('AgencyCall', (event) => {
      if (event?.type === 'create' && event.data) accept({ ...event.data, id: event.id });
    });
    base44.entities.AgencyCall.list('-created_date', 1).then((rows) => rows.forEach(accept)).catch(() => {});
    return unsubscribe;
  }, [accept]);

  useEffect(() => {
    if (!call) return undefined;
    const timer = window.setTimeout(() => setCall(null), VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, [call?.id]);

  return { call, dismiss: () => setCall(null) };
}