import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { roomVisitId, endRoomVisit } from '@/lib/roomVisit';
import subscribeEntity from '@/components/data/entitySubscriptions';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { broadcasterState } from '@/lib/broadcaster';
import { makeId } from '@/lib/uid';
import { useVoiceChat } from '@/hooks/useVoiceChat';
import VoiceViewport from '@/components/voice/VoiceViewport';
import RoomBackground from '@/components/voice/RoomBackground';
import { useToast } from '@/components/ui/use-toast';
import VoiceStage from '@/components/voice/VoiceStage';
import { resizeSeats } from '@/components/voice/seatLayout';
import { isHiddenName } from '@/lib/hiddenUser';
import useVoiceRoomMessages from '@/hooks/useVoiceRoomMessages';
import VoiceControlBar from '@/components/voice/VoiceControlBar';
import VoiceChatDock from '@/components/voice/VoiceChatDock';
import VoiceViewerSheet from '@/components/voice/VoiceViewerSheet';
import VoiceSeatInvitePrompt from '@/components/voice/VoiceSeatInvitePrompt';
import RoomInfoCard from '@/components/voice/RoomInfoCard';
import RoomProfileSheet from '@/components/voice/RoomProfileSheet';
import VoiceRoomMenu from '@/components/voice/VoiceRoomMenu';
import VoiceSeatSheet from '@/components/voice/VoiceSeatSheet';
import InviteSheet from '@/components/voice/InviteSheet';
import MicPermissionGuide from '@/components/voice/MicPermissionGuide';
import useLatestCallback from '@/hooks/useLatestCallback';
import { useUserProfile } from '@/lib/profileCard';
import useVoiceRoomProfileActions from '@/hooks/useVoiceRoomProfileActions';
import useRoomActionGate from '@/hooks/useRoomActionGate';
import useVoiceRoomAction from '@/hooks/useVoiceRoomAction';
import RoomLogSheet from '@/components/voice/RoomLogSheet';
import GiftScoreChip from '@/components/voice/GiftScoreChip';
import GiftBoardSheet from '@/components/voice/GiftBoardSheet';
import RoomExitOverlay from '@/components/voice/RoomExitOverlay';
import VoiceRoomGate from '@/components/voice/VoiceRoomGate';
import { clearMinimizedRoom, getMinimizedRoom, isRoomMinimized, setMinimizedRoom } from '@/lib/minimizedRoom';
import VoicePrivateChatSheet from '@/components/voice/VoicePrivateChatSheet';
import useRoomMusic from '@/hooks/useRoomMusic';
import RoomMusicLayer from '@/components/voice/RoomMusicLayer';
import { takeRoomPrefetch } from '@/lib/roomPrefetch';
import { rememberRoom } from '@/lib/visitedRooms';
import useRoomSwipeNav from '@/hooks/useRoomSwipeNav';
import useVerticalSwipe from '@/hooks/useVerticalSwipe';
import useOfflineExit from '@/hooks/useOfflineExit';
import useOfflineParticipantCleanup from '@/hooks/useOfflineParticipantCleanup';
// Oyun paneli ağır: oda açılışında indirilmez, yalnızca açıldığında yüklenir.
const GamePanel = lazy(() => import('@/components/games/GamePanel'));
import GiftBoard from '@/components/voice/GiftBoard';
import GiftScene from '@/components/voice/GiftScene';
import GiftEffectsSheet from '@/components/voice/GiftEffectsSheet';
import useGiftEffects from '@/hooks/useGiftEffects';
import useGiftAlerts from '@/hooks/useGiftAlerts';
import useBigGiftAlerts from '@/hooks/useBigGiftAlerts';
import useAgencyCalls from '@/hooks/useAgencyCalls';
import useAgencyCallStatus from '@/hooks/useAgencyCallStatus';
import AgencyCallBanner from '@/components/voice/AgencyCallBanner';
import AgencyCallComposer from '@/components/voice/AgencyCallComposer';
import useBigGiftNotice from '@/hooks/useBigGiftNotice';
import BigGiftStage from '@/components/voice/BigGiftStage';
import { useGiftBalance, useGiftCatalog } from '@/hooks/useGiftCatalog';
import { publishWalletCoins } from '@/hooks/useWalletCoinsLive';
import { K_UNIT, formatCoins, tierForK, toneColor } from '@/lib/giftTone';
import { withBoardStep } from '@/lib/numberBoard';
import { leaveRoomKeepalive, leaveSeatKeepalive } from '@/lib/roomLeaveKeepalive';

