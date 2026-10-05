import { lazy, Suspense } from 'react';
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
// Açılış paketini küçük tutar: arama katmanı ve küçültülmüş oda balonu ayrı indirilir.
const DirectCallOverlay = lazy(() => import('@/components/friends/DirectCallOverlay'));
const MinimizedRoomBubble = lazy(() => import('@/components/voice/MinimizedRoomBubble'));
// Add page imports here
import AppLayout from '@/components/layout/AppLayout';
import { ThemeProvider } from '@/lib/ThemeContext';
import XpProvider from '@/components/xp/XpProvider';
import DirectCallProvider from '@/lib/DirectCallContext';
import { FrameCatalogProvider } from '@/lib/FrameCatalogContext';
import { Navigate } from 'react-router-dom';

const Home = lazy(() => import('@/pages/Home'));
const Browse = lazy(() => import('@/pages/Browse'));
const MovieDetail = lazy(() => import('@/pages/MovieDetail'));
const Watch = lazy(() => import('@/pages/Watch'));
const WatchParty = lazy(() => import('@/pages/WatchParty'));
const CreateRoom = lazy(() => import('@/pages/CreateRoom'));
const VoiceRoomCreate = lazy(() => import('@/pages/VoiceRoomCreate'));
const VoiceRoom = lazy(() => import('@/pages/VoiceRoom'));
const Profile = lazy(() => import('@/pages/Profile'));
const AgencyPage = lazy(() => import('@/pages/AgencyPage'));
const MyList = lazy(() => import('@/pages/MyList'));
const Search = lazy(() => import('@/pages/Search'));
const Support = lazy(() => import('@/pages/Support'));
const Notifications = lazy(() => import('@/pages/Notifications'));
const OpenRooms = lazy(() => import('@/pages/OpenRooms'));
const MaintenanceMode = lazy(() => import('@/pages/MaintenanceMode'));
const UserProfile = lazy(() => import('@/pages/UserProfile'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const BannedScreen = lazy(() => import('@/pages/BannedScreen'));
const SecurityProtocol = lazy(() => import('@/pages/SecurityProtocol'));
const Friends = lazy(() => import('@/pages/Friends'));
const AdminLayout = lazy(() => import('@/pages/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers'));
const AdminMovies = lazy(() => import('@/pages/admin/AdminMovies'));
const AdminSupport = lazy(() => import('@/pages/admin/AdminSupport'));
const AdminNotifications = lazy(() => import('@/pages/admin/AdminNotifications'));
const AdminTelegram = lazy(() => import('@/pages/admin/AdminTelegram'));
const AdminCategories = lazy(() => import('@/pages/admin/AdminCategories'));
const AdminReports = lazy(() => import('@/pages/admin/AdminReports'));
const AdminUserReports = lazy(() => import('@/pages/admin/AdminUserReports'));
const AdminSettings = lazy(() => import('@/pages/admin/AdminSettings'));
const AdminSecurity = lazy(() => import('@/pages/admin/AdminSecurity'));
const AdminPromoVideo = lazy(() => import('@/pages/admin/AdminPromoVideo'));
const AdminSessions = lazy(() => import('@/pages/admin/AdminSessions'));
const AdminUpdates = lazy(() => import('@/pages/admin/AdminUpdates'));
const AdminRoles = lazy(() => import('@/pages/admin/AdminRoles'));
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
    return <div className="fixed inset-0 bg-catalog" />;
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
      <Route path="/onay-bekleniyor" element={<Navigate to="/" replace />} />
      <Route path="/engellendiniz" element={<BannedScreen />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<LoginRedirect />} />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/filmler" element={<Browse type="movie" title="Filmler" />} />
          <Route path="/acik-odalar" element={<OpenRooms />} />
          <Route path="/openrooms" element={<Navigate to="/acik-odalar" replace />} />
          <Route path="/odalar" element={<Navigate to="/acik-odalar" replace />} />
          <Route path="/kategoriler" element={<Browse type="movie" title="Kategoriler" />} />
          <Route path="/izle/:id" element={<MovieDetail />} />
          <Route path="/video/:id" element={<Watch />} />
          <Route path="/oda/:id" element={<WatchParty />} />
          <Route path="/oda-kur" element={<CreateRoom />} />
          <Route path="/sesli-oda-kur" element={<VoiceRoomCreate />} />
          <Route path="/sesli-oda/:id" element={<VoiceRoom />} />
          <Route path="/listem" element={<MyList />} />
          <Route path="/ara" element={<Search />} />
          <Route path="/destek" element={<Support />} />
          <Route path="/arkadaslar" element={<Friends />} />
          <Route path="/bildirimler" element={<Notifications />} />
          <Route path="/profil" element={<Profile />} />
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
          <Route index element={<AdminDashboard />} />
          <Route path="kullanicilar" element={<AdminUsers />} />
          <Route path="roller" element={<AdminRoles />} />
          <Route path="hediyeler" element={<AdminGifts />} />
          <Route path="coins" element={<AdminCoins />} />
          <Route path="vip" element={<AdminVip />} />
          <Route path="ajanslar" element={<AdminAgencies />} />
          <Route path="filmler" element={<AdminMovies />} />
          <Route path="film-ekle" element={<AdminMovies />} />
          <Route path="kategoriler" element={<AdminCategories />} />

          <Route path="destek" element={<AdminSupport />} />
          <Route path="bildirimler" element={<AdminNotifications />} />
          <Route path="telegram" element={<AdminTelegram />} />
          <Route path="guvenlik" element={<AdminSecurity />} />
          <Route path="sikayetler" element={<AdminUserReports />} />
          <Route path="ayarlar" element={<AdminSettings />} />
          <Route path="ayalar" element={<AdminSettings />} />
          <Route path="tanitim-videosu" element={<AdminPromoVideo />} />
          <Route path="oturumlar" element={<AdminSessions />} />
          <Route path="guncellemeler" element={<AdminUpdates />} />
          <Route path="xp" element={<Navigate to="/admin/kullanicilar" replace />} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
    </Suspense>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <FrameCatalogProvider>
        <XpProvider>
        <ThemeProvider>
          <DirectCallProvider>
            <Router>
              <ScrollToTop />
              <AuthenticatedApp />
              {/* Bu iki katman ana pakete dahil değil: açılış hızlı kalır, davranış aynı. */}
              <Suspense fallback={null}>
                <DirectCallOverlay />
                <MinimizedRoomBubble />
              </Suspense>
            </Router>
          </DirectCallProvider>
          <Toaster />
        </ThemeProvider>
        </XpProvider>
        </FrameCatalogProvider>
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App