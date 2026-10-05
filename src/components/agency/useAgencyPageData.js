import { useCallback, useEffect, useState } from 'react';
import { agencyApi } from '@/lib/agency';
import { useCurrentUser } from '@/lib/useCurrentUser';

// Ajans sayfaları arasında gezinirken bekleme olmasın: son veri anında gösterilir,
// yenisi arka planda alınır. Oturum kapanınca/başka hesapla girişte sayfa yeniden yüklenir.
let pageCache = null;

/**
 * Ajans sayfalarının ortak verisi: kullanıcının ajans rolü, özet bilgileri ve
 * role göre yayıncı ya da ajans panel verisi.
 */
export default function useAgencyPageData() {
  const { user, reload: reloadUser } = useCurrentUser();
  const [summary, setSummary] = useState(pageCache?.summary || null);
  const [panel, setPanel] = useState(pageCache?.panel || null);
  const [broadcaster, setBroadcaster] = useState(pageCache?.broadcaster || null);
  const [loading, setLoading] = useState(!pageCache);

  // quiet: bekleme ekranı gösterilmeden sessizce yeniler (canlı kota takibi).
  const load = useCallback(async (quiet = false) => {
    if (!user?.id) return;
    if (!quiet && !pageCache) setLoading(true);
    try {
      const data = await agencyApi('summary');
      setSummary(data);
      const recordId = data?.profile?.agency_record_id || '';
      const isOwner = data?.profile?.agency_role === 'owner' || data?.agency?.owner_id === user.id;
      const role = !recordId ? '' : isOwner ? (data?.agency?.status === 'pending' ? 'pending' : 'owner') : 'broadcaster';
      let panelData = null;
      let broadcasterData = null;
      if (role === 'owner' || role === 'pending') panelData = await agencyApi('agency-panel').catch(() => null);
      else if (role === 'broadcaster') broadcasterData = await agencyApi('broadcaster').catch(() => null);
      setPanel(panelData);
      setBroadcaster(broadcasterData);
      pageCache = { summary: data, panel: panelData, broadcaster: broadcasterData };
    } catch {
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  /** Sessiz yenileme: açık sayfadaki ilerleme çubuklarını günceller. */
  const refresh = useCallback(() => load(true), [load]);

  useEffect(() => { load(); }, [load]);

  const profile = summary?.profile || {};
  const role = !profile.agency_record_id
    ? ''
    : profile.agency_role === 'owner' || summary?.agency?.owner_id === user?.id
      ? (summary?.agency?.status === 'pending' ? 'pending' : 'owner')
      : 'broadcaster';

  return {
    user,
    loading,
    role,
    profile,
    agency: panel?.agency || broadcaster?.agency || summary?.agency || null,
    panel,
    broadcaster,
    reload: () => load(),
    refresh,
    reloadUser,
  };
}