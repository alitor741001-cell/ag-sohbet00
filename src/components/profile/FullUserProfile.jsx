import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AtSign, ChevronRight, Gift, Loader2, Lock, MessageSquare, Mic, Mic2, MicOff, Settings, Unlock, UserPlus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import subscribeEntity from '@/components/data/entitySubscriptions';
import { useToast } from '@/components/ui/use-toast';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { HIDDEN_AVATAR_URL } from '@/lib/hiddenUser';
import { ROOM_BLUE, ageFromBirthDate, formatDate, genderPalette } from '@/components/profile/genderPalette';
import { agencyApi } from '@/lib/agency';
import ProfileHeroBlock from '@/components/profile/ProfileHeroBlock';
import ProfileStatsRow from '@/components/profile/ProfileStatsRow';
import ProfileIdentityBlock from '@/components/profile/ProfileIdentityBlock';
import FollowButton from '@/components/profile/social/FollowButton';
import { AccountStatusMark, ACCOUNT_MARKS, ACCOUNT_STATES, getAccountState } from '@/components/friends/AccountStatusAvatar';
import { broadcasterState } from '@/lib/broadcaster';
import { useRoomProfileActions } from '@/lib/roomProfileActions';
import useBackDismiss from '@/hooks/useBackDismiss';

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
  const showSocial = !isSelf && !hidden && !accountState;
  const age = hidden ? null : ageFromBirthDate(profile?.birth_date);
  const genderLabel = profile?.gender === 'erkek' ? 'Erkek' : profile?.gender === 'kadın' ? 'Kadın' : 'Belirtilmedi';
  const roleLabel = hidden
    ? ''
    : (profile?.custom_role?.name || profile?.title || profile?.display_role || (profile?.role === 'admin' ? 'ADMIN' : 'ÜYE'));
  const ownerAgency = profile?.owned_agency_id
    ? { name: profile.owned_agency_name, code: profile.owned_agency_code }
    : null;
  // Ajans sahibi, kendi ajansında olmayan bir kullanıcıyı yayıncı olarak davet edebilir.
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

  /* ---------- Oda işlemleri: mikrofon ve iki koltuk kilidi ---------- */
  const targetSeat = room ? room.seatFor(userId) : -1;
  const mySeat = room ? room.seatFor(user?.id) : -1;
  const targetMuted = room ? room.mutedOf(userId) : !!muted;
  const micMuted = isSelf ? (room ? room.selfMicMuted : !!muted) : targetMuted;

  const needRoom = (what) => toast({
    title: `${what} için sesli odada olmalısın`,
    description: 'Bir sesli odaya katıldığında bu işlemler o odanın koltuğuna bağlanır.',
  });

  const toggleMic = () => {
    if (!room) { needRoom('Mikrofon'); return; }
    if (isSelf) { room.toggleMic(); return; }
    if (!room.canControl(userId)) {
      toast({ title: 'Yetki gerekli', description: 'Başkasının mikrofonunu yalnızca oda sahibi ve yöneticiler kullanabilir.', variant: 'destructive' });
      return;
    }
    room.toggleMic(userId);
  };

  const toggleSeatLock = (index, who) => {
    if (!room) { needRoom('Koltuk kilidi'); return; }
    if (index < 0) {
      toast({ title: 'Kilitlenecek koltuk yok', description: who === user?.id ? 'Önce bir koltuğa otur.' : `${shownName} şu anda bir koltukta oturmuyor.` });
      return;
    }
    if (!room.canControl(who)) {
      toast({ title: 'Yetki gerekli', description: 'Koltuk kilidini yalnızca oda sahibi ve yöneticiler kullanabilir.', variant: 'destructive' });
      return;
    }
    room.lockSeat(index, !room.isLocked(index));
  };

  /* ---------- Hediye ve bahsetme ---------- */
  const sendGift = () => {
    if (!room) {
      toast({ title: 'Hediye göndermek için sesli odada olmalısın', description: 'Hediye penceresi katıldığın sesli odada bu karttan açılır.' });
      return;
    }
    room.gift(userId);
    onClose?.();
  };

  const mention = () => {
    if (room) {
      room.mention(shownName);
      onClose?.();
      return;
    }
    // Oda dışında bahsetme, kişiyle olan sohbet açılarak yapılır.
    if (!isSelf && onMessage) {
      onMessage(userId);
      onClose?.();
      toast({ title: 'Sohbet açıldı', description: `${shownName} kişisinden sohbette bahsedebilirsin.` });
      return;
    }
    if (!isSelf && onMention) {
      onMention(shownName);
      onClose?.();
      return;
    }
    toast({ title: 'Bahsetmek için bir sohbet alanı gerekli', description: 'Kişiyle sohbeti açıp oradan bahsedebilirsin.' });
  };

  const openChat = () => {
    if (isSelf) return;
    if (room?.message) { room.message(userId); onClose?.(); return; }
    onMessage?.(userId);
    onClose?.();
  };

  const header = (
    <header className="flex items-center justify-between">
      <button
        type="button"
        onClick={onClose}
        className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-bold text-white"
        style={{ borderColor: palette.soft, background: 'rgba(0,0,0,0.45)' }}
      >
        <ArrowLeft className="h-4 w-4" /> Geri
      </button>
      <div className="flex items-center gap-2">
        {muted && <MicOff className="h-4 w-4" style={{ color: palette.accent }} />}
        {isSelf && !hideSettings && (
          <button
            type="button"
            onClick={() => { onClose?.(); navigate('/profil?tab=settings'); }}
            aria-label="Profil ayarları"
            className="flex h-9 w-9 items-center justify-center rounded-full border text-white"
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
    <div className="flex flex-1 items-center justify-center py-24">
      <Loader2 className="h-6 w-6 animate-spin" style={{ color: palette.accent }} />
    </div>
  ) : accountState && !banned ? (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <AccountStatusMark status={accountState.status} />
      <h2 className="mt-4 text-lg font-black text-white">{accountState.name}</h2>
      <p className="mx-auto mt-2 max-w-[300px] text-xs leading-snug text-white/70">{accountState.message}</p>
    </div>
  ) : null;

  // Üç kutu: Mik aç · Koltuğu kilitle (tıklanan kişinin koltuğu) · Koltuğu kilitle (kendi koltuğum).
  const seatLockIcon = (index) => (index >= 0 && room?.isLocked(index) ? Unlock : Lock);
  const seatLockLabel = (index) => (index >= 0 && room?.isLocked(index) ? 'Kilidi aç' : 'Koltuğu kilitle');
  const roomItems = [
    { key: 'mic', icon: micMuted ? MicOff : Mic, label: micMuted ? 'Mik aç' : 'Mik kapat', onClick: toggleMic },
    { key: 'lock-target', icon: seatLockIcon(targetSeat), label: seatLockLabel(targetSeat), onClick: () => toggleSeatLock(targetSeat, userId) },
    { key: 'lock-self', icon: seatLockIcon(mySeat), label: seatLockLabel(mySeat), onClick: () => toggleSeatLock(mySeat, user?.id) },
  ];

  // İki geniş bar: Hediye gönder · Bahset.
  const wideItems = [
    { key: 'gift', icon: Gift, label: 'Hediye gönder', onClick: sendGift },
    { key: 'mention', icon: AtSign, label: 'Bahset', onClick: mention },
  ];

  const content = statusContent || (
    <>
      <div className="mt-4">
        <ProfileHeroBlock
          name={shownName}
          avatar={banned ? ACCOUNT_STATES.banned.image : shownAvatar}
          palette={palette}
          hidden={hidden}
          statusLabel={banned ? ACCOUNT_MARKS.banned : ''}
          roleLabel={roleLabel}
        />
      </div>

      {!hidden && (profile?.broadcaster_status === 'active' || profile?.agency_name || ownerAgency) && (
        <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2">
          {profile?.broadcaster_status === 'active' && (
            <span className="flex items-center gap-1 rounded-full border border-[#F5C542]/50 bg-[#F5C542]/10 px-3 py-1 text-[11px] font-black text-[#F5C542]">
              <Mic2 className="h-3 w-3" /> 🎤 YAYINCI
            </span>
          )}
          {profile?.agency_role === 'assistant' && (
            <span
              className="flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-black"
              style={{ borderColor: palette.accent, background: palette.soft, color: palette.accent }}
            >
              🤝 ASİSTAN
            </span>
          )}
          {ownerAgency ? (
            <span className="flex items-center gap-1 rounded-full border border-[#F5C542]/60 bg-[#F5C542]/10 px-3 py-1 text-[11px] font-black text-[#F5C542]">
              🏢 AJANS SAHİBİ{ownerAgency.name ? ` • ${ownerAgency.name}` : ''}{ownerAgency.code ? ` (${ownerAgency.code})` : ''}
            </span>
          ) : profile?.agency_name ? (
            <span className="rounded-full border border-white/15 bg-black/40 px-3 py-1 text-[11px] font-semibold text-white/70">Ajans: {profile.agency_name}</span>
          ) : null}
        </div>
      )}

      <ProfileStatsRow
        palette={palette}
        level={0}
        receivedLevel={profile?.gift_received_level || 0}
        receivedTier={profile?.gift_received_tier}
        nLevel={profile?.n_level || 0}
        vipLevel={profile?.vip_level || 0}
      />

      {hidden ? (
        <p className="mt-5 rounded-2xl border px-4 py-3 text-center text-[11px] leading-snug text-white/70" style={{ borderColor: palette.soft, background: 'rgba(0,0,0,0.5)' }}>
          Kullanıcı, özel Gizli Kullanıcı modunu etkinleştirdi. Kimlik bilgileri gizli kalır.
        </p>
      ) : (
        <ProfileIdentityBlock
          palette={palette}
          genderLabel={genderLabel}
          age={age}
          country={badge.country}
          flag={badge.flag}
          memberId={memberId}
          joinDate={formatDate(profile?.created_date)}
          copied={copied}
          onCopyId={copyId}
        />
      )}

      {!hidden && info.length > 0 && (
        <div className="mt-4 space-y-1.5 rounded-2xl border px-4 py-3 text-[12px]" style={{ borderColor: palette.soft, background: 'rgba(0,0,0,0.45)' }}>
          {info.map((row) => (
            <div key={row.label} className="flex items-start justify-between gap-3">
              <span className="shrink-0 text-white/55">{row.label}</span>
              <span className="min-w-0 break-words text-right font-semibold text-white">{row.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Oda işlemleri: mikrofon ve koltuk kilitleri */}
      <div className="mt-4 grid grid-cols-3 gap-x-2 gap-y-2 rounded-2xl border px-3 py-3" style={{ borderColor: palette.soft, background: 'rgba(0,0,0,0.45)' }}>
        {roomItems.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={item.onClick}
            className="flex min-w-0 flex-col items-center gap-1.5 rounded-xl py-1 text-[10px] font-bold text-white/85 active:scale-95"
          >
            <item.icon className="h-5 w-5" strokeWidth={1.9} style={{ color: palette.accent }} />
            <span className="max-w-full text-center leading-tight">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Hediye gönder · Bahset */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        {wideItems.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={item.onClick}
            className="flex items-center justify-center gap-2 rounded-2xl border-2 px-3 py-3 text-sm font-black text-white active:scale-[0.98]"
            style={{ borderColor: palette.accent, background: palette.soft, boxShadow: `0 0 20px -8px ${palette.glow}` }}
          >
            <item.icon className="h-4 w-4" /> {item.label}
          </button>
        ))}
      </div>

      {showSocial && (
        <div className="mt-4 space-y-3">
          <FollowButton userId={userId} accent={palette.accent} />
          {relation !== 'friend' && (
            <button
              type="button"
              onClick={addFriend}
              disabled={relation === 'pending'}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 px-4 py-3.5 text-base font-black text-white disabled:opacity-60"
              style={{ borderColor: palette.accent, background: palette.soft, boxShadow: `0 0 22px -6px ${palette.glow}` }}
            >
              <UserPlus className="h-5 w-5" /> {relation === 'pending' ? 'İstek Gönderildi' : 'Arkadaş Ekle'}
            </button>
          )}
          <button
            type="button"
            onClick={openChat}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 px-4 py-3.5 text-base font-black text-white"
            style={{ borderColor: palette.accent2, background: 'rgba(0,0,0,0.5)', boxShadow: `0 0 22px -8px ${palette.glow}` }}
          >
            <MessageSquare className="h-5 w-5" /> Mesaj Yaz
          </button>
          {canInvite && (
            <button
              type="button"
              onClick={inviteBroadcaster}
              disabled={inviteSent}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 px-4 py-3.5 text-base font-black text-white disabled:opacity-60"
              style={{ borderColor: '#F5C542', background: 'rgba(245,197,66,0.14)', boxShadow: '0 0 22px -8px rgba(245,197,66,0.95)' }}
            >
              <Mic2 className="h-5 w-5" /> {inviteSent ? 'Davet Gönderildi' : 'Yayıncı Olarak Davet Et'}
            </button>
          )}
        </div>
      )}

      {tiles.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-x-2 gap-y-3 rounded-2xl border px-3 py-4" style={{ borderColor: palette.soft, background: 'rgba(0,0,0,0.45)' }}>
          {tiles.map((item) => (
            <button
              key={item.key}
              type="button"
              disabled={item.disabled}
              onClick={item.onClick}
              className="flex min-w-0 flex-col items-center gap-1.5 rounded-xl px-1 py-1 text-[11px] font-semibold text-white/85 active:scale-95 disabled:opacity-35"
            >
              <item.icon className="h-6 w-6" strokeWidth={1.75} />
              <span className="max-w-full text-center leading-tight">{item.label}</span>
            </button>
          ))}
        </div>
      )}

      {footer.length > 0 && (
        <div className="mt-4 overflow-hidden rounded-2xl border" style={{ borderColor: palette.soft, background: 'rgba(0,0,0,0.45)' }}>
          {footer.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={item.onClick}
              className="flex w-full items-center gap-3 border-b px-4 py-3.5 text-left text-sm font-bold"
              style={{ borderColor: palette.soft, color: item.danger ? palette.danger : '#fff' }}
            >
              <item.icon className="h-4 w-4" strokeWidth={2} />
              <span className="flex-1">{item.label}</span>
              <ChevronRight className="h-4 w-4 text-white/40" />
            </button>
          ))}
        </div>
      )}
    </>
  );

  return (
    <div className="fixed inset-0 z-[300] overflow-y-auto overscroll-contain" style={{ background: palette.bg }}>
      <div className="relative mx-auto flex min-h-full w-full max-w-[520px] flex-col px-4 pb-8 pt-[max(0.75rem,env(safe-area-inset-top))]">
        {header}
        {content}
      </div>
    </div>
  );
}