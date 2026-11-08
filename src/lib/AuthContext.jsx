import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import subscribeEntity from '@/components/data/entitySubscriptions';
import { appParams } from '@/lib/app-params';
import { createAxiosClient } from '@base44/sdk/dist/utils/axios-client';
import { detectConnectionType } from '@/lib/connectionType';
import { triggerBanNotice } from '@/lib/banNotice';
import { isMultiDeviceExempt } from '@/lib/sessionPolicy';
import { seedCurrentUser } from '@/lib/useCurrentUser';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null); // Contains only { id, public_settings }
  const [publicSettings, setPublicSettings] = useState({ maintenance_mode: false, registration_open: true, app_theme: 'auto' });

  useEffect(() => {
    checkAppState();
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const unsubscribe = subscribeEntity('User', (event) => {
      const changedId = event.data?.id || event.id;
      if (changedId !== user.id) return;
      if (event.type === 'delete') {
        triggerBanNotice('removed');
        setUser(null);
        setIsAuthenticated(false);
        base44.auth.logout('/login?removed=1');
        return;
      }
      if (event.type === 'update' && event.data) {
        setUser((current) => current ? { ...current, ...event.data } : current);
        if (event.data.membership_status === 'active' && ['/onay-bekleniyor', '/abonelik'].includes(window.location.pathname)) {
          window.location.replace('/');
          return;
        }
        if (event.data.is_banned) {
          triggerBanNotice('banned', event.data.ban_reason, event.data.ban_description);
          setIsAuthenticated(false);
          base44.auth.logout('/login?banned=1');
        }
      }
    });
    return () => unsubscribe?.();
  }, [user?.id]);

  const checkAppState = async () => {
    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);
      
      // First, check app public settings (with token if available)
      // This will tell us if auth is required, user not registered, etc.
      const appClient = createAxiosClient({
        baseURL: `/api/apps/public`,
        headers: {
          'X-App-Id': appParams.appId
        },
        token: appParams.token, // Include token if available
        interceptResponses: true
      });
      
      // Oturum doğrulaması ile ayarlar aynı anda başlar: açılış süresi tek tura iner.
      const authPromise = appParams.token ? checkUserAuth() : Promise.resolve().then(() => {
        setIsLoadingAuth(false);
        setIsAuthenticated(false);
        setAuthChecked(true);
      });

      // Ek ayar servisi açılış sırasını beklemez: arka planda tamamlanır, geldiğinde uygulanır.
      base44.functions.invoke('public-settings', {})
        .then((ps) => setPublicSettings(ps.data || ps))
        .catch(() => {});

      try {
        // Ayarlar isteği yavaş kalırsa uygulama beklemez: 2,5 saniyede varsayılanlarla
        // açılır, gelen ayarlar arkada uygulanır.
        const appSettings = await Promise.race([
          appClient.get(`/prod/public-settings/by-id/${appParams.appId}`),
          new Promise((resolve) => { window.setTimeout(() => resolve(null), 2500); }),
        ]);
        if (appSettings) setAppPublicSettings(appSettings);
        await authPromise;
        setIsLoadingPublicSettings(false);
      } catch (appError) {
        console.error('App state check failed:', appError);
        
        // Handle app-level errors
        if (appError.status === 403 && appError.data?.extra_data?.reason) {
          const reason = appError.data.extra_data.reason;
          if (reason === 'auth_required') {
            setAuthError({
              type: 'auth_required',
              message: 'Authentication required'
            });
          } else if (reason === 'user_not_registered') {
            setAuthError({
              type: 'user_not_registered',
              message: 'User not registered for this app'
            });
          } else {
            setAuthError({
              type: reason,
              message: appError.message
            });
          }
        } else {
          setAuthError({
            type: 'unknown',
            message: appError.message || 'Failed to load app'
          });
        }
        setIsLoadingPublicSettings(false);
        setIsLoadingAuth(false);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setAuthError({
        type: 'unknown',
        message: error.message || 'An unexpected error occurred'
      });
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }
  };

  const checkUserAuth = async () => {
    try {
      // Now check if the user is authenticated
      setIsLoadingAuth(true);
      const currentUser = await base44.auth.me();
      if (currentUser.is_banned || currentUser.role === 'banned') {
        if (window.location.pathname !== '/login') {
          triggerBanNotice('banned', currentUser.ban_reason || '', currentUser.ban_description || '');
          await base44.auth.logout();
          window.location.href = '/login?banned=1';
          return;
        }
      }
      // Tek cihaz girişi — cihaz oturum kimliği doğrula
      const sessionKey = 'filmkeyfi_session_' + currentUser.id;
      const storedSession = localStorage.getItem(sessionKey);
      if (storedSession && !isMultiDeviceExempt(currentUser) && currentUser.active_session_id && storedSession !== currentUser.active_session_id) {
        // Hesap başka cihazdan açılmış — muaf hesaplar hariç bu cihazı kapat
        await base44.auth.logout();
        localStorage.removeItem(sessionKey);
        window.location.href = '/login?kicked=1';
        return;
      }
      setUser(currentUser);
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
      setAuthChecked(true);
      // Kullanıcı paylaşılan önbelleğe yazılır: sayfalar oturum sorgusunu beklemez.
      seedCurrentUser(currentUser);
      // Cihaz oturum kaydı arka planda yapılır; uygulamanın açılışını beklemez.
      if (!storedSession) {
        base44.functions.invoke('register-session', { connection_type: detectConnectionType() })
          .then((res) => { if (res?.data?.session_id) localStorage.setItem(sessionKey, res.data.session_id); })
          .catch(() => {});
      }
    } catch (error) {
      console.error('User auth check failed:', error);
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      setAuthChecked(true);
      
      // If user auth fails, it might be an expired token
      if (error.status === 401 || error.status === 403) {
        setAuthError({
          type: 'auth_required',
          message: 'Authentication required'
        });
      }
    }
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    
    if (shouldRedirect) {
      // Use the SDK's logout method which handles token cleanup and redirect
      base44.auth.logout(window.location.href);
    } else {
      // Just remove the token without redirect
      base44.auth.logout();
    }
  };

  const navigateToLogin = () => {
    // Use the SDK's redirectToLogin method
    base44.auth.redirectToLogin(window.location.href);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      publicSettings,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};