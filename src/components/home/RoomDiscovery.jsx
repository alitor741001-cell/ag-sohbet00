import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import subscribeEntity from '@/components/data/entitySubscriptions';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { broadcasterState } from '@/lib/broadcaster';
import RoomDiscoveryCard from '@/components/home/RoomDiscoveryCard';
import HomeTopBar from '@/components/home/fantasy/HomeTopBar';
import PullToRefresh from '@/components/home/PullToRefresh';
import GameDiscoveryRow from '@/components/home/GameDiscoveryRow';
import FollowPanel from '@/components/home/FollowPanel';
import useFriends from '@/hooks/useFriends';
import useMessageProfiles from '@/hooks/useMessageProfiles';
import { readRoomList, writeRoomList } from '@/lib/roomListCache';
import { fetchYouTubeTitle, isGenericTitle, youtubeIdFromMovieId } from '@/lib/youtubeTitle';
import useTabActivity from '@/components/layout/TabActivityContext';

// Oyunlar ayrı indirilir: ana sayfa paketi küçük kalır.
const GamePanel = lazy(() => import('@/components/games/GamePanel'));

const isVoiceRoom = (room) => room?.room_type === 'voice' || room?.voice_mode === true;

/** Tazeleme karşılaştırması: oda kayıtları değişmediyse liste yerinde bırakılır. */
const roomListSignature = (items) =>
  items.map((room) => `${room.id}:${room.updated_date || room.created_date || ''}`).join('|');

/** Odada kimse yoksa kart hiç listelenmez; içeri giren olunca kart kendiliğinden gelir.
    Koltukta oturanlar da odadaki kişi sayar: yalnızca katılımcı listesine bakmak yetersiz. */
const hasPeopleInside = (room) =>
  (room?.participants || []).some((person) => person?.user_id) ||
  (room?.seats || []).some((seat) => seat?.user_id);

/**
 * Ana sayfa keşfet bölümü: en üstte arkadaş şeridi, altında koltuklu odalar ve
 * film odaları sekmeleri, oda numarası / üye kimliği araması ve oda kartları.
 */
export default function RoomDiscovery({ shortcuts = null }) {
  const tabActive = useTabActivity();
  const { user } = useCurrentUser();
  const { relations } = useFriends();
  const [allRooms, setAllRooms] = useState([]);
  const [owners, setOwners] = useState({});
  const [titles, setTitles] = useState({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
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
    else if (!gamesParam && tab === 'games') setTab('all');
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
    if (!tabActive) return;
    let alive = true;
    let reading = false;
    // Oda listesi tek yoldan okunur: ilk yükleme de düzenli tazeleme de bunu kullanır.
    const readRooms = async () => {
      if (reading) return null;
      reading = true;
      const list = await base44.entities.Room.filter({ status: 'active' }, '-created_date', 100).catch(() => null);
      reading = false;
      if (!alive) return null;
      if (!list) { setLoading(false); return null; }
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
  }, [user?.id, user?.role, refreshToken, tabActive]);

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
  // Sıcak listesi: yalnızca içinde kişi bulunan odalar listelenir; boş oda kartı çıkmaz.
  const hotRooms = useMemo(
    () => uniqueRooms.filter((room) => hasPeopleInside(room)),
    [uniqueRooms]
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
  // Sıralama izleyici sayısına göre: en kalabalık oda ilk sırada, izleyici azaldıkça aşağı iner.
  const list = useMemo(
    () => [...hotRooms].sort((a, b) => (b.participants?.length || 0) - (a.participants?.length || 0)),
    [hotRooms]
  );
  const items = list;

  // Takip görünümü: takip edilenlerin yayınları, arkadaşlar ve son ziyaret edilen odalar.
  if (view === 'history') {
    return (
      <PullToRefresh onRefresh={refreshList}>
        <HomeTopBar view="history" onView={setView} onSearch={() => navigate('/arama')} />
        <FollowPanel
          rooms={uniqueRooms}
          owners={owners}
          friends={friendsWithProfiles}
          filmTitleFor={filmTitleFor}
          historyVersion={historyVersion}
          onHistoryChange={() => setHistoryVersion((value) => value + 1)}
        />
      </PullToRefresh>
    );
  }

  return (
    <PullToRefresh onRefresh={refreshList}>
      <HomeTopBar view={view} onView={setView} onSearch={() => navigate('/arama')} />
      {shortcuts}

      {tab === 'games' ? (
        <GameDiscoveryRow onPick={setGameOpen} />
      ) : loading ? (
        /* Yükleme alanı kart listesinin yerini baştan ayırır: liste gelince sayfa yüksekliği
           değişmez, açılışta alt menü yukarı kayıp geri inmez. */
        <div className="grid grid-cols-2 gap-2.5" aria-hidden="true">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="animate-pulse rounded-[16px] bg-[#10141d]" style={{ aspectRatio: '3 / 2' }} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="premium-panel rounded-2xl px-4 py-8 text-center">
          <p className="text-sm font-bold text-white">Şu an açık oda yok.</p>
          <Link
            to="/oda-kur"
            className="mt-2 inline-block rounded-lg border border-premium-gold/50 px-3 py-1.5 text-xs font-black text-premium-gold"
          >
            İlk odayı sen aç →
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2.5">
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