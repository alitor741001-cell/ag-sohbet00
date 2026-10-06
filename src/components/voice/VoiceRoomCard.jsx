import { Link } from 'react-router-dom';
import { Lock, Mic, Users } from 'lucide-react';
import { prefetchRoomCancel, prefetchRoomSoon } from '@/lib/roomPrefetch';

/** Açık odalar listesindeki sesli sohbet odası kartı. `action` yönetici oda menüsü için ayrılmıştır. */
export default function VoiceRoomCard({ room, action }) {
  const seats = room.seat_count || (room.seats || []).length;
  const speakers = (room.seats || []).filter((seat) => seat.user_id).length;

  return (
    <div
      className="flex items-center gap-3 rounded-2xl border border-white/5 bg-[#16161e] p-3"
      onPointerDown={() => prefetchRoomSoon(room.id)}
      onPointerMove={() => prefetchRoomCancel(room.id)}
      onPointerUp={() => prefetchRoomCancel(room.id)}
      onPointerLeave={() => prefetchRoomCancel(room.id)}
    >
      <Link to={`/sesli-oda/${room.id}`} className="flex min-w-0 flex-1 items-center gap-3 active:scale-[0.99] transition-transform">
        <div className="flex shrink-0 flex-col items-center gap-1">
          <div className="flex h-14 w-14 items-center justify-center rounded-full" style={{ background: 'linear-gradient(135deg, #dc2626, #991b1b)' }}>
            <Mic className="h-6 w-6 text-white" />
          </div>
          <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
            <Users className="h-2.5 w-2.5" /> {room.participants?.length || 0}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-white">{room.name}</p>
          <p className="mt-0.5 truncate text-xs text-gray-400">{room.owner_name || 'Kullanıcı'}</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-bold text-red-300">{seats} Mikrofon</span>
            <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-gray-400">{speakers} konuşmacı</span>
            {room.hidden && <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-gray-400">Gizli</span>}
            {room.password && (
              <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-400">
                <Lock className="h-2.5 w-2.5" /> Kilitli
              </span>
            )}
          </div>
        </div>
      </Link>
      <div className="flex shrink-0 flex-col items-center gap-1.5">
        {action}
        <Link to={`/sesli-oda/${room.id}`} className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground">Katıl</Link>
      </div>
    </div>
  );
}