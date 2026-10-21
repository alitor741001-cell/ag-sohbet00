import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Film, Loader2, Users } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import subscribeEntity from '@/components/data/entitySubscriptions';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { broadcasterState } from '@/lib/broadcaster';
import RoomDiscoveryCard from '@/components/home/RoomDiscoveryCard';
import HomeTopBar from '@/components/home/fantasy/HomeTopBar';
import PullToRefresh from '@/components/home/PullToRefresh';
import GameDiscoveryRow from '@/components/home/GameDiscoveryRow';
import RoomHistory from '@/components/home/RoomHistory';
import useFriends from '@/hooks/useFriends';
import useMessageProfiles from '@/hooks/useMessageProfiles';
import { readRoomList, writeRoomList } from '@/lib/roomListCache';
import { fetchYouTubeTitle, isGenericTitle, youtubeIdFromMovieId } from '@/lib/youtubeTitle';

// Oyunlar ayrı indirilir: ana sayfa paketi küçük kalır.
const GamePanel = lazy(() => import('@/components/games/GamePanel'));

const isVoiceRoom = (room) => room?.room_type === 'voice' || room?.voice_mode === true;

/** Tazeleme karşılaştırması: oda kayıtları değişmediyse liste yerinde bırakılır. */
const roomListSignature = (items) =>
  items.map((room) => `${room.id}:${room.updated_date || room.created_date || ''}`).join('|');

