import { useEffect, useState } from 'react';
import { ArrowLeft, MessageCircle, Shield } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import MessagesHeaderArt from '@/components/friends/MessagesHeaderArt';
import FriendRequests from '@/pages/FriendRequests';
import Notifications from '@/pages/Notifications';
import AgencyMessages from '@/pages/AgencyMessages';

const INBOX_PANELS = { requests: FriendRequests, notes: Notifications, agency: AgencyMessages };
import ConversationList from '@/components/friends/ConversationList';
import FriendsPanel from '@/components/friends/FriendsPanel';
import ChatPanel from '@/components/friends/ChatPanel';
import NotificationBell from '@/components/friends/NotificationBell';
import FriendRequestsButton from '@/components/friends/FriendRequestsButton';
import useFriends from '@/hooks/useFriends';
import useConversations from '@/hooks/useConversations';
import useFriendPresence from '@/hooks/useFriendPresence';
import { useToast } from '@/components/ui/use-toast';
import { isModerator } from '@/lib/roles';
import useTabActivity from '@/components/layout/TabActivityContext';
import useLiveBadges from '@/hooks/useLiveBadges';
import useActiveRooms from '@/hooks/useActiveRooms';

export default function Friends() {
  const tabActive = useTabActivity();
  const { user, relations, loading: friendsLoading, invoke } = useFriends();
  const { conversations, loading: convosLoading, optimisticHide, reload: reloadConversations } = useConversations();
  const { isOnline, getLastSeen } = useFriendPresence(user);
  const { toast } = useToast();
  const liveBadges = useLiveBadges(user?.id);
  const navigate = useNavigate();
  const [adminLoading, setAdminLoading] = useState(false);
  const { rooms, getRoomId } = useActiveRooms(tabActive);
  const [inboxTab, setInboxTab] = useState('chats');

  // Özel sohbet bölümü kendini 5 saniyede bir tazeler: sohbet listesi, okunmamış sayıları
  // ve son mesaj önizlemesi canlı akış gecikse de (Android) güncel kalır.
  useEffect(() => {
    if (!tabActive) return;
    const interval = setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      reloadConversations();
    }, 5000);
    return () => clearInterval(interval);
  }, [reloadConversations, tabActive]);

  const [params, setParams] = useSearchParams();
  const [view, setView] = useState(() => {
    const target = params.get('view');
    return target === 'chats' ? target : 'friends';
  });
  const [selected, setSelected] = useState(null);

  // Adres çubuğu görünümün tek kaynağıdır: alt menüden sekmeye basıldığında, sohbetten
  // geri dönüldüğünde ya da geri tuşuyla gelindiğinde görünüm adresteki değere kurulur.
  useEffect(() => {
    if (!tabActive || params.get('chat')) return; // gizli sekmenin sohbeti ve taslağı korunur
    setView(params.get('view') === 'chats' ? 'chats' : 'friends');
  }, [params, tabActive]);

  useEffect(() => {
    const chatId = params.get('chat');
    if (!chatId || !tabActive) return;
    const convo = conversations.find((c) => c.id === chatId);
    if (convo) { setSelected(convo); setView('chat'); }
    else {
      base44.entities.Conversation.get(chatId)
        .then((c) => { if (c) { setSelected(c); setView('chat'); } })
        .catch(() => {});
    }
  }, [conversations, params, tabActive]);

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

  const InboxPanel = INBOX_PANELS[inboxTab];
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
      >
        <header className="sticky top-0 z-20 flex items-center gap-2 px-3 py-3 backdrop-blur-md" style={{ background: 'rgba(4,11,28,0.6)', borderBottom: '1px solid rgba(242,206,107,0.25)' }}>
          <button
            type="button"
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/profil'))}
            aria-label="Geri"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-premium-gold/30 bg-white/5 text-[#ffeec2] active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="flex-1 text-center text-base font-black uppercase tracking-[0.2em] text-[#ffeec2]" style={{ textShadow: '0 0 6px rgba(255,214,120,0.9), 0 0 18px rgba(239,68,68,0.75)' }}>Arkadaşlarım</h1>
          <span className="h-9 w-9" />
        </header>
        <div className="p-4">
          <FriendsPanel relations={relations} userId={user.id} invoke={invoke} onChat={openChat} isOnline={isOnline} getRoomId={getRoomId} rooms={rooms} />
        </div>
      </div>
    );
  }

  // Sohbet listesi tema görselinin içindeki örnek satırın üstüne opak panel olarak oturur:
  // tasarımdaki sabit içerik görünmez, liste kendi içinde kayar.
  return (
    <div className="dark fixed inset-0 z-10 text-white">
      <div className="design-screen">
        <div className="design-stage flex flex-col">
          {/* MESAJLAR başlığı ve dört neon sekme: tasarım görseli, sekmeler üstünde tıklanır. */}
          <MessagesHeaderArt counts={{ chats: totalUnread, requests: incomingRequests, notes: liveBadges.notes, agency: liveBadges.agency }} active={inboxTab} onSelect={setInboxTab} />
          <div className="mx-[5%] flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              {InboxPanel ? <InboxPanel embedded onBack={() => setInboxTab('chats')} /> : conversations.length > 0 ? (
                <ConversationList conversations={conversations} userId={user.id} onOpen={openConversation} onHide={hide} isOnline={isOnline} getLastSeen={getLastSeen} rooms={rooms} getRoomId={getRoomId} />
              ) : (
                <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                  <div className="relative w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-5">
                    <MessageCircle className="w-10 h-10 text-[#f2ce6b]/50" />
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#f2ce6b] flex items-center justify-center text-[10px] font-bold text-black">!</span>
                  </div>
                  <h2 className="text-lg font-bold text-white mb-2">Henüz sohbetin yok</h2>
                  <p className="text-sm text-gray-400 max-w-xs">Mesajlaşmak için arkadaşlarınla sohbet başlatabilirsin.</p>
                </div>
              )}
            </div>
          </div>
          <div className="shrink-0" style={{ height: '13.5%' }} aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}