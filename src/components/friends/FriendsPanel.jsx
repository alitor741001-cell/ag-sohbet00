import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';
import useMessageProfiles from '@/hooks/useMessageProfiles';
import FriendRequests from '@/components/friends/FriendRequests';
import FriendRow from '@/components/friends/FriendRow';
import { getAccountState } from '@/components/friends/AccountStatusAvatar';
import FullUserProfile from '@/components/profile/FullUserProfile';
import { findLiveRoom } from '@/lib/liveRoom';
import CrystalCard from '@/components/profile/fantasy/CrystalCard';

/** Profilden açılan arkadaş listesi: kristal kart içinde arkadaşlar ve istekler. */
export default function FriendsPanel({ relations, userId, invoke, onChat, isOnline, getRoomId, rooms }) {
  const [menuFor, setMenuFor] = useState(null);
  // Profil kartı: arkadaşa dokununca özel sohbetteki kartın aynısı açılır.
  const [cardUser, setCardUser] = useState(null);
  const navigate = useNavigate();
  const friends = relations.filter((r) => r.status === 'accepted');
  const friendIds = friends.map((r) => (r.requester_id === userId ? r.recipient_id : r.requester_id));
  const profiles = useMessageProfiles(friendIds);
  const action = async (type, relation) => { await invoke({ action: type, friendship_id: relation.id }); setMenuFor(null); };

  return (
    <div className="space-y-3">
      <FriendRequests relations={relations} userId={userId} invoke={invoke} />

      <CrystalCard>
        <div className="flex items-center gap-3 border-b border-[#7dd3fc]/20 px-4 py-3">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{ background: 'rgba(56,189,248,0.14)', border: '1px solid rgba(125,211,252,0.35)' }}
          >
            <Users className="h-4 w-4 text-[#a5e4ff]" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-black text-white">Arkadaşlarım</p>
            <p className="text-[10.5px] font-semibold text-[#a5e4ff]/60">{friends.length} arkadaş</p>
          </div>
        </div>

        {!friends.length ? (
          <div className="px-4 py-10 text-center">
            <Users className="mx-auto h-8 w-8 text-[#7dd3fc]/35" />
            <p className="mt-2 text-sm font-bold text-white/75">Henüz arkadaşın yok</p>
            <p className="mt-1 text-[11px] font-semibold text-white/40">Arama bölümünden üye numarasıyla arkadaş ekleyebilirsin.</p>
          </div>
        ) : friends.map((r) => {
          const friendId = r.requester_id === userId ? r.recipient_id : r.requester_id;
          const name = r.requester_id === userId ? r.recipient_name : r.requester_name;
          const avatar = r.requester_id === userId ? r.recipient_avatar : r.requester_avatar;
          const member = r.requester_id === userId ? r.recipient_member_id : r.requester_member_id;
          const profile = profiles[friendId];
          const liveRoom = findLiveRoom(rooms, friendId, getRoomId ? getRoomId(friendId) : '');
          const accountState = getAccountState(profile, name);
          const openCard = () => setCardUser({
            id: friendId,
            name,
            avatar: profile?.avatar || avatar,
            frame: profile?.profile_frame,
            frameScale: profile?.profile_frame_scale,
          });
          return (
            <FriendRow
              key={r.id}
              name={name}
              member={member}
              avatar={profile?.avatar || avatar}
              friendId={friendId}
              frame={profile?.profile_frame}
              online={isOnline(friendId)}
              liveRoom={liveRoom}
              showStatusDot={!accountState && !liveRoom}
              menuOpen={menuFor === r.id}
              onToggleMenu={() => setMenuFor(menuFor === r.id ? null : r.id)}
              onOpenCard={openCard}
              onChat={() => onChat(r)}
              onUnfriend={() => action('unfriend', r)}
              onBlock={() => action('block', r)}
              onJoin={() => liveRoom?.isPublic && navigate(liveRoom.link)}
            />
          );
        })}
      </CrystalCard>

      {cardUser && (
        <FullUserProfile
          userId={cardUser.id}
          name={cardUser.name}
          avatar={cardUser.avatar}
          frame={cardUser.frame}
          frameScale={cardUser.frameScale}
          onClose={() => setCardUser(null)}
          onMessage={() => {
            const relation = relations.find((r) => (r.requester_id === userId ? r.recipient_id : r.requester_id) === cardUser.id);
            setCardUser(null);
            if (relation) onChat(relation);
          }}
        />
      )}
    </div>
  );
}