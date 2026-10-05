import { Link } from 'react-router-dom';
import { Image } from '@/components/ui/image';

/** Oda yolunu oda tipine göre kurar (koltuklu odalar ayrı sayfada açılır). */
const roomPath = (room) =>
  room.room_type === 'voice' || room.voice_mode ? `/sesli-oda/${room.id}` : `/oda/${room.id}`;

/**
 * Keşfet üstündeki arkadaş şeridi: çevrim içi arkadaşlar başta gelir.
 * Odada olan arkadaş odaya, diğerleri profiline gider.
 */
export default function FriendStrip({ friends, rooms, isOnline, getRoomId }) {
  const roomById = new Map((rooms || []).map((room) => [room.id, room]));

  return (
    <div className="mb-4">
      <p className="mb-2 text-[11px] font-black uppercase tracking-wider text-white/50">Arkadaşların</p>
      <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
        {friends.map((friend) => {
          const online = isOnline(friend.id);
          const room = roomById.get(getRoomId(friend.id));
          const to = room ? roomPath(room) : `/kullanici/${friend.id}`;
          const status = room ? 'Odada' : online ? 'Çevrim içi' : 'Çevrim dışı';

          return (
            <Link
              key={friend.id}
              to={to}
              className="flex w-14 shrink-0 flex-col items-center gap-1 transition-transform active:scale-95"
            >
              <span className="relative h-12 w-12">
                <span className="block h-full w-full overflow-hidden rounded-full border border-white/15 bg-black/40">
                  {friend.avatar ? (
                    <Image src={friend.avatar} className="h-full w-full" fittingType="fill" alt="" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-sm font-bold text-white">
                      {(friend.name || '?')[0]}
                    </span>
                  )}
                </span>
                <span
                  className={`absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-[#0a0a0f] ${
                    online ? 'bg-green-500' : 'bg-white/30'
                  }`}
                />
              </span>
              <span className="w-full truncate text-center text-[10px] font-bold text-white">{friend.name}</span>
              <span
                className={`w-full truncate text-center text-[9px] ${
                  room ? 'text-[#4caf50]' : online ? 'text-green-500' : 'text-white/40'
                }`}
              >
                {status}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}