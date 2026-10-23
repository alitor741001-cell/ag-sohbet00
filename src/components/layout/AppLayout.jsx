import { Suspense, useEffect, useRef, useState } from 'react';
import PullToRefresh from '@/components/home/PullToRefresh';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import subscribeEntity from '@/components/data/entitySubscriptions';
import { useCurrentUser, membershipActive } from '@/lib/useCurrentUser';
import { useAuth } from '@/lib/AuthContext';
import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/layout/BottomNav';
import useFriendPresence from '@/hooks/useFriendPresence';
import useRoleCelebration from '@/hooks/useRoleCelebration';
import RoleCelebrationOverlay from '@/components/role/RoleCelebrationOverlay';
import { triggerBanNotice } from '@/lib/banNotice';
import { useToast } from '@/components/ui/use-toast';
import MessageRealtimeProvider from '@/components/messages/MessageRealtimeProvider';
import RoutePreloader from '@/components/layout/RoutePreloader';
import TabStack from '@/components/layout/TabStack';
import { matchTabPath } from '@/lib/tabPaths';
import { motion, useReducedMotion } from 'framer-motion';
import { isMultiDeviceExempt } from '@/lib/sessionPolicy';
// Yüz doğrulaması uygulamaya girişte sorulmaz: yalnızca elmaslar/bakiye bölümünde istenir.

// Koyu yüzeyler tek bir gece mavisi gradyanıyla boyanır: durum çubuğu, güvenli alan ve
// kaydırma kenarlarında siyah şerit kalmaz, ana sayfanın zemini ekranın tamamını kaplar.
import { HOME_DESIGN } from '@/components/layout/HomeImageNav';
const DARK_SURFACE_GRADIENT = 'radial-gradient(120% 75% at 50% 0%, #1d1013 0%, #0c0a0f 44%, #050409 100%)';

