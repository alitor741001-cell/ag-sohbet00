import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AtSign, Loader2, MessageSquare, Mic2, MicOff, Settings, UserPlus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import subscribeEntity from '@/components/data/entitySubscriptions';
import { useToast } from '@/components/ui/use-toast';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { HIDDEN_AVATAR_URL } from '@/lib/hiddenUser';
import { formatDate } from '@/components/profile/genderPalette';
import { agencyApi } from '@/lib/agency';
import FollowButton from '@/components/profile/social/FollowButton';
import CrystalProfileCard from '@/components/profile/crystal/CrystalProfileCard';
import CrystalCircleButton from '@/components/profile/crystal/CrystalCircleButton';
import { crystalSkin } from '@/components/profile/crystal/crystalTheme';
import { AccountStatusMark, ACCOUNT_MARKS, ACCOUNT_STATES, getAccountState } from '@/components/friends/AccountStatusAvatar';
import { broadcasterState } from '@/lib/broadcaster';
import useBackDismiss from '@/hooks/useBackDismiss';

/**
 * Uygulamadaki tek profil kartı: sesli oda, film odası, sohbetler, arkadaşlar ve
 * yönetim ekranları aynı kristal kartı kullanır. Renkler kişinin cinsiyetine göre
 * değişir: kadın → pembe/altın, erkek → lacivert/altın.
 */
