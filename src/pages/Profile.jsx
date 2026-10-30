import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import PullToRefresh from '@/components/home/PullToRefresh';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/ui/use-toast';
import { findProtectedName } from '@/lib/protectedNames';
import { vipLevelOf } from '@/lib/userLevels';
import '@/components/profile/fireice/fireIce.css';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import useActiveRooms from '@/hooks/useActiveRooms';
import { findLiveRoom } from '@/lib/liveRoom';
import FireIceHeader from '@/components/profile/fireice/FireIceHeader';
import FireIceQuickBar from '@/components/profile/fireice/FireIceQuickBar';
import FireIceWalletPanel from '@/components/profile/fireice/FireIceWalletPanel';
import FireIceGrid from '@/components/profile/fireice/FireIceGrid';
import FireIceFooter from '@/components/profile/fireice/FireIceFooter';
import { giftBoxLocked } from '@/lib/giftAccess';
import ProfileDetailsSection from '@/components/profile/ProfileDetailsSection';
import ProfileSettings from '@/components/profile/ProfileSettings';
import PrivacyPolicyBody from '@/components/profile/PrivacyPolicyBody';
import BlockedUsers from '@/components/profile/BlockedUsers';

import DeleteAccountSection from '@/components/profile/DeleteAccountSection';
import GiftBoxPanel from '@/components/profile/GiftBoxPanel';
import CoinPurchasePanel from '@/components/voice/CoinPurchasePanel';
import CoinActivityPanel from '@/components/profile/CoinActivityPanel';
import VipBagPanel from '@/components/profile/VipBagPanel';
import StorePanel from '@/components/store/StorePanel';
import useWalletCoinsLive from '@/hooks/useWalletCoinsLive';
import useGiftSummaryLive from '@/hooks/useGiftSummaryLive';

const EMPTY_FORM = { username: '', full_name: '', phone: '', avatar: '', birth_date: '' };

const SHEET = 'max-h-[88vh] max-w-2xl gap-0 border-[#2ee6ff]/30 bg-[linear-gradient(180deg,#081426,#04070f)] p-0 text-white';

