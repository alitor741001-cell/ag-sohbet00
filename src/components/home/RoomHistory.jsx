import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { History, Mic, Trash2 } from 'lucide-react';
import { Image } from '@/components/ui/image';
import useMessageProfiles from '@/hooks/useMessageProfiles';
import { clearVisitedRooms, readVisitedRooms } from '@/lib/visitedRooms';
import { youtubeIdFromMovieId } from '@/lib/youtubeTitle';

const timeLabel = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
};

/** Son Ziyaretçiler: son bir haftada girilen odalar, en yeni önce.
    Aynı yayıncının birden çok odası tek kartta toplanır. */
export default function RoomHistory({ version = 0, onChange, rooms = [] }) {
  const items = useMemo(() => readVisitedRooms(), [version]);

  // Yayıncı kimliği önce kayıttan, yoksa hâlâ açık olan odadan çözülür.
  const ownerByRoom = useMemo(
    () => new Map((rooms || []).map((room) => [room.id, room.owner_id || ''])),
    [rooms]
  );

  // Kişi başına tek kart: listedeki en yeni ziyaret korunur, tekrarlar elenir.
  const entries = useMemo(() => {
    const seen = new Set();
    const kept = [];
    items.forEach((item) => {
      const ownerId = item.owner_id || ownerByRoom.get(item.id) || '';
      const key = ownerId || item.owner_name || item.id;
      if (seen.has(key)) return;
      seen.add(key);
      kept.push({ ...item, owner_id: ownerId });
    });
    return kept;
  }, [items, ownerByRoom]);

  const profiles = useMessageProfiles(entries.map((entry) => entry.owner_id));

  if (!entries.length) {
    return (
      <div className="premium-panel rounded-2xl px-4 py-10 text-center">
        <History className="mx-auto mb-2 h-6 w-6 text-premium-gold/70" />
        <p className="text-sm font-bold text-white">Henüz bir odaya girmedin.</p>
        <p className="mt-1 text-[11px] font-semibold text-white/45">Son bir haftada girdiğin odalar burada listelenir.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <span className="h-3 w-1 rounded-full" style={{ background: 'linear-gradient(180deg,#ffe6a8,#7ff0e6)' }} />
        <h2 className="text-[10.5px] font-black tracking-[0.18em] text-[#ffe6a8]">SON GİRDİĞİN ODALAR</h2>
        <button
          type="button"
          onClick={() => { clearVisitedRooms(); onChange?.(); }}
          className="ml-auto flex items-center gap-1 rounded-full border border-white/15 px-2 py-1 text-[9.5px] font-bold text-white/55"
        >
          <Trash2 className="h-3 w-3" /> Temizle
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {entries.map((room) => {
          const voice = room.kind === 'voice';
          const videoId = voice ? '' : youtubeIdFromMovieId(room.movie_id);
          const cover = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '';
          const profile = profiles[room.owner_id];
          const ownerName = profile?.username || profile?.full_name || room.owner_name || '';
          const ownerAvatar = profile?.avatar || room.owner_avatar || '';
          return (
            <Link
              key={room.id}
              to={voice ? `/sesli-oda/${room.id}` : `/oda/${room.id}`}
              className="relative flex aspect-square flex-col overflow-hidden rounded-[20px] bg-[#07162f] active:scale-[0.98]"
              style={{ boxShadow: '0 0 0 1.5px rgba(232,196,124,0.7), 0 0 20px -8px rgba(79,216,207,0.6)' }}
            >
              {cover ? (
                <Image src={cover} className="absolute inset-0 h-full w-full" fittingType="fill" alt="" />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#0b2144] to-[#04081a]">
                  <Mic className="h-8 w-8 text-premium-gold/50" />
                </span>
              )}
              <span
                className="absolute inset-0"
                style={{ background: 'linear-gradient(to top, rgba(6,16,34,0.96), rgba(6,16,34,0.35) 60%, transparent)' }}
              />
              <span className="relative mt-auto p-2.5">
                {ownerName && (
                  <span className="mb-1 flex min-w-0 items-center gap-1.5">
                    <span className="h-5 w-5 shrink-0 overflow-hidden rounded-full border border-[#ffe6a8]/70 bg-[#0f2a4a]">
                      {ownerAvatar ? (
                        <Image src={ownerAvatar} className="h-full w-full" fittingType="fill" alt="" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-[9px] font-black text-[#ffe6a8]">
                          {ownerName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </span>
                    <span className="truncate text-[10px] font-bold text-[#ffe6a8]/90">{ownerName}</span>
                  </span>
                )}
                <span className="line-clamp-2 block text-[12px] font-extrabold leading-tight text-white">{room.name}</span>
                <span className="mt-1 flex items-center gap-1.5">
                  <span className="rounded-full border border-[#ffe6a8]/50 bg-[#0f3b52]/80 px-2 py-0.5 text-[9px] font-black text-white">
                    {voice ? 'Sesli' : 'Film'}
                  </span>
                  <span className="ml-auto text-[9px] font-bold text-white/45">{timeLabel(room.visited_at)}</span>
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}