export default function VoiceRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  // Oyun merkezi yalnızca yayıncı/ajans üyesi hesaplara açıktır.
  const gamesEnabled = broadcasterState(user).games;
  const { toast } = useToast();
  const { openUserProfile } = useUserProfile();
  const { begin: beginAction, end: endAction } = useRoomActionGate(id);

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  // Odaya girilen yer cihazda tutulur: ana sayfadaki Geçmiş Odalar buradan beslenir.
  useEffect(() => { rememberRoom(room); }, [room?.id]);
  const [joined, setJoined] = useState(false);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [notice, setNotice] = useState('');
  const [banNotice, setBanNotice] = useState('');
  const [messages, setMessages] = useState([]);
  // Sohbet akışı ve yazma alanı ayrı yönetilir: mesaj gidince yazma alanı kapanır, akış kalır.
  const [chatOpen, setChatOpen] = useState(false);
  // Sohbet akışı (geçmiş dahil) odaya girildiği anda görünür; buton yalnızca yazma alanını açar.
  const [composerOpen, setComposerOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [musicOpen, setMusicOpen] = useState(false);
  // Köşedeki müzik çemberi odaya girildiğinde kendiliğinden gelmez: yalnızca müzik
  // menüden elle açıldığında görünür, sonra köşede durur.
  const [musicBubble, setMusicBubble] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [seatIndex, setSeatIndex] = useState(null);
  const [dmUserId, setDmUserId] = useState(null);
  const [dmOpen, setDmOpen] = useState(false);
  // Özel sohbet paneli tam ekrana geçti mi? Yarım panelken oda panelin üstüne sığar.
  const [dmExpanded, setDmExpanded] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [gamesOpen, setGamesOpen] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  // Profil kartındaki "Bahset" isteği: yazma alanına @isim eklenir.
  const [mentionTarget, setMentionTarget] = useState(null);
  // Coin yetmediğinde hediye kutusu açılıp doğrudan coin yükleme ekranı gösterilir (sayaç sinyali).
  const [coinsRequest, setCoinsRequest] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [micGuideDismissed, setMicGuideDismissed] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  // Oda paneli: profilim, oda ismi düzenleme, kategori, duyuru ve yöneticiler burada durur.
  const [profilePanelOpen, setProfilePanelOpen] = useState(false);
  const [giftBoardOpen, setGiftBoardOpen] = useState(false);
  const [giftBoard, setGiftBoard] = useState(null);
  const [giftBoardLoading, setGiftBoardLoading] = useState(false);
  const [giftId, setGiftId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [gifted, setGifted] = useState({});

  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const handleKeyboardChange = useCallback((open) => {
    setKeyboardOpen(open);
    if (!open) setComposerOpen(false);
  }, []);
  // Hediye efektleri tercihi: kapalıyken atılan hediyelerin görselleri gösterilmez.
  const { giftEffects, setGiftEffects } = useGiftEffects();

  // Hediye Tahtası: katalog, K seviyeleri, bakiye ve gelen hediye animasyonları.
  const { gifts, tiers } = useGiftCatalog();
  const giftQueueRef = useRef([]);
  const giftFlushingRef = useRef(false);
  const { coins, setCoins, refresh: refreshCoins } = useGiftBalance(id, giftOpen, user?.id, giftFlushingRef);
  const giftMap = useMemo(() => new Map(gifts.map((item) => [item.id, item])), [gifts]);
  const resolveGift = useCallback((giftKey) => giftMap.get(giftKey) || null, [giftMap]);
  const { alert: giftAlert, push: pushGiftAlert, markSeen: markGiftSeen, markOwnSend } = useGiftAlerts(messages, resolveGift, user?.id);
  // Büyük hediye duyurusu tüm sesli odalarda görünür.
  const bigGift = useBigGiftAlerts();
  const [agencyCallOpen, setAgencyCallOpen] = useState(false);
  const { status: agencyCallStatus, setStatus: setAgencyCallStatus } = useAgencyCallStatus(user?.id);
  const { call: agencyCall, dismiss: dismissAgencyCall } = useAgencyCalls();
  // Sohbetin altındaki büyük hediye satırı — basılınca hediye atan kişinin odasına gidilir.
  const { notice: bigGiftNotice, dismiss: dismissBigGiftNotice } = useBigGiftNotice(id);

  const joinedRef = useRef(false);
  const joinTriedRef = useRef(false);
  const sawSelfRef = useRef(false);
  // Yönetici görünmez (ghost) katılabilir: katılımcı listesinde görünmez, atılmış sayılmaz.
  const ghostRef = useRef(false);
  const keepSeatRef = useRef(false);
  const giftFlashRef = useRef(null);
  const giftBoardRef = useRef(0);
  const giftRefreshTimerRef = useRef(null);
  const giftBoardRequestRef = useRef(0);
  const giftSyncTimerRef = useRef(0);

  const seats = useMemo(() => (Array.isArray(room?.seats) ? room.seats : []), [room?.seats]);
  const myInvite = useMemo(
    () => (Array.isArray(room?.seat_invites) ? room.seat_invites.find((item) => item.user_id === user?.id) : null),
    [room?.seat_invites, user?.id]
  );
  const participants = useMemo(() => room?.participants || [], [room?.participants]);
  // Gizli kullanıcıların takma adı → kimliği: yalnızca N/VIP rozetleri için kullanılır, kimlik gösterilmez.
  const hiddenUsersByName = useMemo(() => {
    const names = {};
    [...participants, ...seats].forEach((person) => { if (person?.user_id && isHiddenName(person.name)) names[person.name] = person.user_id; });
    return names;
  }, [participants, seats]);
  const moderators = useMemo(() => room?.room_moderators || [], [room?.room_moderators]);
  // Oda LVL'i: odadakilerin seviyesi canlı izlenir — seviye atlayınca rozet anında değişir.
  const mySeatIndex = seats.findIndex((seat) => seat.user_id === user?.id);
  const seated = mySeatIndex >= 0;
  const isOwner = !!user && room?.owner_id === user.id;
  const canMod = isOwner || moderators.includes(user?.id) || user?.role === 'admin';
  // Odadan atma yalnızca oda sahibinin yetkisidir.
  // Odadan atma: oda sahibi, oda moderatörleri, yönetici rolü ve admin yetkilidir.
  const canKick = canMod;
  // Sohbet yasağı açıkken yalnızca koltuktakiler yazar.
  const chatBanned = room?.chat_seated_only === true;
  const chatLocked = chatBanned && !seated;

  // Koltukta değilken yukarı/aşağı kaydırma: diğer canlı sesli odalara geçilir.
  // Ayarlar bölümündeki anahtarla açılıp kapanır; koltukta otururken hiç çalışmaz.
  const swipe = useRoomSwipeNav({ roomId: id, userId: user?.id, active: joined && !seated, navigate });
  const swipeGesture = useVerticalSwipe({
    enabled: joined && !seated && swipe.swipeEnabled,
    onSwipeUp: swipe.goNext,
    onSwipeDown: swipe.goPrevious,
  });

  // 3 dakika çevrim dışı kalan kişi sessizce odadan çıkar ve ana sayfaya döner:
  // "atıldı" bildirimi, yasak kaydı ve listeye ekleme olmaz; kural oda sahibini de kapsar.
  const silentOfflineExit = useCallback(async () => {
    joinedRef.current = false;
    sawSelfRef.current = false;
    setJoined(false);
    try { await base44.functions.invoke('room-presence', { action: 'leave', room_id: id, silent: true }); } catch {}
    navigate('/', { replace: true });
  }, [id, navigate]);
  useOfflineExit({ enabled: joined, onExit: silentOfflineExit });

  // Oda sahibi: 3 dakikadır görünmeyen kişiyi sessizce odadan çıkarır (yasak ve bildirim yok).
  useOfflineParticipantCleanup({
    enabled: isOwner,
    roomId: id,
    participants: room?.participants || [],
    exemptIds: [user?.id, room?.owner_id].filter(Boolean),
  });

  const seatsView = useMemo(() => {
    const mutedByUser = new Map(participants.map((person) => [person.user_id, !!person.muted]));
    return seats.map((seat) => {
      const muted = seat.user_id ? !!mutedByUser.get(seat.user_id) : !!seat.muted;
      return seat.muted === muted ? seat : { ...seat, muted };
    });
  }, [seats, participants]);

  // Mik'e davet listesi: koltukta oturmayan odadakiler (kendisi hariç).
  const unseatedViewers = useMemo(() => {
    const seatedIds = new Set(seats.filter((seat) => seat.user_id).map((seat) => seat.user_id));
    return participants.filter((person) => person.user_id && person.user_id !== user?.id && !seatedIds.has(person.user_id));
  }, [participants, seats, user?.id]);
  // Koltuk daveti gönderilmiş kişiler listede "Davet edildi" olarak görünür.
  const seatInviteIds = useMemo(
    () => (Array.isArray(room?.seat_invites) ? room.seat_invites.map((invite) => invite.user_id) : []),
    [room?.seat_invites]
  );

  // Kayıt defteri ve odadan atılanlar — yönetici işlemleri sohbete değil buraya yazılır.
  const roomLogs = useMemo(() => (Array.isArray(room?.room_logs) ? room.room_logs : []), [room?.room_logs]);
  const bannedUsers = useMemo(() => (Array.isArray(room?.banned_users) ? room.banned_users : []), [room?.banned_users]);

  // Sayı tahtası: açıkken her koltuğun altında kişinin sayısı gösterilir.
  const boardActive = room?.number_board === true;
  // Süre sayacı, sayaç başlatıldığı andan itibaren sayılır.
  const boardStartedAt = room?.board_started_at || '';
  const scores = useMemo(() => {
    const map = {};
    (Array.isArray(room?.number_scores) ? room.number_scores : []).forEach((item) => {
      if (item?.user_id) map[item.user_id] = Number(item.value) || 0;
    });
    return map;
  }, [room?.number_scores]);

  // Hediye gönderilebilecek kişiler: odadaki herkes ve kendisi (kendine de hediye gönderebilir).
  const giftPeople = useMemo(() => {
    const map = new Map();
    participants.forEach((person) => {
      if (person.user_id) map.set(person.user_id, { user_id: person.user_id, name: person.name || 'Kullanıcı', avatar: person.avatar || '' });
    });
    seats.forEach((seat) => {
      if (seat.user_id && !map.has(seat.user_id)) map.set(seat.user_id, { user_id: seat.user_id, name: seat.name || 'Kullanıcı', avatar: seat.avatar || '' });
    });
    // Kendisi hiç koltukta/katılımcı listesinde görünmüyorsa yine de seçilebilir ve listenin başında durur.
    const self = user?.id
      ? (map.get(user.id) || { user_id: user.id, name: user.full_name || 'Kullanıcı', avatar: '' })
      : null;
    const others = [...map.values()].filter((person) => person.user_id !== user?.id);
    return self ? [{ ...self, me: true }, ...others] : others;
  }, [seats, participants, user?.id, user?.full_name]);

  // Seçim rengi: seçilen hediyenin K seviyesi belirler.
  const selectedGift = useMemo(() => gifts.find((item) => item.id === giftId) || null, [gifts, giftId]);
  const seatAccent = toneColor(tierForK(tiers, selectedGift?.k_value || 0));
  // Bakiye yetmiyorsa gönderim hiç başlatılmaz: hediye işleme alınmaz, bakiyeye dokunulmaz.
  const giftCost = (Number(selectedGift?.k_value) || 0) * K_UNIT * selectedIds.length;
  const giftUnaffordable = !!selectedGift && selectedIds.length > 0
    && coins !== null && coins !== undefined && giftCost > coins;

  // Odada atılan/alan her hediye seviye çubuğunu tazeler: bar hediye atıldığı anda canlı ilerler.
  const giftCount = useMemo(() => messages.filter((message) => message.type === 'gift').length, [messages]);

  // Odadan ayrılan kişi seçimden düşer.
  useEffect(() => {
    if (!selectedIds.length) return;
    const valid = new Set(giftPeople.map((person) => person.user_id));
    setSelectedIds((prev) => {
      const next = prev.filter((value) => valid.has(value));
      return next.length === prev.length ? prev : next;
    });
  }, [giftPeople, selectedIds.length]);

  const voice = useVoiceChat({
    roomId: id,
    user,
    participants,
    voiceEnabled: joined && !!room?.voice_enabled,
    micEnabled: seated,
  });
  useEffect(() => { if (voice.micDenied) setMicGuideDismissed(false); }, [voice.micDenied]);

  // Oda müziği: odanın açık şarkısı canlı izlenir, herkes kendi telefonunda duyar.
  // Hoparlör kapatıldığında şarkı da susar; açıldığında kullanıcı sesleriyle birlikte geri gelir.
  const music = useRoomMusic(id, joined, { muted: voice.deafened });

  const syncRoom = useCallback(async () => {
    const response = await base44.functions.invoke('room-presence', { action: 'get', room_id: id }).catch(() => null);
    const record = response?.data?.room;
    if (record) setRoom(prev => prev?.updated_date && record.updated_date && prev.updated_date > record.updated_date ? prev : record);
    return record;
  }, [id]);

  // Hediye kutusu: odada biriken hediyeler (son 24 saat + tüm zamanlar).
  const loadGiftBoard = useCallback(async () => {
    const version = ++giftBoardRequestRef.current;
    setGiftBoardLoading(true);
    try {
      const response = await base44.functions.invoke('voice-room', { room_id: id, action: 'gift-board' });
      if (version === giftBoardRequestRef.current) setGiftBoard(response.data);
    } catch {
      // Sıralama alınamazsa kutu son bilinen değerle kalır.
    } finally {
      if (version === giftBoardRequestRef.current) setGiftBoardLoading(false);
    }
  }, [id]);

  // Odaya girildiğinde kutu doldurulur.
  useEffect(() => {
    if (!joined) return;
    loadGiftBoard();
  }, [joined, loadGiftBoard]);

  // Yeni hediye geldiğinde kutu toplamı tazelenir (en fazla 3 saniyede bir).
  // Kısa aralıkla gelen hediyeler atlanmaz: kalan süre bitince bir kez daha tazelenir.
  useEffect(() => {
    if (!joined) return;
    const last = messages[messages.length - 1];
    if (!last || last.type !== 'gift') return;
    const elapsed = Date.now() - giftBoardRef.current;
    if (elapsed >= 3000) {
      giftBoardRef.current = Date.now();
      loadGiftBoard();
      return;
    }
    window.clearTimeout(giftRefreshTimerRef.current);
    giftRefreshTimerRef.current = window.setTimeout(() => {
      giftBoardRef.current = Date.now();
      loadGiftBoard();
    }, 3000 - elapsed);
  }, [messages, joined, loadGiftBoard]);

  useEffect(() => () => window.clearTimeout(giftRefreshTimerRef.current), []);

  // Kaydırarak oda değiştirildiğinde eski odadan çıkılır ve giriş durumu sıfırlanır:
  // yeni odaya temiz bir oturumla katılınır.
  // The departure requests already run in the membership effect's cleanup.
  useEffect(() => {
    joinedRef.current = false;
    sawSelfRef.current = false;
    joinTriedRef.current = false;
    ghostRef.current = false;
    setJoined(false);
    setRoom(null);
    setNotice('');
    setBanNotice('');
    setNeedsPassword(false);
    setPassword('');
    setMessages([]);
    setLoading(true);
  }, [id]);

  // Odayı yükle — sesli oda değilse normal oda sayfasına yönlendir.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        // Karta dokunulduğunda istek önden başlatıldıysa o cevap kullanılır; cevap boş dönerse
        // taze istek yapılır — oda açılışı her koşulda çalışır.
        const prefetched = takeRoomPrefetch(id);
        let response = prefetched ? await prefetched : null;
        if (!response?.data?.room) {
          response = await base44.functions.invoke('room-presence', { action: 'get', room_id: id });
        }
        if (cancelled) return;
        const record = response?.data?.room;
        if (!record) { setNotice('Oda bulunamadı.'); return; }
        // Sesli odalar ve sesli moda alınmış film odaları bu arayüzü kullanır.
        if (record.room_type !== 'voice' && record.voice_mode !== true) { navigate(`/oda/${id}`, { replace: true }); return; }
        setRoom(record);
        const alreadyInside = (record.participants || []).some((person) => person.user_id === user?.id);
        if (alreadyInside) {
          sawSelfRef.current = true;
          joinedRef.current = true;
          setJoined(true);
        }
      } catch (error) {
        if (!cancelled) setNotice(error?.response?.data?.error || 'Oda yüklenemedi.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [id, user?.id, navigate]);

  // Film odasında sesli mod kapatılınca koltuk korunarak film odasına dönülür.
  useEffect(() => {
    if (!room || room.room_type === 'voice' || room.voice_mode === true) return;
    keepSeatRef.current = true;
    navigate(`/oda/${id}`, { replace: true });
  }, [room, id, navigate]);

  // Odaya katılım: anlık yoğunluk kaynaklı geçici hatalarda kısa aralıklarla tekrar denenir.
  // Böylece odadan çıkıp tekrar girerken tek seferlik bir aksaklık hata ekranı çıkarmaz.
  const attemptJoin = useCallback(async (pw = '') => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const response = await base44.functions.invoke('room-presence', { action: 'join', room_id: id, password: pw, visit_id: roomVisitId(id) });
        if (response?.data?.ghost) ghostRef.current = true;
        joinedRef.current = true;
        setJoined(true);
        setNeedsPassword(false);
        setPassword('');
        setNotice('');
        // Kendi kaydımız sunucudan gelen taze odada doğrulanır: eski listede görünmediğimiz
        // ara an "odadan çıkarıldım" sanılmasın.
        const record = await syncRoom();
        if ((record?.participants || []).some((person) => person.user_id === user?.id)) sawSelfRef.current = true;
        return true;
      } catch (error) {
        const data = error?.response?.data || {};
        // Şifre ve yasak gibi kesin cevaplar bekletilmez; yalnızca geçici hatalar tekrarlanır.
        // Yoğunluk (429) da geçici sayılır: yayınlar arasında gezinirken anlık sınır hata ekranı çıkarmaz.
        const transient = !data.error || error?.response?.status >= 500 || error?.response?.status === 429;
        if (transient && attempt < 2) {
          await new Promise((resolve) => window.setTimeout(resolve, 700 * (attempt + 1)));
          continue;
        }
        setNeedsPassword(!!data.needsPassword);
        // Odadan atılan kişi 24 saat giremez: uyarı ekranda gösterilir.
        if (data.banned) setBanNotice(data.error || '24 saat boyunca bu odaya giremezsiniz.');
        setNotice(data.error || 'Odaya katılamadınız.');
        return false;
      }
    }
    return false;
  }, [id, syncRoom, user?.id]);

  // Şifresiz odalara otomatik katıl.
  useEffect(() => {
    if (loading || joined || !room || !user || needsPassword || joinTriedRef.current) return;
    joinTriedRef.current = true;
    attemptJoin('');
  }, [loading, joined, room, user, needsPassword, attemptJoin]);

  // Oda kaydını canlı takip et (koltuklar, katılımcılar, ayarlar).
  useEffect(() => {
    if (!id) return;
    const unsubscribe = subscribeEntity('Room', (event) => {
      if (event.id !== id) return;
      if (event.type === 'delete') { setNotice('Oda kapatıldı.'); return; }
      if (event.type === 'update' || event.type === 'create') {
        setRoom((prev) => {
          if (!prev) return event.data;
          const next = { ...prev, ...(event.data || {}) };
          // Gönderim sırasında gelen oda kopyası sayı tahtasının eski halini taşıyabilir:
          // iyimser değer korunur, tahta kuyruk boşalınca sunucudan kesin haliyle eşitlenir.
          if (prev.updated_date && event.data?.updated_date && prev.updated_date > event.data.updated_date) return prev;
          return next;
        });
      }
    });
    return unsubscribe;
  }, [id]);

  // Oda verisini 5 saniyede bir sessizce tazeler: canlı abonelik kaçırsa bile
  // koltuk, katılımcı ve ayarlar her cihazda güncel kalır — yükleme göstergesi çıkmaz.
  useEffect(() => {
    if (!joined || !id) return;
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      syncRoom();
    }, 5000);
    return () => window.clearInterval(interval);
  }, [joined, id, syncRoom]);

  // Yöneticilik alındığı an açık olan "…" menüsü kapanır; tuş da anında kaybolur.
  useEffect(() => {
    if (!canMod) setMenuOpen(false);
  }, [canMod]);

  // Odadan atılma kontrolü.
  useEffect(() => {
    if (!joined || !user) return;
    if (participants.some((person) => person.user_id === user.id)) { sawSelfRef.current = true; return; }
    if (sawSelfRef.current && joinedRef.current) {
      joinedRef.current = false;
      setJoined(false);
      setNotice('Odadan çıkarıldınız.');
    }
  }, [participants, joined, user?.id]);

  useEffect(() => {
    if (joined && room?.status === 'closed') {
      joinedRef.current = false;
      setJoined(false);
      setNotice('Oda kapatıldı.');
    }
  }, [room?.status, joined]);

  useVoiceRoomMessages(id, setMessages);

  // Sekme kapanırken / sayfadan çıkılırken odadan ayrıl.
  // keepalive: tarayıcı kapatılsa bile istek sunucuya ulaşır.
  useEffect(() => () => {
    if (!joinedRef.current) return;
    joinedRef.current = false;
    // Profil sayfasına gidilirken oda ve koltuk korunur.
    if (keepSeatRef.current) return;
    // Oda küçültüldüğünde odadan düşülmez — balon açıkken odalar gezilebilir.
    if (isRoomMinimized(id)) return;
    leaveSeatKeepalive(id);
    leaveRoomKeepalive(id);
  }, [id]);

  const invokeVoice = useVoiceRoomAction(id, setRoom, toast);

  // Oda ayarı ekranda anında değişir: sunucu cevabı beklenmeden yerel kayıt güncellenir,
  // ardından diğer cihazlara canlı yayınla aynı değer düşer.
  const patchRoom = useCallback((patch) => {
    setRoom((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  // Koltuk sayısı: düzen anında değişir, sığmayanlar tek hamlede izleyiciye düşer.
  const changeSeatCount = useCallback(async (count) => {
    const current = Array.isArray(room?.seats) ? room.seats : [];
    patchRoom({ seats: resizeSeats(current, count, room?.owner_id), seat_count: count });
    try {
      const response = await base44.functions.invoke('voice-room', { room_id: id, action: 'set-seat-count', seat_count: count });
      const data = response?.data || {};
      // Sunucu düzeni kesinleştirir; kim koltukta kaldıysa ekran ona uyar.
      if (Array.isArray(data.seats)) patchRoom({ seats: data.seats, seat_count: data.seats.length });
      const dropped = data.dropped || [];
      if (dropped.length) {
        toast({
          title: `${dropped.length} kişi koltuktan indirildi`,
          description: dropped.map((person) => person.name).join(', '),
        });
      }
    } catch (error) {
      syncRoom();
      toast({ title: 'Koltuk sayısı değiştirilemedi', description: error?.response?.data?.error || error.message, variant: 'destructive' });
    }
  }, [id, room?.seats, room?.owner_id, patchRoom, syncRoom, toast]);

  const leaveRoom = useCallback(async () => {
    endRoomVisit(id);
    joinedRef.current = false;
    sawSelfRef.current = false;
    setJoined(false);
    if (seated) await base44.functions.invoke('voice-room', { action: 'seat-leave', room_id: id }).catch(() => {});
    await base44.functions.invoke('room-presence', { action: 'leave', room_id: id }).catch(() => {});
    navigate('/');
  }, [id, seated, navigate]);

  // Odayı küçült: oda ve koltuk korunur, sağ alttaki balondan odalar gezilebilir.
  const minimizeRoom = useCallback(() => {
    setMinimizedRoom({ id, name: room?.name || 'Sesli oda', owner_id: room?.owner_id, owner_name: room?.owner_name, path: `/sesli-oda/${id}` });
    navigate('/');
  }, [id, room?.name, room?.owner_id, room?.owner_name, navigate]);

  // Odaya dönüldüğünde küçültme kaydı temizlenir: balon kapanır, oda normal akışına döner.
  useEffect(() => {
    if (getMinimizedRoom()?.id !== id) return;
    clearMinimizedRoom();
  }, [id]);

  // Anonsta gösterilecek takma ad — gerçek isim hiçbir yerde kullanılmaz.
  const hiddenAnnounceName = useMemo(() => {
    const person = [...(seats || []), ...(participants || [])].find((item) => isHiddenName(item?.name));
    return person?.name || '';
  }, [seats, participants]);

  // Dolu koltuk yalnızca hediye seçiminde işaretlenir; boş koltuk beyaz koltuk menüsünü açar.
  const handleSeatPress = useLatestCallback((index) => {
    const seat = seats[index];
    if (seat?.user_id) {
      if (giftOpen) toggleGiftPerson(seat.user_id);
      else openRoomProfile(seat.user_id);
      return;
    }
    setSeatIndex(index);
  });

  const handleTakeSeat = () => {
    const index = seatIndex;
    setSeatIndex(null);
    if (index !== null) invokeVoice({ action: 'seat-take', seat_index: index });
  };

  const handleMic = () => {
    if (!seated) {
      toast({ title: 'Konuşmak için bir koltuğa otur', description: 'Yukarıdaki boş bir koltuğa dokun.' });
      return;
    }
    voice.toggleMute();
  };

  // Boş koltuk menüsündeki mikrofon tuşu kendi mikrofonumu değil, dokunulan koltuğun mikrofonunu açar/kapatır.
  const muteMicFromSeat = () => {
    const index = seatIndex;
    setSeatIndex(null);
    if (index === null) return;
    invokeVoice({ action: 'seat-mute', seat_index: index, muted: !seats[index]?.muted });
  };

  // Koltuk daveti: hedef koltuk verilirse o koltuğa, verilmezse ilk boş koltuğa gider.
  const inviteToSeat = async (targetId, index) => {
    if (!targetId) return;
    const ok = await invokeVoice({ action: 'seat-invite', target_id: targetId, seat_index: index });
    if (ok) {
      await syncRoom();
      toast({ title: 'Koltuk daveti gönderildi', description: 'Karşı tarafın ekranında "Otur / Aya kalk" seçenekleri çıkacak.' });
    }
  };

  const acceptSeatInvite = async (index) => {
    const ok = await invokeVoice({ action: 'seat-take', seat_index: index });
    if (ok) await invokeVoice({ action: 'seat-invite-clear' });
  };

  const declineSeatInvite = () => { invokeVoice({ action: 'seat-invite-clear' }); };

  // Yayını paylaş: seçilen arkadaşlara özel sohbetten katılma kartı gönderilir.
  // Paylaşılan kişiler oda gizli olsa da girebilir.
  const shareRoom = async (ids) => {
    try {
      const response = await base44.functions.invoke('room-presence', { action: 'share', room_id: id, target_ids: ids });
      toast({ title: 'Yayın paylaşıldı', description: `${response.data?.shared || ids.length} kişiye özel sohbetten gönderildi.` });
      setShareOpen(false);
      return true;
    } catch (error) {
      toast({ title: 'Paylaşım başarısız', description: error?.response?.data?.error || error.message, variant: 'destructive' });
      return false;
    }
  };

  const handleSetPassword = async (pw) => {
    if (!beginAction('password')) return;
    const previousPassword = room?.password || '';
    try {
      // Kilit durumu anında değişir, sunucu kaydı arkadan yazılır.
      patchRoom({ password: pw ? 'protected' : '' });
      await base44.functions.invoke('room-presence', { action: 'set-password', room_id: id, password: pw });
      toast({ title: pw ? 'Oda kilitlendi' : 'Oda kilidi kaldırıldı' });
    } catch (error) {
      patchRoom({ password: previousPassword });
      toast({ title: 'İşlem başarısız', description: error?.response?.data?.error || error.message, variant: 'destructive' });
    } finally { endAction('password'); }
  };

  // Oda ismi: başlıktaki kalemle değiştirilir, odadaki herkese anında yansır.
  const renameRoom = useCallback(async (nextName) => {
    try {
      patchRoom({ name: nextName });
      await base44.functions.invoke('room-presence', { action: 'set-name', room_id: id, name: nextName });
      toast({ title: 'Oda ismi güncellendi' });
      return true;
    } catch (error) {
      toast({ title: 'İsim değiştirilemedi', description: error?.response?.data?.error || error.message, variant: 'destructive' });
      return false;
    }
  }, [id, syncRoom, toast]);

  // Oda görünümü: tema ve kapak fotoğrafı oda panelinden değiştirilir (sahip/yönetici).
  const saveRoomLook = useCallback(async (look) => {
    patchRoom(look);
    try {
      await base44.functions.invoke('room-presence', { action: 'set-look', room_id: id, ...look });
      toast({ title: 'Oda profili güncellendi' });
      return true;
    } catch (error) {
      toast({ title: 'Oda profili güncellenemedi', description: error?.response?.data?.error || error.message, variant: 'destructive' });
      return false;
    }
  }, [id, patchRoom, toast]);

  // Duyuru kaydı: oda kaydına yazılır ve kayıt defterine (cheat paneli) düşer.
  const saveAnnouncement = useCallback(async (text) => {
    patchRoom({ announcement: text });
    try {
      const response = await base44.functions.invoke('room-presence', { action: 'set-announcement', room_id: id, announcement: text });
      patchRoom({ announcement: response.data?.announcement ?? text });
      toast({ title: text ? 'Duyuru kaydedildi' : 'Duyuru silindi' });
      return true;
    } catch (error) {
      toast({ title: 'Duyuru kaydedilemedi', description: error?.response?.data?.error || error.message, variant: 'destructive' });
      return false;
    }
  }, [id, patchRoom, toast]);

  // Kategori etiketi: seçim anında uygulanır, sunucu kaydı arkadan yazılır.
  const saveCategory = useCallback(async (category) => {
    const previous = room?.category || '';
    patchRoom({ category });
    try {
      await base44.functions.invoke('room-presence', { action: 'set-category', room_id: id, category });
      return true;
    } catch (error) {
      patchRoom({ category: previous });
      toast({ title: 'Kategori kaydedilemedi', description: error?.response?.data?.error || error.message, variant: 'destructive' });
      return false;
    }
  }, [id, room?.category, patchRoom, toast]);

  const handleToggleHidden = async () => {
    if (!beginAction('hidden')) return;
    const previousHidden = !!room?.hidden;
    try {
      patchRoom({ hidden: !previousHidden });
      const response = await base44.functions.invoke('room-presence', { action: 'toggle-hidden', room_id: id });
      patchRoom({ hidden: !!response.data?.hidden });
      toast({ title: response.data?.hidden ? 'Oda gizlendi' : 'Oda herkese açık' });
    } catch (error) {
      patchRoom({ hidden: previousHidden });
      toast({ title: 'İşlem başarısız', description: error?.response?.data?.error || error.message, variant: 'destructive' });
    } finally { endAction('hidden'); }
  };

  const clearChat = useCallback(async () => {
    try {
      const response = await base44.functions.invoke('clear-room-messages', { room_id: id });
      // Temizleyen kişiyi belirten not sohbette kalır.
      const noticeMessage = response?.data?.message;
      setMessages(noticeMessage ? [noticeMessage] : []);
      toast({ title: 'Sohbet temizlendi' });
    } catch (error) {
      toast({ title: 'Sohbet temizlenemedi', description: error?.response?.data?.error || error.message, variant: 'destructive' });
    }
  }, [id, toast]);

  // Sayaç tahtası: açıkken her koltuğun altında sayaç görünür.
  const toggleBoard = async () => {
    const next = !boardActive;
    // Anında tepki ver, ardından oda kaydıyla doğrula.
    setRoom((prev) => (prev ? { ...prev, number_board: next } : prev));
    const ok = await invokeVoice({ action: next ? 'number-board-open' : 'number-board-close' });
    if (ok) {
      toast({ title: next ? 'Sayaçlar başladı' : 'Sayaçlar durdu', description: next ? 'Koltukların altında “Devam Ediyor” sayacı ilerliyor.' : undefined });
    } else {
      setRoom((prev) => (prev ? { ...prev, number_board: !next } : prev));
    }
  };

  // Sayaç ayarı: kişi koltuktan inince ya da odadan çıkınca sayacı sıfırlansın mı?
  const saveBoardSettings = async (resetSeat, resetRoom) => {
    // Seçim anında uygulanır, sunucu yanıtı aynı değerleri doğrular.
    patchRoom({ number_board_reset_seat: resetSeat, number_board_reset_room: resetRoom });
    const ok = await invokeVoice({ action: 'number-settings', reset_on_seat_leave: resetSeat, reset_on_room_leave: resetRoom });
    if (ok) toast({ title: resetSeat || resetRoom ? 'Sayaç ayarı kaydedildi' : 'Sayaç sıfırlama kapatıldı' });
  };

  // Oda teması: seçim anında zemin değişir, oda kaydına yazılarak odadaki herkese yansır.
  const changeTheme = async (key) => {
    const previous = room?.background || '';
    patchRoom({ background: key });
    try {
      await base44.entities.Room.update(id, { background: key });
      toast({ title: 'Oda teması değişti' });
    } catch (error) {
      patchRoom({ background: previous });
      toast({ title: 'Tema değiştirilemedi', description: error?.response?.data?.error || error.message, variant: 'destructive' });
    }
  };

  const toggleChatBan = async () => {
    const ok = await invokeVoice({ action: 'chat-ban', banned: !chatBanned });
    if (ok) {
      // Menü açık kalır; buton etiketi "Sohbet yasağını kaldır" olarak değişir.
      toast({
        title: chatBanned ? 'Sohbet yasağı kaldırıldı' : 'Sohbet yasağı açıldı',
        description: chatBanned ? 'Herkes yeniden yazabilir.' : 'Yalnızca koltuktakiler yazabilir.',
      });
    }
  };

  // Film odasındayken sesli modu kapatıp film arayüzüne dönmeyi sağlar.
  const exitVoiceMode = useCallback(async () => {
    try {
      await base44.functions.invoke('room-presence', { action: 'toggle-voice', room_id: id });
      toast({ title: 'Film odasına dönülüyor' });
    } catch (error) {
      toast({ title: 'İşlem başarısız', description: error?.response?.data?.error || error.message, variant: 'destructive' });
    }
  }, [id, toast]);

  const handleToggleMod = async (targetId, makeMod) => {
    const actionKey = `mod:${targetId}`;
    if (!beginAction(actionKey)) return;
    const previousModerators = room?.room_moderators || [];
    try {
      const mods = room?.room_moderators || [];
      patchRoom({ room_moderators: makeMod ? [...new Set([...mods, targetId])] : mods.filter((value) => value !== targetId) });
      await base44.functions.invoke('room-presence', { action: makeMod ? 'assign-mod' : 'remove-mod', room_id: id, target_id: targetId });
      toast({ title: makeMod ? 'Yönetici yapıldı' : 'Yöneticilik kaldırıldı' });
    } catch (error) {
      patchRoom({ room_moderators: previousModerators });
      toast({ title: 'İşlem başarısız', description: error?.response?.data?.error || error.message, variant: 'destructive' });
    } finally { endAction(actionKey); }
  };

  const toggleMuteFor = async (targetId) => {
    if (!targetId) return;
    const actionKey = `mute:${targetId}`;
    if (!beginAction(actionKey)) return;
    const muted = !!participants.find((person) => person.user_id === targetId)?.muted;
    try {
      patchRoom({ participants: (room?.participants || []).map((person) => (person.user_id === targetId ? { ...person, muted: !muted } : person)) });
      await base44.functions.invoke('room-presence', { action: 'toggle-mute', room_id: id, target_id: targetId });
      toast({ title: muted ? 'Mikrofonu açıldı' : 'Mikrofonu kapatıldı' });
    } catch (error) {
      setRoom((current) => current ? { ...current, participants: (current.participants || []).map((person) => person.user_id === targetId ? { ...person, muted } : person) } : current);
      toast({ title: 'İşlem başarısız', description: error?.response?.data?.error || error.message, variant: 'destructive' });
    } finally { endAction(actionKey); }
  };

  const kickFromRoom = async (targetId) => {
    if (!targetId) return;
    await invokeVoice({ action: 'seat-kick', target_id: targetId });
    try {
      await base44.functions.invoke('room-presence', { action: 'kick', room_id: id, target_id: targetId });
      await syncRoom();
      toast({ title: 'Kişi odadan atıldı', description: 'Atılan kişi odaya tekrar giremez — kayıt defterinden yasağı kaldırabilirsin.' });
    } catch (error) {
      toast({ title: 'İşlem başarısız', description: error?.response?.data?.error || error.message, variant: 'destructive' });
    }
  };

  // Kayıt defterinden giriş yasağını kaldır
  const unbanUser = async (targetId) => {
    if (!targetId) return;
    try {
      await base44.functions.invoke('room-presence', { action: 'unban', room_id: id, target_id: targetId });
      await syncRoom();
      toast({ title: 'Giriş yasağı kaldırıldı' });
    } catch (error) {
      toast({ title: 'İşlem başarısız', description: error?.response?.data?.error || error.message, variant: 'destructive' });
    }
  };

  const sendMessage = useCallback(async (text) => {
    // Sohbet yasağı açıkken koltukta oturmayan kişi sohbete yazamaz.
    if (chatLocked) {
      toast({ title: 'Sohbet yasağı var', description: 'Yazmak için bir koltuğa otur.', variant: 'destructive' });
      return;
    }
    try {
      await base44.functions.invoke('send-room-message', { room_id: id, text });
    } catch (error) {
      // Yasak yeni açıldıysa oda durumunu tazele — sohbet bölümü anında kilitlenir.
      if (error?.response?.status === 403) syncRoom();
      toast({ title: 'Mesaj gönderilemedi', description: error?.response?.data?.error || error.message, variant: 'destructive' });
    }
  }, [id, toast, chatLocked, syncRoom]);

  // Hediye alan kişinin profilinde kısa süreli efekt.
  const flashGifted = useCallback((ids, emoji) => {
    if (!Array.isArray(ids) || !ids.length) return;
    setGifted((prev) => {
      const next = { ...prev };
      ids.forEach((value) => { next[value] = emoji || '🎁'; });
      return next;
    });
    window.clearTimeout(giftFlashRef.current);
    giftFlashRef.current = window.setTimeout(() => setGifted({}), 2000);
  }, []);

  useEffect(() => () => window.clearTimeout(giftFlashRef.current), []);

  const openGifts = useCallback(() => setGiftOpen(true), []);
  const closeGifts = useCallback(() => setGiftOpen(false), []);

  // Hediye tahtası açıkken profiller çoklu seçilir — kişi kendini de seçebilir.
  const roomProfileActions = useVoiceRoomProfileActions({
    seats, participants, canMod, userId: user?.id, seated, voice, invokeVoice, toast, toggleMuteFor,
    openGifts, setSelectedIds, setMentionTarget, setChatOpen, setComposerOpen, setDmUserId, kickFromRoom,
    moderators, onToggleMod: handleToggleMod,
  });

  // Koltuk, sohbet satırı ve izleyici listesi aynı merkezi profil kartını açar.
  const openRoomProfile = useLatestCallback((targetId) => {
    if (!targetId) return;
    const person = participants.find((item) => item.user_id === targetId) || seats.find((item) => item.user_id === targetId);
    openUserProfile(targetId, { roomActions: roomProfileActions, name: person?.name, avatar: person?.avatar, hidden: !!person?.hidden || isHiddenName(person?.name) });
  });

  const toggleGiftPerson = useCallback((userId) => {
    if (!userId) return;
    setSelectedIds((prev) => (prev.includes(userId) ? prev.filter((value) => value !== userId) : [...prev, userId]));
  }, []);

  // Kuyruk boşaldıktan sonra kısa bir sessizlik beklenir: art arda gönderimde her dokunuş için
  // ayrı tahta/bakiye eşitlemesi yapılmaz, gönderim bitince tek seferde yapılır.
  const scheduleGiftSync = () => {
    window.clearTimeout(giftSyncTimerRef.current);
    giftSyncTimerRef.current = window.setTimeout(() => {
      giftSyncTimerRef.current = 0;
      if (giftQueueRef.current.length || giftFlushingRef.current) return;
      syncRoom().catch(() => {});
      refreshCoins();
    }, 400);
  };

  // Sayfadan çıkılırken bekleyen tamamlamalar bırakılmaz: kalan istekler arka planda yollanır,
  // alıcının elmas ve kota kaydı eksik kalmaz.
  useEffect(() => () => {

    window.clearTimeout(giftSyncTimerRef.current);
  }, []);

  // Tek gönderim: bakiye düşer, alıcı başına kayıt ve sohbet satırı oluşur.
  const sendGiftOnce = async (gift, ids, quantity = 1, requestId) => {
    // Sahne tek kez oynasın: hediye satırının canlı yayın kopyası bu gönderim için yok sayılır.
    markOwnSend();
    const response = await base44.functions.invoke('voice-room', {
      room_id: id, action: 'gift-send', gift_id: gift.id, target_ids: ids, quantity, request_id: requestId,
    });
    const data = response.data;
    // Kuyrukta bekleyen gönderim yoksa bakiye sunucudan gelen gerçek değerle eşitlenir;
    // bekleyen gönderim varsa anlık düşen değer korunur (kuyruk boşalınca gerçek değer okunur).
    if (typeof data.coins === 'number') {
      const reserved = giftQueueRef.current.reduce((sum, job) => sum + Number(job.gift.k_value) * 1000 * job.quantity * job.ids.length, 0);
      setCoins(Math.max(0, data.coins - reserved));
      publishWalletCoins(user?.id, data.coins);
    }
    setRoom(prev => !prev || (prev.updated_date && data.room_updated_at && prev.updated_date > data.room_updated_at) ? prev : { ...prev, number_scores: data.number_scores, number_board: true, board_started_at: data.board_started_at, updated_date: data.room_updated_at });
    markGiftSeen((data.messages || []).map((message) => message.id));
    const recipientIds = (data.recipients || []).map((item) => item.user_id);
    // Gönderdiğim hediye kutu toplamına anında yansır, ardından sunucu toplamıyla doğrulanır.
    loadGiftBoard();
    flashGifted(recipientIds, data.gift?.emoji);
  };

  // Sunucu gönderimi kabul etmediyse yerelde işlenen adım geri alınır: bakiyeden düşmeyen
  // hediyenin sayı tahtasına işlememesi için tahta ve bakiye aynı anda eski haline döner.
  const revertGiftStep = (job) => {
    const step = Math.max(0, Number(job.gift?.k_value) || 0) * 1000 * (job.quantity || 1);
    if (step <= 0 || !job.ids?.length) return;
    const cost = step * job.ids.length;
    setCoins((prev) => (prev === null || prev === undefined ? prev : prev + cost));

  };

  // Kuyruğu boşaltır: istekler tek tek gider, geçici hatalarda kısa beklemeyle yeniden denenir.
  // Böylece aynı anda gönderilen iki hediye sunucudaki sayı kaydını birbirinin üstüne yazmaz
  // (sayaç bir anda yükselip geri düşmez) ve hızlı seri gönderimde istek yoğunluğu hatası olmaz.
  const flushGiftQueue = async () => {
    if (giftFlushingRef.current) return;
    giftFlushingRef.current = true;
    let lastError = null;
    try {
      while (giftQueueRef.current.length) {
        const job = giftQueueRef.current.shift();
        let done = false;
        let rejected = false;
        for (let attempt = 0; attempt < 8 && !done; attempt += 1) {
          try {
            await sendGiftOnce(job.gift, job.ids, job.quantity, job.requestId);
            lastError = null;
            done = true;
          } catch (error) {
            lastError = error;
            const status = error?.response?.status || 0;
            // Kesin cevap (bakiyede para yok, geçersiz hediye): kalan gönderimler bekletilmez.
            if (status >= 400 && status < 500 && status !== 429) {
              rejected = true;
              giftQueueRef.current.forEach(revertGiftStep);
              giftQueueRef.current = [];
              const data = error?.response?.data || {};
              // Bakiye yetmediyse kullanıcı doğrudan coin yükleme ekranına alınır.
              if (data.needed_k !== undefined || /Yetersiz/i.test(data.error || '')) {
                setGiftOpen(true);
                setCoinsRequest((value) => value + 1);
              }
              break;
            }
            await new Promise((resolve) => window.setTimeout(resolve, Math.min(5000, Number(error?.response?.data?.retry_after_ms) || 700 * (attempt + 1))));
          }
        }
        // Sunucu bu gönderimi işlemediyse yereldeki adım geri alınır: bakiyeden düşmeyen
        // hediye sayı tahtasında kalmaz. İşlenen gönderimler olduğu gibi bırakılır.
        if (!done) revertGiftStep(job);
        if (rejected) break;
      }
    } finally {
      giftFlushingRef.current = false;
    }
    // Kuyruk boşaldı: tahtanın kesin hali ve gerçek coin bakiyesi sunucudan okunur — ekranda
    // gösterilen değer her zaman gerçek cüzdan değeridir. Art arda gönderimde tek seferde yapılır.
    scheduleGiftSync();
    if (lastError) throw lastError;
  };

  // Gönderim isteği: coin dokunuş anında gerçekten düşer, sayı tahtası ilerler ve istek
  // kuyruğa girip sırayla işlenir (bakiyeye her hediye tek tek işlenir).
  const queueGiftSend = (gift, ids, quantity = 1) => {
    const step = Math.max(0, Number(gift.k_value) || 0) * 1000 * quantity;
    if (step > 0 && ids.length) {
      // Coin bakiyesi anında düşer: ekranda eski değer kalmaz.
      const cost = step * ids.length;
      setCoins((prev) => (prev === null || prev === undefined ? prev : Math.max(0, prev - cost)));
      // Sayı tahtası anında ilerler: sunucu cevabı beklenmez.
      setRoom((prev) => prev ? { ...prev, number_scores: withBoardStep(prev.number_scores, user?.id, cost), number_board: true } : prev);
    }
    // Hediye animasyonu gönderim anında başlar: sunucu cevabı beklenmez.
    pushGiftAlert({
      key: `send-${Date.now()}`,
      giftId: gift.id,
      giftName: gift.name || 'Hediye',
      emoji: gift.emoji || '🎁',
      imageUrl: gift.image_url || '',
      kValue: Number(gift.k_value) || 0,
      totalK: (Number(gift.k_value) || 0) * ids.length * quantity,
      count: ids.length,
      senderName: '',
      recipientName: ids.map((uid) => giftPeople.find((p) => p.user_id === uid)?.name).filter(Boolean).join(', ') || 'Oda',
      toId: ids.length === 1 ? ids[0] : '',
    });
    giftQueueRef.current.push({ gift, ids, quantity, requestId: makeId() });
    return flushGiftQueue();
  };

  // Kutudaki ve köşedeki gönder tuşu: bakiye yetmiyorsa hediye hiç işleme alınmaz, uyarı verilir
  // ve bakiyeye dokunulmaz; yeterliyse gönderim kuyruğa girer. Dönen değer: gönderim kabul edildi mi.
  const pressGift = () => {
    if (!selectedGift || !selectedIds.length) return false;
    if (giftUnaffordable) {
      toast({
        title: 'Yetersiz bakiye',
        description: `Gereken ${formatCoins(giftCost)} coin, bakiyen ${formatCoins(coins)} coin.`,
        variant: 'destructive',
      });
      // Hediye işleme alınmaz; doğrudan coin yükleme ekranı açılır.
      setGiftOpen(true);
      setCoinsRequest((value) => value + 1);
      return false;
    }
    setGiftOpen(false);
    queueGiftSend(selectedGift, [...selectedIds]).catch((error) => {
      toast({ title: 'Hediye gönderilemedi', description: error?.response?.data?.error || error.message, variant: 'destructive' });
    });
    return true;
  };

  // Odaya giriş ekranları (yükleme, giriş yasağı, şifre ve bağlanma beklemesi) tek bileşende toplanır.
  if (loading || banNotice || !joined) {
    return (
      <VoiceRoomGate
        loading={loading}
        banNotice={banNotice}
        notice={notice}
        needsPassword={needsPassword}
        room={room}
        password={password}
        onPasswordChange={setPassword}
        onSubmitPassword={attemptJoin}
        onGoHome={() => navigate('/')}
      />
    );
  }

  // Özel sohbet yarım panel olarak açıkken oda yalnızca panelin üstünde kalan alana yerleşir:
  // sahne bu alana sığar, koltuk ızgarası kesilmeden tam görünür. Panel tam ekrana geçince
  // (zaten her yeri kapladığı için) oda normal düzeninde kalır.
  const dmHalfOpen = (dmOpen || !!dmUserId) && !dmExpanded;

  const sheetSeat = seatIndex === null ? null : seats[seatIndex];

  // Seçili kişinin koltuk puanı animasyonda gösterilir; hediye alan kişinin profili ve ismi de sahnede yazar.
  const overlayAlert = giftAlert ? (() => {
    const person = [...seatsView, ...participants].find((item) => item?.user_id === giftAlert.toId) || null;
    return {
      ...giftAlert,
      value: scores[giftAlert.toId] || 0,
      recipientName: giftAlert.recipientName || person?.name || '',
      recipientAvatar: person?.avatar || '',
      recipientFrame: person?.frame || '',
      recipientFrameScale: person?.frame_scale,
    };
  })() : null;

  // Klavye açılınca oda düzeni yerinden oynamaz: yalnızca sohbet bölümü klavyenin üstüne kayar,
  // alttaki kontrol çubuğu (mik/hoparlör) hep aynı yerde durur.
  return (
    <VoiceViewport
      className={`z-[150] ${dmHalfOpen ? 'voice-dm-open' : ''}`}
      style={dmHalfOpen ? { paddingBottom: 'var(--voice-dm-height)' } : undefined}
      onKeyboardChange={handleKeyboardChange}
    >
      <RoomBackground value={room?.background} cover={room?.cover_url} />

      <header className="relative shrink-0 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex min-w-0 flex-col items-start">
          <RoomInfoCard
            room={room}
            onOpen={() => setProfilePanelOpen(true)}
            viewerCount={participants.length}
            onOpenViewers={() => setViewerOpen(true)}
            canMod={canMod}
            menuHighlighted={!!music.music?.is_playing}
            onOpenMenu={() => setMenuOpen(true)}
            onExit={() => setExitOpen(true)}
          />
          <GiftScoreChip
            score={giftBoard?.all?.total || 0}
            onClick={() => { setGiftBoardOpen(true); loadGiftBoard(); }}
          />
        </div>
      </header>

      <VoiceStage
        scrollRef={swipeGesture.scrollRef}
        handlers={swipeGesture.handlers}
        room={room}
        hiddenAnnounce={{ active: room?.ghost_entered_at, name: hiddenAnnounceName }}
        grid={{
          seats: seatsView,
          musicOwnerId: music.music?.is_playing ? music.music.owner_id : null,
          userId: user?.id,
          ownerId: room?.owner_id,
          moderators,
          speakingIds: voice.speakingIds,
          localSpeaking: voice.localSpeaking,
          participantMicStates: voice.participantMicStates,
          localMicMuted: voice.muted,
          onSelectSeat: handleSeatPress,
          boardActive,
          boardStartedAt,
          scores,
          accent: seatAccent,
          gifted,
        }}
      />

      {/* Ajans çağrısı kartı: "Devam Ediyor" sayacının altında çıkar. Çağrıyı yollayan
          kişide (ajans sahibi/asistan) görünmez, yalnızca diğer kişilere düşer. */}
      {agencyCall && agencyCall.sender_id !== user?.id && (
        <AgencyCallBanner call={agencyCall} onClose={dismissAgencyCall} onJoin={() => { const target = agencyCall?.room_id; dismissAgencyCall(); if (target && target !== id) navigate(`/sesli-oda/${target}`); }} />
      )}

      <div className={`voice-chat-dock min-h-0 shrink-0 ${composerOpen ? 'is-composing' : ''}`}>
      <VoiceChatDock
        messages={messages}
        chatLocked={chatLocked}
        onSend={sendMessage}
        open={chatOpen}
        onCloseComposer={() => setComposerOpen(false)}
        composerOpen={composerOpen}
        keyboardOpen={keyboardOpen}
        currentUserId={user?.id}
        ownerId={room?.owner_id}
        moderators={moderators}
        hiddenUsers={hiddenUsersByName}
        onOpenProfile={openRoomProfile}
        mention={mentionTarget}
        bigGiftNotice={bigGiftNotice}
        onOpenBigGiftRoom={() => {
          const target = bigGiftNotice?.room_id;
          dismissBigGiftNotice();
          if (target) navigate(`/sesli-oda/${target}`);
        }}
      />

      {(voice.remoteMuted || voice.error) && (
        <p className="px-3 pb-1 text-center text-[11px] text-amber-400">
          {voice.remoteMuted ? 'Yönetici mikrofonunu kapattı.' : voice.error}
        </p>
      )}

      <MicPermissionGuide
        open={voice.micDenied && !micGuideDismissed}
        onClose={() => setMicGuideDismissed(true)}
        onRetry={voice.retryMic}
      />

      </div>
      {/* Controls never receive keyboard transforms; the keyboard covers them while typing. */}
      <div className="voice-controls-anchor shrink-0" hidden={composerOpen}>
      {!composerOpen && (
      <VoiceControlBar
        keyboardOpen={keyboardOpen}
        micActive={!voice.muted}
        deafened={voice.deafened}
        chatOpen={chatOpen}
        onToggleMic={handleMic}
        onToggleSpeaker={voice.toggleDeafen}
        gamesOpen={gamesOpen}
        gamesEnabled={gamesEnabled}
        giftOpen={giftOpen}
        settingsOpen={settingsOpen}
        onOpenGames={() => setGamesOpen(true)}
        onOpenGifts={openGifts}
        onOpenSettings={() => setSettingsOpen((value) => !value)}
        onOpenPrivateChat={() => setDmOpen(true)}
        onToggleChat={() => {
          if (chatLocked) {
            toast({ title: 'Sohbet yasağı açık', description: 'Yazmak için bir koltuğa otur.' });
            return;
          }
          // Tek basışta sohbet akışı ve yazma alanı açılır, klavye gelir.
          // Yazma alanı açıkken basılırsa yalnızca yazma alanı kapanır; mesaj akışı ekranda kalır,
          // tekrar basınca yazma alanı ve klavye yeniden açılır.
          if (composerOpen) { setComposerOpen(false); return; }
          setChatOpen(true);
          setComposerOpen(true);
        }}
      />
      )}
      </div>

      <VoiceRoomMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        musicPlaying={!!music.music?.is_playing}
        onOpenMusic={() => { setMusicBubble(true); setMusicOpen(true); }}
        room={room}
        isOwner={isOwner}
        isAdmin={user?.role === 'admin'}
        canMod={canMod}
        onSeatCount={changeSeatCount}
        onSetPassword={handleSetPassword}
        onToggleHidden={handleToggleHidden}
        onShare={canMod ? () => setShareOpen(true) : null}
        boardActive={boardActive}
        onToggleBoard={toggleBoard}
        onBoardSettings={saveBoardSettings}
        onClearChat={clearChat}
        onToggleChatBan={toggleChatBan}
        onOpenLog={() => setLogOpen(true)}
        onExitVoiceMode={canMod ? exitVoiceMode : null}
        theme={room?.background}
        onTheme={changeTheme}
        onAgencyCall={agencyCallStatus?.eligible ? () => setAgencyCallOpen(true) : null}
      />
      <AgencyCallComposer open={agencyCallOpen} onClose={() => setAgencyCallOpen(false)} roomId={id} status={agencyCallStatus} onSent={(data) => setAgencyCallStatus((prev) => ({ ...prev, ...data }))} />


      <RoomLogSheet
        open={logOpen}
        onClose={() => setLogOpen(false)}
        logs={roomLogs}
        bannedUsers={bannedUsers}
        onUnban={unbanUser}
      />

      {/* Oda paneli: oda kartına dokununca yarıdan açılır. */}
      <RoomProfileSheet
        open={profilePanelOpen}
        onClose={() => setProfilePanelOpen(false)}
        room={room}
        user={user}
        moderators={moderators}
        canMod={canMod}
        onRename={renameRoom}
        onSaveAnnouncement={saveAnnouncement}
        onSaveCategory={saveCategory}
        onSaveLook={saveRoomLook}
        onRemoveMod={(targetId) => handleToggleMod(targetId, false)}
      />

      {/* Odadaki şarkı bu cihazda çalar; liste ve denetleyici kendi bileşeninde durur.
          Köşedeki çember denetleyici yalnızca şarkıyı açan oda sahibi/yöneticide görünür. */}
      <RoomMusicLayer
        music={music}
        sheetOpen={musicOpen}
        onCloseSheet={() => setMusicOpen(false)}
        controllerVisible={canMod && musicBubble && !!music.music && !musicOpen && !menuOpen}
        onOpenList={() => setMusicOpen(true)}
        isMod={canMod}
        onControl={music.control}
        onPlayNext={music.playNext}
      />

      <GiftBoardSheet
        open={giftBoardOpen}
        onClose={() => setGiftBoardOpen(false)}
        board={giftBoard}
        loading={giftBoardLoading}
        onSelect={openRoomProfile}
      />

      <VoiceSeatSheet
        open={seatIndex !== null}
        onClose={() => setSeatIndex(null)}
        seat={sheetSeat}
        index={seatIndex ?? 0}
        canMod={canMod}
        myId={user?.id}
        viewers={unseatedViewers}
        invitedIds={seatInviteIds}
        onTakeSeat={handleTakeSeat}
        onInviteToSeat={inviteToSeat}
        onMuteMic={muteMicFromSeat}
        onToggleLock={() => invokeVoice({ action: 'seat-lock', seat_index: seatIndex, locked: !sheetSeat?.locked })}
        onStepDown={() => invokeVoice({ action: 'seat-leave' })}
      />

      <RoomExitOverlay
        open={exitOpen}
        onClose={() => setExitOpen(false)}
        onMinimize={() => { setExitOpen(false); minimizeRoom(); }}
        onLeave={() => { setExitOpen(false); leaveRoom(); }}
      />

      <VoiceViewerSheet
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        participants={participants}
        seats={seats}
        userId={user?.id}
        ownerId={room?.owner_id}
        moderators={moderators}
        onSelect={openRoomProfile}
      />

      <VoiceSeatInvitePrompt
        invite={myInvite}
        roomName={room?.name}
        onAccept={acceptSeatInvite}
        onDecline={declineSeatInvite}
      />

      <VoicePrivateChatSheet
        open={dmOpen || !!dmUserId}
        initialUserId={dmUserId}
        onExpandChange={setDmExpanded}
        onClose={() => { setDmOpen(false); setDmUserId(null); setDmExpanded(false); }}
      />

      {/* Yayını paylaş: arkadaşlar tek tek seçilir, oda gizliyse giriş izni de verilir. */}
      <InviteSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        onInvite={shareRoom}
        title="Yayını paylaş"
        submitLabel="Paylaş"
        emptyText="Paylaşabileceğin arkadaş yok."
      />

      {gamesOpen && gamesEnabled && (
        <Suspense fallback={null}>
          <GamePanel open={gamesOpen} onClose={() => setGamesOpen(false)} roomId={id} />
        </Suspense>
      )}

      <GiftBoard
        open={giftOpen}
        onClose={closeGifts}
        coinsRequest={coinsRequest}
        user={user}
        gifts={gifts}
        tiers={tiers}
        people={giftPeople}
        selectedIds={selectedIds}
        giftId={giftId}
        coins={coins}
        giftTick={giftCount}
        onSelectGift={setGiftId}
        onTogglePerson={toggleGiftPerson}
        onSelectAll={() => setSelectedIds(giftPeople.map((person) => person.user_id))}
        onClear={() => setSelectedIds([])}
        onSend={pressGift}
        sendDisabled={!selectedGift || !selectedIds.length}
      />

      <GiftScene key={overlayAlert?.key} alert={giftEffects && !bigGift ? overlayAlert : null} tiers={tiers} gifts={gifts} />
      {giftEffects && <BigGiftStage alert={bigGift} gifts={gifts} />}

      <GiftEffectsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        enabled={giftEffects}
        onToggle={setGiftEffects}
        swipeEnabled={swipe.swipeEnabled}
        onToggleSwipe={swipe.toggleSwipe}
        onAgencyCall={agencyCallStatus?.eligible ? () => setAgencyCallOpen(true) : null}
      />

      {notice && joined && (
        <p className="pointer-events-none absolute left-1/2 top-20 z-[170] -translate-x-1/2 rounded-full bg-black/80 px-4 py-2 text-xs text-white">{notice}</p>
      )}
    </VoiceViewport>
  );
}