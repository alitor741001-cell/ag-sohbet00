import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Armchair, Eye, Loader2, Lock, LogOut, MessageSquare, Mic, MicOff, Minimize2, MoreHorizontal, Radio, RotateCcw, Shield, ShieldAlert, Unlock, UserMinus, UserPlus, UserRound } from 'lucide-react';
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
import VoiceOwnerBadge from '@/components/voice/VoiceOwnerBadge';
import VoiceRoomMenu from '@/components/voice/VoiceRoomMenu';
import VoiceSeatSheet from '@/components/voice/VoiceSeatSheet';
import InviteSheet from '@/components/voice/InviteSheet';
import VoiceCard from '@/components/voice/VoiceCard';
import VoiceProfileCard from '@/components/voice/VoiceProfileCard';
import VoiceMenuButton from '@/components/voice/VoiceMenuButton';
import VoiceRoomBubble from '@/components/voice/VoiceRoomBubble';
import RoomDirectMessages from '@/components/player/RoomDirectMessages';
import GamePanel from '@/components/games/GamePanel';
import VoiceGiftSheet from '@/components/voice/VoiceGiftSheet';
import VoiceGiftOverlay from '@/components/voice/VoiceGiftOverlay';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

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
  const [messages, setMessages] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [seatIndex, setSeatIndex] = useState(null);
  const [profileUserId, setProfileUserId] = useState(null);
  const [dmUserId, setDmUserId] = useState(null);
  const [dmOpen, setDmOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [gamesOpen, setGamesOpen] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [giftAlert, setGiftAlert] = useState(null);
  const [boardResetOpen, setBoardResetOpen] = useState(false);

  const keyboardInset = useKeyboardInset();

  const joinedRef = useRef(false);
  const joinTriedRef = useRef(false);
  const sawSelfRef = useRef(false);
  const keepSeatRef = useRef(false);
  const giftTimerRef = useRef(null);
  const lastGiftRef = useRef(null);

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

  const seatsView = useMemo(
    () => seats.map((seat) => ({
      ...seat,
      muted: seat.user_id ? !!participants.find((person) => person.user_id === seat.user_id)?.muted : false,
    })),
    [seats, participants]
  );

  // Sayı tahtası: açıkken her koltuğun altında kişinin sayısı gösterilir.
  const boardActive = room?.number_board === true;
  const scores = useMemo(() => {
    const map = {};
    (Array.isArray(room?.number_scores) ? room.number_scores : []).forEach((item) => {
      if (item?.user_id) map[item.user_id] = Number(item.value) || 0;
    });
    return map;
  }, [room?.number_scores]);

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

  // Odayı yükle — sesli oda değilse normal oda sayfasına yönlendir.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await base44.functions.invoke('room-presence', { action: 'get', room_id: id });
        if (cancelled) return;
        const record = response.data?.room;
        if (!record) { setNotice('Oda bulunamadı.'); return; }
        if (record.room_type !== 'voice') { navigate(`/oda/${id}`, { replace: true }); return; }
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
    if (seat?.user_id) { setProfileUserId(seat.user_id); return; }
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

  const handleToggleHidden = async () => {
    try {
      const response = await base44.functions.invoke('room-presence', { action: 'toggle-hidden', room_id: id });
      await syncRoom();
      toast({ title: response.data?.hidden ? 'Oda gizlendi' : 'Oda herkese açık' });
    } catch (error) {
      toast({ title: 'İşlem başarısız', description: error?.response?.data?.error || error.message, variant: 'destructive' });
    }
  };

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
      toast({ title: 'Kişi odadan atıldı' });
    } catch (error) {
      toast({ title: 'İşlem başarısız', description: error?.response?.data?.error || error.message, variant: 'destructive' });
    }
  };

  // Profil kartındaki koltuk eylemi: kendi koltuğumda kalk/otur, başkasında yönetici olarak indir.
  const handleProfileSeat = () => {
    const target = profileUserId;
    if (!target) return;
    setProfileUserId(null);
    if (target === user?.id) {
      if (seated) { invokeVoice({ action: 'seat-leave' }); return; }
      const free = seats.findIndex((item) => !item.user_id && !item.locked);
      if (free < 0) { toast({ title: 'Boş koltuk yok' }); return; }
      invokeVoice({ action: 'seat-take', seat_index: free });
      return;
    }
    if (!canMod) return;
    invokeVoice({ action: 'seat-kick', target_id: target });
  };

  const sendMessage = useCallback(async (text) => {
    try {
      await base44.functions.invoke('send-room-message', { room_id: id, text });
    } catch (error) {
      toast({ title: 'Mesaj gönderilemedi', description: error?.response?.data?.error || error.message, variant: 'destructive' });
    }
  }, [id, toast]);

  // Hediye gönder — odaya canlı bildirim düşer, herkes aynı anda görür.
  const sendGift = async (giftId) => {
    setGiftOpen(false);
    try {
      await base44.functions.invoke('voice-room', { room_id: id, action: 'gift-send', gift: giftId });
    } catch (error) {
      toast({ title: 'Hediye gönderilemedi', description: error?.response?.data?.error || error.message, variant: 'destructive' });
    }
  };

  // Yeni gelen hediyeyi ekranın ortasında kısa süre göster.
  useEffect(() => {
    const latest = [...messages].reverse().find((message) => message.type === 'gift');
    if (!latest || latest.id === lastGiftRef.current) return;
    const created = latest.created_date ? new Date(latest.created_date).getTime() : 0;
    if (!created || Date.now() - created > 15000) return;
    lastGiftRef.current = latest.id;
    setGiftAlert({ gift: latest.gift, name: latest.user_name });
    window.clearTimeout(giftTimerRef.current);
    giftTimerRef.current = window.setTimeout(() => setGiftAlert(null), 4000);
  }, [messages]);

  useEffect(() => () => window.clearTimeout(giftTimerRef.current), []);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[150] flex items-center justify-center bg-catalog">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
  const profileActions = profileTarget ? [
    { key: 'mic', icon: (profileSelf ? voice.muted : profileMuted) ? MicOff : Mic, label: 'Mikrofon', disabled: !profileSelf && !canMod, onClick: profileSelf ? handleMic : () => toggleMuteFor(profileTarget) },
    { key: 'chat', icon: MessageSquare, label: 'Sohbet', disabled: profileSelf, onClick: () => { setDmUserId(profileTarget); setProfileUserId(null); } },
    { key: 'seat', icon: Armchair, label: profileSelf ? (seated ? 'Ayağa kalk' : 'Otur') : 'Koltuk', disabled: !profileSelf && !canMod, onClick: handleProfileSeat },
    { key: 'invite', icon: UserPlus, label: 'Davet et', disabled: profileSelf || (!canMod && !seated), onClick: () => { const target = profileTarget; setProfileUserId(null); inviteToSeat(target); } },
  ] : [];

  if (minimized) {
    return <VoiceRoomBubble name={room?.name} muted={voice.muted} onOpen={() => setMinimized(false)} />;
  }

  return (
    <div
      className="fixed inset-0 z-[150] flex flex-col bg-catalog text-white"
      style={{ paddingBottom: chatOpen ? keyboardInset : 0 }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-primary/25 to-transparent" />

      <header className="relative flex shrink-0 items-center justify-between gap-2 px-3 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-1.5">
            <Radio className="h-4 w-4 shrink-0 text-primary" />
            <p className="min-w-0 truncate text-sm font-bold">{room?.name}</p>
            <VoiceOwnerBadge userId={room?.owner_id} fallbackName={room?.owner_name} />
          </div>
          <p className="truncate text-[11px] text-white/60">
            {seats.length} koltuk • {participants.length} kişi
          </p>
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
      </header>

      <div className="relative min-h-0 flex-1 overflow-y-auto px-3 pb-4 pt-1">
        {room?.password && (
          <p className="mb-3 flex items-center justify-center gap-1.5 text-[11px] text-amber-400">
            <Lock className="h-3 w-3" /> Şifreli oda
          </p>
        )}
        {boardActive && canMod && (
          <div className="mb-2 flex justify-center">
            <button
              type="button"
              onClick={() => setBoardResetOpen(true)}
              className="flex items-center gap-1.5 rounded-full bg-red-600/90 px-3 py-1.5 text-[11px] font-bold text-white active:scale-95 transition-transform"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Sayıları sıfırla
            </button>
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
          canScoreAll={canMod}
          onScoreStep={(targetId, delta) => invokeVoice({ action: 'number-step', target_id: targetId, delta })}
        />
        <p className="mt-5 text-center text-[11px] text-white/50">
          {seated
            ? (voice.muted ? 'Mikrofonun kapalı — konuşmak için mikrofon tuşuna bas.' : 'Koltuktayken mikrofonun açık, konuşabilirsin.')
            : 'Sese çıkmak için boş bir koltuğa dokun.'}
        </p>
      </div>

      <VoiceChatDock
        messages={messages}
        onSend={sendMessage}
        onCloseComposer={() => setChatOpen(false)}
        composerOpen={chatOpen}
        currentUserId={user?.id}
        ownerId={room?.owner_id}
        moderators={moderators}
        onOpenProfile={openProfile}
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
        onOpenGifts={() => setGiftOpen(true)}
        onOpenPrivateChat={() => setDmOpen(true)}
        onToggleChat={() => setChatOpen((value) => !value)}
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
        boardResetSeat={room?.number_board_reset_seat !== false}
        boardResetRoom={room?.number_board_reset_room !== false}
        onToggleBoard={() => invokeVoice({ action: boardActive ? 'number-board-close' : 'number-board-open' })}
        onResetBoard={() => { setMenuOpen(false); setBoardResetOpen(true); }}
        onBoardSettings={(patch) => invokeVoice({ action: 'number-settings', ...patch })}
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
          <VoiceMenuButton icon={Minimize2} label="Odayı küçült" onClick={() => { setExitOpen(false); setMinimized(true); }} />
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

      <VoiceGiftSheet open={giftOpen} onClose={() => setGiftOpen(false)} onSend={sendGift} />

      <VoiceGiftOverlay alert={giftAlert} />

      <ConfirmDialog
        open={boardResetOpen}
        onOpenChange={setBoardResetOpen}
        title="Sayılar sıfırlansın mı?"
        description="Koltuklardaki tüm sayılar sıfıra döner."
        confirmText="Sıfırla"
        onConfirm={() => invokeVoice({ action: 'number-reset' })}
      />

      {notice && joined && (
        <p className="pointer-events-none absolute left-1/2 top-20 z-[170] -translate-x-1/2 rounded-full bg-black/80 px-4 py-2 text-xs text-white">{notice}</p>
      )}
    </div>
  );
}