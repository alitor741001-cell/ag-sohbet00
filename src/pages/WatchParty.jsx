import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import subscribeEntity from '@/components/data/entitySubscriptions';
import VideoPlayer from '@/components/player/VideoPlayer';
import ChatOverlay from '@/components/player/ChatOverlay';
import StageSwipeLayer from '@/components/player/StageSwipeLayer';
import { useVoiceChat } from '@/hooks/useVoiceChat';
import { useCurrentUser, membershipActive } from '@/lib/useCurrentUser';
import { useToast } from '@/components/ui/use-toast';
import { Ban, Crown, Eye, LogOut, UserMinus } from 'lucide-react';
import { Image } from '@/components/ui/image';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import RoomSettingsMenu from '@/components/player/RoomSettingsMenu';
import InviteSheet from '@/components/voice/InviteSheet';
import RoomGiftStage from '@/components/voice/RoomGiftStage';
import RoomExitOverlay from '@/components/voice/RoomExitOverlay';
import { clearMinimizedRoom, getMinimizedRoom, isRoomMinimized, setMinimizedRoom } from '@/lib/minimizedRoom';
import { clearMinimizedFilm, getMinimizedFilm, setMinimizedFilm } from '@/lib/minimizedFilm';


import LiveKitDebugPanel from '@/components/player/LiveKitDebugPanel';
import RoomDirectMessages from '@/components/player/RoomDirectMessages';

import YouTubeStage from '@/components/player/YouTubeStage';
import YouTubeLinkSheet from '@/components/player/YouTubeLinkSheet';
import RoomScreenLauncher, { RoomScreenSwitch } from '@/components/player/RoomScreenLauncher';
import FilmSearchSheet from '@/components/player/FilmSearchSheet';
import { YT_PREFIX, youtubeVideoId } from '@/lib/mediaSource';
import SpecialRoleWelcome from '@/components/player/SpecialRoleWelcome';
import ProfileFrame from '@/components/ProfileFrame';
import useSocialBadges from '@/hooks/useSocialBadges';
import useMessageProfiles from '@/hooks/useMessageProfiles';
import useRoomLevels from '@/hooks/useRoomLevels';
import useRoomSwipeNav from '@/hooks/useRoomSwipeNav';
import useOfflineExit from '@/hooks/useOfflineExit';
import useOfflineParticipantCleanup from '@/hooks/useOfflineParticipantCleanup';
import { isModerator } from '@/lib/roles';
import { triggerBanNotice } from '@/lib/banNotice';
import { isHiddenName } from '@/lib/hiddenUser';
import XpAvatar from '@/components/xp/XpAvatar';
import FullUserProfile from '@/components/profile/FullUserProfile';
import RoomOwnerBadge from '@/components/player/RoomOwnerBadge';


