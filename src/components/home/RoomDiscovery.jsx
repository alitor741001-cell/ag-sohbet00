import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
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
export default function RoomDiscovery({ shortcuts = null }) {
  const { user } = useCurrentUser();
  const { relations } = useFriends();
  const [allRooms, setAllRooms] = useState([]);
  const [owners, setOwners] = useState({});
  const [titles, setTitles] = useState({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('voice');
  const [query, setQuery] = useState('');
  // Açık oyun: ana sayfadan seçilen oyun tam ekran oynanır.
  const [gameOpen, setGameOpen] = useState(null);

  // Gizlendiğini bildiğimiz odalar kimliğiyle işaretlenir: canlı güncelleme gelse
  // de ana sayfaya geri dönmez (olay yalnızca değişen alanları taşıyabilir).
  const hiddenIdsRef = useRef(new Set());

  // Gizli oda hiçbir listede görünmez: sahibinin ve yöneticinin listesinde de kartı çıkmaz.
  const isCandidate = (room) =>
    !!room &&
    room.status === 'active' &&
    room.hidden !== true &&
    !hiddenIdsRef.current.has(room.id);

  // Oda açıldığı anda listelenir; çevrim içi işaretçisi beklenmez.
  // Görünürlük yalnızca odanın aktif ve gizlenmemiş olmasına bağlıdır.
  const rooms = allRooms;

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const list = await base44.entities.Room.filter({ status: 'active' }, '-created_date', 100).catch(() => []);
      if (!alive) return;
      const live = list.filter((room) => {
        if (room.hidden === true) hiddenIdsRef.current.add(room.id);
        else hiddenIdsRef.current.delete(room.id);
        return isCandidate(room);
      });
      setAllRooms(live);
      setLoading(false);
      const ownerIds = [...new Set(live.map((room) => room.owner_id).filter(Boolean))];
      if (!ownerIds.length) return;
      const response = await base44.functions.invoke('user-profile', { user_ids: ownerIds }).catch(() => null);
      if (alive) setOwners(response?.data?.data || response?.data || {});
    };
    load();

    // Oda olayları çok sık gelir (koltuk, sayaç, hediye): hepsi toplanıp tek seferde
    // uygulanır, böylece ana sayfa saniyede defalarca yeniden çizilmez.
    const pending = new Map();
    let flushTimer = null;
    const flush = () => {
      flushTimer = null;
      const events = [...pending.values()];
      pending.clear();
      if (!events.length) return;
      setAllRooms((prev) => {
        let next = prev;
        events.forEach((event) => {
          const data = event.data;
          if (event.type === 'delete') {
            next = next.filter((room) => room.id !== event.id);
            return;
          }
          if (!data) return;
          const id = data.id || event.id;
          const known = next.find((item) => item.id === id);
          // Canlı olay yalnızca değişen alanları taşıyabilir: kayıt eskisiyle birleştirilir,
          // aksi halde gizli oda kısmi güncellemeyle ana sayfaya geri gelir.
          const room = known ? { ...known, ...data, id } : { ...data, id };
          const rest = next.filter((item) => item.id !== id);
          // Liste ham tutulur: odanın açık sayılıp sayılmadığı çevrim içi kişilere göre ayrıca hesaplanır.
          next = isCandidate(room) ? [room, ...rest] : rest;
        });
        return next;
      });
    };
    const unsubscribe = base44.entities.Room.subscribe((event) => {
      const data = event.data;
      const id = data?.id || event.id;
      // Sunucu "gizli" derse işaretlenir, "görünür" derse işaret kalkar.
      if (data?.hidden === true) hiddenIdsRef.current.add(id);
      else if (data?.hidden === false) hiddenIdsRef.current.delete(id);
      pending.set(id, event);
      // Kısa bir toplama penceresi: kartlar gözle görülür bir gecikme olmadan güncellenir.
      if (!flushTimer) flushTimer = window.setTimeout(flush, 250);
    });

    return () => {
      alive = false;
      if (flushTimer) window.clearTimeout(flushTimer);
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
  // Arkadaşın bulunduğu odalar bir kez hesaplanır: kart çiziminde tekrar tekrar
  // katılımcı listesi taranmaz, arama sabit maliyetli olur.
  const friendRoomIds = useMemo(() => {
    const ids = new Set();
    if (!friendIds.length) return ids;
    rooms.forEach((room) => {
      const present = new Set([
        ...(room.participants || []).map((person) => person.user_id),
        ...(room.seats || []).map((seat) => seat.user_id),
      ]);
      if (friendIds.some((id) => present.has(id))) ids.add(room.id);
    });
    return ids;
  }, [rooms, friendIds]);
  const hasFriendInside = (room) => friendRoomIds.has(room.id);

  // Ana ekranda herkes tek odasıyla görünür: kişinin en son kullandığı oda listelenir,
  // böylece kart kişinin o an içinde olduğu odayı ve modunu (film/koltuklu) yansıtır.
  const uniqueRooms = useMemo(() => {
    const latest = new Map();
    rooms.forEach((room) => {
      const key = room.owner_id || room.id;
      const current = latest.get(key);
      const stamp = (item) => new Date(item.updated_date || item.created_date || 0);
      if (!current || stamp(room) > stamp(current)) latest.set(key, room);
    });
    return [...latest.values()].sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));
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
    // Film adları yalnızca etiket: ilk boyamayı ve oda listesini bekletmez,
    // tarayıcı boşa çıktığında çekilir.
    const idle = window.requestIdleCallback ? window.requestIdleCallback.bind(window) : (callback) => window.setTimeout(callback, 1200);
    const cancelIdle = window.cancelIdleCallback ? window.cancelIdleCallback.bind(window) : window.clearTimeout;
    const handle = idle(load, { timeout: 3000 });
    return () => { alive = false; cancelIdle(handle); };
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
  }, [tab, voiceRooms, filmRooms, friendRoomIds]);
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
    <section>
      <div className="mb-3 flex items-center gap-1.5 rounded-2xl border border-premium-gold/20 bg-black/25 p-1 backdrop-blur">
        <button
          type="button"
          onClick={() => setTab('voice')}
          className={`flex min-w-0 flex-1 items-center justify-center gap-1 rounded-xl py-2 text-[10.5px] font-extrabold transition ${
            tab === 'voice'
              ? 'border border-premium-gold/55 bg-gradient-to-r from-premium-red-deep via-premium-red to-premium-gold text-white shadow-[0_0_18px_-6px_rgba(198,40,40,0.95)]'
              : 'border border-transparent text-white/60'
          }`}
        >
          <Mic className="h-4 w-4 shrink-0" /> <span className="truncate">Koltuklu Odalar</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('film')}
          className={`flex min-w-0 flex-1 items-center justify-center gap-1 rounded-xl py-2 text-[10.5px] font-extrabold transition ${
            tab === 'film'
              ? 'border border-premium-gold/55 bg-gradient-to-r from-premium-red-deep via-premium-red to-premium-gold text-white shadow-[0_0_18px_-6px_rgba(198,40,40,0.95)]'
              : 'border border-transparent text-white/60'
          }`}
        >
          <Film className="h-4 w-4 shrink-0" /> <span className="truncate">Film Odaları</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('games')}
          className={`flex min-w-0 flex-1 items-center justify-center gap-1 rounded-xl py-2 text-[10.5px] font-extrabold transition ${
            tab === 'games'
              ? 'border border-premium-gold/55 bg-gradient-to-r from-premium-red-deep via-premium-red to-premium-gold text-white shadow-[0_0_18px_-6px_rgba(198,40,40,0.95)]'
              : 'border border-transparent text-white/60'
          }`}
        >
          <Gamepad2 className="h-4 w-4 shrink-0" /> <span className="truncate">Oyunlar</span>
        </button>
      </div>

      {tab !== 'games' && (
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-premium-gold/80" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Oda numarası veya üye kimliği ara…"
          autoComplete="off"
          enterKeyHint="search"
          className="w-full rounded-2xl border border-premium-gold/30 bg-black/30 py-2.5 pl-9 pr-3 text-[13px] font-medium text-white outline-none backdrop-blur transition placeholder:text-white/40 focus:border-premium-gold/60 focus:shadow-[0_0_18px_-6px_rgba(198,40,40,0.8)]"
        />
      </div>
      )}

      {shortcuts}

      {tab === 'games' ? (
        <GameDiscoveryRow onPick={setGameOpen} />
      ) : loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-premium-gold/70" />
        </div>
      ) : items.length === 0 ? (
        searching ? (
          <div className="premium-panel rounded-2xl px-4 py-8 text-center">
            <p className="text-sm font-bold text-premium-gold">Eşleşen oda yok.</p>
            <p className="mt-1 text-xs text-white/45">Oda numarasını veya üye kimliğini kontrol et.</p>
          </div>
        ) : (
          <div className="premium-panel rounded-2xl px-4 py-8 text-center">
            <p className="text-sm font-bold text-white">
              {tab === 'voice' ? 'Şu an açık koltuklu oda yok.' : 'Şu an açık film odası yok.'}
            </p>
            <Link
              to={tab === 'voice' ? '/sesli-oda-kur' : '/oda-kur'}
              className="mt-2 inline-block rounded-lg border border-premium-gold/50 px-3 py-1.5 text-xs font-black text-premium-gold"
            >
              {tab === 'voice' ? 'İlk koltuklu odayı sen aç →' : 'İlk film odasını sen aç →'}
            </Link>
          </div>
        )
      ) : (
        <>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-3 w-1 rounded-full bg-gradient-to-b from-premium-gold to-premium-red" />
            <h2 className="text-[10.5px] font-black tracking-[0.18em] text-premium-gold">
              {searching ? 'ARAMA SONUCU' : tab === 'voice' ? 'CANLI KOLTUKLU ODALAR' : 'CANLI FİLM ODALARI'}
            </h2>
            <span className="ml-auto text-[10px] font-bold text-white/40">{items.length} oda</span>
          </div>
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
        </>
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