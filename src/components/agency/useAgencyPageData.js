import { useCallback, useEffect, useState } from 'react';
import { agencyApi } from '@/lib/agency';
import { resolveAgencyRole } from '@/lib/agencyRole';
import { useCurrentUser } from '@/lib/useCurrentUser';

// Ajans sayfaları arasında gezinirken bekleme olmasın: son veri anında gösterilir,
// yenisi arka planda alınır. Oturum kapanınca/başka hesapla girişte sayfa yeniden yüklenir.
let pageCache = null;

/**
 * Ajans sayfalarının ortak verisi: kullanıcının ajans rolü, özet bilgileri ve
 * role göre yayıncı, asistan ya da ajans panel verisi.
 */
export default function useAgencyPageData() {
  const { user, reload: reloadUser } = useCurrentUser();
  const [summary, setSummary] = useState(pageCache?.summary || null);
  const [panel, setPanel] = useState(pageCache?.panel || null);
  const [broadcaster, setBroadcaster] = useState(pageCache?.broadcaster || null);
  const [assistant, setAssistant] = useState(pageCache?.assistant || null);
  const [loading, setLoading] = useState(!pageCache);

  // quiet: bekleme ekranı gösterilmeden sessizce yeniler (canlı kota takibi).
  const load = useCallback(async (quiet = false) => {
    if (!user?.id) return;
    if (!quiet && !pageCache) setLoading(true);
    try {
      const data = await agencyApi('summary');
      setSummary(data);
      const role = resolveAgencyRole({ profile: data?.profile || user, owned: data?.owned_agency, membership: data?.agency, userId: user?.id });
      let panelData = null;
      let broadcasterData = null;
      let assistantData = null;
      if (role === 'owner' || role === 'pending') panelData = await agencyApi('agency-panel').catch(() => null);
      else if (role === 'assistant') assistantData = await agencyApi('assistant').catch(() => null);
      else if (role === 'broadcaster') broadcasterData = await agencyApi('broadcaster').catch(() => null);
      setPanel(panelData);
      setBroadcaster(assistantData || broadcasterData);
      setAssistant(assistantData);
      pageCache = { summary: data, panel: panelData, broadcaster: assistantData || broadcasterData, assistant: assistantData };
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
  // Özet gelmeden önce rol kullanıcı kaydından okunur; sahiplik üyelikten önce gelir.
  const role = resolveAgencyRole({
    profile: summary?.profile || user || {}, owned: summary?.owned_agency, membership: summary?.agency, userId: user?.id,
  });

  return {
    user,
    loading,
    role,
    profile,
    agency: panel?.agency || assistant?.agency || broadcaster?.agency || summary?.owned_agency || summary?.agency || null,
    panel,
    broadcaster,
    assistant,
    reload: () => load(),
    refresh,
    reloadUser,
  };
}