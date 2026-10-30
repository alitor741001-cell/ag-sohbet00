import { lazy, Suspense, useEffect } from 'react';
import warmChunks from '@/lib/warmChunks';
import { ART } from '@/lib/designArt';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoginRedirect from '@/components/LoginRedirect';
// Açılış paketini küçük tutar: küçültülmüş oda balonu ayrı indirilir.
const MinimizedRoomBubble = lazy(() => import('@/components/voice/MinimizedRoomBubble'));
// Add page imports here
import AppLayout from '@/components/layout/AppLayout';
import useDeferredMount from '@/hooks/useDeferredMount';
import XpProvider from '@/components/xp/XpProvider';
import { FrameCatalogProvider } from '@/lib/FrameCatalogContext';
import { UserProfileProvider } from '@/lib/profileCard';
import { Navigate } from 'react-router-dom';

const Home = lazy(() => import('@/pages/Home'));
const OAuthConsent = lazy(() => import('@/pages/OAuthConsent'));
const WatchParty = lazy(() => import('@/pages/WatchParty'));
const CreateRoom = lazy(() => import('@/pages/CreateRoom'));
const VoiceRoomCreate = lazy(() => import('@/pages/VoiceRoomCreate'));
const VoiceRoom = lazy(() => import('@/pages/VoiceRoom'));
const AgencyPage = lazy(() => import('@/pages/AgencyPage'));
const Support = lazy(() => import('@/pages/SupportEntry'));
const Notifications = lazy(() => import('@/pages/Notifications'));
const OpenRooms = lazy(() => import('@/pages/OpenRooms'));
const MaintenanceMode = lazy(() => import('@/pages/MaintenanceMode'));
const Profile = lazy(() => import('@/pages/Profile'));
const ProfileSettingsPage = lazy(() => import('@/pages/ProfileSettingsPage'));
const UserProfile = lazy(() => import('@/pages/UserProfile'));
const Search = lazy(() => import('@/pages/Search'));
const VipLevels = lazy(() => import('@/pages/VipLevels'));
const LevelPage = lazy(() => import('@/pages/LevelPage'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const BannedScreen = lazy(() => import('@/pages/BannedScreen'));
const SecurityProtocol = lazy(() => import('@/pages/SecurityProtocol'));
const Friends = lazy(() => import('@/pages/Friends'));
const FriendRequests = lazy(() => import('@/pages/FriendRequests'));
const AgencyMessages = lazy(() => import('@/pages/AgencyMessages'));
const AdminLayout = lazy(() => import('@/pages/admin/AdminLayout'));
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers'));
const AdminSupport = lazy(() => import('@/pages/admin/AdminSupport'));
const AdminTelegram = lazy(() => import('@/pages/admin/AdminTelegram'));
const AdminSettings = lazy(() => import('@/pages/admin/AdminSettings'));
const AdminSecurity = lazy(() => import('@/pages/admin/AdminSecurity'));
const AdminGifts = lazy(() => import('@/pages/admin/AdminGifts'));
const AdminCoins = lazy(() => import('@/pages/admin/AdminCoins'));
const AdminVip = lazy(() => import('@/pages/admin/AdminVip'));
const AdminAgencies = lazy(() => import('@/pages/admin/AdminAgencies'));
const AgencyEarnings = lazy(() => import('@/pages/agency/AgencyEarnings'));
const AgencyQuota = lazy(() => import('@/pages/agency/AgencyQuota'));
const AgencyBroadcasters = lazy(() => import('@/pages/agency/AgencyBroadcasters'));
const AgencyAssistants = lazy(() => import('@/pages/agency/AgencyAssistants'));
const AgencyInfo = lazy(() => import('@/pages/agency/AgencyInfo'));
const AgencyInvites = lazy(() => import('@/pages/agency/AgencyInvites'));
const AgencyTransfers = lazy(() => import('@/pages/agency/AgencyTransfers'));


const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  // Açılışta marka ekranı gösterilmez: arka plan hazırlanırken ana sayfa doğrudan gelir.
  if (isLoadingPublicSettings || isLoadingAuth) {
    return <div aria-hidden="true" className="app-design-backdrop fixed inset-0" style={{ backgroundImage: `url(${ART.pageBg})` }} />;
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Suspense fallback={null}>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/oauth/consent" element={<OAuthConsent />} />
      <Route path="/onay-bekleniyor" element={<Navigate to="/" replace />} />
      <Route path="/engellendiniz" element={<BannedScreen />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<LoginRedirect />} />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          {/* Film kataloğu kaldırıldı: eski film bağlantıları ana sayfaya düşer. */}
          <Route path="/filmler" element={<Navigate to="/" replace />} />
          <Route path="/kategoriler" element={<Navigate to="/" replace />} />
          <Route path="/izle/:id" element={<Navigate to="/" replace />} />
          <Route path="/video/:id" element={<Navigate to="/" replace />} />
          <Route path="/acik-odalar" element={<OpenRooms />} />
          <Route path="/openrooms" element={<Navigate to="/acik-odalar" replace />} />
          {/* Kaldırılan 'Odalar' sekmesi: eski bağlantılar ana sayfaya düşer. */}
          <Route path="/odalar" element={<Navigate to="/" replace />} />
          <Route path="/oda/:id" element={<WatchParty />} />
          <Route path="/oda-kur" element={<CreateRoom />} />
          <Route path="/arama" element={<Search />} />
          <Route path="/vip" element={<VipLevels />} />
          <Route path="/seviye" element={<LevelPage />} />
          <Route path="/sesli-oda-kur" element={<VoiceRoomCreate />} />
          <Route path="/sesli-oda/:id" element={<VoiceRoom />} />
          <Route path="/listem" element={<Navigate to="/" replace />} />
          <Route path="/ara" element={<Navigate to="/" replace />} />
          <Route path="/destek" element={<Support />} />
          <Route path="/arkadaslar" element={<Friends />} />
          <Route path="/arkadaslar/istekler" element={<FriendRequests />} />
          <Route path="/ajans/mesajlar" element={<AgencyMessages />} />
          <Route path="/bildirimler" element={<Notifications />} />
          {/* Profil kısmı kaldırıldı: eski bağlantılar ana sayfaya düşer. */}
          <Route path="/profil" element={<Profile />} />
          <Route path="/profil/ayarlar" element={<ProfileSettingsPage />} />
          <Route path="/ajans" element={<AgencyPage />} />
          <Route path="/ajans/kazanc" element={<AgencyEarnings />} />
          <Route path="/ajans/kota-tablosu" element={<AgencyQuota />} />
          <Route path="/ajans/yayincilar" element={<AgencyBroadcasters />} />
          <Route path="/ajans/asistanlar" element={<AgencyAssistants />} />
          <Route path="/ajans/ajansim" element={<AgencyInfo />} />
          <Route path="/ajans/davetler" element={<AgencyInvites />} />
          <Route path="/ajans/transferler" element={<AgencyTransfers />} />
          <Route path="/kullanici/:id" element={<UserProfile />} />
          <Route path="/güvenlik-protokolü" element={<SecurityProtocol />} />
          {/* Paket/ödeme sayfaları kaldırıldı: giriş yapan herkes içeriğe erişir, eski bağlantılar ana sayfaya düşer. */}
          <Route path="/abonelik" element={<Navigate to="/" replace />} />
          <Route path="/odeme-gecmisim" element={<Navigate to="/" replace />} />
          <Route path="/odeme/basarili" element={<Navigate to="/" replace />} />
          <Route path="/odeme/basarisiz" element={<Navigate to="/" replace />} />
          <Route path="/bakim" element={<MaintenanceMode />} />
        </Route>
        <Route path="/admin" element={<AdminLayout />}>
          {/* Dashboard kaldırıldı: panel doğrudan kullanıcı yönetimiyle açılır.
              Roller ve Çerçeveler sayfası da kaldırıldı: eski bağlantılar buraya düşer. */}
          <Route index element={<Navigate to="/admin/kullanicilar" replace />} />
          <Route path="kullanicilar" element={<AdminUsers />} />
          <Route path="roller" element={<Navigate to="/admin/kullanicilar" replace />} />
          <Route path="hediyeler" element={<AdminGifts />} />
          <Route path="coins" element={<AdminCoins />} />
          <Route path="vip" element={<AdminVip />} />
          <Route path="ajanslar" element={<AdminAgencies />} />
          <Route path="filmler" element={<Navigate to="/admin" replace />} />
          <Route path="film-ekle" element={<Navigate to="/admin" replace />} />
          <Route path="kategoriler" element={<Navigate to="/admin" replace />} />

          <Route path="destek" element={<AdminSupport />} />
          <Route path="telegram" element={<AdminTelegram />} />
          <Route path="guvenlik" element={<AdminSecurity />} />
          {/* Şikayet akışı kaldırıldı: eski bağlantılar kullanıcı yönetimine düşer. */}
          <Route path="sikayetler" element={<Navigate to="/admin/kullanicilar" replace />} />
          <Route path="ayarlar" element={<AdminSettings />} />
          <Route path="ayalar" element={<AdminSettings />} />
          <Route path="xp" element={<Navigate to="/admin/kullanicilar" replace />} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
    </Suspense>
  );
};


function App() {
  // Arama katmanı ve küçültülmüş oda balonu ilk boyamayı beklemez.
  const deferredReady = useDeferredMount();
  // Sık gidilen ekranlar tarayıcı boşa çıkınca indirilir: geçişler anında açılır.
  useEffect(() => { warmChunks(); }, []);

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <FrameCatalogProvider>
        <XpProvider>
            <Router>
              <ScrollToTop />
              <UserProfileProvider>
                <AuthenticatedApp />
              </UserProfileProvider>
              {/* Küçültülmüş oda balonu ana pakete dahil değil: açılış hızlı kalır. */}
              {deferredReady && (
                <Suspense fallback={null}>
                  <MinimizedRoomBubble />
                </Suspense>
              )}
            </Router>
          <Toaster />
        </XpProvider>
        </FrameCatalogProvider>
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App