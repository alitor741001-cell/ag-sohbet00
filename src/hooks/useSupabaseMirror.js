import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';

// Canlı ayna üç dakikada bir tazelenir; tam eşitleme on dakikada bir sıradaki dilimi işler.
const LIVE_MS = 3 * 60 * 1000;
const FULL_MS = 10 * 60 * 1000;
const inFlight = new Set();
// Profil özeti de arka planda tazelenir: profil sayfası açılırken hesap beklenmez.
const WARM_MS = 3 * 60 * 1000;
const WARM_KEY = 'filmkeyfi_profile_warm';

/**
 * Supabase aynasını uygulama açıkken taze tutar: oda, katılımcı, mesaj,
 * arkadaşlık ve çevrim içi durum verisi kendiliğinden eşitlenir.
 * İlk tur açılışı bekletmez, sekme gizliyken çalışmaz, hata sessizce yutulur.
 */
export default function useSupabaseMirror(user) {
  const userId = user?.id || '';
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!userId) return undefined;
    let cancelled = false;
    const run = (mode, interval) => {
      if (cancelled || document.visibilityState === 'hidden') return;
      // Tabs in the same browser share the mirror interval; overlapping runs are suppressed.
      const key = `filmkeyfi_mirror_${mode}`;
      const last = Number(localStorage.getItem(key) || 0);
      if (inFlight.has(mode) || Date.now() - last < interval) return;
      inFlight.add(mode);
      localStorage.setItem(key, String(Date.now()));
      base44.functions.invoke('supabase-sync', { mode }).catch(() => {}).finally(() => inFlight.delete(mode));
    };
    // Profil özeti arka planda hazırlanır: sayfa açıldığında Supabase'teki hazır değer gelir.
    const warm = () => {
      if (cancelled || document.visibilityState === 'hidden') return;
      if (Date.now() - Number(localStorage.getItem(WARM_KEY) || 0) < WARM_MS) return;
      localStorage.setItem(WARM_KEY, String(Date.now()));
      base44.functions.invoke('profile-summary', {}).catch(() => {});
    };
    const tick = () => {
      run('live', LIVE_MS);
      warm();
      // Tam eşitleme yalnızca yönetici oturumunda çalışır: ekonomi, oyun ve katalog kayıtları tazelenir.
      if (isAdmin) run('all', FULL_MS);
    };
    const warmFirst = setTimeout(warm, 4000);
    const first = setTimeout(tick, 20000);
    const timer = setInterval(tick, 60000);
    return () => { cancelled = true; clearTimeout(warmFirst); clearTimeout(first); clearInterval(timer); };
  }, [userId, isAdmin]);
}