export default function AppLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, loading } = useCurrentUser();
  useFriendPresence(user, true);
  useRoleCelebration();
  // Supabase aynası: canlı veri oturum açıkken kendiliğinden eşitlenir.
  const { publicSettings } = useAuth();
  const { toast } = useToast();
  // RoleCelebrationOverlay renders a full-screen animated character when role changes
  const isRoom = pathname.startsWith('/oda/') || pathname.startsWith('/sesli-oda/') || pathname === '/sesli-oda-kur';
  const isDarkSurface = !pathname.startsWith('/admin');
  const [refreshKey, setRefreshKey] = useState(0);
  // Alt menü sekmeleri bellekte kalır: sekme değişiminde sayfa değişmez, görünürlük değişir.
  const activeTabPath = matchTabPath(pathname);
  const reduceMotion = useReducedMotion();

  // Bakım modu: admin olmayan kullanıcılar bakım ekranı görür
  const isAdmin = user?.role === 'admin';
  const isMaintenance = publicSettings?.maintenance_mode && !isAdmin && pathname !== '/bakim';
  useEffect(() => {
    if (isMaintenance) window.location.href = '/bakim';
  }, [isMaintenance]);

  // Tek noktadan yedek durum kontrolü — anlık işlemler realtime, güvenlik doğrulaması 30 saniyede bir:
  // ban/silme + abonelik onayı + cihaz/session + bakım modu
  const wasInactiveRef = useRef(false);
  useEffect(() => {
    if (!user) return;
    let tick = 0;
    const check = async () => {
      if (document.visibilityState === 'hidden') return;
      try {
        const u = await base44.auth.me();
        // Ban / silme
        if (u?.is_banned || u?.role === 'banned') {
          triggerBanNotice('banned', u?.ban_reason || '', u?.ban_description || '');
          base44.auth.logout().catch(() => {});
          window.location.href = '/login?banned=1';
          return;
        }
        // Abonelik onayı — pending kullanıcı aktif olunca ana sayfaya
        const isActive = membershipActive(u);
        if (!isActive) {
          wasInactiveRef.current = true;
        } else if (wasInactiveRef.current) {
          wasInactiveRef.current = false;
          window.location.href = '/';
          return;
        }
        // Cihaz/session kontrolü (adminler ve çoklu cihaz muaf hesaplar hariç)
        if (!isMultiDeviceExempt(u)) {
          const stored = localStorage.getItem('filmkeyfi_session_' + u.id);
          if (stored && u?.active_session_id && stored !== u.active_session_id) {
            triggerBanNotice('kicked');
            base44.auth.logout().catch(() => {});
            localStorage.removeItem('filmkeyfi_session_' + u.id);
            window.location.href = '/login?kicked=1';
            return;
          }
        }
        // Bakım modu — iki dakikada bir kontrol; anlık kullanıcı yaptırımları realtime ile gelir
        tick++;
        if (tick % 4 === 0 && u?.role !== 'admin') {
          const ps = await base44.functions.invoke('public-settings', {}).catch(() => null);
          const s = ps?.data || ps;
          if (s?.maintenance_mode) {
            window.location.href = '/bakim';
            return;
          }
        }
      } catch (e) {
        if (e?.status === 401 || e?.status === 403 || e?.status === 404) {
          triggerBanNotice('removed');
          base44.auth.logout().catch(() => {});
          window.location.href = '/login?removed=1';
        }
      }
    };
    // Açılışta oturum doğrulaması zaten yapıldı: ilk kontrol 30 saniye sonra, açılışı yavaşlatmaz.
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  }, [user?.id]);

  // Ban kontrolü — engellenmiş kullanıcıları giriş ekranına at
  useEffect(() => {
    if (user?.is_banned && pathname !== '/login') {
      triggerBanNotice('banned');
      base44.auth.logout().catch(() => {});
      window.location.href = '/login?banned=1';
    }
  }, [user?.is_banned, pathname]);

  // Gerçek zamanlı hesap durumu tespiti
  useEffect(() => {
    if (!user) return;
    const unsubNotif = subscribeEntity('Notification', (ev) => {
      if (ev.type !== 'create' || ev.data?.user_id !== user.id) return;
      if (ev.data?.type === 'banned') {
        triggerBanNotice('banned');
        base44.auth.logout().catch(() => {});
        window.location.href = '/login?banned=1';
        return;
      }
      // Özel mesajlar üst bildirim yerine yalnızca sohbet rozetinde gösterilir.
      if (ev.data?.type === 'dm') return;
      // Asistanlık daveti ve onayı siyah kutuda değil, yalnızca sistem bildiriminde görünür.
      if (ev.data?.type === 'assistant_invite' || ev.data?.type === 'assistant_accepted') return;
      toast({ title: ev.data?.title || 'Bildirim', description: ev.data?.body });
    });
    const unsubUser = subscribeEntity('User', (ev) => {
      if (ev.type === 'update' && ev.data?.id === user.id && (ev.data?.is_banned || ev.data?.role === 'banned')) {
        triggerBanNotice('banned', ev.data?.ban_reason || '', ev.data?.ban_description || '');
        base44.auth.logout().catch(() => {});
        window.location.href = '/login?banned=1';
        return;
      }
      // Admin üyeliği onayladığında anında ana sayfaya yönlendir
      if (ev.type === 'update' && ev.data?.id === user.id && ev.data?.membership_status === 'active' && !membershipActive(user)) {
        window.location.href = '/';
      }
      if (ev.type === 'delete' && (ev.data?.id === user.id || ev.id === user.id)) {
        triggerBanNotice('removed');
        base44.auth.logout().catch(() => {});
        window.location.href = '/login?removed=1';
      }
    });
    return () => { unsubNotif(); unsubUser(); };
  }, [user?.id]);

  // Sayfa görünür olunca anlık güvenlik kontrolü — kullanıcı geri döndüğünde ban/silme tespiti
  useEffect(() => {
    const onVisible = async () => {
      if (document.visibilityState !== 'visible' || !user) return;
      try {
        const u = await base44.auth.me();
        if (u?.is_banned || u?.role === 'banned') {
          triggerBanNotice('banned', u?.ban_reason || '', u?.ban_description || '');
          base44.auth.logout().catch(() => {});
          window.location.href = '/login?banned=1';
        }
      } catch (e) {
        if (e?.status === 401 || e?.status === 403 || e?.status === 404) {
          triggerBanNotice('removed');
          base44.auth.logout().catch(() => {});
          window.location.href = '/login?removed=1';
        }
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [user?.id]);

  // Sosyal girişle yeni kayıt olan kullanıcı için admin bildirimi (email kaydı zaten Register'da gönderir, dedup ref_id ile engeller)
  useEffect(() => {
    if (!user?.id || user.role === 'admin') return;
    const created = user.created_date ? new Date(user.created_date).getTime() : 0;
    if (created && Date.now() - created < 2 * 60 * 1000) {
      base44.functions.invoke('admin-notify', {
        event: 'new_user',
        ref_id: `new_user:${user.email || user.id}`,
        title: 'Yeni kullanıcı kaydoldu',
        body: user.username || user.full_name || user.email,
        link: '/admin/kullanicilar'
      }).catch(() => {});
    }
  }, [user?.id]);

  if (isRoom) {
    // Oda zeminini artık tema boyuyor: buradaki lacivert katman kapatıldı, alt şerit kalmaz.
    return <MessageRealtimeProvider userId={user?.id}><div className="min-h-screen bg-transparent"><RoutePreloader /><RoleCelebrationOverlay /><Suspense fallback={null}><Outlet /></Suspense></div></MessageRealtimeProvider>;
  }
  return (
    <MessageRealtimeProvider userId={user?.id}><div className={`min-h-screen w-full min-w-0 overflow-x-clip ${isDarkSurface ? 'relative isolate' : 'bg-background'}`} style={isDarkSurface ? { background: DARK_SURFACE_GRADIENT } : undefined}>
      {/* Ana sayfa teması: tasarım görseli tüm koyu sayfalarda sabit zemin olur. */}
      {isDarkSurface && <div aria-hidden="true" className="app-design-backdrop pointer-events-none fixed inset-0 -z-10" style={{ backgroundImage: `url(${HOME_DESIGN})` }} />}
      <RoutePreloader />
      <RoleCelebrationOverlay />
      <Navbar />
      {/* Klavye kullanıcısı menüyü atlayıp doğrudan içeriğe geçebilir. */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-[100] focus:rounded-lg focus:bg-card focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-foreground focus:ring-2 focus:ring-ring">İçeriğe geç</a>
      <main id="main-content" tabIndex={-1} className="mx-auto w-full min-w-0 max-w-[1600px] overflow-x-clip pt-[max(env(safe-area-inset-top),0.5rem)] pb-[calc(7.5rem+env(safe-area-inset-bottom))] lg:pt-16 lg:pb-8" style={{ touchAction: 'pan-y' }}>
        {/* Sayfa paketi yüklenirken kabuk (menü, sohbetler, bildirimler) yerinde kalır. */}
        <Suspense fallback={null}>
          <TabStack activePath={activeTabPath} />
          {!activeTabPath && (
            /* Sayfa geçişi mobil uygulama hissiyle akar: hafif aşağıdan yukarı + belirginlik. */
            <PullToRefresh disabled={pathname.startsWith('/ajans')} onRefresh={() => setRefreshKey((k) => k + 1)}>
            <motion.div
              key={`${pathname}-${refreshKey}`}
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.24, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
            </PullToRefresh>
          )}
        </Suspense>
      </main>
      <BottomNav />
    </div></MessageRealtimeProvider>
  );
}