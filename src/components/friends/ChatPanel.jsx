import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Send, Settings, Mic2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LiveBadge from '@/components/friends/LiveBadge';
import { findLiveRoom } from '@/lib/liveRoom';
import { base44 } from '@/api/base44Client';
import subscribeEntity from '@/components/data/entitySubscriptions';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/ui/use-toast';
import useChatMessages from '@/hooks/useChatMessages';
import { refreshFriends } from '@/hooks/useFriends';
import useKeyboardInset from '@/hooks/useKeyboardInset';
import ChatSettingsPanel from '@/components/friends/ChatSettingsPanel';
import ProfileFrame from '@/components/ProfileFrame';
import XpAvatar from '@/components/xp/XpAvatar';
import { useUserProfile } from '@/lib/profileCard';
import { getAccountState } from '@/components/friends/AccountStatusAvatar';
import { agencyApi } from '@/lib/agency';
import ImageLightbox from '@/components/friends/ImageLightbox';
import { useMessageRealtime } from '@/components/messages/MessageRealtimeProvider';
import useTabActivity from '@/components/layout/TabActivityContext';
import useChatViewport from '@/hooks/useChatViewport';
import useFollowMessages from '@/hooks/useFollowMessages';
import useDmTyping from '@/hooks/useDmTyping';
import ChatMessageItem from '@/components/friends/ChatMessageItem';
import ChatHistoryControl from '@/components/friends/ChatHistoryControl';
import '@/components/friends/privateChat.css';


