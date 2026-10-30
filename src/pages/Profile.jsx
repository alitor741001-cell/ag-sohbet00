import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/ui/use-toast';
import { vipLevelOf } from '@/lib/userLevels';
import { ART } from '@/lib/designArt';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import useFriends from '@/hooks/useFriends';
import SocialListDialog from '@/components/profile/social/SocialListDialog';
import ProfileFixedHero from '@/components/profile/fantasy/ProfileFixedHero';
import ProfileMenuDeck from '@/components/profile/fantasy/ProfileMenuDeck';
import { isModerator } from '@/lib/roles';
import { giftBoxLocked } from '@/lib/giftAccess';
import PrivacyPolicyBody from '@/components/profile/PrivacyPolicyBody';

import GiftBoxPanel from '@/components/profile/GiftBoxPanel';
import CoinPurchasePanel from '@/components/voice/CoinPurchasePanel';
import CoinActivityPanel from '@/components/profile/CoinActivityPanel';
import VipBagPanel from '@/components/profile/VipBagPanel';
import StorePanel from '@/components/store/StorePanel';
import useWalletCoinsLive from '@/hooks/useWalletCoinsLive';
import useGiftSummaryLive from '@/hooks/useGiftSummaryLive';

/** Profil sayfası: cüzdan, kişisel bilgiler, eklentiler (ayarlar) ve hesap işlemleri. */
export default function Profile() {
  const { user, reload, setUser } = useCurrentUser();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [wallet, setWallet] = useState(null);
  const [vipCount, setVipCount] = useState(0);
  const [giftBoxOpen, setGiftBoxOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  // Takip ve ziyaretçi sayaçları ile açılan liste: takip edilenler, takipçiler, ziyaretçiler.
  const [social, setSocial] = useState({ following: 0, followers: 0, visitors: 0 });
  const [socialList, setSocialList] = useState(null);

  const [activityOpen, setActivityOpen] = useState(false);
  const [vipBagOpen, setVipBagOpen] = useState(false);
  const [storeOpen, setStoreOpen] = useState(false);
  const [coinShopOpen, setCoinShopOpen] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ avatar: '' });

  // Eski /profil?tab=settings bağlantıları Ayarlar sayfasına gider.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('tab') !== 'settings') return;
    navigate('/profil/ayarlar', { replace: true });
  }, []);

  const loadVipCount = () => {
    base44.functions.invoke('vip-bag', { action: 'list' })
      .then((response) => setVipCount((response.data?.items || []).length))
      .catch(() => {});
  };

  const loadWallet = () => {
    base44.functions.invoke('gift-box', { action: 'summary' })
      .then((response) => setWallet(response.data))
      .catch(() => {});
  };

  // Profil açılışı tek çağrıda Supabase aynasından gelir: cüzdan ve VIP sayısı birlikte.
  const loadSummary = () => {
    base44.functions.invoke('profile-summary', {})
      .then((response) => {
        setVipCount(response.data?.vip_count ?? 0);
      })
      .catch(() => {});
  };

  const loadSocial = () => {
    base44.functions.invoke('social-service', { action: 'stats' })
      .then((response) => setSocial({
        following: response.data?.following ?? 0,
        followers: response.data?.followers ?? 0,
        visitors: response.data?.visitors ?? 0,
      }))
      .catch(() => {});
  };

  useEffect(() => {
    // Ayna hızlı açılış sağlar; bakiye hemen canlı değerle doğrulanır.
    loadSummary();
    loadWallet();
    loadSocial();
  }, []);

  // Cüzdan canlıdır: oyun kazancı, hesaba gelen coin ve hediye harcaması bakiyeye
  // anında işler — kart 5 saniyelik yenilemeyi beklemez.
  useWalletCoinsLive(user?.id, (coins) => setWallet((prev) => ({ ...prev, coins })));
  useGiftSummaryLive(user?.id, loadWallet);

  // Arkadaş sayısı ortak arkadaşlık deposundan gelir.
  const { relations } = useFriends();
  const friendCount = relations.filter((relation) => relation.status === 'accepted').length;


  // Sayfa kendini 5 saniyede bir sessizce tazeler: bakiye canlı değerden okunur, böylece
  // hediye/oyun harcamaları ekranda eski tutarla kalmaz — yükleme göstergesi çıkmaz.
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      loadWallet();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!user) return;
    setForm({ username: user.username || '', full_name: user.full_name || '', phone: user.phone || '', avatar: user.avatar || '', birth_date: user.birth_date || '' });
    if (!user.member_id) base44.functions.invoke('ensure-member-id').then(reload).catch(() => {});
  }, [user?.id]);

  const onAvatar = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type)) return toast({ title: 'PNG, JPG, WebP veya GIF seçin', variant: 'destructive' });
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const { data } = await base44.functions.invoke('update-profile', { avatar: file_url });
      if (!data?.ok || data.profile?.id !== user.id) throw new Error(data?.error || 'Fotoğraf kaydedilemedi.');
      setForm((current) => ({ ...current, avatar: file_url }));
      setUser((current) => ({ ...current, avatar: file_url }));
      toast({ title: 'Profil fotoğrafı güncellendi' });
    } catch (error) {
      toast({ title: 'Yükleme hatası', description: error.response?.data?.error || error.message, variant: 'destructive' });
    } finally { setUploading(false); event.target.value = ''; }
  };

  // Elmas/bakiye bölümüne giriş: yalnızca yayıncı hesaba açılır, sonra yüz doğrulaması istenir.
  const openGiftBox = async () => {
    if (giftBoxLocked(user)) {
      toast({ title: 'Elmas ve bakiye bölümü yayıncılara açıktır', description: 'Yayıncı olduğunuzda elmas ve bakiye bölümünü kullanabilirsiniz.', variant: 'destructive' });
      return;
    }
    setGiftBoxOpen(true);
  };

  if (!user) return <div className="dark min-h-screen p-6 text-white">Yükleniyor...</div>;
  const elmasLocked = giftBoxLocked(user);
  // Paket/abonelik sistemi kaldırıldı: üyelik süresi artık erişimi etkilemez.

  return (
    <div
      className="dark relative min-h-screen pb-6 text-white"
      style={{
        marginLeft: 'calc(-1 * env(safe-area-inset-left, 0px))',
        marginRight: 'calc(-1 * env(safe-area-inset-right, 0px))',
      }}
    >
      {/* Profil zemini: ana sayfadaki tema görseli, çentik kenarlarına kadar uzanır. */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-black">
        <img src={ART.pageBg} alt="" draggable={false} className="h-full w-full select-none object-cover" />
      </div>
      <div className="flex min-h-[var(--app-height)] w-full flex-col">
      <ProfileFixedHero
        user={user}
        avatar={form.avatar}
        onAvatar={onAvatar}
        uploading={uploading}
        vipLevel={vipLevelOf(user)}
      />

      <div className="flex min-h-0 flex-1 flex-col px-4 pb-[env(safe-area-inset-bottom)]">
          <ProfileMenuDeck
            admin={isModerator(user)}
            stats={{
              friends: friendCount,
              following: social.following,
              followers: social.followers,
              visitors: social.visitors,
              coins: wallet?.coins ?? null,
              diamonds: elmasLocked ? null : (wallet?.month_score ?? null),
            }}
            onAction={(key) => {
              if (key === 'friends') navigate('/arkadaslar?view=friends');
              else if (key === 'following' || key === 'followers' || key === 'visitors') setSocialList(key);
              else if (key === 'coins') setCoinShopOpen(true);
              else if (key === 'diamonds') openGiftBox();
              else if (key === 'vip') navigate('/vip');
              else if (key === 'giftHistory') setActivityOpen(true);
              else if (key === 'store') setStoreOpen(true);
              else if (key === 'bag') setVipBagOpen(true);
              else if (key === 'level') navigate('/seviye');
              else if (key === 'agency') navigate('/ajans');
              else if (key === 'admin') navigate('/admin');
              else if (key === 'blocked') navigate('/profil/engellenen');
              else if (key === 'privacy') setPrivacyOpen(true);
              else if (key === 'settings') navigate('/profil/ayarlar');
            }}
          />



        </div>
      </div>

      {/* Kutu kapanınca bakiye canlı değerden tazelenir: kart eski tutarı göstermez. */}
      <GiftBoxPanel open={giftBoxOpen} onClose={() => { setGiftBoxOpen(false); loadWallet(); }} />
      <CoinActivityPanel open={activityOpen} onClose={() => setActivityOpen(false)} />
      <VipBagPanel open={vipBagOpen} onClose={() => setVipBagOpen(false)} onChanged={loadVipCount} />
      <StorePanel open={storeOpen} onClose={() => { setStoreOpen(false); loadWallet(); }} onCoins={() => { setStoreOpen(false); setCoinShopOpen(true); }} />
      <CoinPurchasePanel
        open={coinShopOpen}
        coins={wallet?.coins ?? null}
        onBack={() => { setCoinShopOpen(false); loadWallet(); }}
      />

      <SocialListDialog open={!!socialList} kind={socialList} onClose={() => { setSocialList(null); loadSocial(); }} />

      <Dialog open={privacyOpen} onOpenChange={(value) => !value && setPrivacyOpen(false)}>
        <DialogContent className="max-h-[88vh] max-w-2xl gap-0 border-[#7dd3fc]/30 bg-[linear-gradient(180deg,#0B2A52,#05122A)] p-0 text-white">
          <DialogHeader className="border-b border-[#7dd3fc]/20 px-5 pb-3 pt-5 text-left">
            <DialogTitle className="text-[#a5e4ff]">Gizlilik Politikası</DialogTitle>
            <p className="mt-1 text-[11px] font-normal text-white/55">Son güncelleme: 21 Ekim 2026</p>
          </DialogHeader>
          <div className="max-h-[68vh] overflow-y-auto overscroll-contain px-5 pb-8 pt-4">
            <PrivacyPolicyBody />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}