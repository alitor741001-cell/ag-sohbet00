import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function useMessageProfiles(userIds) {
  const key = [...new Set(userIds.filter(Boolean))].sort().join(',');
  const [profiles, setProfiles] = useState({});
  useEffect(() => {
    if (!key) { setProfiles({}); return; }
    let active = true;
    const ids = key.split(',');
    const load = () => base44.functions.invoke('user-profile', { user_ids: ids }).then((response) => {
      if (!active) return;
      const found = response.data?.data || response.data || {};
      setProfiles(Object.fromEntries(ids.map((id) => [id, found[id] || { account_status: 'deleted' }])));
    }).catch(() => {});
    load();
    // Profil güncellemeleri çok sık gelir: biriken değişiklikler tek çağrıda okunur,
    // her güncelleme ayrı istek açıp listeyi yeniden çizmez.
    let refreshTimer = null;
    const scheduleLoad = () => {
      if (refreshTimer) window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(load, 1200);
    };
    const unsubscribe = base44.entities.User.subscribe((event) => {
      if (ids.includes(event.data?.id || event.id)) scheduleLoad();
    });
    return () => { active = false; if (refreshTimer) window.clearTimeout(refreshTimer); unsubscribe(); };
  }, [key]);
  return profiles;
}