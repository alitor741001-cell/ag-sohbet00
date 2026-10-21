import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import FullUserProfile from '@/components/profile/FullUserProfile';

/**
 * Uygulamanın tek profil kartı merkezi: hangi sayfada olursa olsun
 * openUserProfile(userId) çağrısı aynı kristal kartı açar. Kart kapanınca
 * kullanıcı bulunduğu sayfada kalır (yönlendirme yapılmaz).
 */
const ProfileCardContext = createContext(null);

export function UserProfileProvider({ children }) {
  const [state, setState] = useState(null);

  const openUserProfile = useCallback((userId, options = {}) => {
    if (!userId) return;
    setState({ userId, options: options || {} });
  }, []);

  const closeUserProfile = useCallback(() => setState(null), []);

  const value = useMemo(
    () => ({ openUserProfile, closeUserProfile, profileUserId: state?.userId || null }),
    [openUserProfile, closeUserProfile, state?.userId]
  );

  return (
    <ProfileCardContext.Provider value={value}>
      {children}
      <FullUserProfile
        key={state?.userId || 'kapali'}
        open={!!state?.userId}
        userId={state?.userId}
        {...(state?.options || {})}
        onClose={closeUserProfile}
      />
    </ProfileCardContext.Provider>
  );
}

export function useUserProfile() {
  return useContext(ProfileCardContext) || {
    openUserProfile: () => {},
    closeUserProfile: () => {},
    profileUserId: null,
  };
}