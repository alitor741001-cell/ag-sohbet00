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
import RoomFriendRequests from '@/components/friends/RoomFriendRequests';

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
  return <section className="dark flex h-full w-full min-w-0 flex-col border-l border-[#F2CE6B]/25 bg-gradient-to-b from-[#2C1512] to-[#150A0A] text-white pt-[max(env(safe-area-inset-top),1rem)] backdrop-blur-xl" onTouchStart={(e) => { touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }} onTouchEnd={(e) => { const dx = e.changedTouches[0].clientX - touchStart.current.x; const dy = e.changedTouches[0].clientY - touchStart.current.y; if (dx > 80 && dx > Math.abs(dy) * 1.5) onClose(); }}><header className="flex items-center justify-between border-b border-[#F2CE6B]/25 px-4 py-3"><h2 className="font-bold text-[#F2CE6B]">Sohbetler</h2><div className="flex items-center gap-1">{!isModerator(user) && <button onClick={startAdminChat} disabled={adminLoading} className="flex items-center gap-1.5 rounded-lg bg-primary/15 px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/25 disabled:opacity-50"><Shield className="w-3.5 h-3.5" /> Admin'e Mesaj</button>}<button onClick={onClose} className="p-2" aria-label="Kapat"><X className="w-5 h-5" /></button></div></header><RoomFriendRequests relations={relations} userId={user.id} invoke={invoke} /><div className="min-h-0 flex-1 overflow-y-auto"><ConversationList conversations={conversations} userId={user.id} onOpen={setSelected} onHide={hide} isOnline={isOnline} /></div></section>;
}