import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Loader2, MessageSquare, Mic2, MicOff, Settings } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import subscribeEntity from '@/components/data/entitySubscriptions';
import { useToast } from '@/components/ui/use-toast';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { HIDDEN_AVATAR_URL } from '@/lib/hiddenUser';
import { ROOM_BLUE, ageFromBirthDate, formatDate, genderPalette } from '@/components/profile/genderPalette';
import { agencyApi } from '@/lib/agency';
import FantasyProfileShell from '@/components/profile/FantasyProfileShell';
import ProfileStatsRow from '@/components/profile/ProfileStatsRow';
import ProfileIdentityBlock from '@/components/profile/ProfileIdentityBlock';
import ProfileSocialRow from '@/components/profile/social/ProfileSocialRow';
import { AccountStatusMark, ACCOUNT_STATES, getAccountState } from '@/components/friends/AccountStatusAvatar';
import { broadcasterState, isNewMember } from '@/lib/broadcaster';
import { useRoomProfileActions } from '@/lib/roomProfileActions';
import useBackDismiss from '@/hooks/useBackDismiss';
import useRoomLevels from '@/hooks/useRoomLevels';
import VoiceFantasyCard from '@/components/profile/VoiceFantasyCard';
import ProfileAgencyBadges from '@/components/profile/ProfileAgencyBadges';
import ProfileModeration from '@/components/profile/ProfileModeration';
import useProfileFriendship from '@/hooks/useProfileFriendship';

/**
 * Uygulamadaki tek profil kartı: kadın kartı pembe/altın, erkek kartı mavi/altın tonundadır.
 * Üstte fotoğraf ve isim, altında seviye rozetleri, kimlik bilgileri, oda işlemleri
 * (mikrofon, koltuk kilidi), hediye/bahset barları ve sosyal düğmeler yer alır.
 */
