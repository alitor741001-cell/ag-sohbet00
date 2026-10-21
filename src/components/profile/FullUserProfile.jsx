import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AtSign, Gift, Loader2, Lock, MessageSquare, Mic, MicOff, Settings, Unlock, User, UserCheck, UserPlus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import subscribeEntity from '@/components/data/entitySubscriptions';
import { useToast } from '@/components/ui/use-toast';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { HIDDEN_AVATAR_URL } from '@/lib/hiddenUser';
import { formatDate } from '@/components/profile/genderPalette';
import { agencyApi } from '@/lib/agency';
import VoiceImageCard from '@/components/profile/voice/VoiceImageCard';
import { AccountStatusMark, ACCOUNT_STATES, getAccountState } from '@/components/friends/AccountStatusAvatar';
import { useRoomProfileActions } from '@/lib/roomProfileActions';
import useBackDismiss from '@/hooks/useBackDismiss';

/**
 * Uygulamadaki tek profil kartı: görsel kart (kadın pembe, erkek mavi) alt yarıdan açılır.
 * Kart üzerindeki düğmeler gerçek işlemlere bağlıdır: mikrofon, koltuk kilidi, ayağa kalk,
 * takip, sohbet, bahsetme ve hediye. Yönetim ekranlarının ek satırları kartın altında listelenir.
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
  const [inviteSent, setInviteSent] = useState(false);
  const [following, setFollowing] = useState(false);

  // Takip durumu kart açılınca okunur: düğme "Takip Et" / "Takip Ediliyor" olarak çalışır.
  useEffect(() => {
    if (!open || !userId || hidden || userId === user?.id) return;
    base44.functions.invoke('social-service', { action: 'state', user_id: userId })
      .then((res) => setFollowing(!!res.data?.following)).catch(() => {});
  }, [open, userId, hidden, user?.id]);

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

  const loading = !hidden && !profile;
  const accountState = hidden ? null : getAccountState(profile);
  const banned = accountState?.status === 'banned';
  const shownName = hidden ? (name || 'Gizli Kullanıcı') : (profile?.username || profile?.full_name || name || 'Kullanıcı');
  const shownAvatar = hidden ? HIDDEN_AVATAR_URL : (profile?.avatar || avatar || '');
  const showSocial = !isSelf && !hidden && !accountState;
  const tone = theme === 'blue' && !hidden && profile?.gender !== 'kadın' ? 'blue' : profile?.gender === 'erkek' ? 'blue' : 'pink';
  const accent = tone === 'blue' ? '#4fa8ff' : '#ff6fb5';
  const roleLabel = hidden
    ? ''
    : (profile?.custom_role?.name || profile?.title || profile?.display_role || (profile?.role === 'admin' ? 'ADMIN' : 'ÜYE'));
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

  const addFriend = async () => {
    try {
      await base44.functions.invoke('friend-service', { action: 'request', user_id: userId });
      setRelation('pending');
      toast({ title: 'Arkadaşlık isteği gönderildi' });
    } catch (error) {
      toast({ title: 'İşlem başarısız', description: error.response?.data?.error || error.message, variant: 'destructive' });
    }
  };

  const toggleFollow = async () => {
    try {
      const res = await base44.functions.invoke('social-service', { action: following ? 'unfollow' : 'follow', user_id: userId });
      setFollowing(!!res.data?.following);
    } catch (error) {
      toast({ title: 'İşlem başarısız', description: error.response?.data?.error || error.message, variant: 'destructive' });
    }
  };

  /* ---------- Oda işlemleri: mikrofon ve koltuk kilidi ---------- */
  const targetSeat = room ? room.seatFor(userId) : -1;
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

  const toggleSeatLock = () => {
    if (!room) { needRoom('Koltuk kilidi'); return; }
    if (targetSeat < 0) {
      toast({ title: 'Kilitlenecek koltuk yok', description: isSelf ? 'Önce bir koltuğa otur.' : `${shownName} şu anda bir koltukta oturmuyor.` });
      return;
    }
    if (!room.canControl(userId)) {
      toast({ title: 'Yetki gerekli', description: 'Koltuk kilidini yalnızca oda sahibi ve yöneticiler kullanabilir.', variant: 'destructive' });
      return;
    }
    room.lockSeat(targetSeat, !room.isLocked(targetSeat));
  };

  const standUp = () => {
    if (!room) { needRoom('Ayağa kalkmak'); return; }
    if (!isSelf && !room.canControl(userId)) {
      toast({ title: 'Yetki gerekli', description: 'Birini koltuktan yalnızca oda sahibi ve yöneticiler indirebilir.', variant: 'destructive' });
      return;
    }
    room.standUp(userId);
    onClose?.();
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

  // Yükleniyor ve hesap durumu ekranları kartın yerini alır.
  const statusContent = loading ? (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="h-6 w-6 animate-spin" style={{ color: accent }} />
    </div>
  ) : accountState && !banned ? (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <AccountStatusMark status={accountState.status} />
      <h2 className="mt-4 text-lg font-black text-white">{accountState.name}</h2>
      <p className="mx-auto mt-2 max-w-[300px] text-xs leading-snug text-white/70">{accountState.message}</p>
    </div>
  ) : null;

  // Kart üstündeki üç düğme: odada mikrofon · koltuk kilidi · ayağa kalk, dışarıda sosyal işlemler.
  const rectItems = room
    ? [
      { key: 'mic', icon: micMuted ? MicOff : Mic, label: micMuted ? 'Mik aç' : 'Mik kapat', onClick: toggleMic },
      { key: 'lock', icon: targetSeat >= 0 && room.isLocked(targetSeat) ? Unlock : Lock, label: targetSeat >= 0 && room.isLocked(targetSeat) ? 'Kilidi aç' : 'Koltuğu kilitle', onClick: toggleSeatLock },
      { key: 'stand', icon: User, label: isSelf ? 'Ayağa kalk' : 'Koltuktan indir', onClick: standUp },
    ]
    : isSelf
      ? (hideSettings ? [] : [{ key: 'settings', icon: Settings, label: 'Ayarlar', onClick: () => { onClose?.(); navigate('/profil?tab=settings'); } }])
      : [
        ...(showSocial ? [{ key: 'follow', icon: following ? UserCheck : UserPlus, label: following ? 'Takip Ediliyor' : 'Takip Et', onClick: toggleFollow }] : []),
        ...(showSocial && relation !== 'friend' ? [{ key: 'friend', icon: UserPlus, label: relation === 'pending' ? 'İstek Gönderildi' : 'Arkadaş Ekle', onClick: addFriend }] : []),
        { key: 'chat', icon: MessageSquare, label: 'Mesaj Yaz', onClick: openChat },
      ];

  // Kart altındaki yuvarlak düğmeler: hediye · takip · sohbet · bahset.
  const circleItems = [
    ...(room ? [{ key: 'gift', icon: Gift, label: 'Hediye', onClick: sendGift }] : []),
    ...(showSocial ? [{ key: 'follow', icon: following ? UserCheck : UserPlus, label: following ? 'Takip Ediliyor' : 'Takip Et', onClick: toggleFollow }] : []),
    ...(!isSelf ? [{ key: 'chat', icon: MessageSquare, label: 'Sohbet', onClick: openChat }] : []),
    { key: 'mention', icon: AtSign, label: 'Bahset', onClick: mention },
    ...(canInvite ? [{ key: 'invite', icon: Mic, label: inviteSent ? 'Davet Edildi' : 'Yayıncı Daveti', onClick: inviteBroadcaster }] : []),
  ];

  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center">
      <button type="button" aria-label="Kapat" onClick={onClose} className="absolute inset-0 w-full bg-black/60" />
      <div className="animate-sheet-up relative max-h-[94vh] w-full max-w-[460px] overflow-y-auto overscroll-contain rounded-t-[22px] bg-black pb-[env(safe-area-inset-bottom)]">
        {statusContent || (
          <>
            <div className="mx-auto h-[min(68vh,660px)]" style={{ aspectRatio: '682 / 1024' }}>
              <VoiceImageCard
                tone={tone}
                name={shownName}
                avatar={banned ? ACCOUNT_STATES.banned.image : shownAvatar}
                genderSymbol={hidden ? '?' : profile?.gender === 'erkek' ? '♂' : '♀'}
                roleLabel={roleLabel === 'ÜYE' ? '' : roleLabel}
                receivedLevel={profile?.gift_received_level || 0}
                nLevel={profile?.n_level || 0}
                vipLevel={profile?.vip_level || 0}
                joinDate={formatDate(profile?.created_date)}
                rectItems={rectItems}
                circleItems={circleItems}
              />
            </div>

            {!hidden && info.length > 0 && (
              <div className="mx-3 mt-2 space-y-1 rounded-2xl border border-white/15 bg-white/5 px-3 py-2 text-[12px]">
                {info.map((row) => (
                  <div key={row.label} className="flex items-start justify-between gap-3">
                    <span className="shrink-0 text-white/55">{row.label}</span>
                    <span className="min-w-0 break-words text-right font-semibold text-white">{row.value}</span>
                  </div>
                ))}
              </div>
            )}

            {footer.length > 0 && (
              <div className="mx-3 mb-3 mt-2 overflow-hidden rounded-2xl border border-white/15">
                {footer.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={item.onClick}
                    className="flex w-full items-center gap-3 border-b border-white/10 px-4 py-3 text-left text-sm font-bold last:border-b-0"
                    style={{ color: item.danger ? '#ff5f5f' : '#fff' }}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="flex-1">{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}