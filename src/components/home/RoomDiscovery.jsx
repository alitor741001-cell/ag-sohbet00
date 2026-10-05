import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Film, Loader2, Mic } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import RoomDiscoveryCard from '@/components/home/RoomDiscoveryCard';
import { fetchYouTubeTitle, isGenericTitle, youtubeIdFromMovieId } from '@/lib/youtubeTitle';

const isVoiceRoom = (room) => room?.room_type === 'voice' || room?.voice_mode === true;
const EMPTY = [];

/**
 * Ana sayfa keşfet bölümü: koltuklu (sesli) odalar ile film odaları iki sekmede listelenir.
 * Her kartta odanın kapağı, açan kişi, kaç kişi olduğu ve odadaki profiller görünür.
 */
export default function RoomDiscovery() {
  const { user } = useCurrentUser();
  const [rooms, setRooms] = useState([]);
  const [owners, setOwners] = useState({});
  const [titles, setTitles] = useState({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('voice');

  const isAdmin = user?.role === 'admin';
  const isVisible = (room) =>
    !!room &&
    room.status === 'active' &&
    (isAdmin || !room.hidden) &&
    ((room.participants?.length || 0) > 0 || room.owner_id === user?.id);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const list = await base44.entities.Room.filter({ status: 'active' }, '-created_date', 100).catch(() => []);
      if (!alive) return;
      const live = list.filter((room) => isVisible(room));
      setRooms(live);
      setLoading(false);
      const ownerIds = [...new Set(live.map((room) => room.owner_id).filter(Boolean))];
      if (!ownerIds.length) return;
      const response = await base44.functions.invoke('user-profile', { user_ids: ownerIds }).catch(() => null);
      if (alive) setOwners(response?.data?.data || response?.data || {});
    };
    load();

    const unsubscribe = base44.entities.Room.subscribe((event) => {
      const data = event.data;
      if (event.type === 'delete') {
        setRooms((prev) => prev.filter((room) => room.id !== event.id));
        return;
      }
      if (!data) return;
      const room = { ...data, id: data.id || event.id };
      setRooms((prev) => {
        const rest = prev.filter((item) => item.id !== room.id);
        return isVisible(room) ? [room, ...rest] : rest;
      });
    });

    return () => {
      alive = false;
      unsubscribe();
    };
  }, [user?.id, user?.role]);

  const voiceRooms = useMemo(() => rooms.filter((room) => isVoiceRoom(room)), [rooms]);
  const filmRooms = useMemo(() => rooms.filter((room) => !isVoiceRoom(room)), [rooms]);

  // Film odalarında açılan videonun adı: kayıtlı başlık anlamsızsa YouTube'dan bir kez okunur.
  useEffect(() => {
    const ids = [...new Set(filmRooms.map((room) => youtubeIdFromMovieId(room.movie_id)).filter(Boolean))].slice(0, 12);
    if (!ids.length) return;
    let alive = true;
    const load = async () => {
      const pairs = await Promise.all(ids.map(async (id) => [id, await fetchYouTubeTitle(id)]));
      if (alive) setTitles((prev) => ({ ...prev, ...Object.fromEntries(pairs.filter(([, title]) => title)) }));
    };
    load();
    return () => { alive = false; };
  }, [filmRooms]);

  const filmTitleFor = (room) => {
    const stored = String(room.movie_title || '').trim();
    if (stored && !isGenericTitle(stored)) return stored;
    const videoId = youtubeIdFromMovieId(room.movie_id);
    if (videoId) return titles[videoId] || 'YouTube videosu';
    return 'Ekran paylaşımı';
  };

  const list = tab === 'voice' ? voiceRooms : filmRooms;

  return (
    <section className="mt-5">
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setTab('voice')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-2.5 text-[13px] font-extrabold transition ${
            tab === 'voice' ? 'border border-[#4caf50]/45 bg-[#4caf50]/15 text-[#4caf50]' : 'bg-white/5 text-white/50'
          }`}
        >
          <Mic className="h-4 w-4" /> Koltuklu Odalar
        </button>
        <button
          type="button"
          onClick={() => setTab('film')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-2.5 text-[13px] font-extrabold transition ${
            tab === 'film' ? 'border border-[#4caf50]/45 bg-[#4caf50]/15 text-[#4caf50]' : 'bg-white/5 text-white/50'
          }`}
        >
          <Film className="h-4 w-4" /> Film Odaları
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-white/40" />
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-8 text-center">
          <p className="text-sm font-bold">
            {tab === 'voice' ? 'Şu an açık koltuklu oda yok.' : 'Şu an açık film odası yok.'}
          </p>
          <Link
            to={tab === 'voice' ? '/sesli-oda-kur' : '/oda-kur'}
            className="mt-2 inline-block text-xs font-bold text-[#4caf50]"
          >
            {tab === 'voice' ? 'İlk koltuklu odayı sen aç →' : 'İlk film odasını sen aç →'}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {list.map((room) => (
            <RoomDiscoveryCard
              key={room.id}
              room={room}
              owner={owners[room.owner_id]}
              kind={tab === 'voice' ? 'voice' : 'film'}
              filmTitle={tab === 'film' ? filmTitleFor(room) : ''}
            />
          ))}
        </div>
      )}
    </section>
  );
}