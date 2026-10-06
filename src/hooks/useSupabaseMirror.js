import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';

// Canlı ayna üç dakikada bir, tam eşitleme yarım saatte bir tazelenir.
const LIVE_MS = 3 * 60 * 1000;
const FULL_MS = 30 * 60 * 1000;

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
      const key = `filmkeyfi_mirror_${mode}_${userId}`;
      const last = Number(localStorage.getItem(key) || 0);
      if (Date.now() - last < interval) return;
      localStorage.setItem(key, String(Date.now()));
      base44.functions.invoke('supabase-sync', { mode }).catch(() => {});
    };
    const tick = () => {
      run('live', LIVE_MS);
      // Tam eşitleme yalnızca yönetici oturumunda çalışır: ekonomi, oyun ve katalog kayıtları tazelenir.
      if (isAdmin) run('all', FULL_MS);
    };
    const first = setTimeout(tick, 20000);
    const timer = setInterval(tick, 60000);
    return () => { cancelled = true; clearTimeout(first); clearInterval(timer); };
  }, [userId, isAdmin]);
}