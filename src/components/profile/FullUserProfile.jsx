import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AtSign, Gift, Loader2, Lock, MessageSquare, Mic, MicOff, Settings, Unlock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import subscribeEntity from '@/components/data/entitySubscriptions';
import { useToast } from '@/components/ui/use-toast';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { HIDDEN_AVATAR_URL } from '@/lib/hiddenUser';
import { formatDate } from '@/components/profile/genderPalette';
import { agencyApi } from '@/lib/agency';
import FollowButton from '@/components/profile/social/FollowButton';

import ReferenceProfileCard from '@/components/profile/crystal/ReferenceProfileCard';
import CrystalCircleButton from '@/components/profile/crystal/CrystalCircleButton';
import { crystalSkin } from '@/components/profile/crystal/crystalTheme';
import { AccountStatusMark, ACCOUNT_MARKS, ACCOUNT_STATES, getAccountState } from '@/components/friends/AccountStatusAvatar';
import { broadcasterState } from '@/lib/broadcaster';
import { useRoomProfileActions } from '@/lib/roomProfileActions';
import useBackDismiss from '@/hooks/useBackDismiss';

/**
 * Uygulamadaki tek profil kartı: referans görseldeki kristal düzeni birebir izler →
 * kanatlı fotoğraf + taç + VIP, slogan ve el yazısı, büyük rol başlığı, üç rozet,
 * kayıt tarihi, üç işlem kutusu, iki geniş bar (hediye / bahset) ve dört yuvarlak düğme.
 * Oda işlemleri sesli odadan gelen bağlamla gerçek koltuk ve mikrofon durumuna bağlanır.
 */
export default function FullUserProfile({
  open = true, userId, name, avatar, hidden = false, muted = false, self = false,
  hideSettings = false, onClose, onMessage, onMention, tiles = [], footer = [], info = [], roomActions = null,
}) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useCurrentUser();
  const roomContext = useRoomProfileActions();
  const room = roomActions || roomContext;
  const [profile, setProfile] = useState(null);
  const [relation, setRelation] = useState('');
  const [likes, setLikes] = useState(0);
  const [copied, setCopied] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);

  // Profil kartı birleşik geri yığınında: geri tuşu önce kartı kapatır.
  useBackDismiss(open, onClose);

  const isSelf = self || userId === user?.id;

  useEffect(() => {
    if (!open || !userId || hidden) { setProfile(null); setRelation(''); setLikes(0); return; }
    let alive = true;
    setProfile(null);
    setRelation('');
    setLikes(0);
    // Profil, açıkken tazelenebilsin diye fonksiyona alındı: ban anında görsel değişir.
    const load = () => base44.functions.invoke('user-profile', { user_id: userId })
      .then((response) => { if (alive) setProfile(response?.data || {}); })
      .catch((error) => { if (alive) setProfile(error?.response?.status === 404 ? { account_status: 'deleted' } : {}); });
    load();
    // Beğeni sayısı: kullanıcıyı takip edenlerin sayısı (sosyal servis).
    base44.functions.invoke('social-service', { action: 'state', user_id: userId })
      .then((response) => { if (alive) setLikes(response?.data?.followers || 0); })
      .catch(() => {});
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
  const accountState = hidden ? null : getAccountState(profile);
  const banned = accountState?.status === 'banned';
  const shownName = hidden ? (name || 'Gizli Kullanıcı') : (profile?.username || profile?.full_name || name || 'Kullanıcı');
  const shownAvatar = hidden ? HIDDEN_AVATAR_URL : (profile?.avatar || avatar || '');
  const memberId = !hidden && profile?.member_id && profile.member_id !== '-' ? String(profile.member_id) : '';
  const badge = broadcasterState(profile);
  const showSocial = !isSelf && !hidden && !accountState;
  const genderSymbol = hidden ? '?' : (profile?.gender === 'erkek' ? '♂' : profile?.gender === 'kadın' ? '♀' : '·');
  const age = !hidden && profile?.birth_date
    ? Math.max(0, Math.floor((Date.now() - new Date(profile.birth_date).getTime()) / 31557600000))
    : 0;
  const roleLabel = hidden
    ? ''
    : (profile?.custom_role?.name || profile?.title || profile?.display_role || (profile?.role === 'admin' ? 'ADMIN' : 'ÜYE'));
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


  // Mevcut ikincil işlemler oda dışındaki kartta korunur.
  const extraNodes = [
    showSocial && relation !== 'friend' ? (
      <CrystalCircleButton
        key="friend"
        icon={Mic}
        label={relation === 'pending' ? 'İstek Gönderildi' : 'Arkadaş Ekle'}
        tone={tone}
        disabled={relation === 'pending'}
        onClick={addFriend}
      />
    ) : null,
    canInvite ? (
      <CrystalCircleButton
        key="invite"
        icon={Mic}
        label={inviteSent ? 'Davet Gönderildi' : 'Yayıncı Davet'}
        tone={tone}
        disabled={inviteSent}
        onClick={inviteBroadcaster}
      />
    ) : null,
    ...tiles.map(({ key, ...item }) => <CrystalCircleButton key={key} {...item} tone={tone} />),
    ...footer.map(({ key, ...item }) => <CrystalCircleButton key={key} {...item} tone={tone} />),
  ].filter(Boolean);

  return (
    <div className={`fixed inset-0 z-[300] flex items-end justify-center ${roomActions ? '' : 'sm:items-center'}`}>
      <button type="button" aria-label="Kapat" onClick={onClose} className="absolute inset-0 w-full bg-black/65" />
      <div
        className="animate-sheet-up relative flex w-full max-w-[480px] flex-col overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]"
        style={{ maxHeight: 'calc(var(--app-height, 100dvh) - 4px)' }}
      >
        {statusContent || <ReferenceProfileCard
          name={shownName}
          avatar={banned ? ACCOUNT_STATES.banned.image : shownAvatar}
          nLevel={profile?.n_level || 0}
          vipLevel={profile?.vip_level || 0}
          giftSentLevel={profile?.gift_sent_level || 0}
          giftReceivedLevel={profile?.gift_received_level || 0}
          memberId={memberId}
          age={age}
          gender={profile?.gender}
          agency={profile?.agency_name}
          country={hidden ? '' : badge.country}
          flag={hidden ? '' : badge.flag}
          onClose={onClose}
          onCopyId={copyId}
          self={isSelf}
          followNode={showSocial ? <FollowButton variant="reference" userId={userId} /> : null}
          actions={{ gift: sendGift, mention, chat: openChat }}
        />}
        {!roomActions && !statusContent && extraNodes.length > 0 && <div className="flex flex-wrap justify-center gap-3 py-2">{extraNodes}</div>}
      </div>
    </div>
  );
}