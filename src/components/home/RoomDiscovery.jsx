import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Film, Gamepad2, Loader2, Mic, Search } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import RoomDiscoveryCard from '@/components/home/RoomDiscoveryCard';
import GameDiscoveryRow from '@/components/home/GameDiscoveryRow';
import useFriends from '@/hooks/useFriends';
import useMessageProfiles from '@/hooks/useMessageProfiles';
import { fetchYouTubeTitle, isGenericTitle, youtubeIdFromMovieId } from '@/lib/youtubeTitle';

// Oyunlar ayrı indirilir: ana sayfa paketi küçük kalır.
const GamePanel = lazy(() => import('@/components/games/GamePanel'));

const isVoiceRoom = (room) => room?.room_type === 'voice' || room?.voice_mode === true;

/** Arama karşılaştırması: "TR555596" ile "555596" aynı üye kimliği sayılır. */
const normalizeId = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/^tr(?=\d)/, '');

/**
 * Ana sayfa keşfet bölümü: en üstte arkadaş şeridi, altında koltuklu odalar ve
 * film odaları sekmeleri, oda numarası / üye kimliği araması ve oda kartları.
 */
export default function RoomDiscovery() {
  const { user } = useCurrentUser();
  const { relations } = useFriends();
  const [rooms, setRooms] = useState([]);
  const [owners, setOwners] = useState({});
  const [titles, setTitles] = useState({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('voice');
  const [query, setQuery] = useState('');
  // Açık oyun: ana sayfadan seçilen oyun tam ekran oynanır.
  const [gameOpen, setGameOpen] = useState(null);

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

  const friends = useMemo(
    () =>
      relations
        .filter((relation) => relation.status === 'accepted')
        .map((relation) => {
          const mine = relation.requester_id === user?.id;
          return {
            id: (mine ? relation.recipient_id : relation.requester_id) || '',
            name: (mine ? relation.recipient_name : relation.requester_name) || 'Arkadaş',
            avatar: (mine ? relation.recipient_avatar : relation.requester_avatar) || '',
          };
        })
        .filter((friend) => friend.id),
    [relations, user?.id]
  );

  const friendProfiles = useMessageProfiles(friends.map((friend) => friend.id));
  const friendsWithProfiles = useMemo(
    () =>
      friends.map((friend) => {
        const profile = friendProfiles[friend.id];
        return {
          ...friend,
          name: profile?.username || profile?.full_name || friend.name,
          avatar: profile?.avatar || friend.avatar,
        };
      }),
    [friends, friendProfiles]
  );

  const friendIds = useMemo(() => friendsWithProfiles.map((friend) => friend.id), [friendsWithProfiles]);
  const hasFriendInside = (room) => {
    if (!friendIds.length) return false;
    const present = new Set([
      ...(room.participants || []).map((person) => person.user_id),
      ...(room.seats || []).map((seat) => seat.user_id),
    ]);
    return friendIds.some((id) => present.has(id));
  };

  // Ana ekranda herkes tek odasıyla görünür: kişinin en yeni odası listelenir.
  const uniqueRooms = useMemo(() => {
    const newest = new Map();
    rooms.forEach((room) => {
      const key = room.owner_id || room.id;
      const current = newest.get(key);
      if (!current || new Date(room.created_date || 0) > new Date(current.created_date || 0)) newest.set(key, room);
    });
    return [...newest.values()].sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));
  }, [rooms]);

  const voiceRooms = useMemo(() => uniqueRooms.filter((room) => isVoiceRoom(room)), [uniqueRooms]);
  const filmRooms = useMemo(() => uniqueRooms.filter((room) => !isVoiceRoom(room)), [uniqueRooms]);

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

  // Arkadaşının bulunduğu odalar her zaman en üstte görünür.
  const list = useMemo(() => {
    const tabRooms = tab === 'voice' ? voiceRooms : filmRooms;
    return [...tabRooms].sort((a, b) => Number(hasFriendInside(b)) - Number(hasFriendInside(a)));
  }, [tab, voiceRooms, filmRooms, friendIds]);
  const searching = query.trim().length > 0;

  // Arama açıkken iki sekme birlikte taranır: oda numarası veya üye kimliğiyle oda bulunur.
  const searched = useMemo(() => {
    const term = query.trim();
    if (!term) return list;
    const lowered = term.toLowerCase();
    const digits = term.replace(/[^0-9]/g, '');
    const memberTerm = normalizeId(term);
    return uniqueRooms.filter((room) => {
      const owner = owners[room.owner_id] || {};
      if (digits && String(room.room_number) === digits) return true;
      const ownerMember = normalizeId(owner.member_id);
      if (memberTerm && ownerMember && (ownerMember === memberTerm || ownerMember.includes(memberTerm))) return true;
      if (String(room.name || '').toLowerCase().includes(lowered)) return true;
      return `${owner.username || ''} ${owner.full_name || ''} ${room.owner_name || ''}`.toLowerCase().includes(lowered);
    });
  }, [query, list, uniqueRooms, owners]);

  const items = searching ? searched : list;

  return (
    <section className="mt-5">
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setTab('voice')}
          className={`flex min-w-0 flex-1 items-center justify-center gap-1 rounded-full py-2.5 text-[11px] font-extrabold transition ${
            tab === 'voice' ? 'border border-[#4caf50]/45 bg-[#4caf50]/15 text-[#4caf50]' : 'bg-white/5 text-white/50'
          }`}
        >
          <Mic className="h-4 w-4 shrink-0" /> <span className="truncate">Koltuklu Odalar</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('film')}
          className={`flex min-w-0 flex-1 items-center justify-center gap-1 rounded-full py-2.5 text-[11px] font-extrabold transition ${
            tab === 'film' ? 'border border-[#4caf50]/45 bg-[#4caf50]/15 text-[#4caf50]' : 'bg-white/5 text-white/50'
          }`}
        >
          <Film className="h-4 w-4 shrink-0" /> <span className="truncate">Film Odaları</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('games')}
          className={`flex min-w-0 flex-1 items-center justify-center gap-1 rounded-full py-2.5 text-[11px] font-extrabold transition ${
            tab === 'games' ? 'border border-[#f2ce6b]/50 bg-[#f2ce6b]/15 text-[#f2ce6b]' : 'bg-white/5 text-white/50'
          }`}
        >
          <Gamepad2 className="h-4 w-4 shrink-0" /> <span className="truncate">Oyunlar</span>
        </button>
      </div>

      {tab !== 'games' && (
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Oda numarası veya üye kimliği ara…"
          autoComplete="off"
          enterKeyHint="search"
          className="w-full rounded-full border border-white/10 bg-[#141419] py-2.5 pl-9 pr-3 text-[13px] font-medium text-white outline-none placeholder:text-white/35 focus:border-[#4caf50]/50"
        />
      </div>
      )}

      {tab === 'games' ? (
        <GameDiscoveryRow onPick={setGameOpen} />
      ) : loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-white/40" />
        </div>
      ) : items.length === 0 ? (
        searching ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-8 text-center">
            <p className="text-sm font-bold">Eşleşen oda yok.</p>
            <p className="mt-1 text-xs text-white/45">Oda numarasını veya üye kimliğini kontrol et.</p>
          </div>
        ) : (
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
        )
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((room) => {
            const kind = isVoiceRoom(room) ? 'voice' : 'film';
            return (
              <RoomDiscoveryCard
                key={room.id}
                room={room}
                owner={owners[room.owner_id]}
                kind={kind}
                filmTitle={kind === 'film' ? filmTitleFor(room) : ''}
                friendInside={hasFriendInside(room)}
              />
            );
          })}
        </div>
      )}

      {/* Seçilen oyun tam ekran açılır: oda kurmaya gerek yok. */}
      {gameOpen && (
        <Suspense fallback={null}>
          <GamePanel open initialGame={gameOpen} onClose={() => setGameOpen(null)} />
        </Suspense>
      )}
    </section>
  );
}