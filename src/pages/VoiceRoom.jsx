import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Armchair, Eye, Gift, Loader2, Lock, LogOut, MessageSquare, Mic, MicOff, Minimize2, MoreHorizontal, Shield, ShieldAlert, Unlock, UserMinus, UserPlus, UserRound } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useVoiceChat } from '@/hooks/useVoiceChat';
import useKeyboardInset from '@/hooks/useKeyboardInset';
import { useToast } from '@/components/ui/use-toast';
import VoiceSeatGrid from '@/components/voice/VoiceSeatGrid';
import VoiceControlBar from '@/components/voice/VoiceControlBar';
import VoiceChatDock from '@/components/voice/VoiceChatDock';
import VoiceViewerSheet from '@/components/voice/VoiceViewerSheet';
import VoiceSeatInvitePrompt from '@/components/voice/VoiceSeatInvitePrompt';
import RoomInfoCard from '@/components/voice/RoomInfoCard';
import VoiceRoomMenu from '@/components/voice/VoiceRoomMenu';
import VoiceSeatSheet from '@/components/voice/VoiceSeatSheet';
import InviteSheet from '@/components/voice/InviteSheet';
import VoiceCard from '@/components/voice/VoiceCard';
import RoomLogSheet from '@/components/voice/RoomLogSheet';
import GiftScoreChip from '@/components/voice/GiftScoreChip';
import GiftBoardSheet from '@/components/voice/GiftBoardSheet';
import VoiceProfileCard from '@/components/voice/VoiceProfileCard';
import VoiceMenuButton from '@/components/voice/VoiceMenuButton';
import { isRoomMinimized, setMinimizedRoom } from '@/lib/minimizedRoom';
import RoomDirectMessages from '@/components/player/RoomDirectMessages';
import GamePanel from '@/components/games/GamePanel';
import GiftBoard from '@/components/voice/GiftBoard';
import GiftSendButton from '@/components/voice/GiftSendButton';
import drainGiftQueue from '@/components/voice/drainGiftQueue';
import VoiceGiftOverlay from '@/components/voice/VoiceGiftOverlay';
import useGiftAlerts from '@/hooks/useGiftAlerts';
import useBigGiftAlerts from '@/hooks/useBigGiftAlerts';
import useBigGiftNotice from '@/hooks/useBigGiftNotice';
import BigGiftStage from '@/components/voice/BigGiftStage';
import { useGiftBalance, useGiftCatalog } from '@/hooks/useGiftCatalog';
import { tierForK, toneColor } from '@/lib/giftTone';