/** Profil sayfası: ateş-buz çerçeveli kimlik, cüzdan ve kısayollar. */
export default function Profile() {
  const { user, reload, setUser } = useCurrentUser();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  // Bölümler kapalı başlar; yalnızca kullanıcı dokununca açılır (ayar bağlantısı hariç).
  const [openKey, setOpenKey] = useState(() => (new URLSearchParams(window.location.search).get('tab') === 'settings' ? 'settings' : null));
  const [wallet, setWallet] = useState(null);
  const [vipCount, setVipCount] = useState(0);
  const [giftBoxOpen, setGiftBoxOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [blockedOpen, setBlockedOpen] = useState(false);

  const [activityOpen, setActivityOpen] = useState(false);
  const [vipBagOpen, setVipBagOpen] = useState(false);
  const [storeOpen, setStoreOpen] = useState(false);
  const [coinShopOpen, setCoinShopOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  // /profil?tab=settings bağlantısı Eklentiler bölümünü açar ve oraya kaydırır.
  useEffect(() => {
    if (new URLSearchParams(location.search).get('tab') !== 'settings') return;
    setOpenKey('settings');
    const frame = requestAnimationFrame(() => requestAnimationFrame(() => document.getElementById('eklentiler')?.scrollIntoView({ behavior: 'smooth', block: 'start' })));
    return () => cancelAnimationFrame(frame);
  }, [location.search]);

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

  useEffect(() => {
    // Ayna hızlı açılış sağlar; bakiye hemen canlı değerle doğrulanır.
    loadSummary();
    loadWallet();
  }, []);

  // Cüzdan canlıdır: oyun kazancı, hesaba gelen coin ve hediye harcaması bakiyeye
  // anında işler — kart 5 saniyelik yenilemeyi beklemez.
  useWalletCoinsLive(user?.id, (coins) => setWallet((prev) => ({ ...prev, coins })));
  useGiftSummaryLive(user?.id, loadWallet);

  // Kişi şu anda bir odada yayındaysa profil şeridi "Yayında" ve "Yayına Katıl" gösterir.
  const { rooms, getRoomId } = useActiveRooms(true);
  const liveRoom = user ? findLiveRoom(rooms, user.id, getRoomId(user.id)) : null;
  const viewers = liveRoom
    ? [...(liveRoom.room.participants || []), ...(liveRoom.room.seats || [])].filter((person) => person?.user_id).length
    : 0;

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

  const save = async () => {
    if (saving || uploading) return;
    const blocked = findProtectedName(form.username);
    if (blocked) return toast({ title: 'Kullanıcı adı reddedildi', description: `'${blocked}' gibi yetki/rol kelimeleri kullanıcı adında kullanılamaz. Lütfen başka bir ad seçin.`, variant: 'destructive' });
    setSaving(true);
    try {
      const { data } = await base44.functions.invoke('update-profile', { username: form.username, phone: form.phone, avatar: form.avatar, birth_date: form.birth_date });
      if (!data?.ok || data.profile?.id !== user.id) throw new Error(data?.error || 'Kayıt doğrulanamadı. Lütfen tekrar deneyin.');
      setUser((current) => ({ ...current, ...data.profile }));
      setEditing(false);
      toast({ title: 'Profil güncellendi' });
    } catch (error) {
      toast({ title: 'Profil güncellenemedi', description: error.response?.data?.error || error.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

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
  const isAdmin = user.role === 'admin';
  const elmasLocked = giftBoxLocked(user);
  const resetForm = () => setForm({ username: user.username || '', full_name: user.full_name || '', phone: user.phone || '', avatar: user.avatar || '', birth_date: user.birth_date || '' });
  const toggle = (key) => setOpenKey((current) => (current === key ? null : key));
  const openGrid = (key) => {
    if (key === 'shop') setCoinShopOpen(true);
    else if (key === 'store') setStoreOpen(true);
    else if (key === 'bag') setVipBagOpen(true);
    else if (key === 'level') navigate('/seviye');
    else if (key === 'vip') navigate('/vip');
    else if (key === 'agency') navigate('/ajans');
    else if (key === 'friends') navigate('/arkadaslar');
    else if (key === 'notifications') navigate('/bildirimler');
  };

  return (
    <div className="dark relative min-h-screen pb-28 text-white">
      <div className="fi-backdrop" aria-hidden="true" />

      <div className="relative z-10 mx-auto w-full max-w-[560px] px-3 pt-3">
        <PullToRefresh onRefresh={() => { reload?.(); loadWallet(); loadVipCount(); }}>
          <div className="space-y-2.5">
            <FireIceHeader
              user={user}
              avatar={form.avatar}
              uploading={uploading}
              onAvatar={onAvatar}
              vipLevel={vipLevelOf(user)}
              liveRoom={liveRoom}
              viewers={viewers}
              isAdmin={isAdmin}
              onEdit={() => toggle('info')}
              onSettings={() => toggle('settings')}
              onAdmin={() => navigate('/admin')}
              onLogout={() => base44.auth.logout('/login')}
            />

            <FireIceQuickBar
              onInfo={() => toggle('info')}
              onSettings={() => toggle('settings')}
              onActivity={() => setActivityOpen(true)}
            />

            <FireIceWalletPanel
              coins={wallet?.coins ?? null}
              diamonds={elmasLocked ? null : (wallet?.month_score ?? null)}
              vipLevel={vipLevelOf(user)}
              liveRoom={liveRoom}
              viewers={viewers}
              onCoins={() => setCoinShopOpen(true)}
              onDiamonds={openGiftBox}
              onJoin={() => liveRoom && navigate(liveRoom.link)}
            />

            <FireIceGrid vipCount={vipCount} onSelect={openGrid} />

            {openKey === 'info' && (
              <ProfileDetailsSection
                user={user}
                editing={editing}
                form={form}
                setForm={setForm}
                saving={saving}
                onSave={save}
                onEdit={() => { resetForm(); setEditing(true); }}
                onCancel={() => { resetForm(); setEditing(false); }}
              />
            )}

            {openKey === 'settings' && (
              <div id="eklentiler" className="scroll-mt-24 space-y-3">
                <ProfileSettings user={user} onUpdated={reload} />
                {/* Hesabı Sil: Eklentiler bölümünün en altında durur. */}
                <DeleteAccountSection />
              </div>
            )}

            <FireIceFooter
              onBlocked={() => setBlockedOpen(true)}
              onPrivacy={() => setPrivacyOpen(true)}
              onSettings={() => toggle('settings')}
            />
          </div>
        </PullToRefresh>
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

      <Dialog open={blockedOpen} onOpenChange={(value) => !value && setBlockedOpen(false)}>
        <DialogContent className={SHEET}>
          <DialogHeader className="border-b border-[#2ee6ff]/20 px-5 pb-3 pt-5 text-left">
            <DialogTitle className="text-[#d6f7ff]">Engellenen Hesaplar</DialogTitle>
          </DialogHeader>
          <div className="max-h-[68vh] overflow-y-auto overscroll-contain px-4 pb-6 pt-4">
            <BlockedUsers />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={privacyOpen} onOpenChange={(value) => !value && setPrivacyOpen(false)}>
        <DialogContent className={SHEET}>
          <DialogHeader className="border-b border-[#2ee6ff]/20 px-5 pb-3 pt-5 text-left">
            <DialogTitle className="text-[#d6f7ff]">Gizlilik Politikası</DialogTitle>
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