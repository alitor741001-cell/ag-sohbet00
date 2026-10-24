import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import useFriends from '@/hooks/useFriends';
import useConversations from '@/hooks/useConversations';
import useFriendPresence from '@/hooks/useFriendPresence';
import ConversationList from '@/components/friends/ConversationList';
import ChatPanel from '@/components/friends/ChatPanel';
import RoomChatThemeList from '@/components/player/RoomChatThemeList';
import useLiveBadges from '@/hooks/useLiveBadges';
import BackDismissLayer from '@/components/player/BackDismissLayer';
import FriendRequests from '@/pages/FriendRequests';
import Notifications from '@/pages/Notifications';
import AgencyMessages from '@/pages/AgencyMessages';

// Şeritteki üç dokunma alanı oda içinde tam ekran açılır; geri tuşu sohbete döner.
const ROOM_PANELS = { requests: FriendRequests, notes: Notifications, agency: AgencyMessages };

export default function RoomDirectMessages({ onClose, initialUserId, onFullScreenChange, closeOnBackdrop = false }) {
  const { user, relations, loading: friendsLoading, invoke } = useFriends();
  const { conversations, loading: convosLoading, optimisticHide } = useConversations();
  const { toast } = useToast();
  const { isOnline } = useFriendPresence(user);
  const liveBadges = useLiveBadges(user?.id);
  const [selected, setSelected] = useState(null);
  const [roomPanel, setRoomPanel] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);
  const touchStart = useRef({ x: 0, y: 0 });
  const Panel = roomPanel ? ROOM_PANELS[roomPanel] : null;

  // Panelde bir mesaj açıldığında üst katman tam ekrana geçer, geri dönünce panelde kalır.
  useEffect(() => { onFullScreenChange?.(!!selected); }, [selected, onFullScreenChange]);

  useEffect(() => {
    if (!initialUserId || !user?.id || initialUserId === user.id) return;
    base44.functions.invoke('dm-service', { action: 'start', target_id: initialUserId })
      .then((res) => { if (res?.data?.warning) toast({ description: res.data.warning, duration: 6000 }); if (res?.data?.conversation) setSelected(res.data.conversation); })
      .catch((e) => toast({ title: 'Sohbet açılamadı', description: e.response?.data?.error || e.message, variant: 'destructive' }));
  }, [initialUserId, user?.id]);

  const startAdminChat = async () => {
    setAdminLoading(true);
    try {
      const res = await base44.functions.invoke('friend-service', { action: 'start_admin_chat' });
      const adminId = res?.data?.admin_id;
      if (!adminId) { toast({ title: 'Yönetici bulunamadı' }); return; }
      const convoRes = await base44.functions.invoke('dm-service', { action: 'start', target_id: adminId });
      if (convoRes?.data?.warning) toast({ description: convoRes.data.warning, duration: 6000 });
      if (convoRes?.data?.conversation) { setSelected(convoRes.data.conversation); }
    } catch (e) {
      toast({ title: 'Başlatılamadı', description: e.response?.data?.error || e.message, variant: 'destructive' });
    } finally { setAdminLoading(false); }
  };

  const hide = (conversation) => {
    optimisticHide(conversation.id);
    if (selected?.id === conversation.id) setSelected(null);
    base44.functions.invoke('dm-service', { action: 'delete_conversation', conversation_id: conversation.id }).catch(() => {});
  };

  // İstekler / sistem bildirimleri / ajans mesajları da odanın üstünde yarım panel olarak açılır,
  // arkadaki koltuklar görünür kalır.
  const panelOverlay = Panel ? createPortal(
    <div className="dark fixed inset-0 z-[290] flex flex-col justify-end">
      <BackDismissLayer onClose={() => setRoomPanel('')} />
      <button type="button" aria-label="Kapat" onClick={() => setRoomPanel('')} className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" />
      <div className="relative flex h-[var(--voice-dm-height)] w-full flex-col overflow-hidden rounded-t-2xl bg-[#040b1c] pt-[env(safe-area-inset-top)] text-white">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <Panel onBack={() => setRoomPanel('')} />
        </div>
      </div>
    </div>,
    document.body,
  ) : null;

  if (friendsLoading || convosLoading || !user) return <div className="dark h-full bg-black p-6 text-sm text-muted-foreground">Yükleniyor...</div>;

  if (selected) {
    const friendId = selected.user1_id === user.id ? selected.user2_id : selected.user1_id;
    return (
      <section className="room-direct-selected dark flex h-full min-h-0 w-full flex-col bg-black text-white pt-[max(env(safe-area-inset-top),1rem)] pb-[env(safe-area-inset-bottom)]">
        <BackDismissLayer onClose={onClose} />
        <ChatPanel conversation={selected} userId={user.id} onBack={() => setSelected(null)} online={isOnline(friendId)} embedded />
        {panelOverlay}
      </section>
    );
  }

  // Ana sayfadaki özel sohbet tasarımının aynısı: aynı tema görseli ve sekmeler, tam ekran.
  const counts = {
    chats: conversations.reduce((sum, c) => sum + (c.user1_id === user.id ? (c.unread_user1 || 0) : (c.unread_user2 || 0)), 0),
    requests: relations.filter((r) => r.status === 'pending' && r.recipient_id === user.id).length,
    notes: liveBadges.notes,
    agency: liveBadges.agency,
  };
  return (
    <>
      <BackDismissLayer onClose={onClose} />
      <RoomChatThemeList counts={counts} onTab={setRoomPanel} onClose={closeOnBackdrop ? onClose : undefined}>
        <ConversationList conversations={conversations} userId={user.id} onOpen={setSelected} onHide={hide} isOnline={isOnline} />
      </RoomChatThemeList>
      {panelOverlay}
    </>
  );
}