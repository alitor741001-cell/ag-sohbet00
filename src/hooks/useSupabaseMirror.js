import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';

// Zamanlanmış görevler aynayı zaten taze tutar: canlı ayna 2 dakikada bir,
// tam ayna 15 dakikada bir çalışır. Uygulama içinden de tur açmak aynı işi
// ikinci kez yapıp istek bütçesini yediği için burada yalnızca açılışta ve
// sekmeye dönüşte tazelenir: boşuna yük yok, veri yine taze.
const LIVE_MS = 2 * 60 * 1000;
const inFlight = new Set();
// Profil özeti de arka planda tazelenir: profil sayfası açılırken hesap beklenmez.
const WARM_MS = 3 * 60 * 1000;
const WARM_KEY = 'filmkeyfi_profile_warm';
const LIVE_KEY = 'filmkeyfi_mirror_live';

/**
 * Supabase aynasını taze tutar: açılışta ve sekmeye dönüldüğünde bir canlı tur
 * ile profil özeti yenilenir. Sekme gizliyken çalışmaz, hata sessizce yutulur.
 */
export default function useSupabaseMirror(user) {
  const userId = user?.id || '';

  useEffect(() => {
    if (!userId) return undefined;
    let cancelled = false;

    const runLive = () => {
      if (cancelled || document.visibilityState === 'hidden') return;
      // Aynı tarayıcıdaki sekmeler aynı boşluğu paylaşır; üst üste binen turlar engellenir.
      const last = Number(localStorage.getItem(LIVE_KEY) || 0);
      if (inFlight.has('live') || Date.now() - last < LIVE_MS) return;
      inFlight.add('live');
      localStorage.setItem(LIVE_KEY, String(Date.now()));
      base44.functions.invoke('supabase-sync', { mode: 'live' }).catch(() => {}).finally(() => inFlight.delete('live'));
    };

    const warm = () => {
      if (cancelled || document.visibilityState === 'hidden') return;
      if (Date.now() - Number(localStorage.getItem(WARM_KEY) || 0) < WARM_MS) return;
      localStorage.setItem(WARM_KEY, String(Date.now()));
      base44.functions.invoke('profile-summary', {}).catch(() => {});
    };

    // İlk tur açılışı bekletmez.
    const first = setTimeout(() => { runLive(); warm(); }, 20000);
    // Sekmeye dönüş: bayat veri anında yakalanır.
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      runLive();
      warm();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      clearTimeout(first);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [userId]);
}