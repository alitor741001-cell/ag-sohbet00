import { useEffect, useState } from 'react';
import { ArrowLeft, MessageCircle, Shield } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import subscribeEntity from '@/components/data/entitySubscriptions';
import ConversationList from '@/components/friends/ConversationList';
import FriendsPanel from '@/components/friends/FriendsPanel';
import ChatPanel from '@/components/friends/ChatPanel';
import NotificationBell from '@/components/friends/NotificationBell';
import RoomFriendRequests from '@/components/friends/RoomFriendRequests';
import useFriends from '@/hooks/useFriends';
import useConversations from '@/hooks/useConversations';
import useFriendPresence from '@/hooks/useFriendPresence';
import { useToast } from '@/components/ui/use-toast';
import { isModerator } from '@/lib/roles';
import PullToRefresh from '@/components/home/PullToRefresh';

export default function Friends() {
  const { user, relations, loading: friendsLoading, invoke, reload: reloadFriends } = useFriends();
  const { conversations, loading: convosLoading, optimisticHide, reload: reloadConversations } = useConversations();
  const { isOnline, getLastSeen } = useFriendPresence(user);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [adminLoading, setAdminLoading] = useState(false);
  const [rooms, setRooms] = useState([]);
  useEffect(() => {
    let active = true;
    let timer = null;
    const load = async () => {
      const items = await base44.entities.Room.filter({ status: 'active' }, '-updated_date', 200).catch(() => []);
      if (active) setRooms(items);
    };
    load();
    const unsub = subscribeEntity('Room', (event) => {
      // Oda kaydı olayın içinde geldiği için yayın göstergesi beklemeden güncellenir:
      // kişi odaya girdiği an listede "yayında" görünür.
      const incoming = event.data;
      const id = incoming?.id || event.id;
      if (!id) return;
      setRooms((current) => {
        const rest = current.filter((room) => room.id !== id);
        return incoming && event.type !== 'delete' && incoming.status !== 'closed' ? [incoming, ...rest] : rest;
      });
      // Liste ayrıca tazelenir: sıralama yenilenir, kaçan kayıtlar tamamlanır.
      clearTimeout(timer);
      timer = setTimeout(load, 2500);
    });
    // Abonelik düşen cihazlarda (mobil/PWA) gösterge doğru kalsın diye düzenli tazeleme.
    // Android'de canlı akış gecikebildiği için yayın durumu 5 saniyede bir yeniden okunur.
    const interval = setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      load();
    }, 5000);
    return () => { active = false; clearTimeout(timer); clearInterval(interval); unsub(); };
  }, []);

  // Özel sohbet bölümü kendini 5 saniyede bir tazeler: sohbet listesi, okunmamış sayıları
  // ve son mesaj önizlemesi canlı akış gecikse de (Android) güncel kalır.
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      reloadConversations();
    }, 5000);
    return () => clearInterval(interval);
  }, [reloadConversations]);

  // Kişinin yayında olduğu oda, oda kaydından okunur: kişi hangi cihazdan/oturumdan
  // girerse girsin katılımcı listesinde görünür. Birden fazla odada kaydı kalmışsa
  // en son hareket gören oda geçerli sayılır. Gizli odalar arkadaşlara gösterilmez.
  const getRoomId = (personId) => {
    if (!personId) return '';
    let best = null;
    rooms.forEach((room) => {
      if (room.status !== 'active' || room.hidden) return;
      const inside = [...(room.participants || []), ...(room.seats || [])].some((person) => person?.user_id === personId);
      if (!inside) return;
      if (!best || new Date(room.updated_date || 0) > new Date(best.updated_date || 0)) best = room;
    });
    return best?.id || '';
  };
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState(() => {
    const target = params.get('view');
    return target === 'chats' ? target : 'friends';
  });
  const [selected, setSelected] = useState(null);

  // Adres çubuğu görünümün tek kaynağıdır: alt menüden sekmeye basıldığında, sohbetten
  // geri dönüldüğünde ya da geri tuşuyla gelindiğinde görünüm adresteki değere kurulur.
  useEffect(() => {
    if (params.get('chat')) return; // açık sohbeti sohbet efekti kurar
    setView(params.get('view') === 'chats' ? 'chats' : 'friends');
  }, [params]);

  useEffect(() => {
    const chatId = params.get('chat');
    if (!chatId) return;
    const convo = conversations.find((c) => c.id === chatId);
    if (convo) { setSelected(convo); setView('chat'); }
    else {
      base44.entities.Conversation.get(chatId)
        .then((c) => { if (c) { setSelected(c); setView('chat'); } })
        .catch(() => {});
    }
  }, [conversations, params]);

  const startAdminChat = async () => {
    setAdminLoading(true);
    try {
      const res = await base44.functions.invoke('friend-service', { action: 'start_admin_chat' });
      const adminId = res?.data?.admin_id;
      if (!adminId) { toast({ title: 'Yönetici bulunamadı' }); return; }
      const convoRes = await base44.functions.invoke('dm-service', { action: 'start', target_id: adminId });
      if (convoRes?.data?.warning) toast({ description: convoRes.data.warning, duration: 6000 });
      if (convoRes?.data?.conversation) openChatView(convoRes.data.conversation);
    } catch (e) {
      toast({ title: 'Başlatılamadı', description: e.response?.data?.error || e.message, variant: 'destructive' });
    } finally { setAdminLoading(false); }
  };

  // Sohbet açılırken adrese yeni bir geçmiş kaydı eklenir: iOS kaydırma-geri hareketi ve
  // Android geri tuşu uygulamayı kapatmak yerine sohbet listesine döner.
  const openChatView = (conversation) => {
    setSelected(conversation);
    setView('chat');
    setParams({ view: 'chats', chat: conversation.id });
  };

  const openChat = async (relation) => {
    const friendId = relation.requester_id === user.id ? relation.recipient_id : relation.requester_id;
    try {
      const res = await base44.functions.invoke('dm-service', { action: 'start', target_id: friendId });
      if (res?.data?.warning) toast({ description: res.data.warning, duration: 6000 });
      if (res?.data?.conversation) openChatView(res.data.conversation);
    } catch (e) {
      toast({ title: 'Sohbet açılamadı', description: e.response?.data?.error || e.message, variant: 'destructive' });
    }
  };

  const openConversation = (conversation) => openChatView(conversation);

  const hide = (conversation) => {
    optimisticHide(conversation.id);
    if (selected?.id === conversation.id) { setSelected(null); setView('chats'); }
    base44.functions.invoke('dm-service', { action: 'delete_conversation', conversation_id: conversation.id }).catch(() => {});
  };

  const switchView = (next) => { setView(next); setSelected(null); setParams(next === 'chats' ? { view: 'chats' } : {}); };

  if (friendsLoading || convosLoading || !user) return <div className="p-6 text-gray-400">Yükleniyor...</div>;
  const incomingRequests = relations.filter((r) => r.status === 'pending' && r.recipient_id === user.id).length;
  const totalUnread = conversations.reduce((sum, c) => sum + (c.user1_id === user.id ? (c.unread_user1 || 0) : (c.unread_user2 || 0)), 0);

  if (view === 'chat') {
    const friendId = selected?.user1_id === user.id ? selected?.user2_id : selected?.user1_id;
    return <div className="mx-auto w-full min-w-0 max-w-5xl sm:p-4"><ChatPanel key={selected?.id} conversation={selected} userId={user.id} onBack={() => switchView('chats')} online={isOnline(friendId)} getLastSeen={getLastSeen} rooms={rooms} getRoomId={getRoomId} /></div>;
  }

  // Arkadaş listesi profilden gelindiğinde tam ekran açılır: kendi geri butonu vardır.
  if (view === 'friends') {
    return (
      <div
        className="dark min-h-[var(--app-height)] w-full text-white"
        style={{ background: 'radial-gradient(140% 80% at 50% 0%, #0E2A5A 0%, #071731 46%, #03081A 100%)' }}
      >
        <header className="sticky top-0 z-20 flex items-center gap-2 px-3 py-3" style={{ background: 'rgba(6,20,44,0.94)', borderBottom: '1px solid rgba(125,211,252,0.25)' }}>
          <button
            type="button"
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/profil'))}
            aria-label="Geri"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#7dd3fc]/30 bg-[#0b2a52] text-[#a5e4ff] active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="flex-1 text-center text-base font-extrabold text-[#a5e4ff]">Arkadaşlarım</h1>
          <span className="h-9 w-9" />
        </header>
        <div className="p-4">
          <FriendsPanel relations={relations} userId={user.id} invoke={invoke} onChat={openChat} isOnline={isOnline} getRoomId={getRoomId} rooms={rooms} />
        </div>
      </div>
    );
  }

  return (
    <div
      className="dark mx-auto min-h-[calc(100vh-8rem)] w-full min-w-0 max-w-5xl text-white supports-[height:100dvh]:min-h-[calc(100dvh-8rem)]"
      style={{ background: 'radial-gradient(120% 80% at 50% 0%, #3a1146 0%, #1b0a2a 46%, #0a0410 100%)' }}
    >
      {/* Aşağı çekerek tazeleme: arkadaşlar, istekler ve sohbetler yeniden okunur. */}
      <PullToRefresh onRefresh={() => { reloadFriends(); reloadConversations(); }}>
      <header className="px-4 py-5">
        <h1 className="text-2xl font-extrabold">Arkadaşlar</h1>
        <p className="text-sm text-gray-400 mt-1">Sohbet ve arkadaşlarını yönet.</p>
        <div className="mt-4 flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #b91c1c, #dc2626 52%, #f2ce6b)' }}>
            <MessageCircle className="w-4 h-4" /> Mesajlar
            {totalUnread > 0 && <span className="min-w-5 h-5 px-1 rounded-full bg-[#f2ce6b] text-black text-[10px] flex items-center justify-center">{totalUnread}</span>}
          </div>
          {/* Sistem bildirim butonu: tüm bildirimler buraya düşer, dokununca tam ekran açılır.
              Yönetici hesabında gösterilmez — bildirimler yönetim panelinden takip edilir. */}
          {!isModerator(user) && <NotificationBell />}
        </div>
      </header>

      <>
          {!isModerator(user) && (
            <button onClick={startAdminChat} disabled={adminLoading} className="w-full flex items-center gap-3 px-4 py-3 bg-[hsl(var(--secondary))] border-b border-white/5 text-left active:bg-[#1c1c24]">
              <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #b91c1c, #dc2626 52%, #f2ce6b)' }}><Shield className="w-4 h-4 text-white" /></span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white">Admin'e Mesaj Gönder</p>
                <p className="text-xs text-gray-400">Arkadaş eklemeden yöneticiye yazın</p>
              </div>
            </button>
          )}
          {/* Arkadaşlık istekleri doğrudan özel sohbet ekranında yönetilir. */}
          <div className="px-3 pt-2">
            <RoomFriendRequests relations={relations} userId={user.id} invoke={invoke} />
          </div>
          {conversations.length > 0 ? (
            <ConversationList conversations={conversations} userId={user.id} onOpen={openConversation} onHide={hide} isOnline={isOnline} getLastSeen={getLastSeen} rooms={rooms} getRoomId={getRoomId} />
          ) : (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <div className="relative w-20 h-20 rounded-full bg-[hsl(var(--secondary))] flex items-center justify-center mb-5">
                <MessageCircle className="w-10 h-10 text-[#f2ce6b]/50" />
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#f2ce6b] flex items-center justify-center text-[10px] font-bold text-black">!</span>
              </div>
              <h2 className="text-lg font-bold text-white mb-2">Henüz sohbetin yok</h2>
              <p className="text-sm text-gray-400 max-w-xs">Mesajlaşmak için arkadaşlarınla sohbet başlatabilirsin.</p>
            </div>
          )}
        </>
      </PullToRefresh>
    </div>
  );
}