export default function WatchParty() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: ul } = useCurrentUser();
  const { toast } = useToast();
  const [room, setRoom] = useState(null);
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [directOpen, setDirectOpen] = useState(false);
  const [directTarget, setDirectTarget] = useState(null);
  const [showViewers, setShowViewers] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [ytOpen, setYtOpen] = useState(false);
  const [filmOpen, setFilmOpen] = useState(false);
  const [filmQuery, setFilmQuery] = useState('');
  const [filmResults, setFilmResults] = useState([]);
  const [needPassword, setNeedPassword] = useState(false);
  const [pwInput, setPwInput] = useState('');
  const [pwSetInput, setPwSetInput] = useState('');
  const [showPwSet, setShowPwSet] = useState(false);
  const [showPwRemoveConfirm, setShowPwRemoveConfirm] = useState(false);
  const [syncState, setSyncState] = useState({ is_playing: false, current_time: 0, last_sync: null });
  const [unread, setUnread] = useState(0);
  const [joinCount, setJoinCount] = useState(0);

  const [joinError, setJoinError] = useState('');
  const [roomLoadError, setRoomLoadError] = useState('');
  const [roomRetry, setRoomRetry] = useState(0);
  const [waitingForApproval, setWaitingForApproval] = useState(false);
  const [joinRejected, setJoinRejected] = useState(false);
  const [joinRequests, setJoinRequests] = useState([]);
  const [voiceReady, setVoiceReady] = useState(false);
  const joinedRef = useRef(false);
  const ghostRef = useRef(false);
  const kickedRef = useRef(false);
  // Sesli moda/film moduna geçişte oda üyeliği korunur — kişi odadan düşmez.
  const modeSwitchRef = useRef(false);
  const lastUpdateRef = useRef(0);
  const lastSyncRef = useRef({ is_playing: false, current_time: 0, movie_id: '' });
  const prevMovieIdRef = useRef(null);
  const playerWrapRef = useRef(null);
  // Dokunuşun başlangıç noktası: yalnızca kontrol düğmelerinin dışında başlayan hareketler kaydedilir.
  const touchStart = useRef(null);
  const seenRoomMessagesRef = useRef(new Set());
  const voice = useVoiceChat({ roomId: id, user, participants: room?.participants, voiceEnabled: !!room?.voice_enabled && voiceReady });
  const { messages: directUnread } = useSocialBadges(user?.id);
  const [countdownText, setCountdownText] = useState('');
  const [autoDeleteMinutes, setAutoDeleteMinutes] = useState(0);
  const [chatClearToken, setChatClearToken] = useState(0);

  const [roomNameEdit, setRoomNameEdit] = useState('');

  const profileTarget = new URLSearchParams(location.search).get('profile');
  // Gizli kullanıcı odada takma adla görünür: kartında da isim, cinsiyet ve kimlik gizlenir.
  const profilePerson = [...(room?.participants || []), ...(room?.recent_participants || [])].find((person) => person.user_id === profileTarget);
  const profileHidden = !!profileTarget && profileTarget !== user?.id && isHiddenName(profilePerson?.name);
  const openUserProfile = (userId) => {
    if (!userId) return;
    const params = new URLSearchParams(location.search);
    params.set('profile', userId);
    navigate({ pathname: location.pathname, search: `?${params.toString()}` }, { state: { ...(location.state || {}), roomProfileOverlay: true } });
  };
  const closeUserProfile = () => {
    if (location.state?.roomProfileOverlay) { navigate(-1); return; }
    const params = new URLSearchParams(location.search);
    params.delete('profile');
    navigate({ pathname: location.pathname, search: params.toString() ? `?${params.toString()}` : '' }, { replace: true });
  };
  const [presenceMap, setPresenceMap] = useState({});
  const hasMembership = membershipActive(user);
  const isOwner = user?.id === room?.owner_id;
  const isMod = user?.role === 'admin' || user?.role === 'moderator';
  const canMod = isOwner || isMod || (room?.room_moderators || []).includes(user?.id);
  // Oda LVL'i: odadakilerin seviyesi canlı izlenir — seviye atlayınca rozet anında değişir.
  const roomLevels = useRoomLevels([...(room?.participants || []).map((person) => person.user_id), ...(room?.seats || []).map((seat) => seat.user_id), room?.owner_id].filter(Boolean));
  // Sesli sohbet alanı açıkken film yerine sesli sohbet bölümü gösterilir.
  const voiceMode = room?.voice_mode === true;

  // Sesli mod seçildiğinde oda, tüm özellikleriyle sesli oda arayüzüne dönüşür.
  useEffect(() => {
    // Sesli moda geçişte çıkış ertelenir; film moduna dönüldüğünde normal çıkış yeniden açılır.
    modeSwitchRef.current = voiceMode;
    if (voiceMode) navigate(`/sesli-oda/${id}`, { replace: true });
  }, [voiceMode, id, navigate]);

  useEffect(() => {
    if (ul || !user) return;
    if (!hasMembership) { setLoading(false); return; }
    let active = true;
    setLoading(true); setRoomLoadError('');
    base44.functions.invoke('room-presence', { action: 'get', room_id: id })
      .then((res) => {
        if (!active) return;
        const r = res.data?.room;
        setRoom(r || null);
        if (r) setSyncState({ is_playing: r.is_playing, current_time: r.current_time, last_sync: r.last_sync });
      })
      .catch((error) => {
        if (!active) return;
        const message = error.response?.data?.error || error.message;
        setRoomLoadError(message === 'not-found' ? 'Oda servisine ulaşılamadı. Lütfen yeniden deneyin.' : message || 'Oda yüklenemedi.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, ul, user?.id, hasMembership, roomRetry]);

  // Film değiştiğinde yeni filmi yükle (ilk yükleme dahil)
  useEffect(() => {
  if (!room?.movie_id || prevMovieIdRef.current === room.movie_id) return;
  prevMovieIdRef.current = room.movie_id;
  base44.entities.Movie.get(room.movie_id).then(setMovie).catch(() => {});
  }, [room?.movie_id]);

  // Oda adını düzenleme alanını odadan başlat
  useEffect(() => { setRoomNameEdit(room?.name || ''); }, [room?.name]);



  // Kişisel odada YouTube linki paneli kendiliğinden açılmaz: oda doğrudan açılır,
  // link yalnızca kullanıcı istediğinde (ekrandaki Filmler/Link düğmesiyle) girilir.

  // Katılım: anlık yoğunluk kaynaklı geçici hatalarda kısa aralıklarla tekrar denenir.
  // Böylece odadan çıkıp tekrar girerken tek seferlik bir aksaklık hata ekranı çıkarmaz.
  const joinWithRetry = useCallback(async () => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const res = await base44.functions.invoke('room-presence', { action: 'join', room_id: id });
        joinedRef.current = true;
        setVoiceReady(true);
        setJoinCount((c) => c + 1);
        if (res.data?.ghost) ghostRef.current = true;
        return;
      } catch (error) {
        const data = error?.response?.data || {};
        // Şifre, onay ve yasak gibi kesin cevaplar bekletilmez; yalnızca geçici hatalar tekrarlanır.
        const transient = !data.error || error?.response?.status >= 500;
        if (transient && attempt < 2) {
          await new Promise((resolve) => window.setTimeout(resolve, 700 * (attempt + 1)));
          continue;
        }
        const message = data.error || error.message;
        setJoinError(message);
        toast({ title: 'Katılım başarısız', description: message, variant: 'destructive' });
        return;
      }
    }
  }, [id, toast]);

  useEffect(() => {
    if (!user || !hasMembership || !room || joinedRef.current) return;
    if (room.password && room.owner_id !== user.id && !isModerator(user) && !room.participants?.some((p) => p.user_id === user.id)) {
      setNeedPassword(true);
      return;
    }
    // Özel oda: sahip/admin değilse onay sisteminden geç
    // requires_approval kapalıysa doğrudan katıl.
    if (room.is_personal && room.requires_approval !== false && room.owner_id !== user.id && !isModerator(user)) {
      base44.functions.invoke('room-presence', { action: 'request-join', room_id: id })
        .then((res) => {
          if (res.data?.approved) {
            // Onaylı istek var — normal katılıma geç
            joinWithRetry();
          } else if (res.data?.pending) {
            setWaitingForApproval(true);
          }
        })
        .catch((e) => { const m = e.response?.data?.error || e.message; setJoinError(m); toast({ title: 'İstek gönderilemedi', description: m, variant: 'destructive' }); });
      return;
    }
    joinWithRetry();
  }, [user?.id, room?.id]);

  // Bekleyen isteğin durumunu izle (onay/red)
  useEffect(() => {
    if (!user || !room || !waitingForApproval) return;
    const unsub = subscribeEntity('RoomJoinRequest', (ev) => {
      if (ev.data?.room_id !== id || ev.data?.user_id !== user.id) return;
      if (ev.type === 'update') {
        if (ev.data.status === 'approved') {
          setWaitingForApproval(false);
          joinWithRetry();
        } else if (ev.data.status === 'rejected') {
          setWaitingForApproval(false);
          setJoinRejected(true);
        }
      }
    });
    return unsub;
  }, [user?.id, room?.id, waitingForApproval]);

  // Oda sahibi: bekleyen katılım isteklerini izle
  useEffect(() => {
    if (!user || !room || room.owner_id !== user.id) return;
    const load = () => {
      base44.entities.RoomJoinRequest.filter({ room_id: id, status: 'pending' }, '-created_date', 50)
        .then((reqs) => setJoinRequests(reqs))
        .catch(() => {});
    };
    load();
    const unsub = subscribeEntity('RoomJoinRequest', (ev) => {
      if (ev.data?.room_id !== id) return;
      load();
    });
    return unsub;
  }, [user?.id, room?.id]);

  const submitPassword = async () => {
    try {
      await base44.functions.invoke('room-presence', { action: 'join', room_id: id, password: pwInput });
      joinedRef.current = true; setVoiceReady(true); setNeedPassword(false); setPwInput('');
    } catch (e) {
      toast({ title: 'Hatalı şifre', description: e.response?.data?.error || e.message, variant: 'destructive' });
    }
  };

  useEffect(() => {
    const unsub = subscribeEntity('Room', (ev) => {
      if (ev.type === 'update' && ev.data?.id === id) {
        setRoom((current) => ({ ...current, ...ev.data }));
        const playingChanged = ev.data.is_playing !== lastSyncRef.current.is_playing;
        const timeChanged = Math.abs((ev.data.current_time || 0) - lastSyncRef.current.current_time) > 3;
        // Film değiştiğinde oynatma durumu sıfırdan kurulur: yeni film baştan başlar.
        const movieChanged = ev.data.movie_id !== lastSyncRef.current.movie_id;
        if (playingChanged || timeChanged || movieChanged) {
          lastSyncRef.current = { is_playing: ev.data.is_playing, current_time: ev.data.current_time, movie_id: ev.data.movie_id };
          setSyncState({ is_playing: ev.data.is_playing, current_time: ev.data.current_time, last_sync: ev.data.last_sync });
        }
      }
      if (ev.type === 'delete' && (ev.data?.id === id || ev.id === id)) {
        toast({ title: 'Oda silindi', variant: 'destructive' });
        navigate('/');
      }
    });
    return unsub;
  }, [id]);

  // Sohbet kapalıyken realtime okunmamış sayacı; bağlantı dönünce kaçan mesajları tamamlar.
  useEffect(() => {
    if (chatOpen) { setUnread(0); return; }
    seenRoomMessagesRef.current = new Set();
    const syncMessages = async (countMissed = false) => {
      const items = await base44.entities.RoomMessage.filter({ room_id: id }, 'created_date', 500).catch(() => []);
      let missed = 0;
      items.forEach((message) => {
        if (countMissed && !seenRoomMessagesRef.current.has(message.id) && message.type !== 'system' && message.user_id !== user?.id) missed += 1;
        seenRoomMessagesRef.current.add(message.id);
      });
      if (missed) setUnread((current) => current + missed);
    };
    syncMessages(false);
    const unsub = subscribeEntity('RoomMessage', (event) => {
      const message = event.data;
      if (event.type !== 'create' || message?.room_id !== id || message.type === 'system' || message.user_id === user?.id || seenRoomMessagesRef.current.has(message.id)) return;
      seenRoomMessagesRef.current.add(message.id);
      setUnread((current) => current + 1);
    });
    const reconnect = () => syncMessages(true);
    window.addEventListener('online', reconnect);
    return () => { unsub(); window.removeEventListener('online', reconnect); };
  }, [chatOpen, id, user?.id]);

  // Atılma tespiti: katılımcı listesinden çıkarıldıysa yönlendir
  useEffect(() => {
    if (!user || !joinedRef.current || !room || room.owner_id === user.id || ghostRef.current) return;
    const stillIn = (room.participants || []).some((p) => p.user_id === user.id);
    if (!stillIn && !kickedRef.current) {
      kickedRef.current = true;
      (async () => {
        try {
          const me = await base44.entities.User.get(user.id);
          if (me.role === 'banned' || me.is_banned) {
            triggerBanNotice('banned');
            await base44.auth.logout();
            window.location.href = '/login?banned=1';
            return;
          }
        } catch {}
        toast({ title: 'Odadan atıldınız', variant: 'destructive' });
        navigate('/');
      })();
    }
  }, [room?.participants, user?.id]);

  // Atılma tespiti yedeği — 15sn polling (realtime kaçırsa diye, düşük sıklık)
  useEffect(() => {
    if (!user || joinCount === 0 || !room || room.owner_id === user.id || ghostRef.current) return;
    const intervalId = setInterval(async () => {
      if (kickedRef.current) { clearInterval(intervalId); return; }
      try {
        const res = await base44.functions.invoke('room-presence', { action: 'get', room_id: id });
        const r = res.data?.room;
        if (!r) { kickedRef.current = true; clearInterval(intervalId); navigate('/'); return; }
        const stillIn = (r.participants || []).some((p) => p.user_id === user.id);
        if (!stillIn) {
          kickedRef.current = true;
          clearInterval(intervalId);
          toast({ title: 'Odadan atıldınız', variant: 'destructive' });
          navigate('/');
        }
      } catch {}
    }, 15000);
    return () => clearInterval(intervalId);
  }, [user?.id, room?.id, joinCount, isMod, ghostRef.current]);

  // İzleyici profillerini çek (gerçek avatarlar için)
  const participantIdsKey = [...(room?.participants || []), ...(room?.recent_participants || [])].map((p) => p.user_id).filter(Boolean).filter((value, index, all) => all.indexOf(value) === index).sort().join(',');
  const viewerProfiles = useMessageProfiles(participantIdsKey ? participantIdsKey.split(',') : []);

  useEffect(() => {
    if (!participantIdsKey) return;
    const ids = participantIdsKey.split(',');
    // N+1 önleme: tek filter çağrısıyla tüm presence kayıtları.
    // Kişi başına birden fazla kayıt olabilir: limit geniş tutulur, en taze kayıt geçerli sayılır.
    base44.entities.UserPresence.filter({ user_id: { $in: ids } }, '-created_date', ids.length * 5)
      .then((records) => {
        const map = {};
        records.forEach((rec) => {
          if (!rec?.user_id) return;
          const current = map[rec.user_id];
          if (!current || new Date(rec.last_seen || 0) > new Date(current.last_seen || 0)) map[rec.user_id] = rec;
        });
        setPresenceMap(map);
      })
      .catch(() => {});
    const unsub = subscribeEntity('UserPresence', (ev) => {
      if (ev.type !== 'create' && ev.type !== 'update') return;
      if (!ids.includes(ev.data.user_id)) return;
      setPresenceMap((prev) => {
        const current = prev[ev.data.user_id];
        // Eski bir kayıt güncel durumu ezmesin: yalnızca daha taze kayıt yazılır.
        if (current && new Date(current.last_seen || 0) > new Date(ev.data.last_seen || 0)) return prev;
        return { ...prev, [ev.data.user_id]: ev.data };
      });
    });
    return unsub;
  }, [participantIdsKey]);

  const leaveRoom = async () => {
    if (!user || !joinedRef.current || kickedRef.current) return;
    // Sesli moda geçiş sırasında odaya üyelik korunur.
    if (modeSwitchRef.current) return;
    // Oda küçültüldüyse odadan düşülmez: film ve ses arka planda devam eder.
    if (isRoomMinimized(id)) return;
    joinedRef.current = false;
    setVoiceReady(false);
    try { await base44.functions.invoke('room-presence', { action: 'leave', room_id: id }); } catch {}
  };
  const leaveRoomRef = useRef(() => {});
  leaveRoomRef.current = leaveRoom;

  // Odadan çık: oda üyeliği bırakılır ve ana sayfaya dönülür.
  const handleLeave = async () => { await leaveRoom(); navigate('/'); };

  // Odayı küçült: film ve mikrofon arka planda devam eder, küçük oynatıcıdan odaya dönülür.
  const minimizeRoom = () => {
    const src = movie?.video_url || movie?.hls_url || movie?.external_url || '';
    setMinimizedRoom({
      id,
      name: room?.name || 'Film odası',
      owner_id: room?.owner_id,
      owner_name: room?.owner_name,
      path: `/oda/${id}`,
    });
    if (src) {
      setMinimizedFilm({
        roomId: id,
        src,
        title: room?.movie_title || movie?.title || '',
        time: syncState.current_time || 0,
        playing: syncState.is_playing !== false,
        isOwner,
        path: `/oda/${id}`,
      });
    }
    navigate('/');
  };

  // Odaya dönüldüğünde küçültme kayıtları temizlenir: balon ve küçük oynatıcı kapanır.
  useEffect(() => {
    if (getMinimizedRoom()?.id === id) clearMinimizedRoom();
    if (getMinimizedFilm()?.roomId === id) clearMinimizedFilm(id);
  }, [id]);

  useEffect(() => {
    const handler = () => { leaveRoomRef.current(); };
    window.addEventListener('pagehide', handler);
    window.addEventListener('beforeunload', handler);
    return () => { leaveRoomRef.current(); window.removeEventListener('pagehide', handler); window.removeEventListener('beforeunload', handler); };
  }, []);

  // 3 dakika çevrim dışı kalan kişi sessizce odadan çıkar ve ana sayfaya döner:
  // "atıldı" bildirimi, yasak kaydı ve listeye ekleme olmaz; kural oda sahibini de kapsar.
  const silentOfflineExit = useCallback(async () => {
    if (!joinedRef.current) return;
    joinedRef.current = false;
    setVoiceReady(false);
    try { await base44.functions.invoke('room-presence', { action: 'leave', room_id: id, silent: true }); } catch {}
    navigate('/', { replace: true });
  }, [id, navigate]);
  useOfflineExit({ enabled: voiceReady, onExit: silentOfflineExit });

  // Oda sahibi: 3 dakikadır görünmeyen kişiyi sessizce odadan çıkarır (yasak ve bildirim yok).
  useOfflineParticipantCleanup({
    enabled: isOwner,
    roomId: id,
    participants: room?.participants || [],
    exemptIds: [user?.id, room?.owner_id].filter(Boolean),
  });

  // Yukarı/aşağı kaydırma: sesli odalardaki gibi sıradaki canlı yayına geçilir.
  const swipe = useRoomSwipeNav({ roomId: id, userId: user?.id, active: voiceReady, navigate });

  // Otomatik sohbet silme sayacı
  useEffect(() => {
    const minutes = room?.chat_auto_delete_minutes || 0;
    setAutoDeleteMinutes(minutes);
    if (!minutes || !room?.chat_auto_delete_at) { setCountdownText(''); return; }
    const tick = () => {
      const target = new Date(room.chat_auto_delete_at).getTime();
      const remaining = Math.max(0, target - Date.now());
      if (remaining <= 0) {
        // Temizleme tek bir kişi (oda sahibi/yönetici) tarafından tetiklenir; odadaki diğer
        // herkes temizliği canlı bildirimle alır — aynı anda çok kez temizleme olmaz.
        if (canMod) {
          base44.functions.invoke('clear-room-messages', { room_id: id }).catch(() => {});
          const newTarget = new Date(Date.now() + minutes * 60000).toISOString();
          base44.entities.Room.update(id, { chat_auto_delete_at: newTarget }).catch(() => {});
        }
        setCountdownText('0:00');
        setChatClearToken((t) => t + 1);
      } else {
        const m = Math.floor(remaining / 60000);
        const s = Math.floor((remaining % 60000) / 1000);
        setCountdownText(`${m}:${s.toString().padStart(2, '0')}`);
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [room?.chat_auto_delete_minutes, room?.chat_auto_delete_at, id, canMod]);

  const setAutoDelete = async (minutes) => {
    if (!canMod) return;
    try {
      const updates = { chat_auto_delete_minutes: minutes };
      if (minutes > 0) updates.chat_auto_delete_at = new Date(Date.now() + minutes * 60000).toISOString();
      else updates.chat_auto_delete_at = null;
      await base44.entities.Room.update(id, updates);
    } catch (e) {
      toast({ title: 'Ayar güncellenemedi', variant: 'destructive' });
    }
  };

  const clearAllMessages = async () => {
    if (!canMod) return;
    if (!confirm('Sohbetin tüm mesajlarını silmek istediğinize emin misiniz?')) return;
    try { await base44.functions.invoke('clear-room-messages', { room_id: id }); toast({ title: 'Tüm mesajlar silindi' }); }
    catch (e) { toast({ title: 'Silinemedi', variant: 'destructive' }); }
  };

  const assignMod = async (uid) => {
    if (!isOwner && !isMod) return;
    try { await base44.functions.invoke('room-presence', { action: 'assign-mod', room_id: id, target_id: uid }); toast({ title: 'Moderatör atandı' }); }
    catch (e) { toast({ title: 'İşlem başarısız', description: e.response?.data?.error || e.message, variant: 'destructive' }); }
  };

  const removeMod = async (uid) => {
    if (!isOwner && !isMod) return;
    try { await base44.functions.invoke('room-presence', { action: 'remove-mod', room_id: id, target_id: uid }); toast({ title: 'Moderatör kaldırıldı' }); }
    catch (e) { toast({ title: 'İşlem başarısız', description: e.response?.data?.error || e.message, variant: 'destructive' }); }
  };

  const deleteRoom = async () => {
    if (!confirm('Bu odayı kalıcı olarak silmek istediğinize emin misiniz?')) return;
    try {
      await base44.functions.invoke('room-presence', { action: 'delete-room', room_id: id });
      toast({ title: 'Oda silindi' });
      navigate('/');
    } catch (e) {
      toast({ title: 'Silinemedi', description: e.response?.data?.error || e.message, variant: 'destructive' });
    }
  };

  const saveRoomName = async () => {
    if (!canMod) return;
    try { await base44.functions.invoke('room-presence', { action: 'set-name', room_id: id, name: roomNameEdit }); toast({ title: 'Oda adı güncellendi' }); }
    catch (e) { toast({ title: 'İşlem başarısız', description: e.response?.data?.error || e.message, variant: 'destructive' }); }
  };

  const updateRoom = useCallback(async (patch, immediate = false) => {
    if (!canMod) return;
    if (!immediate && Date.now() - lastUpdateRef.current < 2000) return;
    lastUpdateRef.current = Date.now();
    await base44.entities.Room.update(id, { ...patch, last_sync: new Date().toISOString() }).catch(() => {});
  }, [canMod, id]);

  const onPlayPause = useCallback((playing) => updateRoom({ is_playing: playing }, true), [updateRoom]);
  const onTimeUpdate = useCallback((t) => updateRoom({ current_time: t }), [updateRoom]);
  const onSeek = useCallback((t) => updateRoom({ current_time: t, is_playing: true }, true), [updateRoom]);

  // Odada oynayan YouTube videosu: tüm izleyiciler aynı videoyu senkron izler.
  const changeVideo = async (videoId) => {
    if (!videoId) return;
    try {
      await base44.functions.invoke('room-presence', { action: 'change-movie', room_id: id, movie_id: `${YT_PREFIX}${videoId}`, movie_title: 'YouTube' });
      toast({ title: 'Video odada başlatıldı' });
    } catch (e) {
      toast({ title: 'Video açılamadı', description: e.response?.data?.error || e.message, variant: 'destructive' });
    }
  };

  // Film arama paneli: ad yazılır, seçilen film odanın ekranında açılır.
  const openFilmSearch = () => { setFilmOpen(true); setShowViewers(false); };

  // Film ekranı kontrolleri: ilerleme çubuğu ve Filmler düğmesi birlikte görünür, birlikte kaybolur.
  const [stageControls, setStageControls] = useState(true);
  const [stageReveal, setStageReveal] = useState(0);
  const showStageControls = () => { setStageControls(true); setStageReveal((n) => n + 1); };
  const pickFilm = (videoId) => { setFilmOpen(false); changeVideo(videoId); };

  const toggleVoice = async () => {
    if (!canMod) { toast({ title: 'Yetkiniz yok', variant: 'destructive' }); return; }
    try { await base44.functions.invoke('room-presence', { action: 'toggle-voice', room_id: id }); toast({ title: room.voice_mode ? 'Film odasına dönüldü' : 'Sesli sohbet alanı açıldı' }); }
    catch (e) { toast({ title: 'İşlem başarısız', description: e.response?.data?.error || e.message, variant: 'destructive' }); }
  };

  // Film odasındaki mikrofon: sesli sohbet kapalıysa odayı sesli moda geçirmeden sesli sohbeti açar.
  const handleMicPress = async () => {
    if (room?.voice_enabled) { await voice.toggleMute(); return; }
    try {
      await base44.functions.invoke('room-presence', { action: 'enable-voice', room_id: id });
      toast({ title: 'Sesli sohbet açıldı', description: 'Mikrofonun açılıyor…' });
    } catch (e) {
      toast({ title: 'Mikrofon açılamadı', description: e.response?.data?.error || e.message, variant: 'destructive' });
    }
  };

  const toggleChat = async () => {
    if (!canMod) { toast({ title: 'Yetkiniz yok', variant: 'destructive' }); return; }
    try { await base44.functions.invoke('room-presence', { action: 'toggle-chat', room_id: id }); toast({ title: room.chat_enabled ? 'Sohbet kapatıldı' : 'Sohbet açıldı' }); }
    catch (e) { toast({ title: 'İşlem başarısız', description: e.response?.data?.error || e.message, variant: 'destructive' }); }
  };

  // Sohbet yasağı: açıkken yalnızca koltukta oturanlar sohbet bölümüne yazabilir.
  const toggleChatBan = async () => {
    if (!canMod) { toast({ title: 'Yetkiniz yok', variant: 'destructive' }); return; }
    try {
      await base44.functions.invoke('room-presence', { action: 'chat-ban', room_id: id, banned: room?.chat_seated_only !== true });
      toast({ title: room?.chat_seated_only ? 'Sohbet yasağı kaldırıldı' : 'Sohbet yasağı açıldı — yalnızca koltuktakiler yazabilir.' });
    } catch (e) { toast({ title: 'İşlem başarısız', description: e.response?.data?.error || e.message, variant: 'destructive' }); }
  };

  const toggleMuteUser = async (uid) => {
    if (!canMod) return;
    try { await base44.functions.invoke('room-presence', { action: 'toggle-mute', room_id: id, target_id: uid }); }
    catch (e) { toast({ title: 'İşlem başarısız', description: e.response?.data?.error || e.message, variant: 'destructive' }); }
  };

  const toggleHidden = async () => {
    if (!canMod) return;
    const previousHidden = !!room.hidden;
    setRoom((current) => ({ ...current, hidden: !previousHidden }));
    try {
      const response = await base44.functions.invoke('room-presence', { action: 'toggle-hidden', room_id: id });
      setRoom((current) => ({ ...current, hidden: !!response.data.hidden }));
      toast({ title: response.data.hidden ? 'Oda gizlendi' : 'Oda artık görünür' });
    } catch (e) {
      setRoom((current) => ({ ...current, hidden: previousHidden }));
      toast({ title: 'İşlem başarısız', description: e.response?.data?.error || e.message, variant: 'destructive' });
    }
  };

  // Yayını paylaş: seçilen arkadaşlara özel sohbetten katılma kartı gönderilir.
  // Paylaşılan kişiler oda gizli olsa da girebilir.
  const shareRoom = async (ids) => {
    try {
      const response = await base44.functions.invoke('room-presence', { action: 'share', room_id: id, target_ids: ids });
      toast({ title: 'Yayın paylaşıldı', description: `${response.data?.shared || ids.length} kişiye özel sohbetten gönderildi.` });
      setShareOpen(false);
      return true;
    } catch (e) {
      toast({ title: 'Paylaşım başarısız', description: e.response?.data?.error || e.message, variant: 'destructive' });
      return false;
    }
  };

  const savePassword = async (override) => {
    if (!canMod) return;
    const pw = (override !== undefined ? override : pwSetInput).trim();
    try {
      await base44.functions.invoke('room-presence', { action: 'set-password', room_id: id, password: pw });
      toast({ title: pw ? 'Oda şifresi güncellendi' : 'Oda şifresi kaldırıldı' });
      setShowPwSet(false); setPwSetInput('');
    } catch (e) { toast({ title: 'İşlem başarısız', description: e.response?.data?.error || e.message, variant: 'destructive' }); }
  };

  const removeUser = async (uid) => {
    if (!canMod) return;
    try { await base44.functions.invoke('room-presence', { action: 'ban', room_id: id, target_id: uid }); toast({ title: 'Kullanıcı odadan atıldı ve geri girişi engellendi' }); }
    catch (e) { toast({ title: 'Çıkarılamadı', description: e.response?.data?.error || e.message, variant: 'destructive' }); }
    setShowViewers(false);
  };

  const banUser = async (uid) => {
    if (!canMod) return;
    try { await base44.functions.invoke('room-presence', { action: 'ban', room_id: id, target_id: uid }); toast({ title: 'Kullanıcı yasaklandı' }); }
    catch (e) { toast({ title: 'İşlem başarısız', description: e.response?.data?.error || e.message, variant: 'destructive' }); }
    setShowViewers(false);
  };

  const kickUser = async (uid) => {
    if (!canMod) return;
    try { await base44.functions.invoke('room-presence', { action: 'kick', room_id: id, target_id: uid }); toast({ title: 'Kullanıcı odadan çıkarıldı' }); }
    catch (e) { toast({ title: 'Çıkarılamadı', description: e.response?.data?.error || e.message, variant: 'destructive' }); }
  };

  const unbanUser = async (uid) => {
    if (!canMod) return;
    try { await base44.functions.invoke('room-presence', { action: 'unban', room_id: id, target_id: uid }); toast({ title: 'Yasak kaldırıldı' }); }
    catch (e) { toast({ title: 'İşlem başarısız', description: e.response?.data?.error || e.message, variant: 'destructive' }); }
  };

  const onTouchStart = (e) => { const t = e.touches[0]; touchStart.current = { x: t.clientX, y: t.clientY }; };
  const onTouchEnd = (e) => {
    // Başlangıç kaydedilmediyse dokunuş bir kontrol düğmesinde başlamıştır (düğmeler kendi
    // dokunuş olayını durdurur): parmak kaldırma anı kaydırma sayılmaz, oda değişmez.
    const origin = touchStart.current;
    if (!origin) return;
    touchStart.current = null;
    const t = e.changedTouches[0];
    const dx = t.clientX - origin.x;
    const dy = t.clientY - origin.y;
    if (Math.abs(dx) > 100 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) setChatOpen(true);
      else setChatOpen(false);
      return;
    }
    // Yukarı/aşağı kaydırma: sesli odalardaki gibi sıradaki canlı yayına geçilir.
    const panelsOpen = chatOpen || showSettings || directOpen || showViewers;
    if (swipe.swipeEnabled && !panelsOpen && Math.abs(dy) > 90 && Math.abs(dy) > Math.abs(dx) * 1.6) {
      if (dy < 0) swipe.goNext();
      else swipe.goPrevious();
    }
  };

  if (ul || loading) return <div className="h-screen flex items-center justify-center bg-background"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (roomLoadError) return <div className="p-6 space-y-4"><p role="alert">{roomLoadError}</p><button onClick={() => setRoomRetry((value) => value + 1)} className="rounded-lg bg-primary px-4 py-2 text-primary-foreground">Yeniden Dene</button><Link to="/" className="ml-4 text-primary">Ana sayfaya dön</Link></div>;
  if (!room) return <div className="p-6">Oda bulunamadı.</div>;
  if (room.status === 'closed') return <div className="p-10 text-center"><p className="text-xl font-bold mb-2">Oda kapatıldı</p><Link to="/" className="text-primary">Ana sayfaya dön</Link></div>;
  if (joinError) return <div className="fixed inset-0 bg-black flex items-center justify-center p-6"><div className="bg-card border border-border rounded-xl p-5 w-full max-w-xs text-center"><h2 className="font-bold mb-2">Odaya katılamadınız</h2><p className="text-sm text-muted-foreground mb-4">{joinError}</p><button onClick={() => navigate(-1)} className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-semibold">Geri Dön</button></div></div>;

  if (joinRejected) return (
    <div className="fixed inset-0 bg-black flex items-center justify-center p-6">
      <div className="bg-card border border-border rounded-xl p-5 w-full max-w-xs text-center">
        <h2 className="font-bold mb-2 text-destructive">İsteğiniz reddedildi</h2>
        <p className="text-sm text-muted-foreground mb-4">Oda sahibi katılım isteğinizi reddetti.</p>
        <button onClick={() => navigate('/')} className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-semibold">Ana Sayfa</button>
      </div>
    </div>
  );

  if (waitingForApproval) return (
    <div className="fixed inset-0 bg-black flex items-center justify-center p-6">
      <div className="bg-card border border-border rounded-xl p-5 w-full max-w-xs text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h2 className="font-bold mb-2">Onay bekleniyor</h2>
        <p className="text-sm text-muted-foreground mb-4">Katılım isteğiniz oda sahibine iletildi. Onaylamasını bekleyin.</p>
        <button onClick={() => navigate('/')} className="w-full bg-secondary text-secondary-foreground py-2.5 rounded-lg text-sm font-semibold">İptal</button>
      </div>
    </div>
  );

  if (needPassword) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-6">
        <div className="bg-card border border-border rounded-xl p-5 w-full max-w-xs">
          <RoomOwnerBadge ownerId={room.owner_id} fallbackName={room.owner_name} className="mb-3" />
          <h2 className="font-bold mb-1 text-center">Şifreli Oda</h2>
          <p className="text-sm text-muted-foreground mb-3 text-center">Bu oda şifre korumalı. Katılmak için şifreyi girin.</p>
          <input value={pwInput} onChange={(e) => setPwInput(e.target.value)} type="password" placeholder="Oda şifresi" className="w-full bg-secondary/60 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring mb-3" />
          <div className="flex gap-2">
            <button onClick={() => navigate(-1)} className="flex-1 bg-secondary py-2 rounded-lg text-sm">Geri</button>
            <button onClick={submitPassword} className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-semibold">Katıl</button>
          </div>
        </div>
      </div>
    );
  }

  // Oda film alanı YouTube kimliği taşıyorsa video oda ekranında oynatılır.
  const ytId = youtubeVideoId(room?.movie_id);
  const src = movie?.video_url || movie?.hls_url || movie?.external_url || '';
  const chatEnabled = room.chat_enabled;
  // Koltukta oturmayan kişi için sohbet bölümü kilitlenir.
  const seatedNow = (Array.isArray(room.seats) ? room.seats : []).some((seat) => seat.user_id === user?.id);
  const chatLocked = room.chat_seated_only === true && !seatedNow;
  const founderCanSeeAdmins = user?.display_role === 'founder';
  const visibleParticipants = (room.participants || []).filter((participant) => participant.user_id === room.owner_id || viewerProfiles[participant.user_id]?.role !== 'admin' || founderCanSeeAdmins);
  const openDirectMessage = (userId) => { setDirectTarget(userId); setDirectOpen(true); setChatOpen(false); setShowViewers(false); };

  return (
    <div className="fixed inset-x-0 top-0 h-screen h-[100dvh] bg-black flex flex-col overflow-hidden" style={{ touchAction: 'pan-y', overscrollBehavior: 'none' }}>
      {/* Tam ekran video + alt kontrol alanı */}
      <div ref={playerWrapRef} className="flex-1 flex min-h-0 relative" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>

        {joinRequests.length > 0 && (
          <div className="absolute top-[max(env(safe-area-inset-top),3.5rem)] left-3 z-[65] space-y-1.5 max-w-[80%]">
            {joinRequests.map((req) => (
              <div key={req.id} className="flex items-center gap-2 rounded-xl bg-card/95 border border-amber-400/50 px-3 py-2 shadow-2xl backdrop-blur-xl room-notif-in">
                {req.user_avatar ? <Image src={req.user_avatar} className="w-7 h-7 rounded-full" fittingType="fill" /> : <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs">{(req.user_name || '?')[0]}</div>}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold truncate text-white">{req.user_name}</p>
                  <p className="text-[10px] text-muted-foreground">odaya katılmak istiyor</p>
                </div>
                <button onClick={async () => { await base44.functions.invoke('room-presence', { action: 'approve-join', room_id: id, request_id: req.id }); toast({ title: 'İstek onaylandı' }); }} className="px-2.5 py-1 rounded-lg bg-green-500 text-white text-[10px] font-bold whitespace-nowrap">Onayla</button>
                <button onClick={async () => { await base44.functions.invoke('room-presence', { action: 'reject-join', room_id: id, request_id: req.id }); toast({ title: 'İstek reddedildi' }); }} className="px-2 py-1 rounded-lg bg-red-500/80 text-white text-[10px] font-bold whitespace-nowrap">Reddet</button>
              </div>
            ))}
          </div>
        )}
        {!chatOpen && !directOpen && <div className="absolute top-[max(env(safe-area-inset-top),0.75rem)] left-3 z-[55] flex items-center gap-2">
          <button onClick={() => setExitOpen(true)} aria-label="Odayı kapat" className="flex items-center justify-center w-9 h-9 rounded-full bg-red-600 text-white active:scale-95 transition"><LogOut className="w-5 h-5" /></button>
          {room?.is_personal && room?.personal_room_code ? <span className="bg-black/60 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1.5 rounded-full border border-white/10 whitespace-nowrap">Kod: {room.personal_room_code}</span> : null}
          {room?.room_number ? <span className="bg-black/60 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1.5 rounded-full border border-white/10 whitespace-nowrap">Oda No: {room.room_number}</span> : null}
        </div>}
        {!chatOpen && <button onClick={() => { setShowViewers(!showViewers); setShowSettings(false); }} className={`absolute top-[max(env(safe-area-inset-top),0.75rem)] right-3 z-[55] flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white border border-white/10 backdrop-blur-md transition active:scale-95 ${showViewers ? 'bg-primary/80' : 'bg-black/60'}`}><Eye className="w-4 h-4" /><span>{visibleParticipants.length}</span></button>}
        {!showViewers && (() => {
          const speakingP = (room?.participants || []).find((p) => p.user_id !== user?.id && voice.speakingIds.includes(p.user_id));
          if (!speakingP) return null;
          const prof = viewerProfiles[speakingP.user_id];
          const avatar = speakingP.avatar || prof?.avatar;
          return (
            <div className="absolute top-[max(env(safe-area-inset-top),3.5rem)] right-3 z-[58] flex items-center gap-1.5 rounded-full bg-card/95 border-2 border-green-400 px-2 py-1 shadow-2xl backdrop-blur-xl speaking-glow max-w-[140px]">
              {avatar ? <Image src={avatar} className="w-6 h-6 rounded-full object-cover" fittingType="fill" /> : <span className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-[10px] font-bold">{(speakingP.name || '?')[0]}</span>}
              <span className="text-xs font-semibold truncate">{speakingP.name}</span>
            </div>
          );
        })()}
        <div className={`room-video-stage flex min-w-0 flex-1 items-center justify-center bg-black ${chatOpen || directOpen ? 'room-video-panel-open' : ''}`}>
          {voiceMode
            ? <p className="p-6 text-center text-sm text-muted-foreground">Sesli sohbet alanı açılıyor…</p>
            : ytId
              ? <YouTubeStage videoId={ytId} syncState={syncState} isOwner={canMod} isTimeSource={isOwner} onPlayPause={onPlayPause} onTimeUpdate={onTimeUpdate} onSeek={onSeek} onEnded={() => { if (isOwner) setYtOpen(true); }} fullscreenRef={playerWrapRef} suppressControls={chatOpen || directOpen || !!profileTarget} onControlsChange={setStageControls} revealSignal={stageReveal} />
              : src
                ? <VideoPlayer src={src} title={room.movie_title} syncState={syncState} isOwner={canMod} isTimeSource={isOwner} onPlayPause={onPlayPause} onTimeUpdate={onTimeUpdate} onSeek={onSeek} onEnded={() => { if (isOwner) setYtOpen(true); }} fullscreenRef={playerWrapRef} watermark={user} suppressControls={chatOpen || directOpen || !!profileTarget} onControlsChange={setStageControls} revealSignal={stageReveal} />
                : <RoomScreenLauncher onSearch={openFilmSearch} />}

          {/* YouTube çerçevesi dokunmayı yuttuğu için kaydırmayı bu katman yakalar. */}
          {!voiceMode && (
            <StageSwipeLayer
              className={chatOpen || directOpen || profileTarget || showSettings || showViewers ? 'pointer-events-none' : ''}
              onSwipeLeft={() => { setChatOpen(true); setShowViewers(false); }}
              onTap={showStageControls}
            />
          )}

          {!voiceMode && !chatOpen && !directOpen && !profileTarget && (
            <div className={`absolute left-1/2 bottom-[calc(env(safe-area-inset-bottom)_+_6.5rem)] z-[56] -translate-x-1/2 transition-opacity duration-300 ${stageControls ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
              <RoomScreenSwitch
                onFilms={openFilmSearch}
                hasResults={filmResults.length > 0}
              />
            </div>
          )}
        </div>

        {(
          <div hidden={!chatOpen} className="room-side-panel absolute bottom-0 right-0 top-0 z-40 flex w-full max-w-md flex-col border-l border-white/10 bg-black pt-[max(env(safe-area-inset-top),0.75rem)] pb-[max(env(safe-area-inset-bottom),0.5rem)] pl-[max(env(safe-area-inset-left),0px)] pr-[max(env(safe-area-inset-right),0px)] shadow-2xl"
            onTouchStart={(e) => { touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
            onTouchEnd={(e) => { if (!touchStart.current) return; const dx = e.changedTouches[0].clientX - touchStart.current.x; const dy = e.changedTouches[0].clientY - touchStart.current.y; if (dx > 80 && dx > Math.abs(dy) * 1.5) setChatOpen(false); }}
          >

            {chatOpen && <ChatOverlay roomId={id} chatEnabled={chatEnabled} chatLocked={chatLocked} isOwner={canMod} isAdmin={isMod} onClose={() => setChatOpen(false)} autoDeleteMinutes={autoDeleteMinutes} countdownText={countdownText} clearToken={chatClearToken} onSetAutoDelete={setAutoDelete} voice={voice} voiceEnabled={room.voice_enabled} onDirect={() => { setDirectTarget(null); setDirectOpen(!directOpen); setChatOpen(false); setShowViewers(false); setShowSettings(false); }} onDirectUser={openDirectMessage} directUnread={directUnread} ownerId={room?.owner_id} roomModerators={room?.room_moderators || []} participants={room?.participants || []} recentParticipants={room?.recent_participants || []} viewerProfiles={viewerProfiles} presenceMap={presenceMap} levels={roomLevels} onProfileCard={openUserProfile} onToggleChat={toggleChat} onMicPress={handleMicPress} settingsProps={{ room, canMod, participants: room?.participants || [], roomModerators: room?.room_moderators || [], onAssignMod: assignMod, onRemoveMod: removeMod, roomName: roomNameEdit, setRoomName: setRoomNameEdit, onSaveName: saveRoomName, password: pwSetInput, setPassword: setPwSetInput, passwordOpen: showPwSet, setPasswordOpen: setShowPwSet, onVoice: toggleVoice, onChat: toggleChat, onChatBan: toggleChatBan, onHidden: toggleHidden, onPassword: () => savePassword(), onRemovePassword: () => setShowPwRemoveConfirm(true), onUnban: unbanUser, onPickMovie: () => setFilmOpen(true), onDeleteRoom: deleteRoom, onShare: () => { setShowSettings(false); setShareOpen(true); } }} />}
          </div>
        )}

        {directOpen && (
          <div className="room-side-panel room-direct-panel absolute inset-0 z-[70] w-full sm:left-auto sm:max-w-sm"
            onTouchStart={(e) => { touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
            onTouchEnd={(e) => { if (!touchStart.current) return; const dx = e.changedTouches[0].clientX - touchStart.current.x; const dy = e.changedTouches[0].clientY - touchStart.current.y; if (dx > 80 && dx > Math.abs(dy) * 1.5) setDirectOpen(false); }}
          >
            <RoomDirectMessages onClose={() => { setDirectOpen(false); setDirectTarget(null); }} initialUserId={directTarget} />
          </div>
        )}

        {/* Gönderilen hediye, sohbet kapalı olsa bile odadaki herkese animasyonla görünür. */}
        <RoomGiftStage roomId={id} />

        {showViewers && (
          <>
            {/* Boş alana dokununca izleyici listesi kapanır. */}
            <button type="button" aria-label="Kapat" onClick={() => setShowViewers(false)} className="absolute inset-0 z-[59]" />
            <div className="absolute top-[max(env(safe-area-inset-top),3.5rem)] right-3 z-[60] w-40 max-h-[55vh] overflow-y-auto rounded-xl border border-amber-400/70 bg-gradient-to-b from-[#123018]/95 to-[#33300a]/95 p-2 text-white shadow-2xl backdrop-blur-xl">
              <p className="mb-1.5 px-0.5 text-xs font-semibold text-amber-300">İzleyiciler</p>
            <div className="space-y-1">
              {visibleParticipants.map((p) => {
                const prof = viewerProfiles[p.user_id];
                const avatar = p.avatar || prof?.avatar;
                const presence = presenceMap[p.user_id];
                const isOnline = presence?.online && (Date.now() - new Date(presence.last_seen).getTime() < 60000);
                // Gizli kullanıcı listede takma adla görünür; profili açılınca tam bilgiler görünür.
                const hidden = isHiddenName(p.name);
                return (
                  <button key={p.user_id} onClick={() => openUserProfile(p.user_id)} className="flex items-center gap-1.5 text-xs py-0.5 w-full text-left rounded px-1 hover:bg-white/10">
                    <div className="shrink-0 relative">
                      {!hidden && prof?.profile_frame ? <ProfileFrame frame={prof.profile_frame} avatar={avatar} name={p.name} size="3xs" frameScale={prof.profile_frame_scale} /> : <XpAvatar avatar={avatar} name={p.name} userId={hidden ? '' : p.user_id} size="3xs" />}
                      <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-card ${isOnline ? 'bg-green-400' : 'bg-red-400'}`} />
                    </div>
                    <span className="flex-1 truncate min-w-0">{hidden ? <span className="hidden-user-name">{p.name}</span> : <>{p.name}{p.user_id === room.owner_id && <Crown className="w-3 h-3 text-amber-400 inline ml-0.5 shrink-0" />}</>}</span>
                    {!isOnline && <span className="text-[9px] text-red-400 shrink-0">çevrim dışı</span>}
                  </button>
                );
              })}
              </div>
            </div>
          </>
        )}
        <RoomSettingsMenu open={showSettings} onClose={() => setShowSettings(false)} room={room} canMod={canMod} participants={room.participants || []} roomModerators={room.room_moderators || []} onAssignMod={assignMod} onRemoveMod={removeMod} roomName={roomNameEdit} setRoomName={setRoomNameEdit} onSaveName={saveRoomName} password={pwSetInput} setPassword={setPwSetInput} passwordOpen={showPwSet} setPasswordOpen={setShowPwSet} onVoice={toggleVoice} onChat={toggleChat} onChatBan={toggleChatBan} onHidden={toggleHidden} onPassword={() => savePassword()} onRemovePassword={() => setShowPwRemoveConfirm(true)} onUnban={unbanUser} onPickMovie={() => { setFilmOpen(true); setShowSettings(false); }} onDeleteRoom={deleteRoom} onShare={() => { setShowSettings(false); setShareOpen(true); }} />

        {/* Yayını paylaş: arkadaşlar tek tek seçilir, oda gizliyse giriş izni de verilir. */}
        <InviteSheet
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          onInvite={shareRoom}
          title="Yayını paylaş"
          submitLabel="Paylaş"
          emptyText="Paylaşabileceğin arkadaş yok."
        />
      </div>

      <LiveKitDebugPanel voice={voice} />

      <ConfirmDialog
        open={showPwRemoveConfirm}
        onOpenChange={setShowPwRemoveConfirm}
        title="Şifre kaldırılsın mı?"
        description="Oda şifresini kaldırırsanız oda herkese açık hale gelir."
        confirmText="Kaldır"
        onConfirm={() => savePassword('')}
      />

      <YouTubeLinkSheet open={ytOpen} onClose={() => setYtOpen(false)} canMod={canMod} onPlay={changeVideo} />
      <FilmSearchSheet
        open={filmOpen}
        onClose={() => setFilmOpen(false)}
        canMod={canMod}
        initialQuery={filmQuery}
        initialResults={filmResults}
        onResults={(query, results) => { setFilmQuery(query); setFilmResults(results); }}
        onPlay={pickFilm}
        onPasteLink={() => setYtOpen(true)}
      />
      <SpecialRoleWelcome roomId={id} />

      {profileTarget && (
        <FullUserProfile
          userId={profileTarget}
          hidden={profileHidden}
          name={profilePerson?.name || ''}
          avatar={profilePerson?.avatar || ''}
          sheet
          theme="blue"
          hideSettings
          hideBlock={canMod}
          onClose={closeUserProfile}
          roomId={id}
          level={roomLevels[profileTarget] || 0}
          onMessage={(userId) => { closeUserProfile(); openDirectMessage(userId); }}
          footer={canMod && profileTarget !== user?.id ? [
            { key: 'kick', icon: UserMinus, label: 'Odadan at', onClick: () => { kickUser(profileTarget); closeUserProfile(); } },
            { key: 'ban', icon: Ban, label: 'Engelle', danger: true, onClick: () => { banUser(profileTarget); closeUserProfile(); } },
          ] : []}
        />
      )}

      <RoomExitOverlay
        open={exitOpen}
        onClose={() => setExitOpen(false)}
        onMinimize={() => { setExitOpen(false); minimizeRoom(); }}
        onLeave={() => { setExitOpen(false); handleLeave(); }}
      />
    </div>
  );
}