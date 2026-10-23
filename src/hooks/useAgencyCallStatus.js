import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

/** Kullanıcının ajans çağrısı yetkisi ve bugünkü kalan hakkı. */
export default function useAgencyCallStatus(userId) {
  const [status, setStatus] = useState(null);
  const refresh = useCallback(() => {
    if (!userId) return;
    base44.functions.invoke('agency-call', { action: 'status' }).then((res) => setStatus(res.data)).catch(() => {});
  }, [userId]);
  useEffect(() => { refresh(); }, [refresh]);
  return { status, setStatus, refresh };
}