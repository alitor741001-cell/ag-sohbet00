import { useEffect, useState, useRef } from 'react';
import { X, Shield } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { isModerator } from '@/lib/roles';
import useFriends from '@/hooks/useFriends';
import useConversations from '@/hooks/useConversations';
import useFriendPresence from '@/hooks/useFriendPresence';
import ConversationList from '@/components/friends/ConversationList';
import ChatPanel from '@/components/friends/ChatPanel';
import FriendRequestsButton from '@/components/friends/FriendRequestsButton';
import MessagesBannerInline from '@/components/friends/MessagesBannerInline';

export default function RoomDirectMessages({ onClose, initialUserId, onFullScreenChange }) {
  const { user, relations, loading: friendsLoading, invoke } = useFriends();
  const { conversations, loading: convosLoading, optimisticHide } = useConversations();
  const { toast } = useToast();
  const { isOnline } = useFriendPresence(user);
  const [adminLoading, setAdminLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const touchStart = useRef({ x: 0, y: 0 });

  // Panelden bir mesaj açıldığında üst katman tam ekrana geçer, geri dönünce yarım panelde kalır.
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

  if (friendsLoading || convosLoading || !user) return <div className="dark h-full bg-black p-6 text-sm text-muted-foreground">Yükleniyor...</div>;
  if (selected) {
    const friendId = selected.user1_id === user.id ? selected.user2_id : selected.user1_id;
    return <section className="room-direct-selected dark h-full min-h-0 w-full bg-black text-white pt-[max(env(safe-area-inset-top),1rem)] pb-[env(safe-area-inset-bottom)]"><ChatPanel conversation={selected} userId={user.id} onBack={() => setSelected(null)} online={isOnline(friendId)} embedded /></section>;
  }
  // Ana sayfadaki özel sohbet görünümü: aynı şerit görseli, aynı tema ve düğmeler.
  return (
    <section
      className="dark flex h-full w-full min-w-0 flex-col bg-[#040b1c] text-white"
      onTouchStart={(e) => { touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
      onTouchEnd={(e) => { const dx = e.changedTouches[0].clientX - touchStart.current.x; const dy = e.changedTouches[0].clientY - touchStart.current.y; if (dx > 80 && dx > Math.abs(dy) * 1.5) onClose(); }}
    >
      <MessagesBannerInline relations={relations} userId={user.id} />
      <header className="flex items-center justify-between gap-2 border-b border-[#F2CE6B]/25 px-4 py-2.5">
        <h2 className="flex-1 font-black uppercase tracking-wider text-[#F2CE6B]" style={{ textShadow: '0 0 6px rgba(255,214,120,0.8), 0 0 16px rgba(239,68,68,0.6)' }}>Sohbetler</h2>
        <FriendRequestsButton relations={relations} userId={user.id} invoke={invoke} />
        <button onClick={onClose} className="p-2" aria-label="Kapat"><X className="w-5 h-5" /></button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <ConversationList conversations={conversations} userId={user.id} onOpen={setSelected} onHide={hide} isOnline={isOnline} />
      </div>
    </section>
  );
}