export default function FullUserProfile({
  open = true, userId, name, avatar, hidden = false, muted = false, self = false,
  theme = '', hideSettings = false, onClose, onMessage, onMention, tiles = [], footer = [], info = [], roomActions = null,
}) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useCurrentUser();
  const roomContext = useRoomProfileActions();
  const room = roomActions || roomContext;
  const [profile, setProfile] = useState(null);
  const { friendship } = useProfileFriendship(open && !hidden ? userId : null);
  const relation = friendship?.status === 'accepted' ? 'friend' : friendship?.status === 'pending' ? 'pending' : '';
  const [copied, setCopied] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);
  const roomLevels = useRoomLevels([userId]);

  // Profil kartı birleşik geri yığınında: geri tuşu önce kartı kapatır.
  useBackDismiss(open, onClose);

  const isSelf = self || userId === user?.id;

  useEffect(() => {
    if (!open || !userId || hidden) { setProfile(null); return; }
    let alive = true;
    setProfile(null);
    // Profil, açıkken tazelenebilsin diye fonksiyona alındı: ban anında görsel değişir.
    const load = () => base44.functions.invoke('user-profile', { user_id: userId })
      .then((response) => { if (alive) setProfile(response?.data || {}); })
      .catch((error) => { if (alive) setProfile(error?.response?.status === 404 ? { account_status: 'deleted' } : {}); });
    load();
    // Kart açıkken ban / ban kaldırma anında işler: kayıt değişince profil yeniden okunur.
    const off = subscribeEntity('User', (event) => { if ((event.data?.id || event.id) === userId) load(); });
    const offVip = subscribeEntity('VipAppearance', (event) => { if (event.data?.owner_id === userId) load(); });
    // Takılan/çıkarılan kozmetik aynı sekmede anında yansır.
    window.addEventListener('vip-cosmetics-changed', load);
    return () => { alive = false; off(); offVip(); window.removeEventListener('vip-cosmetics-changed', load); };
  }, [open, userId, hidden, user?.id]);

  // Profil açıldığında ziyaret kaydı düşülür: sahibi kimlerin baktığını görebilir.
  useEffect(() => {
    if (!open || !userId || hidden) return;
    if (!user?.id || userId === user.id) return;
    base44.functions.invoke('social-service', { action: 'visit', profile_id: userId }).catch(() => {});
  }, [open, userId, hidden, user?.id]);

  useEffect(() => {
    const expiry = Date.parse(profile?.vip_expires_at || '');
    if (!open || !Number.isFinite(expiry) || expiry <= Date.now()) return;
    let timer;
    const checkExpiry = () => {
      const remaining = expiry - Date.now();
      if (remaining <= 0) setProfile((current) => current ? { ...current, vip_level: 0, vip_look: {} } : current);
      else timer = setTimeout(checkExpiry, Math.min(remaining + 50, 2147483647));
    };
    checkExpiry();
    return () => clearTimeout(timer);
  }, [open, profile?.vip_expires_at]);

  if (!open || !userId) return null;

  // Renkler kişinin cinsiyetine göre: kadın → pembe/altın, erkek → mavi/altın, gizli → maskeli altın.
  const palette = theme === 'blue' && !hidden && profile?.gender !== 'kadın'
    ? ROOM_BLUE
    : genderPalette(profile?.gender, hidden);
  const loading = !hidden && !profile;
  // Engellenen hesapta bilgiler görünür kalır: yalnızca profil resmi ban görseline döner.
  const accountState = hidden ? null : getAccountState(profile);
  const banned = accountState?.status === 'banned';
  const shownName = hidden ? (name || 'Gizli Kullanıcı') : (profile?.username || profile?.full_name || name || 'Kullanıcı');
  const shownAvatar = hidden ? HIDDEN_AVATAR_URL : (profile?.avatar || avatar || '');
  const memberId = !hidden && profile?.member_id && profile.member_id !== '-' ? String(profile.member_id) : '';
  const badge = broadcasterState(profile);
  // "Yayıncım": profildeki kişi benim ajansıma bağlıysa. Sahip olunan ajans, üyelikten önce gelir.
  const showSocial = !isSelf && !hidden && !accountState;
  const age = hidden ? null : ageFromBirthDate(profile?.birth_date);
  const genderLabel = profile?.gender === 'erkek' ? 'Erkek' : profile?.gender === 'kadın' ? 'Kadın' : 'Belirtilmedi';
  const roleLabel = hidden
    ? ''
    : (profile?.custom_role?.name || profile?.title || profile?.display_role
      || (profile?.role === 'admin' ? 'ADMIN' : (badge.active && isNewMember(profile) ? 'YENİ YAYINCI' : '')));
  const ownerAgency = profile?.owned_agency_id
    ? { name: profile.owned_agency_name, code: profile.owned_agency_code }
    : null;
  // Ajans sahibi, kendi ajansında olmayan bir kullanıcıyı yayıncı olarak davet edebilir.
  const canInvite = showSocial && relation === 'friend'
    && (user?.agency_role === 'owner' || user?.agency_role === 'assistant') && !!user?.agency_record_id
    && !!profile && profile.agency_record_id !== user?.agency_record_id;

  // Yönetici başkasının kartını açtığında hediye düğmesi "AG Yetkilisi" düğmesinin yanına geçer.
  const adminGiftRow = !hidden && !isSelf && user?.role === 'admin' && !!room?.gift;

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

  const openChat = () => {
    if (isSelf) return;
    if (room?.message) { room.message(userId); onClose?.(); return; }
    onMessage?.(userId);
    onClose?.();
  };

  const header = (
    <header className="flex items-center justify-between">

      <div className="flex items-center gap-2">
        {muted && <MicOff className="h-4 w-4" style={{ color: palette.accent }} />}
        {isSelf && !hideSettings && (
          <button
            type="button"
            onClick={() => { onClose?.(); navigate('/profil?tab=settings'); }}
            aria-label="Profil ayarları"
            className="flex h-7 w-7 items-center justify-center rounded-full border text-white"
            style={{ borderColor: palette.soft, background: 'rgba(0,0,0,0.45)' }}
          >
            <Settings className="h-4 w-4" />
          </button>
        )}
      </div>
    </header>
  );

  // Yükleniyor ve hesap durumu ekranları kartın yerini alır.
  const statusContent = loading ? (
    <div className="flex flex-1 items-center justify-center py-12">
      <Loader2 className="h-6 w-6 animate-spin" style={{ color: palette.accent }} />
    </div>
  ) : accountState && !banned ? (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <AccountStatusMark status={accountState.status} />
      <h2 className="mt-4 text-lg font-black text-white">{accountState.name}</h2>
      <p className="mx-auto mt-2 max-w-[300px] text-xs leading-snug text-white/70">{accountState.message}</p>
    </div>
  ) : null;

  const content = statusContent || (
    <>
      {!hidden && <ProfileIdentityBlock genderLabel={genderLabel} age={age} country={badge.country} flag={badge.flag} joinDate={formatDate(profile?.created_date)} />}
      {!hidden && <ProfileAgencyBadges profile={profile || {}} userId={userId} />}
      {!hidden && <ProfileModeration userId={userId} profile={profile} onChanged={setProfile} />}


      <ProfileStatsRow
        level={roomLevels[userId] || 0}
        sentLevel={profile?.gift_sent_level || 0}
        sentTier={profile?.gift_sent_tier || 'green'}
        receivedLevel={profile?.gift_received_level || 0}
        receivedTier={profile?.gift_received_tier || 'green'}
        nLevel={profile?.n_level || 0}
      />

      {hidden && (
        <p className="rounded-2xl border px-3 py-2 text-center text-[10px] leading-snug text-white/70" style={{ borderColor: palette.soft, background: 'rgba(0,0,0,0.5)' }}>
          Kullanıcı, özel Gizli Kullanıcı modunu etkinleştirdi. Kimlik bilgileri gizli kalır.
        </p>
      )}

      {!hidden && info.length > 0 && (
        <div className="space-y-1 rounded-2xl border px-3 py-2 text-[11px]" style={{ borderColor: palette.soft, background: 'rgba(0,0,0,0.45)' }}>
          {info.map((row) => (
            <div key={row.label} className="flex items-start justify-between gap-3">
              <span className="shrink-0 text-white/55">{row.label}</span>
              <span className="min-w-0 break-words text-right font-semibold text-white">{row.value}</span>
            </div>
          ))}
        </div>
      )}

      {showSocial && (
        <div className="space-y-1.5">
          <ProfileSocialRow userId={userId} accent={palette.accent} />
          <button
            type="button"
            onClick={openChat}
            className="flex w-full min-w-0 items-center justify-center gap-1 rounded-xl border-2 px-2 py-2 text-[11px] font-black text-white"
            style={{ borderColor: palette.accent2, background: 'rgba(0,0,0,0.5)', boxShadow: `0 0 16px -8px ${palette.glow}` }}
          >
            <MessageSquare className="h-3.5 w-3.5 shrink-0" /> Mesaj Yaz
          </button>
          {canInvite && (
            <button
              type="button"
              onClick={inviteBroadcaster}
              disabled={inviteSent}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border-2 px-2 py-1.5 text-[11px] font-black text-white disabled:opacity-60"
              style={{ borderColor: '#F5C542', background: 'rgba(245,197,66,0.14)' }}
            >
              <Mic2 className="h-3.5 w-3.5" /> {inviteSent ? 'Davet Gönderildi' : 'Yayıncı Olarak Davet Et'}
            </button>
          )}
        </div>
      )}

      {tiles.length > 0 && (
        <div className="flex flex-wrap items-stretch gap-1 rounded-2xl border px-1.5 py-1.5" style={{ borderColor: palette.soft, background: 'rgba(0,0,0,0.45)' }}>
          {tiles.map((item) => (
            <button
              key={item.key}
              type="button"
              disabled={item.disabled}
              onClick={item.onClick}
              className="flex min-w-0 flex-1 basis-0 flex-col items-center gap-0.5 rounded-lg px-1 py-1 text-[9px] font-semibold text-white/85 active:scale-95 disabled:opacity-35"
            >
              <item.icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
              <span className="max-w-full text-center leading-tight">{item.label}</span>
            </button>
          ))}
        </div>
      )}

      {footer.length > 0 && (
        <div className="grid grid-cols-2 gap-1">
          {footer.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={event => { event.stopPropagation(); item.onClick(); }}
              className="flex min-w-0 items-center gap-1.5 rounded-xl border px-2 py-1.5 text-left text-[11px] font-bold"
              style={{ borderColor: palette.soft, background: 'rgba(0,0,0,0.45)', color: item.danger ? palette.danger : '#fff' }}
            >
              <item.icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              <ChevronRight className="h-3 w-3 shrink-0 text-white/40" />
            </button>
          ))}
        </div>
      )}
    </>
  );

  // Kart içindeki herhangi bir düğmeye basıldığında kart hemen kapanır.
  const closeOnAction = (event) => {
    if (event.target.closest('button')) onClose?.();
  };

  if (room?.kind === 'voice') return (
    <VoiceFantasyCard profile={profile} hidden={hidden} name={shownName} avatar={banned ? ACCOUNT_STATES.banned.image : shownAvatar}
      role={roleLabel} palette={palette} room={room} userId={userId} isSelf={isSelf} onClose={onClose} onMessage={onMessage}
      statusContent={statusContent} moderation={!hidden && <ProfileModeration userId={userId} profile={profile} onChanged={setProfile} giftAction={adminGiftRow ? () => room.gift(userId) : null} />} memberId={memberId} genderLabel={genderLabel} age={age} badge={badge} giftInAdminRow={adminGiftRow}
      joinDate={formatDate(profile?.created_date)} copied={copied} onCopyId={copyId} onAction={closeOnAction} />
  );

  return (
    <FantasyProfileShell profile={profile} female={profile?.gender === 'kadın'} hidden={hidden} name={shownName}
      avatar={banned ? ACCOUNT_STATES.banned.image : shownAvatar} role={roleLabel} onClose={onClose}
      memberId={memberId} copied={copied} onCopyId={copyId}>
      <div className="space-y-3 px-4 pt-1" onClick={closeOnAction}>
        {header}
        <div className="flex flex-col gap-3">{content}</div>
      </div>
    </FantasyProfileShell>
  );
}