import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Puzzle, Shield, User } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/ui/use-toast';
import { findProtectedName } from '@/lib/protectedNames';
import { faceStatus } from '@/lib/faceCheck';
import ProfileTopBar from '@/components/profile/ProfileTopBar';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileWalletCards from '@/components/profile/ProfileWalletCards';
import { giftBoxLocked } from '@/lib/giftAccess';
import ProfileNeonRow from '@/components/profile/ProfileNeonRow';
import ProfileDetailsSection from '@/components/profile/ProfileDetailsSection';
import ProfileSettings from '@/components/profile/ProfileSettings';
import FaceLockOverlay from '@/components/face/FaceLockOverlay';
import DeleteAccountSection from '@/components/profile/DeleteAccountSection';
import GiftBoxPanel from '@/components/profile/GiftBoxPanel';
import CoinPurchasePanel from '@/components/voice/CoinPurchasePanel';
import CoinActivityPanel from '@/components/profile/CoinActivityPanel';
import VipBagPanel from '@/components/profile/VipBagPanel';
import useWalletCoinsLive from '@/hooks/useWalletCoinsLive';

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
  // Elmaslar/bakiye bölümü yüz doğrulamasıyla korunur.
  const [balanceLocked, setBalanceLocked] = useState(false);
  const [balanceEnroll, setBalanceEnroll] = useState(false);
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
        setWallet(response.data);
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
  useWalletCoinsLive(user?.id, (coins) => setWallet((prev) => (prev ? { ...prev, coins } : prev)));

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
    const status = await faceStatus(user?.id).catch(() => null);
    // Daha önce yüzü doğrulanan cihazda tekrar sorulmaz.
    if (!status || !status.enabled || status.balance || status.trusted) { setGiftBoxOpen(true); return; }
    setBalanceEnroll(!status.enrolled);
    setBalanceLocked(true);
  };

  if (!user) return <div className="dark min-h-screen p-6 text-white">Yükleniyor...</div>;
  const isAdmin = user.role === 'admin';
  const elmasLocked = giftBoxLocked(user);
  const resetForm = () => setForm({ username: user.username || '', full_name: user.full_name || '', phone: user.phone || '', avatar: user.avatar || '', birth_date: user.birth_date || '' });
  const toggle = (key) => setOpenKey((current) => (current === key ? null : key));
  // Paket/abonelik sistemi kaldırıldı: üyelik süresi artık erişimi etkilemez.

  return (
    <div className="dark min-h-screen pb-6 text-white">
      <ProfileTopBar />
      <div className="mx-auto w-full max-w-2xl">
        <ProfileHeader user={user} avatar={form.avatar} onAvatar={onAvatar} onUpdated={reload} uploading={uploading} />

        <div className="space-y-2 px-4 pt-3">
          <ProfileWalletCards
            coins={wallet?.coins ?? null}
            giftScore={wallet?.month_score ?? null}
            vipCount={vipCount}
            locked={elmasLocked}
            onOpenCoins={() => setActivityOpen(true)}
            onOpenGiftBox={openGiftBox}
            onOpenVipBag={() => setVipBagOpen(true)}
            onOpenCoinShop={() => setCoinShopOpen(true)}
            onOpenAgency={isAdmin ? undefined : () => navigate('/ajans')}
          />

          {isAdmin && (
            <ProfileNeonRow icon={Shield} tone="purple" title="Yönetim Paneli" subtitle="Admin kontrol paneli" onClick={() => navigate('/admin')} />
          )}

          <ProfileNeonRow icon={User} title="Kişisel Bilgiler" subtitle="Kullanıcı adı, kimlik no ve hesap bilgileri" open={openKey === 'info'} onClick={() => toggle('info')} />
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

          <ProfileNeonRow icon={Puzzle} tone="gold" title="Eklentiler" subtitle="Ek özellikleri buradan yönetebilirsiniz." open={openKey === 'settings'} onClick={() => toggle('settings')} />
          {openKey === 'settings' && (
            <div id="eklentiler" className="scroll-mt-24 pt-1">
              <ProfileSettings user={user} onUpdated={reload} />
            </div>
          )}

          <ProfileNeonRow icon={LogOut} tone="red" title="Çıkış Yap" subtitle="Hesabınızdan güvenli çıkış yapın" onClick={() => base44.auth.logout('/login')} />
          <DeleteAccountSection />
        </div>
      </div>

      <FaceLockOverlay
        open={balanceLocked}
        user={user}
        mode={balanceEnroll ? 'enroll' : 'verify'}
        scope="balance"
        canCancel
        onCancel={() => setBalanceLocked(false)}
        onVerified={() => { setBalanceLocked(false); setGiftBoxOpen(true); }}
      />
      {/* Kutu kapanınca bakiye canlı değerden tazelenir: kart eski tutarı göstermez. */}
      <GiftBoxPanel open={giftBoxOpen} onClose={() => { setGiftBoxOpen(false); loadWallet(); }} />
      <CoinActivityPanel open={activityOpen} onClose={() => setActivityOpen(false)} />
      <VipBagPanel open={vipBagOpen} onClose={() => setVipBagOpen(false)} onChanged={loadVipCount} />
      <CoinPurchasePanel
        open={coinShopOpen}
        coins={wallet?.coins ?? null}
        onBack={() => { setCoinShopOpen(false); loadWallet(); }}
      />
    </div>
  );
}