import { useMemo } from 'react';
import { History, Trash2 } from 'lucide-react';
import RoomDiscoveryCard from '@/components/home/RoomDiscoveryCard';
import useMessageProfiles from '@/hooks/useMessageProfiles';
import { clearVisitedRooms, readVisitedRooms } from '@/lib/visitedRooms';

const timeLabel = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
};

/** Son Ziyaretçiler: bugün girilen odalar, en yeni önce (her gece 24.00'da sıfırlanır).
    Aynı yayıncının birden çok odası tek kartta toplanır.
    Kartlar Sıcaklar'dakiyle aynı görünür: katılımcı avatarları ve kişi sayısı dahil. */
export default function RoomHistory({ version = 0, onChange, rooms = [], filmTitleFor }) {
  const items = useMemo(() => readVisitedRooms(), [version]);

  // Yayıncı kimliği önce kayıttan, yoksa hâlâ açık olan odadan çözülür.
  const ownerByRoom = useMemo(
    () => new Map((rooms || []).map((room) => [room.id, room.owner_id || ''])),
    [rooms]
  );
  // Açık odaların canlı verisi: katılımcılar ve kişi sayısı kartta gösterilir.
  const roomById = useMemo(
    () => new Map((rooms || []).map((room) => [room.id, room])),
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
        <p className="mt-1 text-[11px] font-semibold text-white/45">Bugün girdiğin odalar burada listelenir; liste her gece 24.00'da sıfırlanır.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <span className="h-3 w-1 rounded-full" style={{ background: 'linear-gradient(180deg,#ffe6a8,#7ff0e6)' }} />
        <h2 className="text-[10.5px] font-black tracking-[0.18em] text-[#ffe6a8]">SON GİRDİĞİN ODALAR</h2>
        <span className="ml-auto text-[10px] font-bold text-white/40">{entries.length}</span>
        <button
          type="button"
          onClick={() => { clearVisitedRooms(); onChange?.(); }}
          className="flex items-center gap-1 rounded-full border border-white/15 px-2 py-1 text-[9.5px] font-bold text-white/55"
        >
          <Trash2 className="h-3 w-3" /> Temizle
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {entries.map((entry, index) => {
          const voice = entry.kind === 'voice';
          const liveRoom = roomById.get(entry.id);
          // Açık odanın canlı verisi yoksa kayıttaki bilgilerle minimal oda nesnesi kurulur.
          const room = liveRoom || {
            id: entry.id,
            name: entry.name,
            movie_id: entry.movie_id,
            owner_id: entry.owner_id,
            owner_name: entry.owner_name,
            room_type: voice ? 'voice' : 'watch',
            voice_mode: voice,
            participants: [],
            seats: [],
            hidden: false,
            category: '',
          };
          const profile = profiles[entry.owner_id];
          const owner = {
            username: profile?.username || profile?.full_name || entry.owner_name || '',
            full_name: profile?.full_name || entry.owner_name || '',
            avatar: profile?.avatar || entry.owner_avatar || '',
          };
          return (
            <div key={entry.id} className="relative">
              <RoomDiscoveryCard
                room={room}
                owner={owner}
                kind={voice ? 'voice' : 'film'}
                filmTitle={voice ? '' : (filmTitleFor?.(liveRoom || room) || '')}
                rank={index < 3 ? index + 1 : 0}
              />
              <span className="mt-0.5 block text-center text-[9px] font-bold text-white/45">{timeLabel(entry.visited_at)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}