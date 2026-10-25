import { useEffect, useRef, useState } from 'react';
import { ChevronRight, Trash2 } from 'lucide-react';
import ProfileFrame from '@/components/ProfileFrame';
import XpAvatar from '@/components/xp/XpAvatar';
import useMessageProfiles from '@/hooks/useMessageProfiles';
import { getAccountState } from '@/components/friends/AccountStatusAvatar';
import { useMessageRealtime } from '@/components/messages/MessageRealtimeProvider';
import LiveBadge from '@/components/friends/LiveBadge';
import NeonMessageCard from '@/components/friends/NeonMessageCard';
import { findLiveRoom } from '@/lib/liveRoom';
import { parseInviteMarker } from '@/lib/agency';
import { useUserProfile } from '@/lib/profileCard';
import { parseRoomShareMarker } from '@/lib/roomShare';

export default function ConversationList({ conversations, userId, onOpen, onHide, isOnline, getLastSeen, rooms, getRoomId }) {
  const { openUserProfile } = useUserProfile();
  const [swiped, setSwiped] = useState(null);
  const { isTyping } = useMessageRealtime();
  const otherIds = conversations.map((c) => c.user1_id === userId ? c.user2_id : c.user1_id);
  const profiles = useMessageProfiles(otherIds);
  useEffect(() => { setSwiped(null); }, [conversations]);
  const touchStart = useRef({ x: 0, y: 0 });
  const swipingRef = useRef(false);
  const chats = conversations.map((c) => {
    const mine = c.user1_id === userId;
    const name = mine ? c.user2_name : c.user1_name;
    const avatar = mine ? c.user2_avatar : c.user1_avatar;
    const otherId = mine ? c.user2_id : c.user1_id;
    const unread = mine ? (c.unread_user1 || 0) : (c.unread_user2 || 0);
    return { conversation: c, name, avatar, otherId, unread };
  }).sort((a, b) => new Date(b.conversation.last_message_at || b.conversation.updated_date || 0) - new Date(a.conversation.last_message_at || a.conversation.updated_date || 0));
  // Aynı kişiyle birden çok sohbet kaydı tek satırda gösterilir (en yenisi kalır).
  const seenChats = new Set();
  const visibleChats = chats.filter((chat) => {
    const key = chat.otherId || chat.conversation.id;
    if (seenChats.has(key)) return false;
    seenChats.add(key);
    return true;
  });
  if (!visibleChats.length) return <p className="py-16 text-center text-sm text-muted-foreground">Henüz sohbetiniz yok.</p>;
  return <div>{visibleChats.map(({ conversation, name, avatar, otherId, unread }) => {
    // Çevrim dışı mod: arkadaş bu sohbette offline görünüyorsa
    const profile = profiles[otherId];
    const friendOffline = (conversation.offline_for || []).includes(otherId);
    const realOnline = isOnline ? isOnline(otherId) : false;
    const online = !friendOffline && realOnline;
    const typing = isTyping(conversation.id, otherId);
    const lastSeen = getLastSeen ? getLastSeen(otherId) : null;
    const accountState = getAccountState(profile, name);
    // Karşı taraf bir odada yayındaysa satırda "Yayında" görünür.
    const liveRoom = findLiveRoom(rooms, otherId, getRoomId ? getRoomId(otherId) : '');
    const inviteCard = parseInviteMarker(conversation.last_message_text);
    const shareCard = parseRoomShareMarker(conversation.last_message_text);

    return <div key={conversation.id} className="relative overflow-hidden">
      {/* Sil butonu — sadece swipe ile görünür */}
      <button
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); onHide(conversation); }}
        onTouchEnd={(e) => e.stopPropagation()}
        className="absolute inset-y-0 right-0 w-20 bg-destructive text-destructive-foreground flex flex-col items-center justify-center text-xs font-semibold"
      >
        <Trash2 className="w-5 h-5 mb-1" /> Sil
      </button>
      <div
        onTouchStart={(e) => { touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
        onTouchEnd={(e) => {
          const distance = touchStart.current.x - e.changedTouches[0].clientX;
          const vertical = Math.abs(touchStart.current.y - e.changedTouches[0].clientY);
          if (distance > 55 && distance > vertical * 1.5) {
            setSwiped(conversation.id);
            swipingRef.current = true;
            setTimeout(() => { swipingRef.current = false; }, 350);
          } else if (distance < -30) {
            setSwiped(null);
          }
        }}
        onClick={() => {
          if (swipingRef.current) return;
          onOpen(conversation);
        }}
        className={`relative z-10 w-full cursor-pointer px-3 py-2 transition-transform bg-black ${swiped === conversation.id ? '-translate-x-20' : 'translate-x-0'}`}
      >
        <NeonMessageCard
          gender={profile?.gender}
          name={name}
          avatar={profile?.avatar || avatar}
          time={conversation.last_message_at ? new Date(conversation.last_message_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : ''}
          aside={<ChevronRight className="h-5 w-5" />}
          badge={<>{liveRoom && <LiveBadge />}{unread > 0 && <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-black bg-[#f2ce6b] px-1 text-[10px] font-bold text-black">{unread}</span>}</>}
          footer={<span className="truncate">{typing ? `${name} yazıyor...` : liveRoom ? 'Yayında' : (online && !accountState) ? 'Çevrim içi' : lastSeen ? `Son görülme: ${new Date(lastSeen).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}` : 'Çevrim dışı'}</span>}
        >
          <p className={`truncate ${unread > 0 ? 'font-semibold' : ''}`}>{inviteCard ? '🎤 Yayıncı Daveti' : shareCard ? '🎬 Yayın paylaşıldı' : conversation.last_message_text || 'Sohbeti başlatın.'}</p>
        </NeonMessageCard>
      </div>
    </div>;
  })}</div>;
}