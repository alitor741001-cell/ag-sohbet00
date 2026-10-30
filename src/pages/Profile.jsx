import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, LogOut, Shield, User } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PullToRefresh from '@/components/home/PullToRefresh';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/ui/use-toast';
import { findProtectedName } from '@/lib/protectedNames';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import useFriends from '@/hooks/useFriends';
import SocialListDialog from '@/components/profile/social/SocialListDialog';
import NeonHero from '@/components/profile/neon/NeonHero';
import NeonAgencyBar from '@/components/profile/neon/NeonAgencyBar';
import NeonStats from '@/components/profile/neon/NeonStats';
import NeonWalletCards from '@/components/profile/neon/NeonWalletCards';
import NeonIconGrid from '@/components/profile/neon/NeonIconGrid';
import NeonFooterMenu from '@/components/profile/neon/NeonFooterMenu';
import NeonPanel from '@/components/profile/neon/NeonPanel';
import '@/components/profile/neon/neonProfile.css';
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
const PROFILE_BG = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/b553a4428_generated_image.png';

/** Profil sayfası: alev çerçeveli tek ekran — kimlik, ajans, istatistik, cüzdan ve menü. */
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
  // Takip ve ziyaretçi sayaçları ile açılan liste: takip edilenler, takipçiler, ziyaretçiler.
  const [social, setSocial] = useState({ following: 0, followers: 0, visitors: 0 });
  const [socialList, setSocialList] = useState(null);

  const [activityOpen, setActivityOpen] = useState(false);
  const [vipBagOpen, setVipBagOpen] = useState(false);
  const [storeOpen, setStoreOpen] = useState(false);
  const [coinShopOpen, setCoinShopOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  // /profil?tab=settings bağlantısı ayarlar bölümünü açar ve oraya kaydırır.
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
    loadVipCount();
  }, []);

  // Cüzdan canlıdır: oyun kazancı, hesaba gelen coin ve hediye harcaması bakiyeye
  // anında işler — kart 5 saniyelik yenilemeyi beklemez.
  useWalletCoinsLive(user?.id, (coins) => setWallet((prev) => ({ ...prev, coins })));
  useGiftSummaryLive(user?.id, loadWallet);

  // Arkadaş sayısı ortak arkadaşlık deposundan gelir.
  const { relations } = useFriends();
  const friendCount = relations.filter((relation) => relation.status === 'accepted').length;

  // Sayfa kendini 5 saniyede bir sessizce tazeler: bakiye canlı değerden okunur.
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

  return (
    <div className="profile-neon-shell dark min-h-screen pb-6 text-white" style={{ '--profile-bg': `url(${PROFILE_BG})` }}>
      <div className="mx-auto w-full max-w-2xl md:max-w-3xl xl:max-w-4xl">
        <PullToRefresh onRefresh={() => { reload?.(); loadWallet(); loadSocial(); loadVipCount(); }}>
          <div className="space-y-2.5 px-3 pt-4">
            <NeonHero user={user} avatar={form.avatar} onAvatar={onAvatar} uploading={uploading} />
            <NeonAgencyBar user={user} />
            <NeonStats
              friends={friendCount}
              following={social.following}
              followers={social.followers}
              visitors={social.visitors}
              onSelect={(key) => {
                if (key === 'friends') navigate('/arkadaslar?view=friends');
                else setSocialList(key);
              }}
            />
            <NeonWalletCards
              coins={wallet?.coins ?? null}
              score={wallet?.received_score ?? null}
              diamonds={elmasLocked ? null : (wallet?.month_score ?? null)}
              diamondScore={elmasLocked ? null : (wallet?.month_k ?? null)}
              vipCount={vipCount}
              onCoins={() => setCoinShopOpen(true)}
              onDiamonds={openGiftBox}
              onVip={() => navigate('/vip')}
              onHistory={() => setActivityOpen(true)}
            />
            <NeonIconGrid
              vipCount={vipCount}
              onSelect={(key) => {
                if (key === 'shop') setStoreOpen(true);
                else if (key === 'bag') setVipBagOpen(true);
                else if (key === 'level') navigate('/seviye');
                else if (key === 'agency') navigate('/ajans');
                else setCoinShopOpen(true);
              }}
            />
            <NeonFooterMenu
              onSelect={(key) => {
                if (key === 'blocked') setBlockedOpen(true);
                else if (key === 'privacy') setPrivacyOpen(true);
                else toggle('settings');
              }}
            />

            {openKey === 'settings' && (
              <div id="eklentiler" className="scroll-mt-24 space-y-2.5">
                <NeonPanel innerClassName="overflow-hidden">
                  {[
                    { key: 'info', label: 'Kişisel Bilgiler', icon: User, run: () => toggle('info') },
                    ...(isAdmin ? [{ key: 'admin', label: 'Yönetim Paneli', icon: Shield, run: () => navigate('/admin') }] : []),
                    { key: 'logout', label: 'Çıkış Yap', icon: LogOut, run: () => base44.auth.logout('/login') },
                  ].map((row, index) => (
                    <button
                      key={row.key}
                      type="button"
                      onClick={row.run}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left active:bg-white/5 ${index > 0 ? 'border-t border-white/10' : ''}`}
                    >
                      <row.icon className="h-4 w-4 shrink-0 text-[#9fd8ff]" aria-hidden="true" />
                      <span className="flex-1 text-[13px] font-bold text-white">{row.label}</span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-white/40" aria-hidden="true" />
                    </button>
                  ))}
                </NeonPanel>

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

                <ProfileSettings user={user} onUpdated={reload} />
                {/* Hesabı Sil: ayarlar bölümünün en altında durur. */}
                <DeleteAccountSection />
              </div>
            )}
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

      <SocialListDialog open={!!socialList} kind={socialList} onClose={() => { setSocialList(null); loadSocial(); }} />

      <Dialog open={blockedOpen} onOpenChange={(value) => !value && setBlockedOpen(false)}>
        <DialogContent className="max-h-[88vh] max-w-2xl gap-0 border-[#7dd3fc]/30 bg-[linear-gradient(180deg,#0B2A52,#05122A)] p-0 text-white">
          <DialogHeader className="border-b border-[#7dd3fc]/20 px-5 pb-3 pt-5 text-left">
            <DialogTitle className="text-[#a5e4ff]">Engellenen Hesaplar</DialogTitle>
          </DialogHeader>
          <div className="max-h-[68vh] overflow-y-auto overscroll-contain px-5 pb-8 pt-4">
            <BlockedUsers />
          </div>
        </DialogContent>
      </Dialog>

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