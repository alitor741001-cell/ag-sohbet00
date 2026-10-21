import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/ui/use-toast';
import { findProtectedName } from '@/lib/protectedNames';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import useFriends from '@/hooks/useFriends';
import SocialListDialog from '@/components/profile/social/SocialListDialog';
import ProfileHeroCard from '@/components/profile/fantasy/ProfileHeroCard';
import ProfileStatBar from '@/components/profile/fantasy/ProfileStatBar';
import ProfileTwinCards from '@/components/profile/fantasy/ProfileTwinCards';
import ProfileIconGrid from '@/components/profile/fantasy/ProfileIconGrid';
import ProfileMenuCard from '@/components/profile/fantasy/ProfileMenuCard';
import { giftBoxLocked } from '@/lib/giftAccess';
import ProfileDetailsSection from '@/components/profile/ProfileDetailsSection';
import ProfileSettings from '@/components/profile/ProfileSettings';

import DeleteAccountSection from '@/components/profile/DeleteAccountSection';
import GiftBoxPanel from '@/components/profile/GiftBoxPanel';
import CoinPurchasePanel from '@/components/voice/CoinPurchasePanel';
import CoinActivityPanel from '@/components/profile/CoinActivityPanel';
import VipBagPanel from '@/components/profile/VipBagPanel';
import useWalletCoinsLive from '@/hooks/useWalletCoinsLive';
import useGiftSummaryLive from '@/hooks/useGiftSummaryLive';

const EMPTY_FORM = { username: '', full_name: '', phone: '', avatar: '', birth_date: '' };

/** Profil sayfası: cüzdan, kişisel bilgiler, eklentiler (ayarlar) ve hesap işlemleri. */
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
  // Takip ve ziyaretçi sayaçları ile açılan liste: takip edilenler, takipçiler, ziyaretçiler.
  const [social, setSocial] = useState({ following: 0, followers: 0, visitors: 0 });
  const [socialList, setSocialList] = useState(null);

  const [activityOpen, setActivityOpen] = useState(false);
  const [vipBagOpen, setVipBagOpen] = useState(false);
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

  // Arkadaş sayısı ortak arkadaşlık deposundan gelir; diğer sayaçlar için ayrı özellik yok.
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
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) return toast({ title: 'PNG, JPG veya WebP seçin', variant: 'destructive' });
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
  // Paket/abonelik sistemi kaldırıldı: üyelik süresi artık erişimi etkilemez.

  return (
    <div
      className="dark min-h-screen pb-6 text-white"
      style={{ background: 'radial-gradient(140% 80% at 50% 0%, #0E2A5A 0%, #071731 46%, #03081A 100%)' }}
    >
      <div className="mx-auto w-full max-w-2xl md:max-w-3xl xl:max-w-4xl">
        <ProfileHeroCard
          user={user}
          avatar={form.avatar}
          onAvatar={onAvatar}
          uploading={uploading}
          onEdit={() => toggle('info')}
          gems={elmasLocked ? null : (wallet?.month_score ?? null)}
          vipLevel={Number(user.vip_level) || 0}
          onOpenGems={openGiftBox}
        />

        <div className="space-y-3 px-4 pt-4">
          <ProfileStatBar
            friends={friendCount}
            following={social.following}
            followers={social.followers}
            visitors={social.visitors}
            onSelect={(key) => (key === 'friends' ? navigate('/arkadaslar?view=friends') : setSocialList(key))}
          />
          <ProfileTwinCards
            vipCount={vipCount}
            coins={wallet?.coins ?? null}
            onVip={() => navigate('/vip')}
            onWallet={() => setActivityOpen(true)}
          />
          <ProfileIconGrid
            vipCount={vipCount}
            onSelect={(key) => {
              if (key === 'shop') setCoinShopOpen(true);
              else if (key === 'bag') setVipBagOpen(true);
              else if (key === 'level') navigate('/seviye');
              else if (key === 'agency') navigate('/ajans');
            }}
          />

          <ProfileMenuCard
            isAdmin={isAdmin}
            onInfo={() => toggle('info')}
            onSettings={() => toggle('settings')}
            onLogout={() => base44.auth.logout('/login')}
            onAdmin={() => navigate('/admin')}
          >
            <DeleteAccountSection />
          </ProfileMenuCard>

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
            <div id="eklentiler" className="scroll-mt-24">
              <ProfileSettings user={user} onUpdated={reload} />
            </div>
          )}

          <button type="button" onClick={() => setPrivacyOpen(true)} className="mx-auto block py-3 text-[11px] font-semibold underline" style={{ color: 'rgba(165,228,255,0.7)' }}>
            Gizlilik Politikası
          </button>
        </div>
      </div>

      {/* Kutu kapanınca bakiye canlı değerden tazelenir: kart eski tutarı göstermez. */}
      <GiftBoxPanel open={giftBoxOpen} onClose={() => { setGiftBoxOpen(false); loadWallet(); }} />
      <CoinActivityPanel open={activityOpen} onClose={() => setActivityOpen(false)} />
      <VipBagPanel open={vipBagOpen} onClose={() => setVipBagOpen(false)} onChanged={loadVipCount} />
      <CoinPurchasePanel
        open={coinShopOpen}
        coins={wallet?.coins ?? null}
        onBack={() => { setCoinShopOpen(false); loadWallet(); }}
      />

      <SocialListDialog open={!!socialList} kind={socialList} onClose={() => { setSocialList(null); loadSocial(); }} />

      <Dialog open={privacyOpen} onOpenChange={(value) => !value && setPrivacyOpen(false)}>
        <DialogContent className="max-w-lg border-[#7dd3fc]/30 bg-[linear-gradient(180deg,#0B2A52,#05122A)] text-white">
          <DialogHeader>
            <DialogTitle className="text-[#a5e4ff]">Gizlilik Politikası</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm leading-6 text-white/80">
            <p>Profil bilgileriniz, sohbetleriniz ve cüzdan hareketleriniz yalnızca uygulama içindeki özelliklerin çalışması için saklanır.</p>
            <p>Profil fotoğrafınız ve kapak görselleriniz diğer üyeler tarafından görülebilir; telefon numaranız ve e-posta adresiniz profilinizde gösterilmez.</p>
            <p>Engellediğiniz hesaplar sizi göremez ve size mesaj gönderemez. Hesabınızı profildeki “Hesabı Sil” bölümünden kalıcı olarak silebilirsiniz.</p>
            <p>Gizlilikle ilgili talepleriniz için Destek bölümünden bize yazabilirsiniz.</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}