export default function ChatPanel({ conversation, userId, onBack, online, embedded, getLastSeen, rooms, getRoomId }) {
  const tabActive = useTabActivity();
  const { messages: allMessages, loading, sending, send: sendMsg, markRead, deleteMessage, hasOlder, loadingOlder, loadOlder, historyError, retryHistory } = useChatMessages(conversation?.id, tabActive);
  const { user: currentUser, setUser } = useCurrentUser();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { conversations, optimisticPatch, isTyping } = useMessageRealtime();
  const realtimeConversation = conversations.find((item) => item.id === conversation?.id) || conversation;
  const isAdmin = currentUser?.role === 'admin';
  const [friendProfile, setFriendProfile] = useState(null);
  const [friendship, setFriendship] = useState(null);
  const [text, setText] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [dndEnabled, setDndEnabled] = useState(currentUser?.dnd_messages === true);
  const [blocking, setBlocking] = useState(false);
  const [unblocking, setUnblocking] = useState(false);
  const [unfriending, setUnfriending] = useState(false);
  const [offlineFor, setOfflineFor] = useState(conversation?.offline_for || []);
  const [readReceiptsDisabledFor, setReadReceiptsDisabledFor] = useState(conversation?.read_receipts_disabled_for || []);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const { openUserProfile } = useUserProfile();
  // Oda içindeki sohbette kart açılır; uygulama içi sohbette tam sayfa profil açılır —
  // geri düğmesi aynı sohbete döner.
  const openProfile = () => (embedded ? openUserProfile(friendId) : navigate(`/kullanici/${friendId}`));
  const messagesRef = useRef(null);
  const chatRef = useRef(null);
  useChatViewport(chatRef, undefined, !embedded && tabActive);
  const { onScroll, onContentLoad, followLatest, preservePosition } = useFollowMessages(messagesRef, allMessages, conversation?.id);
  const { signalTyping, stopTyping } = useDmTyping(conversation?.id, userId, currentUser?.full_name, tabActive);
  const touchStart = useRef({ x: 0, y: 0 });
  // Klavye açılınca tam ekran sohbet klavyenin üstüne kayar: gönder tuşları hep en altta kalır.
  const keyboardInset = useKeyboardInset();
  const prevFriendStatus = useRef(null);
  const [acceptedNotice, setAcceptedNotice] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [invited, setInvited] = useState(false);





  useEffect(() => {
    if (!conversation?.id || !tabActive) return;
    const unreadCount = conversation.user1_id === userId ? (conversation.unread_user1 || 0) : (conversation.unread_user2 || 0);
    window.dispatchEvent(new CustomEvent('social-thread-open', { detail: { conversationId: conversation.id, unreadCount } }));
    markRead();
    return () => window.dispatchEvent(new Event('social-thread-close'));
  }, [conversation?.id, markRead, tabActive]);

  // Sohbete özel çevrim ve okundu tercihlerini iki tarafta da anlık senkronla.
  useEffect(() => {
    if (!conversation?.id) return;
    setOfflineFor(conversation.offline_for || []);
    setReadReceiptsDisabledFor(conversation.read_receipts_disabled_for || []);
    const unsub = subscribeEntity('Conversation', (event) => {
      if ((event.data?.id || event.id) !== conversation.id) return;
      if (Array.isArray(event.data?.offline_for)) setOfflineFor(event.data.offline_for);
      if (Array.isArray(event.data?.read_receipts_disabled_for)) setReadReceiptsDisabledFor(event.data.read_receipts_disabled_for);
    });
    return unsub;
  }, [conversation?.id, userId]);

  // Arkadaş profilini ve friendship kaydını çek — gerçek zamanlı abonelik
  useEffect(() => {
    if (!conversation) return;
    const friendId = conversation.user1_id === userId ? conversation.user2_id : conversation.user1_id;
    if (!friendId) return;
    let active = true;
    const loadProfile = () => base44.functions.invoke('user-profile', { user_id: friendId })
      .then((res) => { if (active) setFriendProfile(res.data); })
      .catch((error) => { if (active && error?.response?.status === 404) setFriendProfile({ account_status: 'deleted' }); });
    const fetchFriendship = () => {
      base44.entities.Friendship.filter({ members: userId }, '-updated_date', 200)
        .then((items) => { if (active) setFriendship(items.find((f) => (f.members || []).includes(friendId)) || null); })
        .catch(() => {});
    };
    loadProfile();
    fetchFriendship();
    const unsub = subscribeEntity('Friendship', () => fetchFriendship());
    const unsubUser = subscribeEntity('User', (event) => {
      if ((event.data?.id || event.id) === friendId) loadProfile();
    });
    return () => { active = false; unsub(); unsubUser(); };
  }, [conversation?.id, userId]);

  // Rahatsız etme tercihi hesaba yazılır; kullanıcı kaydı güncellenince senkronlanır.
  useEffect(() => {
    setDndEnabled(currentUser?.dnd_messages === true);
  }, [currentUser?.dnd_messages]);

  // İstek onaylandığında sohbet içinde sistem mesajı göster
  useEffect(() => {
    if (!friendship) return;
    if (prevFriendStatus.current === 'pending' && friendship.status === 'accepted') {
      setAcceptedNotice(true);
    }
    prevFriendStatus.current = friendship.status;
  }, [friendship?.status]);

  if (!conversation) return <section className="bg-card border border-border rounded-xl min-h-80 flex items-center justify-center text-sm text-muted-foreground">Mesajlaşmak için bir arkadaş seçin.</section>;

  const mine = conversation.user1_id === userId;
  const name = mine ? conversation.user2_name : conversation.user1_name;
  const avatar = mine ? conversation.user2_avatar : conversation.user1_avatar;
  const friendId = mine ? conversation.user2_id : conversation.user1_id;
  const friendTyping = isTyping(conversation.id, friendId);
  const friendLastSeen = getLastSeen ? getLastSeen(friendId) : null;
  const items = allMessages;
  const onlineEnabled = !offlineFor.includes(userId);
  const readReceiptsEnabled = !readReceiptsDisabledFor.includes(userId);
  const friendReadReceiptsEnabled = !readReceiptsDisabledFor.includes(friendId);
  const friendVisibleOnline = online && !offlineFor.includes(friendId);
  // Karşı taraf bir odada yayındaysa başlıkta canlı şerit ve "Katıl" düğmesi çıkar.
  const liveRoom = findLiveRoom(rooms, friendId, getRoomId ? getRoomId(friendId) : '');
  const accountState = getAccountState(friendProfile, realtimeConversation?.last_message_text);
  const isFriend = friendship?.status === 'accepted';
  // Arkadaş olmayanlar da yazabilir: engel ve karşı tarafın rahatsız etme ayarı engeller.
  const dndBlocked = !isFriend && friendProfile?.dnd_messages === true;
  const canMessage = !accountState && friendship?.status !== 'blocked' && !dndBlocked;
  // Ajans sahibi, sohbet ettiği arkadaşını kendi ajansına yayıncı olarak davet edebilir.
  const canInviteAgency = canMessage && currentUser?.agency_role === 'owner' && !!currentUser?.agency_record_id
    && friendship?.status === 'accepted' && !friendProfile?.agency_record_id;

  const inviteBroadcaster = async () => {
    setInviting(true);
    try {
      await agencyApi('invite', { user_id: friendId });
      setInvited(true);
      toast({ title: '🎤 Davet gönderildi', description: `${name} kişisine yayıncı daveti iletildi.` });
    } catch (error) {
      toast({ title: 'Davet gönderilemedi', description: error.response?.data?.error || error.message, variant: 'destructive' });
    } finally { setInviting(false); }
  };

  const handleSubmit = async (event) => {
    event?.preventDefault?.();
    if (!canMessage || sending || uploading || !text.trim()) return;
    const messageText = text.trim();
    setText('');
    try {
      followLatest();
      await sendMsg(messageText);
      stopTyping();
    } catch (error) {
      setText((draft) => draft || messageText);
      const detail = error.response?.data?.error || error.message;
      toast({ title: 'Mesaj gönderilemedi', description: detail === 'not-found' ? 'Mesaj servisine ulaşılamadı. Yazınız korundu; sayfayı yenileyip tekrar deneyin.' : detail, variant: 'destructive', duration: 6000 });
    }
  };

  const changeText = (value) => {
    setText(value);
    if (value.trim()) signalTyping();
    else stopTyping();
  };

  const block = async () => {
    if (!friendship) { toast({ title: 'Arkadaşlık kaydı bulunamadı', variant: 'destructive' }); return; }
    setBlocking(true);
    try {
      await base44.functions.invoke('friend-service', { action: 'block', friendship_id: friendship.id });
      refreshFriends();
      setSettingsOpen(false);
    } catch {} finally { setBlocking(false); }
  };
  const unblock = async () => {
    if (!friendship) { toast({ title: 'Arkadaşlık kaydı bulunamadı', variant: 'destructive' }); return; }
    setUnblocking(true);
    try {
      await base44.functions.invoke('friend-service', { action: 'unblock', friendship_id: friendship.id });
      refreshFriends();
      setSettingsOpen(false);
    } catch { toast({ title: 'Engel kaldırılamadı', variant: 'destructive' }); }
    finally { setUnblocking(false); }
  };
  const toggleReadReceipts = async () => {
    if (!conversation?.id) return;
    const nextEnabled = !readReceiptsEnabled;
    const previous = readReceiptsDisabledFor;
    const next = nextEnabled ? previous.filter((id) => id !== userId) : [...new Set([...previous, userId])];
    setReadReceiptsDisabledFor(next);
    optimisticPatch(conversation.id, { read_receipts_disabled_for: next });
    try {
      const response = await base44.functions.invoke('dm-service', { action: 'toggle_read_receipts', conversation_id: conversation.id, enabled: nextEnabled });
      setReadReceiptsDisabledFor(response.data?.read_receipts_disabled_for || []);
    } catch {
      setReadReceiptsDisabledFor(previous);
      optimisticPatch(conversation.id, { read_receipts_disabled_for: previous });
      toast({ title: 'Okundu tikleri değiştirilemedi', variant: 'destructive' });
    }
  };
  const toggleOnline = async () => {
    if (!conversation?.id) return;
    const nextEnabled = !onlineEnabled;
    const previous = offlineFor;
    const next = nextEnabled ? previous.filter((id) => id !== userId) : [...new Set([...previous, userId])];
    setOfflineFor(next);
    optimisticPatch(conversation.id, { offline_for: next });
    try {
      const response = await base44.functions.invoke('dm-service', { action: 'toggle_offline', conversation_id: conversation.id, online: nextEnabled });
      setOfflineFor(response.data?.offline_for || []);
    } catch {
      setOfflineFor(previous);
      optimisticPatch(conversation.id, { offline_for: previous });
      toast({ title: 'Değiştirilemedi', variant: 'destructive' });
    }
  };
  const toggleDnd = async () => {
    const next = !dndEnabled;
    setDndEnabled(next);
    try {
      await base44.auth.updateMe({ dnd_messages: next });
      setUser({ ...currentUser, dnd_messages: next });
    } catch {
      setDndEnabled(!next);
      toast({ title: 'Rahatsız etme değiştirilemedi', variant: 'destructive' });
    }
  };
  const unfriend = async () => {
    if (!friendship) { toast({ title: 'Arkadaşlık kaydı bulunamadı', variant: 'destructive' }); return; }
    setUnfriending(true);
    try {
      await base44.functions.invoke('friend-service', { action: 'unfriend', friendship_id: friendship.id });
      setFriendship((prev) => prev ? { ...prev, status: 'removed' } : prev);
      refreshFriends();
    } catch { toast({ title: 'Kaldırılamadı', variant: 'destructive' }); }
    finally { setUnfriending(false); }
  };
  const refriend = async () => {
    if (!friendship) { toast({ title: 'Arkadaşlık kaydı bulunamadı', variant: 'destructive' }); return; }
    setUnfriending(true);
    try {
      await base44.functions.invoke('friend-service', { action: 'refriend', friendship_id: friendship.id });
      setFriendship((prev) => prev ? { ...prev, status: 'pending', requester_id: userId } : prev);
      refreshFriends();
    } catch { toast({ title: 'Eklenemedi', variant: 'destructive' }); }
    finally { setUnfriending(false); }
  };
  const acceptRequest = async () => {
    if (!friendship) return;
    try {
      await base44.functions.invoke('friend-service', { action: 'respond', friendship_id: friendship.id, accept: true });
      setFriendship((prev) => prev ? { ...prev, status: 'accepted' } : prev);
      refreshFriends();
      toast({ title: 'Arkadaşlık isteğiniz onaylandı' });
    } catch { toast({ title: 'Kabul edilemedi', variant: 'destructive' }); }
  };
  const rejectRequest = async () => {
    if (!friendship) return;
    try {
      await base44.functions.invoke('friend-service', { action: 'respond', friendship_id: friendship.id, accept: false });
      setFriendship((prev) => prev ? { ...prev, status: 'rejected' } : prev);
      refreshFriends();
    } catch { toast({ title: 'Reddedilemedi', variant: 'destructive' }); }
  };

  const onPhoto = async (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(f.type)) { toast({ title: 'Sadece JPG, PNG, WEBP', variant: 'destructive' }); e.target.value = ''; return; }
    if (f.size > 10 * 1024 * 1024) { toast({ title: 'Maksimum 10 MB', variant: 'destructive' }); e.target.value = ''; return; }
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: f });
      await base44.functions.invoke('send-chat-image', { file_url, context: 'dm', context_id: conversation.id, text: '' });
    } catch (err) {
      toast({ title: 'Görsel gönderilemedi', description: err.response?.data?.error || err.message, variant: 'destructive' });
    } finally { setUploading(false); e.target.value = ''; }
  };


  return <section ref={chatRef} className={embedded ? "room-direct-chat dark relative inset-auto z-auto h-full min-h-0 flex flex-col bg-anthracite text-white" : "standalone-private-chat dark fixed top-0 left-0 right-0 bottom-0 z-[60] min-h-0 flex flex-col overflow-hidden border-y border-[#f2ce6b]/20 bg-anthracite text-white sm:relative sm:inset-auto sm:z-auto sm:h-[72vh] sm:min-h-[72vh] sm:rounded-xl sm:border sm:pt-0"} onTouchStart={(e) => { touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }} onTouchEnd={(e) => { const dx = e.changedTouches[0].clientX - touchStart.current.x; const dy = e.changedTouches[0].clientY - touchStart.current.y; if (dx > 80 && dx > Math.abs(dy) * 1.5) onBack(); }}>
    <header className="room-direct-header relative shrink-0 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 border-b border-[#f2ce6b]/20 bg-anthracite/95 backdrop-blur"><div className="flex items-center justify-between"><button type="button" onClick={onBack} className="p-2 min-h-11 min-w-11 rounded-full text-[#8fd4ff] bg-gradient-to-br from-[#2f7cff]/30 to-[#0b2f8f]/40 border border-[#5cb8ff]/50 shadow-[0_0_14px_-4px_rgba(47,124,255,0.95)] active:scale-95" aria-label="Geri dön"><ArrowLeft aria-hidden="true" className="w-6 h-6" /></button><div className="flex items-center gap-1">{canInviteAgency && <button onClick={inviteBroadcaster} disabled={inviting || invited} className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-bold text-[#F5C542] disabled:opacity-60" style={{ border: '1px solid rgba(245,197,66,0.6)', background: 'rgba(245,197,66,0.16)', boxShadow: '0 0 14px -4px rgba(245,197,66,0.95)' }} aria-label="Ajansa davet et"><Mic2 className="w-4 h-4" /> {invited ? 'Gönderildi' : 'Davet Et'}</button>}{!accountState && <button type="button" onClick={() => setSettingsOpen(true)} className="p-2 min-h-11 min-w-11 rounded-full text-[#d0b0ff] bg-gradient-to-br from-violet-500/30 to-[#3b0a6b]/40 border border-violet-300/50 shadow-[0_0_14px_-4px_rgba(185,0,255,0.9)] active:scale-95" aria-label="Sohbet ayarları"><Settings aria-hidden="true" className="w-5 h-5" /></button>}</div></div>{liveRoom ? (
        <div className="room-direct-profile flex items-center gap-3">
          <button type="button" onClick={openProfile} className="flex shrink-0 flex-col items-center gap-1 active:opacity-70">
            <div className="relative">{friendProfile?.profile_frame ? <ProfileFrame frame={friendProfile.profile_frame} avatar={friendProfile.avatar || avatar} name={name} size="sm" frameScale={friendProfile.profile_frame_scale} /> : <XpAvatar avatar={friendProfile?.avatar || avatar} name={name} userId={friendId} size="sm" />}<LiveBadge /></div>
            <span className="max-w-[120px] truncate text-sm font-bold">{name}</span>
          </button>
          {/* Yayın bilgisi profilin yanında durur: üstte odanın sahibi, altta oda adı. */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-bold text-[#f2ce6b]"><span className="font-semibold text-white/50">Oda sahibi: </span>{liveRoom.room.owner_name || '—'}</p>
            <p className="truncate text-sm font-black text-white">{liveRoom.room.name}</p>
          </div>
          <button type="button" onClick={() => navigate(liveRoom.link)} className="shrink-0 rounded-full bg-[#2fbf4f] px-4 py-1.5 text-xs font-black text-white active:scale-95">Katıl</button>
        </div>
      ) : (
        <div className="room-direct-profile flex flex-col items-center gap-1 cursor-pointer active:opacity-70" onClick={openProfile}><div className="relative">{friendProfile?.profile_frame ? <ProfileFrame frame={friendProfile.profile_frame} avatar={friendProfile.avatar || avatar} name={name} size="sm" frameScale={friendProfile.profile_frame_scale} /> : <XpAvatar avatar={friendProfile?.avatar || avatar} name={name} userId={friendId} size="sm" />}</div><h2 className="font-bold text-sm truncate max-w-[70%]">{name}</h2><p className={`text-[11px] ${friendTyping ? 'text-green-500' : friendVisibleOnline ? 'text-green-500' : 'text-muted-foreground'}`}>{friendTyping ? `${name} yazıyor...` : online ? '• Çevrim içi' : friendLastSeen ? `Son görülme: ${new Date(friendLastSeen).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}` : 'Çevrim dışı'}</p></div>
      )}
    </header>
    {settingsOpen && tabActive && <ChatSettingsPanel name={name} avatar={avatar} friendProfile={friendProfile} isBlocked={(friendship?.status === 'blocked' && (friendship?.blocked_by || []).includes(userId))} isFriend={friendship?.status === 'accepted'} requestSent={friendship?.status === 'pending' && friendship?.requester_id === userId} showFriendButton={!!friendship} onlineEnabled={onlineEnabled} readReceiptsEnabled={readReceiptsEnabled} onToggleReadReceipts={toggleReadReceipts} onToggleOnline={toggleOnline} dndEnabled={dndEnabled} onToggleDnd={toggleDnd} onBlock={(friendship?.status === 'blocked' && (friendship?.blocked_by || []).includes(userId)) ? unblock : block} onUnfriend={unfriend} onRefriend={refriend} onClose={() => setSettingsOpen(false)} blocking={blocking || unblocking} unfriending={unfriending} />}
    <div ref={messagesRef} onScroll={onScroll} onLoadCapture={onContentLoad} className="room-direct-messages min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 space-y-4" style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}><div className="rounded-xl bg-secondary/70 px-4 py-3 text-center text-xs text-muted-foreground">{name} ile sohbet</div><ChatHistoryControl loading={loading} loadingOlder={loadingOlder} hasOlder={hasOlder} error={historyError} onLoad={() => loadOlder(preservePosition)} onRetry={() => retryHistory(preservePosition)} />{loading && <p className="text-center text-sm text-muted-foreground py-12">Mesajlar yükleniyor...</p>}{!loading && !historyError && !items.length && <p className="text-center text-sm text-muted-foreground py-12">İlk mesajı siz gönderin.</p>}{items.map((message) => <ChatMessageItem key={message.id} message={message} userId={userId} isAdmin={isAdmin} ownRole={currentUser?.display_role || ''} friendRole={friendProfile?.display_role || ''} receipts={friendReadReceiptsEnabled} ownGender={currentUser?.gender} friendGender={friendProfile?.gender} ownName={currentUser?.username || currentUser?.full_name} friendName={name} ownAvatar={currentUser?.avatar} friendAvatar={friendProfile?.avatar || avatar} onDelete={deleteMessage} onImage={setLightbox} />)}{friendship?.status === 'blocked' && (friendship?.blocked_by || []).includes(friendId) && <div className="rounded-xl bg-destructive/10 px-4 py-3 text-center text-xs text-destructive">Engellendiniz — bu kullanıcı sizi engelledi</div>}{friendship?.status === 'blocked' && (friendship?.blocked_by || []).includes(userId) && <div className="rounded-xl bg-destructive/10 px-4 py-3 text-center text-xs text-destructive">Bu kullanıcıyı engellediniz — engeli kaldırın</div>}{friendship?.status === 'pending' && friendship?.recipient_id === userId && <div className="rounded-xl bg-primary/10 border border-primary/30 px-4 py-3 flex items-center justify-between gap-3"><span className="text-sm text-foreground">{name} sizi arkadaş olarak eklemek istiyor</span><div className="flex gap-2 shrink-0"><button onClick={acceptRequest} className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-semibold">Onayla</button><button onClick={rejectRequest} className="bg-secondary text-foreground px-3 py-1.5 rounded-lg text-xs font-semibold">Red</button></div></div>}{friendship?.status === 'pending' && friendship?.requester_id === userId && <div className="rounded-xl bg-secondary/70 px-4 py-3 text-center text-xs text-muted-foreground">Arkadaşlık isteği gönderildi — onay bekleniyor</div>}{acceptedNotice && <div className="rounded-xl bg-green-500/10 border border-green-500/30 px-4 py-3 text-center text-xs text-green-400">✓ Arkadaşlık isteğiniz onaylandı</div>}
{friendship?.status === 'rejected' && <div className="rounded-xl bg-destructive/10 px-4 py-3 text-center text-xs text-destructive">Arkadaşlık isteğiniz reddedildi</div>}{friendship?.status === 'removed' && <div className="rounded-xl bg-secondary/70 px-4 py-3 text-center text-xs text-muted-foreground">Arkadaşlık kaldırıldı — tekrar eklemek için ayarlardan istek gönderin</div>}</div>
    {/* Klavye açıkken alt boşluk kaldırılır: yazma çubuğu klavyenin hemen üstüne oturur. */}
    <div className={`room-direct-composer shrink-0 p-3 border-t border-[#f2ce6b]/20 flex items-center gap-2 bg-anthracite ${keyboardInset ? 'pb-2' : 'pb-[max(0.75rem,env(safe-area-inset-bottom))]'}`}><input value={text} onChange={(event) => changeText(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); handleSubmit(event); } }} disabled={!canMessage} maxLength={2000} enterKeyHint="send" inputMode="text" autoComplete="off" autoCorrect="off" autoCapitalize="sentences" spellCheck={false} placeholder={canMessage ? 'Mesaj yazın...' : dndBlocked ? 'Bu kullanıcı mesaj kabul etmiyor' : 'Mesaj gönderilemiyor'} className="flex-1 min-w-0 bg-secondary rounded-full px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#f2ce6b]/50 disabled:opacity-60" /><button type="button" onClick={handleSubmit} disabled={!canMessage || sending || uploading || !text.trim()} className="w-11 h-11 shrink-0 flex items-center justify-center bg-gradient-to-br from-[#ff7a1a] via-[#ef4343] to-[#b900ff] text-white rounded-full border border-amber-200/60 shadow-[0_0_16px_-3px_rgba(255,122,26,0.95)] disabled:opacity-50 active:scale-95" aria-label="Mesaj gönder"><Send className="w-5 h-5" /></button>{uploading && <span className="text-xs text-muted-foreground animate-pulse shrink-0">...</span>}</div>
    {lightbox && tabActive && <ImageLightbox url={lightbox} onClose={() => setLightbox(null)} />}
  </section>;
}