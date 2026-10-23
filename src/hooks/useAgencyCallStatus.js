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
  // Haklar Türkiye saatiyle gece 24:00'da yenilenir: sayaç ekranda kendiliğinden tazelenir.
  useEffect(() => {
    const at = Date.parse(status?.resets_at || '');
    if (!Number.isFinite(at)) return undefined;
    const timer = setTimeout(refresh, Math.max(1000, at - Date.now()) + 1500);
    return () => clearTimeout(timer);
  }, [status?.resets_at, refresh]);
  return { status, setStatus, refresh };
}