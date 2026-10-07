import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Send, Settings, Phone, Trash2, X, Image as ImageIcon, Check, CheckCheck, Mic2 } from 'lucide-react';
import { useDirectCall } from '@/lib/DirectCallContext';
import { useNavigate } from 'react-router-dom';
import LiveBadge from '@/components/friends/LiveBadge';
import { findLiveRoom } from '@/lib/liveRoom';
import { Image } from '@/components/ui/image';
import { base44 } from '@/api/base44Client';
import subscribeEntity from '@/components/data/entitySubscriptions';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/ui/use-toast';
import useChatMessages from '@/hooks/useChatMessages';
import useKeyboardInset from '@/hooks/useKeyboardInset';
import RoleMessageEffect from '@/components/role/RoleMessageEffect';
import ChatSettingsPanel from '@/components/friends/ChatSettingsPanel';
import ProfileFrame from '@/components/ProfileFrame';
import XpAvatar from '@/components/xp/XpAvatar';
import FullUserProfile from '@/components/profile/FullUserProfile';
import { getAccountState } from '@/components/friends/AccountStatusAvatar';
import AgencyInviteCard from '@/components/agency/AgencyInviteCard';
import { agencyApi, parseInviteMarker } from '@/lib/agency';
import RoomShareCard from '@/components/friends/RoomShareCard';
import { parseRoomShareMarker } from '@/lib/roomShare';
import { useMessageRealtime } from '@/components/messages/MessageRealtimeProvider';


