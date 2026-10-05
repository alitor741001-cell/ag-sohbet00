import { Link } from 'react-router-dom';
import { BarChart3, Film, Lock, Mic } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { youtubeIdFromMovieId } from '@/lib/youtubeTitle';

/** Ana sayfa keşfet ızgarasındaki oda kartı: kapağı, rozeti, izleyici sayısı ve profilleri gösterir. */
export default function RoomDiscoveryCard({ room, owner, kind, filmTitle }) {
  const viewers = room.participants?.length || 0;
  const isVoice = kind === 'voice';
  const videoId = isVoice ? '' : youtubeIdFromMovieId(room.movie_id);
  const cover = isVoice ? owner?.avatar : videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '';
  const people = (room.participants || []).slice(0, 3);
  const ownerName = owner?.username || owner?.full_name || room.owner_name || 'Kullanıcı';
  const to = isVoice ? `/sesli-oda/${room.id}` : `/oda/${room.id}`;

  return (
    <Link
      to={to}
      className="flex flex-col overflow-hidden rounded-[20px] border border-white/10 bg-[#141419] transition-transform active:scale-[0.98]"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden" style={{ background: 'linear-gradient(135deg, #3f0d0d, #111114)' }}>
        {cover ? (
          <Image src={cover} className="h-full w-full" fittingType="fill" alt="" />
        ) : (
          <span className="flex h-full w-full items-center justify-center">
            {isVoice ? <Mic className="h-8 w-8 text-white/30" /> : <Film className="h-8 w-8 text-white/30" />}
          </span>
        )}
        <span className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.28) 55%, rgba(0,0,0,0.15))' }} />

        <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-extrabold text-white">
          <span className="h-1.5 w-1.5 rounded-full bg-white" /> CANLI
        </span>

        {!isVoice && filmTitle && (
          <span className="absolute inset-x-2 bottom-11 line-clamp-2 text-[11px] font-bold leading-tight text-white/95">
            {filmTitle}
          </span>
        )}

        <span className="absolute inset-x-2 bottom-2 flex items-end justify-between gap-1">
          <span className="rounded-full bg-[#4caf50] px-2 py-0.5 text-[10px] font-extrabold text-white">
            {isVoice ? 'Koltuklu' : 'Film'}
          </span>
          <span className="flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-extrabold text-white">
            <BarChart3 className="h-3 w-3" style={{ color: '#00bcd4' }} /> {viewers}
          </span>
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1 p-2.5">
        <p className="truncate text-[13px] font-extrabold text-white">{room.name}</p>
        <span className="flex items-center gap-1.5">
          {owner?.avatar ? (
            <Image src={owner.avatar} className="h-4 w-4 shrink-0 overflow-hidden rounded-full" fittingType="fill" alt="" />
          ) : (
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground">
              {(ownerName || '?')[0]}
            </span>
          )}
          <span className="truncate text-[11px] text-white/60">{ownerName}</span>
          {room.password && <Lock className="h-3 w-3 shrink-0 text-amber-400" />}
        </span>
        <span className="mt-auto flex items-center gap-1 pt-1">
          {people.map((person) => (
            <span key={person.user_id} className="h-5 w-5 overflow-hidden rounded-full border border-white/15 bg-black/50">
              {person.avatar ? (
                <Image src={person.avatar} className="h-full w-full" fittingType="fill" alt="" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-[8px] font-bold text-white">
                  {(person.name || '?')[0]}
                </span>
              )}
            </span>
          ))}
          {viewers > people.length && (
            <span className="text-[10px] font-bold text-white/45">+{viewers - people.length}</span>
          )}
        </span>
      </div>
    </Link>
  );
}