export default function VoiceRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const { toast } = useToast();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [notice, setNotice] = useState('');
  const [banNotice, setBanNotice] = useState('');
  const [messages, setMessages] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [seatIndex, setSeatIndex] = useState(null);
  const [profileUserId, setProfileUserId] = useState(null);
  const [dmUserId, setDmUserId] = useState(null);
  const [dmOpen, setDmOpen] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [gamesOpen, setGamesOpen] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [giftBoardOpen, setGiftBoardOpen] = useState(false);
  const [giftBoard, setGiftBoard] = useState(null);
  const [giftBoardLoading, setGiftBoardLoading] = useState(false);
  const [giftSendActive, setGiftSendActive] = useState(false);
  const [giftSendCount, setGiftSendCount] = useState(0);
  const [giftId, setGiftId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [gifted, setGifted] = useState({});

  const keyboardInset = useKeyboardInset();

  // Hediye Tahtası: katalog, K seviyeleri, bakiye ve gelen hediye animasyonları.
  const { gifts, tiers } = useGiftCatalog();
  const { coins, setCoins } = useGiftBalance(id, giftOpen);
  const giftMap = useMemo(() => new Map(gifts.map((item) => [item.id, item])), [gifts]);
  const resolveGift = useCallback((giftKey) => giftMap.get(giftKey) || null, [giftMap]);
  const { alert: giftAlert, push: pushGiftAlert, markSeen: markGiftSeen } = useGiftAlerts(messages, resolveGift);
  // Büyük hediye duyurusu tüm sesli odalarda görünür.
  const bigGift = useBigGiftAlerts();
  // Sohbetin altındaki büyük hediye satırı — basılınca hediye atan kişinin odasına gidilir.
  const { notice: bigGiftNotice, dismiss: dismissBigGiftNotice } = useBigGiftNotice(id);

  const joinedRef = useRef(false);
  const joinTriedRef = useRef(false);
  const sawSelfRef = useRef(false);
  const keepSeatRef = useRef(false);
  const giftFlashRef = useRef(null);
  const giftIdleRef = useRef(null);
  const giftQueueRef = useRef([]);
  const giftBusyRef = useRef(false);
  const giftSessionRef = useRef(0);
  const giftBoardRef = useRef(0);
  const giftRefreshTimerRef = useRef(null);

  useEffect(() => {
    giftSessionRef.current += 1;
    setGiftSendCount(0);
  }, [giftId, selectedIds.join('|')]);

  const seats = useMemo(() => (Array.isArray(room?.seats) ? room.seats : []), [room?.seats]);
  const myInvite = useMemo(
    () => (Array.isArray(room?.seat_invites) ? room.seat_invites.find((item) => item.user_id === user?.id) : null),
    [room?.seat_invites, user?.id]
  );
  const participants = useMemo(() => room?.participants || [], [room?.participants]);
  const moderators = room?.room_moderators || [];
  const mySeatIndex = seats.findIndex((seat) => seat.user_id === user?.id);
  const seated = mySeatIndex >= 0;
  const isOwner = !!user && room?.owner_id === user.id;
  const canMod = isOwner || moderators.includes(user?.id) || user?.role === 'admin';
  // Sohbet yasağı açıkken yalnızca koltuktakiler yazar.
  const chatBanned = room?.chat_seated_only === true;
  const chatLocked = chatBanned && !seated;

  const seatsView = useMemo(
    () => seats.map((seat) => ({
      ...seat,
      muted: seat.user_id ? !!participants.find((person) => person.user_id === seat.user_id)?.muted : false,
    })),
    [seats, participants]
  );

  // Kayıt defteri ve odadan atılanlar — yönetici işlemleri sohbete değil buraya yazılır.
  const roomLogs = useMemo(() => (Array.isArray(room?.room_logs) ? room.room_logs : []), [room?.room_logs]);
  const bannedUsers = useMemo(() => (Array.isArray(room?.banned_users) ? room.banned_users : []), [room?.banned_users]);

  // Sayı tahtası: açıkken her koltuğun altında kişinin sayısı gösterilir.
  const boardActive = room?.number_board === true;
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
      ? (map.get(user.id) || { user_id: user.id, name: user.full_name || 'Sen', avatar: '' })
      : null;
    const others = [...map.values()].filter((person) => person.user_id !== user?.id);
    return self ? [{ ...self, me: true }, ...others] : others;
  }, [seats, participants, user?.id, user?.full_name]);

  // Seçim rengi: seçilen hediyenin K seviyesi belirler.
  const selectedGift = useMemo(() => gifts.find((item) => item.id === giftId) || null, [gifts, giftId]);
  const seatAccent = toneColor(tierForK(tiers, selectedGift?.k_value || 0));

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

  const syncRoom = useCallback(async () => {
    const response = await base44.functions.invoke('room-presence', { action: 'get', room_id: id }).catch(() => null);
    const record = response?.data?.room;
    if (record) setRoom(record);
    return record;
  }, [id]);

  // Hediye kutusu: odada biriken hediyeler (son 24 saat + tüm zamanlar).
  const loadGiftBoard = useCallback(async () => {
    setGiftBoardLoading(true);
    try {
      const response = await base44.functions.invoke('voice-room', { room_id: id, action: 'gift-board' });
      setGiftBoard(response.data);
    } catch {
      // Sıralama alınamazsa kutu son bilinen değerle kalır.
    } finally {
      setGiftBoardLoading(false);
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

  // Odayı yükle — sesli oda değilse normal oda sayfasına yönlendir.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await base44.functions.invoke('room-presence', { action: 'get', room_id: id });
        if (cancelled) return;
        const record = response.data?.room;
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

  const attemptJoin = useCallback(async (pw = '') => {
    try {
      await base44.functions.invoke('room-presence', { action: 'join', room_id: id, password: pw });
      sawSelfRef.current = true;
      joinedRef.current = true;
      setJoined(true);
      setNeedsPassword(false);
      setPassword('');
      setNotice('');
      await syncRoom();
      return true;
    } catch (error) {
      const data = error?.response?.data || {};
      setNeedsPassword(!!data.needsPassword);
      // Odadan atılan kişi 24 saat giremez: uyarı ekranda gösterilir.
      if (data.banned) setBanNotice(data.error || '24 saat boyunca bu odaya giremezsiniz.');
      setNotice(data.error || 'Odaya katılamadınız.');
      return false;
    }
  }, [id, syncRoom]);

  // Şifresiz odalara otomatik katıl.
  useEffect(() => {
    if (loading || joined || !room || !user || needsPassword || joinTriedRef.current) return;
    joinTriedRef.current = true;
    attemptJoin('');
  }, [loading, joined, room, user, needsPassword, attemptJoin]);

  // Oda kaydını canlı takip et (koltuklar, katılımcılar, ayarlar).
  useEffect(() => {
    if (!id) return;
    const unsubscribe = base44.entities.Room.subscribe((event) => {
      if (event.id !== id) return;
      if (event.type === 'delete') { setNotice('Oda kapatıldı.'); return; }
      if (event.type === 'update' || event.type === 'create') setRoom((prev) => (prev ? { ...prev, ...event.data } : event.data));
    });
    return unsubscribe;
  }, [id]);

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

  // Sohbet akışı
  useEffect(() => {
    if (!id) return;
    base44.entities.RoomMessage.filter({ room_id: id }, '-created_date', 80)
      .then((list) => setMessages([...list].reverse()))
      .catch(() => {});
    const unsubscribe = base44.entities.RoomMessage.subscribe((event) => {
      const data = event?.data;
      if (!data || data.room_id !== id || event.type !== 'create') return;
      setMessages((prev) => (prev.some((item) => item.id === event.id) ? prev : [...prev, { ...data, id: event.id }]));
    });
    return unsubscribe;
  }, [id]);

  // Sekme kapanırken / sayfadan çıkılırken odadan ayrıl.
  useEffect(() => () => {
    if (!joinedRef.current) return;
    joinedRef.current = false;
    // Profil sayfasına gidilirken oda ve koltuk korunur.
    if (keepSeatRef.current) return;
    // Oda küçültüldüğünde odadan düşülmez — balon açıkken odalar gezilebilir.
    if (isRoomMinimized(id)) return;
    base44.functions.invoke('voice-room', { action: 'seat-leave', room_id: id }).catch(() => {});
    base44.functions.invoke('room-presence', { action: 'leave', room_id: id }).catch(() => {});
  }, [id]);

  const invokeVoice = async (payload) => {
    try {
      const response = await base44.functions.invoke('voice-room', { room_id: id, ...payload });
      const data = response?.data || {};
      setRoom((prev) => {
        if (!prev) return prev;
        const next = { ...prev };
        if (Array.isArray(data.seats)) {
          next.seats = data.seats;
          next.seat_count = data.seat_count ?? data.seats.length;
        }
        if (typeof data.number_board === 'boolean') next.number_board = data.number_board;
        if (Array.isArray(data.number_scores)) next.number_scores = data.number_scores;
        if (typeof data.number_board_reset_seat === 'boolean') next.number_board_reset_seat = data.number_board_reset_seat;
        if (typeof data.number_board_reset_room === 'boolean') next.number_board_reset_room = data.number_board_reset_room;
        if (typeof data.chat_seated_only === 'boolean') next.chat_seated_only = data.chat_seated_only;
        return next;
      });
      return true;
    } catch (error) {
      toast({ title: 'İşlem başarısız', description: error?.response?.data?.error || error.message, variant: 'destructive' });
      return false;
    }
  };

  const leaveRoom = useCallback(async () => {
    joinedRef.current = false;
    sawSelfRef.current = false;
    setJoined(false);
    if (seated) await base44.functions.invoke('voice-room', { action: 'seat-leave', room_id: id }).catch(() => {});
    await base44.functions.invoke('room-presence', { action: 'leave', room_id: id }).catch(() => {});
    navigate('/acik-odalar');
  }, [id, seated, navigate]);

  // Odayı küçült: oda ve koltuk korunur, sağ alttaki balondan odalar gezilebilir.
  const minimizeRoom = useCallback(() => {
    setMinimizedRoom({ id, name: room?.name || 'Sesli oda', owner_id: room?.owner_id, owner_name: room?.owner_name });
    navigate('/acik-odalar');
  }, [id, room?.name, room?.owner_id, room?.owner_name, navigate]);

  // Profil kartı açıcı — sohbet satırı ve izleyici listesinden kullanılır.
  const openProfile = (userId) => { if (userId) setProfileUserId(userId); };

  // Profil sayfasına giderken odadan ve koltuktan düşmeyi engeller.
  const openFullProfile = (userId) => {
    if (!userId) return;
    keepSeatRef.current = true;
    navigate(`/kullanici/${userId}`);
  };

  // Dolu koltuk profil kartını, boş koltuk beyaz koltuk menüsünü açar.
  const handleSeatPress = (index) => {
    const seat = seats[index];
    if (seat?.user_id) {
      // Hediye tahtası açıkken dokunma, alıcı seçimini değiştirir.
      if (giftOpen) { toggleGiftPerson(seat.user_id); return; }
      setProfileUserId(seat.user_id);
      return;
    }
    setSeatIndex(index);
  };

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

  const handleInvite = () => {
    if (!seated && !canMod) {
      toast({ title: 'Davet etmek için bir koltuğa otur' });
      return;
    }
    setInviteOpen(true);
  };

  const inviteToSeat = async (targetId) => {
    if (!targetId) return;
    const ok = await invokeVoice({ action: 'seat-invite', target_id: targetId });
    if (ok) toast({ title: 'Koltuk daveti gönderildi', description: 'Karşı tarafın ekranında "Otur / Aya kalk" seçenekleri çıkacak.' });
  };

  const acceptSeatInvite = async (index) => {
    const ok = await invokeVoice({ action: 'seat-take', seat_index: index });
    if (ok) await invokeVoice({ action: 'seat-invite-clear' });
  };

  const declineSeatInvite = () => { invokeVoice({ action: 'seat-invite-clear' }); };

  const sendInvites = async (ids) => {
    const ok = await invokeVoice({ action: 'invite', target_ids: ids });
    if (ok) { toast({ title: 'Davet gönderildi', description: `${ids.length} kişi davet edildi.` }); setInviteOpen(false); }
    return ok;
  };

  const handleSetPassword = async (pw) => {
    try {
      await base44.functions.invoke('room-presence', { action: 'set-password', room_id: id, password: pw });
      await syncRoom();
      toast({ title: pw ? 'Oda kilitlendi' : 'Oda kilidi kaldırıldı' });
    } catch (error) {
      toast({ title: 'İşlem başarısız', description: error?.response?.data?.error || error.message, variant: 'destructive' });
    }
  };

  // Oda ismi: başlıktaki kalemle değiştirilir, odadaki herkese anında yansır.
  const renameRoom = useCallback(async (nextName) => {
    try {
      await base44.functions.invoke('room-presence', { action: 'set-name', room_id: id, name: nextName });
      await syncRoom();
      toast({ title: 'Oda ismi güncellendi' });
      return true;
    } catch (error) {
      toast({ title: 'İsim değiştirilemedi', description: error?.response?.data?.error || error.message, variant: 'destructive' });
      return false;
    }
  }, [id, syncRoom, toast]);

  const handleToggleHidden = async () => {
    try {
      const response = await base44.functions.invoke('room-presence', { action: 'toggle-hidden', room_id: id });
      await syncRoom();
      toast({ title: response.data?.hidden ? 'Oda gizlendi' : 'Oda herkese açık' });
    } catch (error) {
      toast({ title: 'İşlem başarısız', description: error?.response?.data?.error || error.message, variant: 'destructive' });
    }
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
      await syncRoom();
      toast({ title: next ? 'Sayaç tahtası açıldı' : 'Sayaç tahtası kapatıldı', description: next ? 'Her koltuğun altında sayaç görünür.' : undefined });
    } else {
      setRoom((prev) => (prev ? { ...prev, number_board: !next } : prev));
    }
  };

  const toggleChatBan = async () => {
    const ok = await invokeVoice({ action: 'chat-ban', banned: !chatBanned });
    if (ok) {
      // Yasağın odaya işlendiğini doğrula — sohbet bölümü anında kilitlenir.
      await syncRoom();
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
    try {
      await base44.functions.invoke('room-presence', { action: makeMod ? 'assign-mod' : 'remove-mod', room_id: id, target_id: targetId });
      await syncRoom();
      toast({ title: makeMod ? 'Yönetici yapıldı' : 'Yöneticilik kaldırıldı' });
    } catch (error) {
      toast({ title: 'İşlem başarısız', description: error?.response?.data?.error || error.message, variant: 'destructive' });
    }
  };

  const toggleMuteFor = async (targetId) => {
    if (!targetId) return;
    const muted = !!participants.find((person) => person.user_id === targetId)?.muted;
    try {
      await base44.functions.invoke('room-presence', { action: 'toggle-mute', room_id: id, target_id: targetId });
      await syncRoom();
      toast({ title: muted ? 'Mikrofonu açıldı' : 'Mikrofonu kapatıldı' });
    } catch (error) {
      toast({ title: 'İşlem başarısız', description: error?.response?.data?.error || error.message, variant: 'destructive' });
    }
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

  // Profil kartındaki koltuk eylemi: kendi koltuğumda ayağa kalkar, yönetici karşı tarafı indirir.
  const handleProfileSeat = () => {
    const target = profileUserId;
    if (!target) return;
    setProfileUserId(null);
    if (target === user?.id) {
      if (seated) invokeVoice({ action: 'seat-leave' });
      return;
    }
    if (!canMod) return;
    invokeVoice({ action: 'seat-kick', target_id: target }).then(() => syncRoom());
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

  // Gönder tuşu: son basıştan 5 saniye sonra ortadan kaybolur, seçim temizlenir.
  const armGiftHide = useCallback(() => {
    window.clearTimeout(giftIdleRef.current);
    giftIdleRef.current = window.setTimeout(() => {
      if (giftBusyRef.current || giftQueueRef.current.length) { armGiftHide(); return; }
      setGiftOpen(false);
      setGiftSendActive(false);
      setSelectedIds([]);
      setGiftSendCount(0);
    }, 5000);
  }, []);

  // Hediye kutusunu aç; elle kapatınca gönder tuşu da gizlenir.
  const openGifts = useCallback(() => { window.clearTimeout(giftIdleRef.current); setGiftOpen(true); }, []);
  const closeGifts = useCallback(() => {
    window.clearTimeout(giftIdleRef.current);
    setGiftOpen(false);
    setGiftSendActive(false);
  }, []);

  useEffect(() => () => window.clearTimeout(giftIdleRef.current), []);

  // Hediye tahtası açıkken profiller çoklu seçilir — kişi kendini de seçebilir.
  const toggleGiftPerson = useCallback((userId) => {
    if (!userId) return;
    setSelectedIds((prev) => (prev.includes(userId) ? prev.filter((value) => value !== userId) : [...prev, userId]));
  }, []);

  // Tek gönderim: bakiye düşer, alıcı başına kayıt ve sohbet satırı oluşur.
  const sendGiftOnce = async (gift, ids, quantity = 1) => {
    const response = await base44.functions.invoke('voice-room', {
      room_id: id, action: 'gift-send', gift_id: gift.id, target_ids: ids, quantity,
    });
    const data = response.data;
    if (typeof data.coins === 'number') setCoins(data.coins);
    setRoom((prev) => ({ ...prev, number_board: data.number_board, number_scores: data.number_scores }));
    markGiftSeen((data.messages || []).map((message) => message.id));
    const recipientIds = (data.recipients || []).map((item) => item.user_id);
    // Gönderdiğim hediye kutu toplamına anında yansır, ardından sunucu toplamıyla doğrulanır.
    const sentScore = Math.round((Number(data.total_k) || 0) * 1000);
    if (sentScore > 0) {
      setGiftBoard((prev) => (prev ? {
        ...prev,
        all: { ...prev.all, total: (Number(prev.all?.total) || 0) + sentScore },
        day: { ...prev.day, total: (Number(prev.day?.total) || 0) + sentScore },
      } : prev));
    }
    giftBoardRef.current = Date.now();
    loadGiftBoard();
    flashGifted(recipientIds, data.gift?.emoji);
    pushGiftAlert({
      key: `send-${Date.now()}`,
      giftId: data.gift?.id,
      giftName: data.gift?.name || gift.name,
      emoji: data.gift?.emoji || gift.emoji,
      imageUrl: data.gift?.image_url || '',
      kValue: Number(data.gift?.k_value) || 0,
      totalK: Number(data.total_k) || 0,
      count: Number(data.count) || recipientIds.length,
      senderName: '',
      recipientName: (data.recipients || []).map((item) => item.name).join(', '),
      toId: '',
    });
  };

  // Gönder tuşu: kutu kapanır ama tuş kalır; her basış sıraya girer ve takılmadan gönderilir.
  const pressGift = async () => {
    if (!selectedGift || !selectedIds.length) return;
    setGiftOpen(false);
    setGiftSendActive(true);
    armGiftHide();
    setGiftSendCount((count) => count + 1);
    giftQueueRef.current.push({ gift: selectedGift, ids: [...selectedIds], session: giftSessionRef.current });
    await drainGiftQueue(giftQueueRef, giftBusyRef, sendGiftOnce, (error, job, quantity) => {
      if (job.session === giftSessionRef.current) setGiftSendCount((count) => Math.max(0, count - quantity));
      toast({ title: 'Hediye gönderilemedi', description: error?.response?.data?.error || error.message, variant: 'destructive' });
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[150] flex items-center justify-center bg-catalog">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Odadan atıldıysanız: 24 saatlik giriş yasağı ekranda açıkça gösterilir.
  if (banNotice) {
    return (
      <div className="fixed inset-0 z-[150] flex flex-col items-center justify-center gap-3 bg-catalog px-6 text-center text-white">
        <ShieldAlert className="h-12 w-12 text-red-500" />
        <p className="text-base font-bold">Odaya giremezsiniz</p>
        <p className="max-w-xs text-sm text-white/70">{banNotice}</p>
        <button type="button" onClick={() => navigate('/acik-odalar')} className="mt-1 rounded-xl bg-white/10 px-5 py-2.5 text-sm font-bold">
          Odalara dön
        </button>
      </div>
    );
  }

  if (notice && !joined && !needsPassword) {
    return (
      <div className="fixed inset-0 z-[150] flex flex-col items-center justify-center gap-4 bg-catalog px-6 text-center text-white">
        <ShieldAlert className="h-10 w-10 text-red-500" />
        <p className="max-w-xs text-sm text-white/70">{notice}</p>
        <button type="button" onClick={() => navigate('/acik-odalar')} className="rounded-xl bg-white/10 px-5 py-2.5 text-sm font-bold">
          Odalara dön
        </button>
      </div>
    );
  }

  if (!joined && needsPassword) {
    return (
      <div className="fixed inset-0 z-[150] flex flex-col items-center justify-center gap-4 bg-catalog px-6 text-white">
        <Lock className="h-10 w-10 text-amber-400" />
        <p className="text-sm text-white/70">{room?.name || 'Oda'} kilitli. Şifreyi gir.</p>
        <form onSubmit={(event) => { event.preventDefault(); attemptJoin(password); }} className="w-full max-w-xs space-y-3">
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Oda şifresi"
            className="h-11 w-full rounded-xl bg-white/10 px-4 text-sm text-white outline-none placeholder:text-white/40"
          />
          {notice && <p className="text-center text-xs text-red-400">{notice}</p>}
          <button type="submit" className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground">Odaya gir</button>
        </form>
        <button type="button" onClick={() => navigate('/acik-odalar')} className="text-xs text-white/50">Vazgeç</button>
      </div>
    );
  }

  if (!joined) {
    return (
      <div className="fixed inset-0 z-[150] flex flex-col items-center justify-center gap-3 bg-catalog text-white">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
        <p className="text-xs text-white/60">Odaya bağlanılıyor...</p>
      </div>
    );
  }

  const sheetSeat = seatIndex === null ? null : seats[seatIndex];
  const profileTarget = profileUserId;
  const profileSeatIndex = profileTarget ? seats.findIndex((item) => item.user_id === profileTarget) : -1;
  const profileSeat = profileSeatIndex >= 0 ? seats[profileSeatIndex] : null;
  const profileSelf = !!profileTarget && profileTarget === user?.id;
  const profileMuted = !!profileTarget && !!participants.find((person) => person.user_id === profileTarget)?.muted;
  const profileIsMod = !!profileTarget && moderators.includes(profileTarget);
  // Koltuk eylemi yalnızca kendi koltuğumda (ayağa kalk) ve oda sahibi/yöneticilerde (koltuktan indir) çıkar.
  const seatAction = profileTarget && (profileSelf ? seated : canMod)
    ? { key: 'seat', icon: Armchair, label: profileSelf ? 'Ayağa kalk' : 'Koltuktan indir', onClick: handleProfileSeat }
    : null;
  const profileActions = profileTarget ? [
    { key: 'mic', icon: (profileSelf ? voice.muted : profileMuted) ? MicOff : Mic, label: 'Mikrofon', disabled: !profileSelf && !canMod, onClick: profileSelf ? handleMic : () => toggleMuteFor(profileTarget) },
    { key: 'chat', icon: MessageSquare, label: 'Sohbet', disabled: profileSelf, onClick: () => { setDmUserId(profileTarget); setProfileUserId(null); } },
    ...(seatAction ? [seatAction] : []),
    { key: 'invite', icon: UserPlus, label: 'Davet et', disabled: profileSelf || (!canMod && !seated), onClick: () => { const target = profileTarget; setProfileUserId(null); inviteToSeat(target); } },
  ] : [];

  // Seçili kişinin koltuk puanı animasyonda gösterilir.
  const overlayAlert = giftAlert ? { ...giftAlert, value: scores[giftAlert.toId] || 0 } : null;

  return (
    <div
      className="fixed inset-0 z-[150] flex flex-col bg-catalog text-white"
      style={{ paddingBottom: chatOpen ? keyboardInset : 0 }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-primary/25 to-transparent" />

      <header className="relative shrink-0 px-3 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col items-start">
            <RoomInfoCard
              room={room}
              canEdit={isOwner || moderators.includes(user?.id)}
              onRename={renameRoom}
            />
            <GiftScoreChip
              score={giftBoard?.all?.total || 0}
              onClick={() => { setGiftBoardOpen(true); loadGiftBoard(); }}
            />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setViewerOpen(true)}
              title={`Odada ${participants.length} kişi var`}
              aria-label={`Odada ${participants.length} kişi var — kimler izliyor gör`}
              className="flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-full bg-white/10 px-3 transition-transform active:scale-95"
            >
              <Eye className="h-5 w-5 text-white/80" />
              <span className="text-sm font-bold tabular-nums">{participants.length}</span>
            </button>
            <button type="button" onClick={() => setMenuOpen(true)} aria-label="Oda ayarları" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 active:scale-95 transition-transform">
              <MoreHorizontal className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => setExitOpen(true)} aria-label="Odadan çık" className="flex h-11 w-11 items-center justify-center rounded-full bg-red-600 active:scale-95 transition-transform">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="relative min-h-0 flex-1 overflow-y-auto px-3 pb-4 pt-1">
        {room?.password && (
          <p className="mb-3 flex items-center justify-center gap-1.5 text-[11px] text-amber-400">
            <Lock className="h-3 w-3" /> Şifreli oda
          </p>
        )}
        {selectedIds.length > 0 && (
          <div className="mb-3 flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <span className="flex min-w-0 items-center gap-1.5 text-[11px] font-bold" style={{ color: seatAccent }}>
              <Gift className="h-3.5 w-3.5 shrink-0" /> {selectedIds.length} kişi seçildi
            </span>
            <button type="button" onClick={() => setSelectedIds([])} className="shrink-0 text-[11px] font-bold text-white/60">Temizle</button>
          </div>
        )}
        <VoiceSeatGrid
          seats={seatsView}
          userId={user?.id}
          ownerId={room?.owner_id}
          moderators={moderators}
          speakingIds={voice.speakingIds}
          localSpeaking={voice.localSpeaking}
          onSelectSeat={handleSeatPress}
          boardActive={boardActive}
          scores={scores}
          accent={seatAccent}
          gifted={gifted}
        />
        <p className="mt-5 text-center text-[11px] text-white/50">
          {seated
            ? (voice.muted ? 'Mikrofonun kapalı — konuşmak için mikrofon tuşuna bas.' : 'Koltuktayken mikrofonun açık, konuşabilirsin.')
            : 'Sese çıkmak için boş bir koltuğa dokun.'}
        </p>
      </div>

      <VoiceChatDock
        messages={messages}
        chatLocked={chatLocked}
        onSend={sendMessage}
        onCloseComposer={() => setChatOpen(false)}
        composerOpen={chatOpen}
        currentUserId={user?.id}
        ownerId={room?.owner_id}
        moderators={moderators}
        onOpenProfile={openProfile}
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

      <VoiceControlBar
        micActive={!voice.muted}
        deafened={voice.deafened}
        chatOpen={chatOpen}
        onToggleMic={handleMic}
        onToggleSpeaker={voice.toggleDeafen}
        gamesOpen={gamesOpen}
        giftOpen={giftOpen}
        onOpenGames={() => setGamesOpen(true)}
        onOpenGifts={openGifts}
        onOpenPrivateChat={() => setDmOpen(true)}
        onToggleChat={() => {
          if (chatLocked) {
            toast({ title: 'Sohbet yasağı açık', description: 'Yazmak için bir koltuğa otur.' });
            return;
          }
          setChatOpen((value) => !value);
        }}
      />

      <VoiceRoomMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        room={room}
        userId={user?.id}
        participants={participants}
        isOwner={isOwner}
        canMod={canMod}
        onSeatCount={(count) => invokeVoice({ action: 'set-seat-count', seat_count: count })}
        onSetPassword={handleSetPassword}
        onToggleHidden={handleToggleHidden}
        onToggleMod={handleToggleMod}
        onInvite={handleInvite}
        boardActive={boardActive}
        onToggleBoard={async () => { setMenuOpen(false); await toggleBoard(); }}
        onClearChat={clearChat}
        onToggleChatBan={toggleChatBan}
        onOpenLog={() => setLogOpen(true)}
        onExitVoiceMode={room?.room_type === 'watch' ? exitVoiceMode : null}
      />

      <RoomLogSheet
        open={logOpen}
        onClose={() => setLogOpen(false)}
        logs={roomLogs}
        bannedUsers={bannedUsers}
        onUnban={unbanUser}
      />

      <GiftBoardSheet
        open={giftBoardOpen}
        onClose={() => setGiftBoardOpen(false)}
        board={giftBoard}
        loading={giftBoardLoading}
      />

      <VoiceSeatSheet
        open={seatIndex !== null}
        onClose={() => setSeatIndex(null)}
        seat={sheetSeat}
        index={seatIndex ?? 0}
        canMod={canMod}
        onTakeSeat={handleTakeSeat}
        onToggleLock={() => invokeVoice({ action: 'seat-lock', seat_index: seatIndex, locked: !sheetSeat?.locked })}
      />

      <VoiceCard open={!!profileTarget} title="Profil" onClose={() => setProfileUserId(null)}>
        {profileTarget && (
          <VoiceProfileCard userId={profileTarget} actions={profileActions}>
            <div className="mt-2 space-y-2">
              {!profileSelf && (
                <VoiceMenuButton
                  icon={UserRound}
                  label="Profili gör"
                  onClick={() => { const target = profileTarget; setProfileUserId(null); openFullProfile(target); }}
                />
              )}
              {canMod && profileSeat && (
                <VoiceMenuButton
                  icon={profileSeat.locked ? Unlock : Lock}
                  label={profileSeat.locked ? 'Koltuğun kilidini aç' : 'Koltuğu kilitle'}
                  onClick={() => invokeVoice({ action: 'seat-lock', seat_index: profileSeatIndex, locked: !profileSeat.locked })}
                />
              )}
              {!profileSelf && canMod && (
                <VoiceMenuButton
                  icon={Shield}
                  label={profileIsMod ? 'Yönetici yetkisini al' : 'Yönetici yap'}
                  onClick={() => { const target = profileTarget; const makeMod = !profileIsMod; setProfileUserId(null); handleToggleMod(target, makeMod); }}
                />
              )}
              {!profileSelf && canMod && (
                <VoiceMenuButton
                  icon={UserMinus}
                  label="Odadan at"
                  danger
                  onClick={() => { const target = profileTarget; setProfileUserId(null); kickFromRoom(target); }}
                />
              )}
            </div>
          </VoiceProfileCard>
        )}
      </VoiceCard>

      <VoiceCard open={exitOpen} title="Oda" onClose={() => setExitOpen(false)}>
        <div className="space-y-2">
          <VoiceMenuButton icon={Minimize2} label="Odayı küçült" onClick={() => { setExitOpen(false); minimizeRoom(); }} />
          <VoiceMenuButton icon={LogOut} label="Odadan çık" danger onClick={() => { setExitOpen(false); leaveRoom(); }} />
        </div>
      </VoiceCard>

      <VoiceViewerSheet
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        participants={participants}
        seats={seats}
        userId={user?.id}
        ownerId={room?.owner_id}
        moderators={moderators}
        onSelect={openProfile}
      />

      <VoiceSeatInvitePrompt
        invite={myInvite}
        roomName={room?.name}
        onAccept={acceptSeatInvite}
        onDecline={declineSeatInvite}
      />

      {(dmOpen || dmUserId) && (
        <div className="absolute inset-0 z-[190] flex min-h-0 flex-col bg-[#101016]">
          <RoomDirectMessages initialUserId={dmUserId} onClose={() => { setDmOpen(false); setDmUserId(null); }} />
        </div>
      )}

      <InviteSheet open={inviteOpen} onClose={() => setInviteOpen(false)} onInvite={sendInvites} />

      <GamePanel open={gamesOpen} onClose={() => setGamesOpen(false)} roomId={id} />

      <GiftBoard
        open={giftOpen}
        onClose={closeGifts}
        gifts={gifts}
        tiers={tiers}
        people={giftPeople}
        selectedIds={selectedIds}
        giftId={giftId}
        coins={coins}
        onSelectGift={setGiftId}
        onTogglePerson={toggleGiftPerson}
        onSelectAll={() => setSelectedIds(giftPeople.map((person) => person.user_id))}
        onClear={() => setSelectedIds([])}
      />

      <GiftSendButton
        visible={giftOpen || giftSendActive}
        disabled={!selectedGift || !selectedIds.length}
        onSend={pressGift}
        count={giftSendCount}
      />

      <VoiceGiftOverlay alert={bigGift ? null : overlayAlert} tiers={tiers} />
      <BigGiftStage alert={bigGift} />

      {notice && joined && (
        <p className="pointer-events-none absolute left-1/2 top-20 z-[170] -translate-x-1/2 rounded-full bg-black/80 px-4 py-2 text-xs text-white">{notice}</p>
      )}
    </div>
  );
}