export default function FullUserProfile({
  open = true, userId, name, avatar, hidden = false, muted = false, self = false,
  hideSettings = false, onClose, onMessage, onMention, tiles = [], footer = [], info = [],
}) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useCurrentUser();
  const [profile, setProfile] = useState(null);
  const [relation, setRelation] = useState('');
  const [copied, setCopied] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);

  // Profil kartı birleşik geri yığınında: geri tuşu önce kartı kapatır.
  useBackDismiss(open, onClose);

  const isSelf = self || userId === user?.id;

  useEffect(() => {
    if (!open || !userId || hidden) { setProfile(null); setRelation(''); return; }
    let alive = true;
    setProfile(null);
    setRelation('');
    // Profil, açıkken tazelenebilsin diye fonksiyona alındı: ban anında görsel değişir.
    const load = () => base44.functions.invoke('user-profile', { user_id: userId })
      .then((response) => { if (alive) setProfile(response?.data || {}); })
      .catch((error) => { if (alive) setProfile(error?.response?.status === 404 ? { account_status: 'deleted' } : {}); });
    load();
    // Kart açıkken ban / ban kaldırma anında işler: kayıt değişince profil yeniden okunur.
    const off = subscribeEntity('User', (event) => { if ((event.data?.id || event.id) === userId) load(); });
    if (user?.id && userId !== user.id) {
      base44.entities.Friendship.filter({ members: userId }, '-created_date', 50)
        .then((rows) => {
          const found = (rows || []).find((row) => row.members.includes(user.id));
          if (alive) setRelation(found?.status === 'accepted' ? 'friend' : found?.status === 'pending' ? 'pending' : '');
        })
        .catch(() => {});
    }
    return () => { alive = false; off(); };
  }, [open, userId, hidden, user?.id]);

  // Profil açıldığında ziyaret kaydı düşülür: sahibi kimlerin baktığını görebilir.
  useEffect(() => {
    if (!open || !userId || hidden) return;
    if (!user?.id || userId === user.id) return;
    base44.functions.invoke('social-service', { action: 'visit', profile_id: userId }).catch(() => {});
  }, [open, userId, hidden, user?.id]);

  if (!open || !userId) return null;

  const tone = profile?.gender === 'erkek' ? 'blue' : 'pink';
  const skin = crystalSkin(tone);
  const loading = !hidden && !profile;
  // Engellenen hesapta bilgiler görünür kalır: yalnızca profil resmi ban görseline döner.
  // Silinen hesapta gösterilecek bilgi kalmadığı için kart durum ekranına geçer.
  const accountState = hidden ? null : getAccountState(profile);
  const banned = accountState?.status === 'banned';
  const shownName = hidden ? (name || 'Gizli Kullanıcı') : (profile?.username || profile?.full_name || name || 'Kullanıcı');
  const shownAvatar = hidden ? HIDDEN_AVATAR_URL : (profile?.avatar || avatar || '');
  const memberId = !hidden && profile?.member_id && profile.member_id !== '-' ? String(profile.member_id) : '';
  const badge = broadcasterState(profile);
  const showSocial = !isSelf && !hidden && !accountState;
  const genderSymbol = hidden ? '?' : (profile?.gender === 'erkek' ? '♂' : profile?.gender === 'kadın' ? '♀' : '·');
  // Ajans sahibi, kendi ajansında olmayan bir kullanıcıyı yayıncı olarak davet edebilir.
  // Yayıncı daveti yalnızca arkadaş olduğun kullanıcılara gönderilebilir.
  const canInvite = showSocial && relation === 'friend'
    && (user?.agency_role === 'owner' || user?.agency_role === 'assistant') && !!user?.agency_record_id
    && !!profile && profile.agency_record_id !== user?.agency_record_id;

  const inviteBroadcaster = async () => {
    try {
      await agencyApi('invite', { user_id: userId });
      setInviteSent(true);
      toast({ title: '🎤 Davet gönderildi', description: `${shownName} kişisine yayıncı daveti iletildi.` });
    } catch (error) {
      toast({ title: 'Davet gönderilemedi', description: error.response?.data?.error || error.message, variant: 'destructive' });
    }
  };

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(memberId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: 'Kimlik kopyalandı', description: `#${memberId}` });
    } catch {
      toast({ title: 'Kopyalanamadı', variant: 'destructive' });
    }
  };

  const addFriend = async () => {
    try {
      await base44.functions.invoke('friend-service', { action: 'request', user_id: userId });
      setRelation('pending');
      toast({ title: 'Arkadaşlık isteği gönderildi' });
    } catch (error) {
      toast({ title: 'İşlem başarısız', description: error.response?.data?.error || error.message, variant: 'destructive' });
    }
  };

  const header = (
    <header className="flex items-center justify-between">
      <button
        type="button"
        onClick={onClose}
        className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-bold text-white"
        style={{ borderColor: skin.edge, background: 'rgba(0,0,0,0.45)' }}
      >
        <ArrowLeft className="h-4 w-4" /> Geri
      </button>
      <div className="flex items-center gap-2">
        {muted && <MicOff className="h-4 w-4" style={{ color: skin.glow }} />}
        {isSelf && !hideSettings && (
          <button
            type="button"
            onClick={() => { onClose?.(); navigate('/profil?tab=settings'); }}
            aria-label="Profil ayarları"
            className="flex h-9 w-9 items-center justify-center rounded-full border text-white"
            style={{ borderColor: skin.edge, background: 'rgba(0,0,0,0.45)' }}
          >
            <Settings className="h-4 w-4" />
          </button>
        )}
      </div>
    </header>
  );

  // Yükleniyor ve hesap durumu ekranları kartın yerini alır.
  const statusContent = loading ? (
    <div className="flex flex-1 items-center justify-center py-24">
      <Loader2 className="h-6 w-6 animate-spin" style={{ color: skin.glow }} />
    </div>
  ) : accountState && !banned ? (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <AccountStatusMark status={accountState.status} />
      <h2 className="mt-4 text-lg font-black text-white">{accountState.name}</h2>
      <p className="mx-auto mt-2 max-w-[300px] text-xs leading-snug text-white/70">{accountState.message}</p>
    </div>
  ) : null;

  // Hediye düğmesi referanstaki dörtlü şeridin dördüncü gözünde durur.
  const giftItem = footer.find((item) => item.key === 'gift');
  const otherFooterItems = footer.filter((item) => item.key !== 'gift');

  // Referanstaki dikdörtgen düğme sırası: mik, koltuk kilidi, profili gör ve kalan oda işlemleri.
  const roomTiles = tiles.filter((item) => item.key !== 'chat');
  const orderedTiles = [
    ...roomTiles.filter((item) => item.key === 'mic'),
    ...roomTiles.filter((item) => item.key === 'lock'),
    ...roomTiles.filter((item) => item.key === 'view-self'),
    ...roomTiles.filter((item) => item.key !== 'mic' && item.key !== 'lock' && item.key !== 'view-self'),
  ];
  const rectItems = orderedTiles.slice(0, 3);
  const leftoverTiles = orderedTiles.slice(3);

  // Referanstaki yuvarlak düğme sırası: Bahset, Takip, Sohbet, Hediye.
  const circleNodes = [
    !isSelf && !!onMention ? (
      <CrystalCircleButton
        key="mention"
        icon={MessageSquare}
        label="Bahset"
        tone={tone}
        onClick={() => { onMention(shownName); onClose?.(); }}
      />
    ) : null,
    showSocial ? <FollowButton key="follow" variant="circle" userId={userId} tone={tone} /> : null,
    !isSelf ? (
      <CrystalCircleButton
        key="chat"
        icon={AtSign}
        label="Sohbet"
        tone={tone}
        onClick={() => { onMessage?.(userId); onClose?.(); }}
      />
    ) : null,
    giftItem ? (
      <CrystalCircleButton key="gift" icon={giftItem.icon} label="Hediye" tone={tone} onClick={giftItem.onClick} />
    ) : null,
    showSocial && relation !== 'friend' ? (
      <CrystalCircleButton
        key="friend"
        icon={UserPlus}
        label={relation === 'pending' ? 'İstek Gönderildi' : 'Arkadaş Ekle'}
        tone={tone}
        disabled={relation === 'pending'}
        onClick={addFriend}
      />
    ) : null,
    ...leftoverTiles.map((item) => (
      <CrystalCircleButton
        key={item.key}
        icon={item.icon}
        label={item.label}
        tone={tone}
        disabled={item.disabled}
        onClick={item.onClick}
      />
    )),
    ...otherFooterItems.map((item) => (
      <CrystalCircleButton
        key={item.key}
        icon={item.icon}
        label={item.label}
        tone={tone}
        danger={item.danger}
        onClick={item.onClick}
      />
    )),
    canInvite ? (
      <CrystalCircleButton
        key="invite"
        icon={Mic2}
        label={inviteSent ? 'Davet Gönderildi' : 'Yayıncı Davet'}
        tone={tone}
        disabled={inviteSent}
        onClick={inviteBroadcaster}
      />
    ) : null,
  ].filter(Boolean);

  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center sm:items-center">
      <button type="button" aria-label="Kapat" onClick={onClose} className="absolute inset-0 w-full bg-black/65" />
      <div
        className="animate-sheet-up relative flex w-full max-w-[400px] flex-col overflow-hidden rounded-t-[26px] border-t-2 px-3 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_30px_rgba(0,0,0,0.75)] sm:mb-6 sm:rounded-[26px] sm:border-2"
        style={{
          background: skin.bg,
          borderColor: skin.edge,
          maxHeight: 'calc(var(--app-height, 100dvh) - 4px)',
          boxShadow: `0 -8px 30px rgba(0,0,0,0.75), inset 0 0 40px -20px ${skin.glow}`,
        }}
      >
        {header}
        {statusContent || (
          <CrystalProfileCard
            name={shownName}
            avatar={banned ? ACCOUNT_STATES.banned.image : shownAvatar}
            tone={tone}
            vipLevel={profile?.vip_level || 0}
            genderSymbol={genderSymbol}
            statusLabel={banned ? ACCOUNT_MARKS.banned : ''}
            roleLabel={hidden ? '' : (profile?.title || profile?.display_role || '')}
            receivedLevel={profile?.gift_received_level || 0}
            nLevel={profile?.n_level || 0}
            joinDate={formatDate(profile?.created_date)}
            memberId={memberId}
            copied={copied}
            onCopyId={copyId}
            country={hidden ? '' : badge.country}
            flag={badge.flag}
            rectItems={rectItems}
            circleNodes={circleNodes}
            infoRows={info}
            hidden={hidden}
          />
        )}
      </div>
    </div>
  );
}