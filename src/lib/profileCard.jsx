import { createContext, lazy, Suspense, useCallback, useContext, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
const FullUserProfile = lazy(() => import('@/components/profile/FullUserProfile'));

/**
 * Uygulamanın tek profil kartı merkezi: hangi sayfada olursa olsun
 * openUserProfile(userId) çağrısı aynı kristal kartı açar. Kart kapanınca
 * kullanıcı bulunduğu sayfada kalır (yönlendirme yapılmaz).
 */
const ProfileCardContext = createContext(null);

export function UserProfileProvider({ children }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [state, setState] = useState(null);

  const openUserProfile = useCallback((userId, options = {}) => {
    if (!userId) return;
    setState({ userId, options: options || {} });
  }, []);

  const closeUserProfile = useCallback(() => setState(null), []);

  // Odada değilken "Sohbet" ve "Bahset": mevcut özel sohbeti açar, yoksa başlatır.
  const openChatWith = useCallback(async (targetId) => {
    if (!targetId) return;
    try {
      const response = await base44.functions.invoke('dm-service', { action: 'start', target_id: targetId });
      if (response?.data?.warning) toast({ description: response.data.warning, duration: 6000 });
      const conversation = response?.data?.conversation;
      if (conversation?.id) {
        navigate(`/arkadaslar?view=chats&chat=${conversation.id}`);
        return;
      }
      toast({ title: 'Sohbet açılamadı', variant: 'destructive' });
    } catch (error) {
      toast({
        title: 'Sohbet açılamadı',
        description: error?.response?.data?.error || error.message,
        variant: 'destructive',
      });
    }
  }, [navigate, toast]);

  const value = useMemo(
    () => ({ openUserProfile, closeUserProfile, profileUserId: state?.userId || null }),
    [openUserProfile, closeUserProfile, state?.userId]
  );

  return (
    <ProfileCardContext.Provider value={value}>
      {children}
      {state?.userId && <Suspense fallback={null}><FullUserProfile
        key={state.userId}
        open={!!state?.userId}
        userId={state?.userId}
        {...(state?.options || {})}
        onMessage={state?.options?.onMessage || openChatWith}
        onClose={closeUserProfile}
      /></Suspense>}
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