import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import useWalletCoinsLive from '@/hooks/useWalletCoinsLive';
import useGiftSummaryLive from '@/hooks/useGiftSummaryLive';

const safeCount = (entity, query) => base44.entities[entity].count(query).catch(() => 0);

/** Profil tasarımını dolduran gerçek veriler: cüzdan, rozetler ve sosyal sayılar. */
export default function useProfileDesignData(user) {
  const [wallet, setWallet] = useState(null);
  const [profile, setProfile] = useState(null);
  const [vipCount, setVipCount] = useState(0);
  const [counts, setCounts] = useState({ friends: 0, following: 0, followers: 0, visitors: 0 });

  const loadWallet = useCallback(() => {
    base44.functions.invoke('gift-box', { action: 'summary' }).then(r => setWallet(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    loadWallet();
    base44.functions.invoke('user-profile', { user_id: user.id }).then(r => setProfile(r.data || null)).catch(() => {});
    base44.functions.invoke('vip-bag', { action: 'list' }).then(r => setVipCount((r.data?.items || []).length)).catch(() => {});
    Promise.all([
      Promise.all([
        safeCount('Friendship', { requester_id: user.id, status: 'accepted' }),
        safeCount('Friendship', { recipient_id: user.id, status: 'accepted' }),
      ]).then(([a, b]) => a + b),
      safeCount('Follow', { follower_id: user.id }),
      safeCount('Follow', { following_id: user.id }),
      safeCount('ProfileVisit', { profile_id: user.id }),
    ]).then(([friends, following, followers, visitors]) => setCounts({ friends, following, followers, visitors }));
  }, [user?.id, loadWallet]);

  useWalletCoinsLive(user?.id, (coins) => setWallet(prev => ({ ...prev, coins })));
  useGiftSummaryLive(user?.id, loadWallet);

  return { wallet, profile, vipCount, counts };
}