export default function ChatPanel({ conversation, userId, onBack, online, embedded, getLastSeen, rooms, getRoomId }) {
  const { messages: allMessages, loading, sending, send: sendMsg, markRead, deleteMessage, deleteConversation } = useChatMessages(conversation?.id);
  const { user: currentUser } = useCurrentUser();
  const { toast } = useToast();
  const { startCall } = useDirectCall();
  const navigate = useNavigate();
  const { conversations, optimisticPatch, isTyping } = useMessageRealtime();
  const realtimeConversation = conversations.find((item) => item.id === conversation?.id) || conversation;
  const isAdmin = currentUser?.role === 'admin';
  const [friendProfile, setFriendProfile] = useState(null);
  const [friendship, setFriendship] = useState(null);
  const [text, setText] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [unblocking, setUnblocking] = useState(false);
  const [unfriending, setUnfriending] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [offlineFor, setOfflineFor] = useState(conversation?.offline_for || []);
  const [readReceiptsDisabledFor, setReadReceiptsDisabledFor] = useState(conversation?.read_receipts_disabled_for || []);
  const [dndFor, setDndFor] = useState(conversation?.dnd_for || []);
  const [dndBusy, setDndBusy] = useState(false);
  const [callDisabledFor, setCallDisabledFor] = useState(conversation?.call_disabled_for || []);
  const [callsBusy, setCallsBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [profilePopup, setProfilePopup] = useState(false);
  const messagesRef = useRef(null);
  const myTypingIdRef = useRef(null);
  const typingTimerRef = useRef(null);
  const touchStart = useRef({ x: 0, y: 0 });
  // Klavye açılınca tam ekran sohbet klavyenin üstüne kayar: gönder tuşları hep en altta kalır.
  const keyboardInset = useKeyboardInset();
  const prevFriendStatus = useRef(null);
  const [acceptedNotice, setAcceptedNotice] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [invited, setInvited] = useState(false);



  // Sayfa kaymasını önle — body'yi fixed yapmak sohbetin fixed çerçevesini bozar,
  // bu yüzden yalnızca taşmayı kapatıyoruz.
  useEffect(() => {
    if (embedded) return;
    const body = document.body;
    const html = document.documentElement;
    const prevBody = body.style.overflow;
    const prevHtml = html.style.overflow;
    body.style.overflow = 'hidden';
    html.style.overflow = 'hidden';
    return () => {
      body.style.overflow = prevBody;
      html.style.overflow = prevHtml;
    };
  }, [embedded]);

  useEffect(() => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight });
  }, [allMessages]);

  useEffect(() => {
    return () => {
      clearTimeout(typingTimerRef.current);
      if (myTypingIdRef.current) { base44.entities.DmTyping.delete(myTypingIdRef.current).catch(() => {}); myTypingIdRef.current = null; }
    };
  }, []);

  const sendTyping = () => {
    if (!userId || !conversation?.id) return;
    const updateOrCreate = async () => {
      try {
        if (myTypingIdRef.current) {
          await base44.entities.DmTyping.update(myTypingIdRef.current, { updated_at: new Date().toISOString() });
        } else {
          const rec = await base44.entities.DmTyping.create({ conversation_id: conversation.id, user_id: userId, user_name: currentUser?.full_name || 'Kullanıcı', updated_at: new Date().toISOString() });
          myTypingIdRef.current = rec.id;
        }
      } catch {
        try {
          const rec = await base44.entities.DmTyping.create({ conversation_id: conversation.id, user_id: userId, user_name: currentUser?.full_name || 'Kullanıcı', updated_at: new Date().toISOString() });
          myTypingIdRef.current = rec.id;
        } catch {}
      }
    };
    updateOrCreate();
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      if (myTypingIdRef.current) { base44.entities.DmTyping.delete(myTypingIdRef.current).catch(() => {}); myTypingIdRef.current = null; }
    }, 3000);
  };

  useEffect(() => {
    if (!conversation?.id) return;
    const unreadCount = conversation.user1_id === userId ? (conversation.unread_user1 || 0) : (conversation.unread_user2 || 0);
    window.dispatchEvent(new CustomEvent('social-thread-open', { detail: { conversationId: conversation.id, unreadCount } }));
    markRead();
    return () => window.dispatchEvent(new Event('social-thread-close'));
  }, [conversation?.id, markRead]);

  // Sohbete özel çevrim ve okundu tercihlerini iki tarafta da anlık senkronla.
  useEffect(() => {
    if (!conversation?.id) return;
    setOfflineFor(conversation.offline_for || []);
    setReadReceiptsDisabledFor(conversation.read_receipts_disabled_for || []);
    setDndFor(conversation.dnd_for || []);
    setCallDisabledFor(conversation.call_disabled_for || []);
    const unsub = subscribeEntity('Conversation', (event) => {
      if ((event.data?.id || event.id) !== conversation.id) return;
      if (Array.isArray(event.data?.offline_for)) setOfflineFor(event.data.offline_for);
      if (Array.isArray(event.data?.read_receipts_disabled_for)) setReadReceiptsDisabledFor(event.data.read_receipts_disabled_for);
      if (Array.isArray(event.data?.dnd_for)) setDndFor(event.data.dnd_for);
      if (Array.isArray(event.data?.call_disabled_for)) setCallDisabledFor(event.data.call_disabled_for);
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
  const dndEnabled = dndFor.includes(userId);
  const friendReadReceiptsEnabled = !readReceiptsDisabledFor.includes(friendId);
  const friendVisibleOnline = online && !offlineFor.includes(friendId);
  // Karşı taraf bir odada yayındaysa başlıkta canlı şerit ve "Katıl" düğmesi çıkar.
  const liveRoom = findLiveRoom(rooms, friendId, getRoomId ? getRoomId(friendId) : '');
  const accountState = getAccountState(friendProfile, realtimeConversation?.last_message_text);
  const canMessage = !accountState && (isAdmin || friendProfile?.role === 'admin' || friendship?.status === 'accepted');
  const callsBlocked = callDisabledFor.includes(userId);
  // Karşı taraf aramaları kapattıysa tuş gizlenir; yöneticide her zaman görünür.
  const canCall = canMessage && (isAdmin || !callDisabledFor.includes(friendId));

  const callFriend = async () => {
    if (!canMessage) return;
    const failure = await startCall({ calleeId: friendId, conversationId: conversation.id });
    if (failure) toast({ title: 'Arama başlatılamadı', description: failure, variant: 'destructive' });
  };

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
      await sendMsg(messageText);
      clearTimeout(typingTimerRef.current);
      if (myTypingIdRef.current) { base44.entities.DmTyping.delete(myTypingIdRef.current).catch(() => {}); myTypingIdRef.current = null; }
    } catch (error) {
      setText((draft) => draft || messageText);
      const detail = error.response?.data?.error || error.message;
      toast({ title: 'Mesaj gönderilemedi', description: detail === 'not-found' ? 'Mesaj servisine ulaşılamadı. Yazınız korundu; sayfayı yenileyip tekrar deneyin.' : detail, variant: 'destructive', duration: 6000 });
    }
  };

  const changeText = (value) => {
    setText(value);
    if (value.trim()) sendTyping();
  };

  const block = async () => {
    if (!friendship) { toast({ title: 'Arkadaşlık kaydı bulunamadı', variant: 'destructive' }); return; }
    setBlocking(true);
    try {
      await base44.functions.invoke('friend-service', { action: 'block', friendship_id: friendship.id });
      setSettingsOpen(false);
    } catch {} finally { setBlocking(false); }
  };
  const unblock = async () => {
    if (!friendship) { toast({ title: 'Arkadaşlık kaydı bulunamadı', variant: 'destructive' }); return; }
    setUnblocking(true);
    try {
      await base44.functions.invoke('friend-service', { action: 'unblock', friendship_id: friendship.id });
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
    if (!conversation?.id) return;
    const nextEnabled = !dndEnabled;
    const previous = dndFor;
    const next = nextEnabled ? [...new Set([...previous, userId])] : previous.filter((id) => id !== userId);
    setDndFor(next);
    setDndBusy(true);
    try {
      const response = await base44.functions.invoke('dm-service', { action: 'toggle_dnd', conversation_id: conversation.id, enabled: nextEnabled });
      setDndFor(response.data?.dnd_for || next);
      toast(nextEnabled
        ? { title: 'Rahatsız etme açıldı', description: 'Bu sohbetten gelen aramalarda zil çalmaz ve telefon titremez.', duration: 6000 }
        : { title: 'Rahatsız etme kapatıldı', description: 'Bu sohbetten gelen aramalar yeniden zil çalacak.' });
    } catch {
      setDndFor(previous);
      toast({ title: 'Rahatsız etme değiştirilemedi', variant: 'destructive' });
    } finally { setDndBusy(false); }
  };
  const toggleCalls = async () => {
    if (!conversation?.id) return;
    const nextBlocked = !callsBlocked;
    const previous = callDisabledFor;
    const next = nextBlocked ? [...new Set([...previous, userId])] : previous.filter((id) => id !== userId);
    setCallDisabledFor(next);
    setCallsBusy(true);
    try {
      const response = await base44.functions.invoke('dm-service', { action: 'toggle_calls', conversation_id: conversation.id, enabled: nextBlocked });
      setCallDisabledFor(response.data?.call_disabled_for || next);
      toast(nextBlocked
        ? { title: 'Aramalar kapatıldı', description: 'Bu kişi sizi arayamaz; yöneticiler aramaya devam edebilir.', duration: 6000 }
        : { title: 'Aramalar açıldı', description: 'Bu kişi sizi yeniden arayabilir.' });
    } catch {
      setCallDisabledFor(previous);
      toast({ title: 'Arama ayarı değiştirilemedi', variant: 'destructive' });
    } finally { setCallsBusy(false); }
  };
  const clearChat = async () => { setClearing(true); try { await deleteConversation(); setSettingsOpen(false); } catch {} finally { setClearing(false); } };
  const unfriend = async () => {
    if (!friendship) { toast({ title: 'Arkadaşlık kaydı bulunamadı', variant: 'destructive' }); return; }
    setUnfriending(true);
    try {
      await base44.functions.invoke('friend-service', { action: 'unfriend', friendship_id: friendship.id });
      setFriendship((prev) => prev ? { ...prev, status: 'removed' } : prev);
    } catch { toast({ title: 'Kaldırılamadı', variant: 'destructive' }); }
    finally { setUnfriending(false); }
  };
  const refriend = async () => {
    if (!friendship) { toast({ title: 'Arkadaşlık kaydı bulunamadı', variant: 'destructive' }); return; }
    setUnfriending(true);
    try {
      await base44.functions.invoke('friend-service', { action: 'refriend', friendship_id: friendship.id });
      setFriendship((prev) => prev ? { ...prev, status: 'pending', requester_id: userId } : prev);
    } catch { toast({ title: 'Eklenemedi', variant: 'destructive' }); }
    finally { setUnfriending(false); }
  };
  const acceptRequest = async () => {
    if (!friendship) return;
    try {
      await base44.functions.invoke('friend-service', { action: 'respond', friendship_id: friendship.id, accept: true });
      setFriendship((prev) => prev ? { ...prev, status: 'accepted' } : prev);
      toast({ title: 'Arkadaşlık isteğiniz onaylandı' });
    } catch { toast({ title: 'Kabul edilemedi', variant: 'destructive' }); }
  };
  const rejectRequest = async () => {
    if (!friendship) return;
    try {
      await base44.functions.invoke('friend-service', { action: 'respond', friendship_id: friendship.id, accept: false });
      setFriendship((prev) => prev ? { ...prev, status: 'rejected' } : prev);
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


  return <section className={embedded ? "room-direct-chat dark relative inset-auto z-auto h-full min-h-0 flex flex-col bg-anthracite text-white" : "standalone-private-chat dark fixed top-0 left-0 right-0 bottom-0 z-[60] min-h-0 flex flex-col overflow-hidden border-y border-[#f2ce6b]/20 bg-anthracite text-white sm:relative sm:inset-auto sm:z-auto sm:h-[72vh] sm:min-h-[72vh] sm:rounded-xl sm:border sm:pt-0"} style={embedded ? undefined : { transform: keyboardInset ? `translateY(-${keyboardInset}px)` : undefined, transition: 'transform 180ms ease-out' }} onTouchStart={(e) => { touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }} onTouchEnd={(e) => { const dx = e.changedTouches[0].clientX - touchStart.current.x; const dy = e.changedTouches[0].clientY - touchStart.current.y; if (dx > 80 && dx > Math.abs(dy) * 1.5) onBack(); }}>
    <header className="room-direct-header relative shrink-0 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 border-b border-[#f2ce6b]/20 bg-anthracite/95 backdrop-blur"><div className="flex items-center justify-between"><button onClick={onBack} className="p-2 rounded-full hover:bg-secondary" aria-label="Geri dön"><ArrowLeft className="w-6 h-6" /></button><div className="flex items-center gap-1">{canInviteAgency && <button onClick={inviteBroadcaster} disabled={inviting || invited} className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-bold text-[#F5C542] disabled:opacity-60" style={{ border: '1px solid rgba(245,197,66,0.5)', background: 'rgba(245,197,66,0.12)' }} aria-label="Ajansa davet et"><Mic2 className="w-4 h-4" /> {invited ? 'Gönderildi' : 'Davet Et'}</button>}{!accountState && canCall && <button onClick={callFriend} className="p-2 rounded-full hover:bg-secondary text-green-500" aria-label="Sesli ara"><Phone className="w-5 h-5" /></button>}{!accountState && <button onClick={() => setSettingsOpen(true)} className="p-2 rounded-full hover:bg-secondary" aria-label="Sohbet ayarları"><Settings className="w-5 h-5" /></button>}</div></div><div className="room-direct-profile flex flex-col items-center gap-1 cursor-pointer active:opacity-70" onClick={() => setProfilePopup(true)}><div className="relative">{friendProfile?.profile_frame ? <ProfileFrame frame={friendProfile.profile_frame} avatar={friendProfile.avatar || avatar} name={name} size="sm" frameScale={friendProfile.profile_frame_scale} /> : <XpAvatar avatar={friendProfile?.avatar || avatar} name={name} userId={friendId} size="sm" />}{liveRoom && <LiveBadge />}</div><h2 className="font-bold text-sm truncate max-w-[70%]">{name}</h2><p className={`text-[11px] ${friendTyping ? 'text-green-500' : liveRoom ? 'font-bold text-[#f97316]' : friendVisibleOnline ? 'text-green-500' : 'text-muted-foreground'}`}>{friendTyping ? `${name} yazıyor...` : liveRoom ? 'Yayında' : online ? '• Çevrim içi' : friendLastSeen ? `Son görülme: ${new Date(friendLastSeen).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}` : 'Çevrim dışı'}</p></div>
      {liveRoom && <div className="mt-2 flex items-center gap-3 rounded-2xl border border-[#f2ce6b]/30 bg-white/5 px-3 py-2"><div className="min-w-0 flex-1"><p className="truncate text-xs font-black text-white">Yayında</p><p className="truncate text-[10px] text-white/60">{liveRoom.room.name}</p></div><button type="button" onClick={() => navigate(liveRoom.link)} className="shrink-0 rounded-full bg-[#2fbf4f] px-4 py-1.5 text-xs font-black text-white active:scale-95">Katıl</button></div>}
    </header>
    {settingsOpen && <ChatSettingsPanel name={name} avatar={avatar} friendProfile={friendProfile} isBlocked={(friendship?.status === 'blocked' && (friendship?.blocked_by || []).includes(userId))} isFriend={friendship?.status === 'accepted'} requestSent={friendship?.status === 'pending' && friendship?.requester_id === userId} showFriendButton={!!friendship} onlineEnabled={onlineEnabled} readReceiptsEnabled={readReceiptsEnabled} onToggleReadReceipts={toggleReadReceipts} onToggleOnline={toggleOnline} dndEnabled={dndEnabled} dndBusy={dndBusy} onToggleDnd={toggleDnd} callsBlocked={callsBlocked} callsBusy={callsBusy} onToggleCalls={toggleCalls} onBlock={(friendship?.status === 'blocked' && (friendship?.blocked_by || []).includes(userId)) ? unblock : block} onUnfriend={unfriend} onRefriend={refriend} onClearChat={clearChat} onClose={() => setSettingsOpen(false)} blocking={blocking || unblocking} unfriending={unfriending} clearing={clearing} />}
    <div ref={messagesRef} className="room-direct-messages min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 space-y-4" style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}><div className="rounded-xl bg-secondary/70 px-4 py-3 text-center text-xs text-muted-foreground">{name} ile sohbet</div>{loading && <p className="text-center text-sm text-muted-foreground py-12">Mesajlar yükleniyor...</p>}{!loading && !items.length && <p className="text-center text-sm text-muted-foreground py-12">İlk mesajı siz gönderin.</p>}{items.map((message) => { const sent = message.sender_id === userId; const senderRoleKey = sent ? (currentUser?.display_role || '') : (friendProfile?.display_role || ''); const shareCard = parseRoomShareMarker(message.content); return <div key={message.id} className={`group flex items-end gap-1.5 ${sent ? 'justify-end' : 'justify-start'}`}><RoleMessageEffect roleKey={senderRoleKey} className="max-w-[80%]"><div className={`rounded-2xl px-3.5 py-2 text-sm shadow-md ${sent ? 'rounded-br-md bg-gradient-to-br from-[#c62828] to-[#7f1d1d] border border-[#f2ce6b]/25 text-white' : 'rounded-bl-md bg-[#1e1e24] text-white'}`}>{message.file_url && <Image src={message.file_url} alt="foto" className="rounded-lg max-w-[200px] max-h-56 object-cover mb-1 cursor-pointer" fittingType="fit" onClick={() => setLightbox(message.file_url)} />}{parseInviteMarker(message.content) ? <AgencyInviteCard inviteId={parseInviteMarker(message.content)} /> : shareCard ? <RoomShareCard roomId={shareCard.roomId} voice={shareCard.voice} senderName={message.sender_name} /> : message.content && <p className="whitespace-pre-wrap break-words">{message.content}</p>}<p className="text-[10px] opacity-50 mt-1 text-right flex items-center justify-end gap-1">{new Date(message.created_date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}{sent && ((message.read_by || []).includes(message.receiver_id) ? <CheckCheck className={`w-3.5 h-3.5 ${friendReadReceiptsEnabled ? 'text-[#f2ce6b]' : ''}`} /> : <Check className="w-3.5 h-3.5" />)}</p></div></RoleMessageEffect>{(sent || isAdmin) && <button onClick={() => deleteMessage(message.id)} className="p-1 text-muted-foreground/50 hover:text-destructive shrink-0 opacity-0 group-hover:opacity-100" title="Sil"><Trash2 className="w-3.5 h-3.5" /></button>}</div>; })}{friendship?.status === 'blocked' && (friendship?.blocked_by || []).includes(friendId) && <div className="rounded-xl bg-destructive/10 px-4 py-3 text-center text-xs text-destructive">Engellendiniz — bu kullanıcı sizi engelledi</div>}{friendship?.status === 'blocked' && (friendship?.blocked_by || []).includes(userId) && <div className="rounded-xl bg-destructive/10 px-4 py-3 text-center text-xs text-destructive">Bu kullanıcıyı engellediniz — engeli kaldırın</div>}{friendship?.status === 'pending' && friendship?.recipient_id === userId && <div className="rounded-xl bg-primary/10 border border-primary/30 px-4 py-3 flex items-center justify-between gap-3"><span className="text-sm text-foreground">{name} sizi arkadaş olarak eklemek istiyor</span><div className="flex gap-2 shrink-0"><button onClick={acceptRequest} className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-semibold">Onayla</button><button onClick={rejectRequest} className="bg-secondary text-foreground px-3 py-1.5 rounded-lg text-xs font-semibold">Red</button></div></div>}{friendship?.status === 'pending' && friendship?.requester_id === userId && <div className="rounded-xl bg-secondary/70 px-4 py-3 text-center text-xs text-muted-foreground">Arkadaşlık isteği gönderildi — onay bekleniyor</div>}{acceptedNotice && <div className="rounded-xl bg-green-500/10 border border-green-500/30 px-4 py-3 text-center text-xs text-green-400">✓ Arkadaşlık isteğiniz onaylandı</div>}
{friendship?.status === 'rejected' && <div className="rounded-xl bg-destructive/10 px-4 py-3 text-center text-xs text-destructive">Arkadaşlık isteğiniz reddedildi</div>}{friendship?.status === 'removed' && <div className="rounded-xl bg-secondary/70 px-4 py-3 text-center text-xs text-muted-foreground">Arkadaşlık kaldırıldı — tekrar eklemek için ayarlardan istek gönderin</div>}</div>
    <div className="room-direct-composer shrink-0 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-[#f2ce6b]/20 flex items-center gap-2 bg-anthracite"><input value={text} onChange={(event) => changeText(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); handleSubmit(event); } }} disabled={!canMessage} maxLength={2000} enterKeyHint="send" inputMode="text" autoComplete="off" autoCorrect="off" autoCapitalize="sentences" spellCheck={false} placeholder={canMessage ? 'Mesaj yazın...' : 'Mesaj gönderilemiyor'} className="flex-1 min-w-0 bg-secondary rounded-full px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#f2ce6b]/50 disabled:opacity-60" /><button type="button" onClick={handleSubmit} disabled={!canMessage || sending || uploading || !text.trim()} className="w-11 h-11 shrink-0 flex items-center justify-center bg-gradient-to-br from-[#c62828] to-[#f2ce6b] text-white rounded-full disabled:opacity-50" aria-label="Mesaj gönder"><Send className="w-5 h-5" /></button>{uploading && <span className="text-xs text-muted-foreground animate-pulse shrink-0">...</span>}</div>
    {profilePopup && (
      <FullUserProfile
        userId={friendId}
        name={name}
        avatar={friendProfile?.avatar || avatar}
        frame={friendProfile?.profile_frame}
        frameScale={friendProfile?.profile_frame_scale}
        onClose={() => setProfilePopup(false)}
        onMessage={() => setProfilePopup(false)}
      />
    )}
    {lightbox && <div onClick={() => setLightbox(null)} className="fixed inset-0 z-[110] bg-black/90 flex items-center justify-center p-4"><button className="absolute top-4 right-4 text-white p-2"><X className="w-6 h-6" /></button><Image src={lightbox} className="max-w-full max-h-full rounded-lg" fittingType="fit" /></div>}
  </section>;
}