/** Odada kimse yoksa kart hiç listelenmez; içeri giren olunca kart kendiliğinden gelir. */
const hasPeopleInside = (room) => (room?.participants || []).some((person) => person?.user_id);

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
  const [tab, setTab] = useState('friends');
  // Üst şerit iki görünüm arasında geçiş yapar: canlı odalar (Sıcak) ve girilen odaların geçmişi.
  const [view, setView] = useState('hot');
  const navigate = useNavigate();
  const [historyVersion, setHistoryVersion] = useState(0);
  // Oyunlar görünümü adresten açılır: alt menüdeki Oyunlar düğmesi ?oyunlar=1 getirir.
  const [searchParams] = useSearchParams();
  const gamesParam = searchParams.get('oyunlar') === '1';
  // Açık oyun: ana sayfadan seçilen oyun tam ekran oynanır.
  const [gameOpen, setGameOpen] = useState(null);
  // Oyunlar yalnızca yayıncı/ajans üyesi hesaplara açıktır; ülke etiketiyle aynı kaynaktan çözülür.
  const gamesEnabled = broadcasterState(user).games;

  // Adresteki oyun isteği sekmeyi açar; adres temizlenince ya da ayrıcalık kalkınca
  // oda listesine dönülür.
  useEffect(() => {
    if (gamesParam && gamesEnabled) setTab('games');
    else if (!gamesParam && tab === 'games') setTab('friends');
  }, [gamesParam, gamesEnabled, tab]);

  // Gizlendiğini bildiğimiz odalar kimliğiyle işaretlenir: canlı güncelleme gelse
  // de ana sayfaya geri dönmez (olay yalnızca değişen alanları taşıyabilir).
  const hiddenIdsRef = useRef(new Set());

  // Gizli odalar yalnızca yönetici hesabında görünür; diğer herkesin listesinde çıkmaz.
  const canSeeHidden = user?.role === 'admin';
  const isCandidate = (room) => {
    if (!room || room.status !== 'active') return false;
    if (canSeeHidden) return true;
    // Gizli oda görünmez; canlı olayla geri gelmesin diye işaretli olanlar da elenir.
    return room.hidden !== true && !hiddenIdsRef.current.has(room.id);
  };

  // Oda açıldığı anda listelenir; çevrim içi işaretçisi beklenmez.
  // Görünürlük yalnızca odanın aktif ve gizlenmemiş olmasına bağlıdır.
  const rooms = allRooms;

  // Aşağı çekerek yenileme: kullanıcı listeyi beklemeden tazeleyebilir.
  const [refreshToken, setRefreshToken] = useState(0);
  const refreshList = useCallback(() => setRefreshToken((token) => token + 1), []);

  useEffect(() => {
    let alive = true;
    // Oda listesi tek yoldan okunur: ilk yükleme de düzenli tazeleme de bunu kullanır.
    const readRooms = async () => {
      const list = await base44.entities.Room.filter({ status: 'active' }, '-created_date', 100).catch(() => []);
      if (!alive) return null;
      const live = list.filter((room) => {
        if (room.hidden === true) hiddenIdsRef.current.add(room.id);
        else hiddenIdsRef.current.delete(room.id);
        return isCandidate(room);
      });
      // Liste gerçekten değişmediyse aynı kayıt korunur: 5 saniyelik tazeleme boşa
      // yeniden çizim ve kayıt yazımı yapmaz, telefon akıcı kalır.
      setAllRooms((prev) => (roomListSignature(prev) === roomListSignature(live) ? prev : live));
      setLoading(false);
      return live;
    };
    const load = async () => {
      // Son görülen liste hafızadan gelir: ana sayfaya dönüşte ağ beklenmeden çizilir,
      // tazeleme arkada sürer — aynı oda ve kullanıcı verisi tekrar tekrar çekilmez.
      const cached = readRoomList(user?.id);
      if (cached) {
        setAllRooms(cached.rooms);
        setOwners(cached.owners);
        setLoading(false);
      }
      const live = await readRooms();
      if (!live) return;
      const ownerIds = [...new Set(live.map((room) => room.owner_id).filter(Boolean))];
      if (!ownerIds.length) return;
      const response = await base44.functions.invoke('user-profile', { user_ids: ownerIds }).catch(() => null);
      // Bilinen profiller korunur: yalnızca yeni gelenler eklenir, liste baştan yazılmaz.
      const profiles = response?.data?.data || response?.data || {};
      if (alive) setOwners((prev) => ({ ...prev, ...profiles }));
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
    const unsubscribe = subscribeEntity('Room', (event) => {
      const data = event.data;
      const id = data?.id || event.id;
      // Sunucu "gizli" derse işaretlenir, "görünür" derse işaret kalkar.
      if (data?.hidden === true) hiddenIdsRef.current.add(id);
      else if (data?.hidden === false) hiddenIdsRef.current.delete(id);
      pending.set(id, event);
      // Kısa bir toplama penceresi: kartlar gözle görülür bir gecikme olmadan güncellenir.
      if (!flushTimer) flushTimer = window.setTimeout(flush, 250);
    });

    // Canlı akışın gecikebildiği cihazlarda (özellikle Android) liste kendini 5 saniyede bir
    // tazeler: odadaki kişiler ve oda bilgileri her cihazda güncel kalır.
    const refresh = window.setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      readRooms();
    }, 5000);

    return () => {
      alive = false;
      if (flushTimer) window.clearTimeout(flushTimer);
      window.clearInterval(refresh);
      unsubscribe();
    };
  }, [user?.id, user?.role, refreshToken]);

  // Liste ve sahip profilleri hafızada tutulur: sayfa değişip geri gelindiğinde veri hazır olur.
  useEffect(() => {
    writeRoomList(user?.id, { rooms: allRooms, owners });
  }, [allRooms, owners, user?.id]);

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

  const filmRooms = useMemo(() => uniqueRooms.filter((room) => !isVoiceRoom(room)), [uniqueRooms]);
  // Sekmeler ilişkiye göre ayrılır: "Arkadaşlar" ekli arkadaşların odalarını, "Sesli+Film" ise
  // arkadaş olmayanların odalarını gösterir; her iki sekmede sesli ve film odaları birlikte listelenir.
  const friendRooms = useMemo(() => uniqueRooms.filter((room) => friendIds.includes(room.owner_id)), [uniqueRooms, friendIds]);
  // Sesli+Film sekmesinde boş odanın kartı görünmez: odada kişi yoksa kart tamamen kaybolur.
  // Arkadaşlar sekmesi olduğu gibi kalır.
  const otherRooms = useMemo(
    () => uniqueRooms.filter((room) => !friendIds.includes(room.owner_id) && hasPeopleInside(room)),
    [uniqueRooms, friendIds]
  );

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
    const tabRooms = tab === 'friends' ? friendRooms : otherRooms;
    return [...tabRooms].sort((a, b) => Number(hasFriendInside(b)) - Number(hasFriendInside(a)));
  }, [tab, friendRooms, otherRooms, friendRoomIds]);
  const items = list;

  // Geçmiş Odalar görünümü: cihazda tutulan oda geçmişi ayrı ekranda listelenir.
  if (view === 'history') {
    return (
      <PullToRefresh onRefresh={refreshList}>
        <HomeTopBar view="history" onView={setView} onSearch={() => navigate('/arama')} />
        <RoomHistory version={historyVersion} onChange={() => setHistoryVersion((value) => value + 1)} />
      </PullToRefresh>
    );
  }

  return (
    <PullToRefresh onRefresh={refreshList}>
      <HomeTopBar view={view} onView={setView} onSearch={() => navigate('/arama')} />
      {tab !== 'games' && (
      <div className="mb-3 flex items-center gap-1.5 rounded-2xl border border-[#e8c47c]/25 bg-[#071736]/70 p-1">
        <button
          type="button"
          onClick={() => setTab('all')}
          className={`flex min-w-0 flex-1 items-center justify-center gap-1 rounded-xl py-2 text-[10.5px] font-extrabold transition ${
            tab === 'all'
              ? 'border border-[#ffe6a8]/70 bg-gradient-to-r from-[#d8fffb] via-[#6fe6dc] to-[#9ad7ff] text-[#062033] shadow-[0_0_20px_-5px_rgba(127,240,230,0.95)]'
              : 'border border-transparent text-white/60'
          }`}
        >
          <Film className="h-4 w-4 shrink-0" /> <span className="truncate">Sesli+Film</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('friends')}
          className={`flex min-w-0 flex-1 items-center justify-center gap-1 rounded-xl py-2 text-[10.5px] font-extrabold transition ${
            tab === 'friends'
              ? 'border border-[#ffe6a8]/70 bg-gradient-to-r from-[#d8fffb] via-[#6fe6dc] to-[#9ad7ff] text-[#062033] shadow-[0_0_20px_-5px_rgba(127,240,230,0.95)]'
              : 'border border-transparent text-white/60'
          }`}
        >
          <Users className="h-4 w-4 shrink-0" /> <span className="truncate">Arkadaşlar</span>
        </button>
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
        <div className="premium-panel rounded-2xl px-4 py-8 text-center">
          <p className="text-sm font-bold text-white">
            {tab === 'friends' ? 'Şu an arkadaşlarının açık odası yok.' : 'Şu an açık oda yok.'}
          </p>
          <Link
            to={tab === 'friends' ? '/arkadaslar' : '/oda-kur'}
            className="mt-2 inline-block rounded-lg border border-premium-gold/50 px-3 py-1.5 text-xs font-black text-premium-gold"
          >
            {tab === 'friends' ? 'Arkadaş ekle →' : 'İlk odayı sen aç →'}
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-3 w-1 rounded-full" style={{ background: 'linear-gradient(180deg,#ffe6a8,#7ff0e6)' }} />
            <h2 className="text-[10.5px] font-black tracking-[0.18em] text-[#ffe6a8]">
              {tab === 'friends' ? 'ARKADAŞLARININ ODALARI' : 'CANLI SESLİ + FİLM ODALARI'}
            </h2>
            <span className="ml-auto text-[10px] font-bold text-white/40">{items.length} oda</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((room, index) => {
            const kind = isVoiceRoom(room) ? 'voice' : 'film';
            return (
              <RoomDiscoveryCard
                key={room.id}
                room={room}
                owner={owners[room.owner_id]}
                kind={kind}
                filmTitle={kind === 'film' ? filmTitleFor(room) : ''}
                friendInside={hasFriendInside(room)}
                rank={index < 3 ? index + 1 : 0}
              />
            );
          })}
          </div>
        </>
      )}

      {/* Seçilen oyun tam ekran açılır: oda kurmaya gerek yok. */}
      {gameOpen && gamesEnabled && (
        <Suspense fallback={null}>
          <GamePanel open initialGame={gameOpen} onClose={() => setGameOpen(null)} />
        </Suspense>
      )}
    </PullToRefresh>
  );
}