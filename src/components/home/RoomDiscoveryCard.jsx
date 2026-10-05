import { Link } from 'react-router-dom';
import { BarChart3, Check, Film, Lock, Mic } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { youtubeIdFromMovieId } from '@/lib/youtubeTitle';

/** Ana sayfa keşfet ızgarasındaki kare oda kartı: kapağı, rozetleri, izleyici sayısı ve profilleri gösterir. */
export default function RoomDiscoveryCard({ room, owner, kind, filmTitle, friendInside }) {
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
      className="relative flex aspect-square flex-col overflow-hidden rounded-[20px] border border-white/10 bg-[#141419] transition-transform active:scale-[0.98]"
    >
      {/* Kapak kartı tamamen kaplar: kart kare kalır, bilgiler kapak üstünde durur. */}
      {cover ? (
        <Image src={cover} className="absolute inset-0 h-full w-full" fittingType="fill" alt="" />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3f0d0d, #111114)' }}>
          {isVoice ? <Mic className="h-8 w-8 text-white/30" /> : <Film className="h-8 w-8 text-white/30" />}
        </span>
      )}
      <span className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.94), rgba(0,0,0,0.42) 52%, rgba(0,0,0,0.12))' }} />

      <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-extrabold text-white">
        <span className="h-1.5 w-1.5 rounded-full bg-white" /> CANLI
      </span>

      {friendInside && (
        <span title="Arkadaşın" className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-[#22c55e] px-2 py-0.5 text-[10px] font-extrabold text-white shadow-[0_0_10px_rgba(34,197,94,0.7)]">
          <Check className="h-3 w-3" strokeWidth={3} /> Ekli
        </span>
      )}

      <div className="relative mt-auto flex min-w-0 flex-col gap-1 p-2.5">
        {!isVoice && filmTitle && (
          <span className="line-clamp-2 text-[11px] font-bold leading-tight text-white/90">{filmTitle}</span>
        )}
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
          <span className="ml-auto flex shrink-0 items-center gap-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-extrabold text-white">
            <BarChart3 className="h-3 w-3" style={{ color: '#00bcd4' }} /> {viewers}
          </span>
        </span>

        <span className="flex items-center gap-1">
          <span className="rounded-full bg-[#4caf50] px-2 py-0.5 text-[10px] font-extrabold text-white">
            {isVoice ? 'Koltuklu' : 'Film'}
          </span>
          <span className="ml-auto flex items-center gap-1">
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
              <span className="text-[10px] font-bold text-white/60">+{viewers - people.length}</span>
            )}
          </span>
        </span>
      </div>
    </Link>
  );
}