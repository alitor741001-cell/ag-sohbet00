import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Trophy, UserPlus } from 'lucide-react';
import { RoomEvent } from 'livekit-client';
import usePkCamera from '@/hooks/usePkCamera';
import usePkMatch from '@/hooks/usePkMatch';
import usePkStreak from '@/hooks/usePkStreak';
import { useToast } from '@/components/ui/use-toast';
import PkFeedTile from '@/components/voice/pk/PkFeedTile';
import PkInvitePanel from '@/components/voice/pk/PkInvitePanel';
import PkLiveHeader from '@/components/voice/pk/PkLiveHeader';
import PkScoreBar from '@/components/voice/pk/PkScoreBar';
import PkLiveChat from '@/components/voice/pk/PkLiveChat';
import PkLiveNotice from '@/components/voice/pk/PkLiveNotice';
import PkActionBar from '@/components/voice/pk/PkActionBar';
import PkRankingSheet from '@/components/voice/pk/PkRankingSheet';
import formatCoinAmount from '@/components/voice/formatCoinAmount';
import { useUserProfile } from '@/lib/profileCard';
import VoiceViewerSheet from '@/components/voice/VoiceViewerSheet';

// Her tur 5 dakika sürer: "Maçı Başlat" denince süre başlar, süre bitince sonuç gelir.
const clock = (total) => `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
const TOUR_SECONDS = 5 * 60;

/**
 * Görüntülü PK ekranı: sesli odanın üstünde açılır, oda bağlantısı arkada korunur.
 * Yayıncıların kamera/mikrofon yayını kendiliğinden çalışır; ekranda elle kamera,
 * mikrofon veya davet düğmesi yoktur.
 */
export default function VideoPkStage({
  open, onClose, onLeft, roomId, roomName, user, participants = [], seatRows = [], moderators = [], ownerId,
  gifts = [], coins = 0, livekitRoom, onSendGift, onOpenGifts, messages = [], onSendMessage, voice, roomActions = null,
}) {
  const { toast } = useToast();
  const { openUserProfile } = useUserProfile();
  const { match, loaded, run, busy } = usePkMatch(roomId, open);
  const { streak, refresh: refreshStreak } = usePkStreak(user?.id);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [rankOpen, setRankOpen] = useState(false);
  const [now, setNow] = useState(Date.now());
  const finishedRef = useRef('');
  const autoRef = useRef(false);

  const isHost = match?.host_id === user?.id;
  const isGuest = match?.guest_id === user?.id;
  const isPlayer = isHost || isGuest;
  const opponentId = isHost ? match?.guest_id : isGuest ? match?.host_id : '';
  const roomOwner = !!ownerId && user?.id === ownerId;
  // Davet yalnızca yayını açan taraftan gönderilir.
  const canManage = roomOwner || isHost;

  const openPerson = (targetId, name, avatar) => {
    if (!targetId) return;
    const person = participants.find((item) => item.user_id === targetId);
    openUserProfile(targetId, {
      roomActions,
      name: name || person?.name,
      avatar: avatar || person?.avatar,
      hidden: !!(person?.hidden),
    });
  };

  const remaining = match?.ends_at ? Math.max(0, Math.ceil((new Date(match.ends_at).getTime() - now) / 1000)) : 0;
  const started = !!match?.started;
  const live = match?.status === 'live';
  const timeUp = live && started && !!match?.guest_id && remaining === 0;
  const finished = match?.status === 'ended' || timeUp;
  // Sonuç ekranı kullanıcı rövanş başlatana ya da maçtan ayrılana kadar açık kalır.
  const staleEnded = match?.status === 'ended'
    && Date.now() - new Date(match.started_at || match.created_date || 0).getTime() > 30 * 60 * 1000;
  const active = match && !staleEnded ? match : null;
  const showFrames = !!active && active.status !== 'invite';
  const guestPresent = !!active?.guest_id;
  const solo = !!active && active.status === 'live' && !guestPresent;
  // Davet alan kişi: yayın akışının üzerinde kabul/ret kartı görünür.
  const incoming = !!active && active.guest_id === user?.id && !active.accepted;

  // Yayını açan taraf kendi kamerasını yayınlar; davet edilen kişi kabul edince yayına girer.
  const cameraOn = open && !!active && (active.status === 'live' || active.status === 'ended')
    && (isHost || (isGuest && !!active.accepted));
  const { localTrack, remoteTracks, error, camOn } = usePkCamera({
    open, publish: cameraOn, livekitRoom, selfId: user?.id,
  });

  // Yayın sesi LiveKit üzerinden akar: yayın açıldığında mikrofon kapalıysa açılır.
  const micAskedRef = useRef('');
  useEffect(() => {
    if (!cameraOn || !voice?.muted) return;
    const key = active?.id || '';
    if (!key || micAskedRef.current === key) return;
    micAskedRef.current = key;
    voice?.allowConsent?.();
    voice?.toggleMute?.();
  }, [cameraOn, active?.id, voice]);

  // Yayın açılır açılmaz kamera yayına girer; odada açık bir yayın varsa ona katılınır.
  useEffect(() => {
    if (!open) { autoRef.current = false; setInviteOpen(false); setViewerOpen(false); setRankOpen(false); return; }
    if (!loaded || autoRef.current) return;
    autoRef.current = true;
    if (active) return;
    if (!canManage) return;
    run('broadcast', { room_id: roomId, room_name: roomName || '' }).catch(() => null);
  }, [open, loaded, active, roomId, roomName, run, canManage]);

  useEffect(() => {
    if (!open) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [open]);

  // Süre bitince tur sunucuda bir kez kapatılır: sonuç ve galibiyet serisi orada işlenir.
  // Yayını açan taraf hemen kapatır; karşı taraf yalnızca yayıncı işlemediyse devreye girer.
  useEffect(() => {
    if (!match?.id || !isPlayer || match.settled || !match.started) return undefined;
    if (match.status !== 'live' || !match.guest_id || !match.ends_at) return undefined;
    const endsAt = new Date(match.ends_at).getTime();
    let stopped = false;

    const attempt = () => {
      if (stopped || Date.now() < endsAt) return;
      const key = `${match.id}:${match.round_no}`;
      if (isHost) {
        if (finishedRef.current === key) return;
        finishedRef.current = key;
      }
      run('finish', { id: match.id }).then(() => refreshStreak()).catch(() => null);
    };

    attempt();
    const timer = window.setInterval(attempt, 5000);
    return () => { stopped = true; window.clearInterval(timer); };
  }, [match?.id, match?.settled, match?.started, match?.status, match?.ends_at, match?.round_no, match?.guest_id, isPlayer, isHost, run, refreshStreak]);

  // Sonuç işlendiğinde galibiyet serisi tazelenir.
  useEffect(() => {
    if (match?.settled) refreshStreak();
  }, [match?.settled, refreshStreak]);

  // Maçtan ayrılan tarafın yayın ekranı kapanır: kişi sesli odada kalmaya devam eder.
  const wasPlayerRef = useRef(false);
  useEffect(() => { if (isPlayer) wasPlayerRef.current = true; }, [isPlayer]);
  useEffect(() => {
    if (!open || !loaded || isPlayer || !wasPlayerRef.current) return;
    wasPlayerRef.current = false;
    onClose?.();
  }, [open, loaded, isPlayer, onClose]);

  // Tur skoru: tutar tur başlangıcından sonra gelen hediyelerden okunur; rövanşta sıfırlanır.
  const matchStart = active?.started_at ? new Date(active.started_at).getTime() : 0;
  const giftScores = useMemo(() => {
    const totals = {};
    messages.forEach((message) => {
      const target = message?.gift_to_id;
      const k = Number(message?.gift_k) || 0;
      if (!target || !k) return;
      if (matchStart && message.created_date && new Date(message.created_date).getTime() < matchStart) return;
      totals[target] = (totals[target] || 0) + k;
    });
    return totals;
  }, [messages, matchStart]);

  // Hediye görselleri: gerçek hediye kataloğundan alınır, kısa süre kamera üzerinde parlar.
  const giftBursts = useMemo(() => {
    const byId = new Map();
    gifts.forEach((gift) => { if (gift?.id) byId.set(gift.id, gift); });
    const map = {};
    messages.forEach((message) => {
      const target = message?.gift_to_id;
      if (!target) return;
      const at = message.created_date ? new Date(message.created_date).getTime() : 0;
      if (now - at > 4500) return;
      const art = byId.get(message.gift || message.gift_id);
      map[target] = {
        key: message.id || `${target}-${at}`,
        emoji: message.gift_emoji || art?.emoji || '🎁',
        imageUrl: message.gift_image_url || art?.image_url || '',
      };
    });
    return map;
  }, [messages, now, gifts]);

  // Kapatılan ses odadaki herkes için susar: izleyiciler ve karşı taraf duymaz.
  const mutedIds = useMemo(() => new Set(active?.muted || []), [active?.muted]);
  useEffect(() => {
    const room = livekitRoom;
    if (!room) return undefined;
    const apply = () => {
      room.remoteParticipants?.forEach((participant, identity) => {
        const off = mutedIds.has(identity);
        participant.audioTrackPublications?.forEach((publication) => {
          try { publication.track?.setVolume?.(off ? 0 : 1); } catch (err) { /* yayın henüz hazır değil */ }
        });
      });
    };
    apply();
    room.on?.(RoomEvent.TrackSubscribed, apply);
    return () => { room.off?.(RoomEvent.TrackSubscribed, apply); };
  }, [livekitRoom, mutedIds]);

  if (!open) return null;

  // Tur bittiğinde son skorlar sunucudan okunur; oyun sırasında hediyelerden canlı hesaplanır.
  const scoreOf = (id) => {
    if (!id) return 0;
    if (finished && match?.settled) {
      const raw = id === active?.host_id ? match.host_score : match.guest_score;
      return (Number(raw) || 0) * 1000;
    }
    return (giftScores[id] || 0) * 1000;
  };

  const seatOf = (id, hostSeat) => ({
    id,
    name: hostSeat ? (active?.host_name || 'Yayıncı') : (active?.guest_name || 'Konuk'),
    avatar: hostSeat ? (active?.host_avatar || '') : (active?.guest_avatar || ''),
  });
  const seats = active
    ? (isGuest
      ? [seatOf(active.guest_id, false), seatOf(active.host_id, true)]
      : [seatOf(active.host_id, true), seatOf(active.guest_id, false)])
      .filter((seat) => !!seat.id)
    : [];
  const leftScore = scoreOf(seats[0]?.id);
  const rightScore = scoreOf(seats[1]?.id);
  const rivalSeat = seats.find((seat) => seat.id && seat.id !== user?.id) || null;
  const rival = rivalSeat ? { id: rivalSeat.id, name: rivalSeat.name, avatar: rivalSeat.avatar } : null;

  const elapsed = active?.started_at ? Math.max(0, Math.floor((now - new Date(active.started_at).getTime()) / 1000)) : 0;
  const timerText = !active
    ? '00:00'
    : finished
      ? '00:00'
      : started
        ? clock(remaining)
        : solo
          ? clock(elapsed)
          : clock(TOUR_SECONDS);

  const resultText = (() => {
    if (!finished) return '';
    const first = seats[0];
    const second = seats[1];
    if (!second) return 'Tek kişilik yayın';
    if (leftScore === rightScore) return `Berabere · ${formatCoinAmount(leftScore)} — ${formatCoinAmount(rightScore)}`;
    const winner = leftScore > rightScore ? first : second;
    return `${winner?.name || 'Yayıncı'} turu kazandı · ${formatCoinAmount(leftScore)} — ${formatCoinAmount(rightScore)}`;
  })();

  const invite = async (person) => {
    if (active?.guest_id) {
      toast({ title: 'Zaten bir rakip var', description: 'Önce mevcut rakiple maçı bitir ya da ayrıl.' });
      return;
    }
    try {
      await run('invite', { room_id: roomId, room_name: roomName || '', guest_id: person.user_id, guest_name: person.name });
      setInviteOpen(false);
      toast({ title: 'PK daveti gönderildi', description: `${person.name || 'Kullanıcı'} kabul ederse maçı başlatabilirsin.` });
    } catch (inviteError) {
      toast({ title: 'Davet gönderilemedi', description: inviteError?.response?.data?.error || inviteError.message, variant: 'destructive' });
    }
  };

  // "Maçtan ayrıl": yalnızca PK oturumu kapanır. Yayını açan kişi tek kişilik yayında kalır,
  // ayrılan rakip odaya döner; sesli oda bağlantısı hiç kesilmez.
  const leaveMatch = async () => {
    if (match?.id) await run('leave', { id: match.id }).catch(() => null);
    if (!isHost) onClose?.();
  };

  // Sağ üstteki X: yayını açan için yayın da kapanır, diğerleri için yalnız ekran kapanır.
  const closeStage = async () => {
    if (isHost && match?.id) await run('leave', { id: match.id, end: true }).catch(() => null);
    else if (isPlayer && match?.id) await run('leave', { id: match.id }).catch(() => null);
    if (isPlayer) onLeft?.();
    onClose?.();
  };

  const decline = async () => {
    if (match?.id) await run('decline', { id: match.id }).catch(() => null);
    onClose?.();
  };

  const startMatch = async () => {
    if (!match?.id) return;
    await run('start', { id: match.id }).catch((startError) => {
      toast({ title: 'Maç başlatılamadı', description: startError?.response?.data?.error || startError.message, variant: 'destructive' });
    });
  };

  const rematch = async () => {
    if (!match?.id) return;
    await run('rematch', { id: match.id }).catch(() => null);
    refreshStreak();
  };

  // Hediye: gül dışındaki hediyeler odanın hediye tahtasından gönderilir.
  const giftTargetId = opponentId || active?.host_id || user?.id;
  const sendGift = (gift) => {
    if (!giftTargetId) return;
    onSendGift?.(gift, [giftTargetId]);
  };

  const sendRose = () => {
    const rose = gifts.find((gift) => gift.model_kind === 'rose') || gifts.find((gift) => /gül|rose/i.test(gift.name || ''));
    if (rose) { sendGift(rose); return; }
    onOpenGifts?.();
    toast({ title: 'Gül hediyesi bulunamadı', description: 'Hediye tahtasından seçebilirsin.' });
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col overflow-hidden bg-black text-white"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <PkLiveHeader
        person={rival || { id: user?.id, name: 'Sen', avatar: user?.avatar || '' }}
        user={user}
        coins={coins}
        pkStreak={streak}
        viewerCount={participants.length}
        onOpenViewers={() => setViewerOpen(true)}
        galleryIndex={seats.length || 1}
        galleryTotal={Math.max(participants.length, seats.length, 1)}
        onOpenRanking={() => setRankOpen(true)}
        onClose={closeStage}
      />

      {/* Skor barı ve süre yalnızca maç sırasında ve sonuç ekranında görünür. */}
      {showFrames && guestPresent && (started || finished) && (
        <PkScoreBar leftScore={leftScore} rightScore={rightScore} timerText={timerText} />
      )}

      <div className="relative flex min-h-0 flex-1 flex-col">
        {!active && (
          <div className="flex min-h-0 flex-1 items-center justify-center gap-2 text-[11.5px] font-semibold text-white/55">
            <Loader2 className="h-4 w-4 animate-spin" /> Kamera yayına alınıyor…
          </div>
        )}

        {/* İki kare: rakip geldiğinde iki kamera yan yana açılır, ayrılınca tek kareye döner. */}
        {showFrames && (
          <div className="flex min-h-0 flex-1 gap-0.5">
            {seats.map((seat, index) => {
              const isMe = seat.id === user?.id;
              return (
                <PkFeedTile
                  key={seat.id || index}
                  name={isMe ? 'Sen' : seat.name}
                  avatar={seat.avatar}
                  score={scoreOf(seat.id)}
                  muted={mutedIds.has(seat.id)}
                  mine={isMe}
                  camOn={camOn}
                  track={isMe ? localTrack : remoteTracks.find((item) => item.identity === seat.id)?.track}
                  error={isMe ? error : ''}
                  burst={giftBursts[seat.id] || null}
                  onOpen={isMe ? null : () => openPerson(seat.id, seat.name, seat.avatar)}
                />
              );
            })}
          </div>
        )}

        {/* PK daveti: tek kişilik yayında sağ üstte küçük düğme, davet paneli tam ekran açılır. */}
        {showFrames && canManage && !guestPresent && (
          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            aria-label="PK daveti gönder"
            className="flame-live absolute right-2 top-2 z-50 flex items-center gap-1 rounded-full border border-fuchsia-200/70 px-2.5 py-1.5 text-[10px] font-black text-white active:scale-95"
            style={{ backgroundImage: 'linear-gradient(115deg,#ffb3f0 0%,#d946ef 45%,#7c0ea0 100%)' }}
          >
            <UserPlus className="h-3.5 w-3.5" /> PK Davet
          </button>
        )}

        {inviteOpen && (
          <div className="absolute inset-2 z-[60] flex flex-col rounded-2xl bg-[#0c0714]/97 p-1.5 ring-1 ring-fuchsia-400/30">
            <PkInvitePanel
              mode="pick"
              match={active}
              user={user}
              participants={participants}
              livekitRoom={livekitRoom}
              busy={busy}
              onInvite={invite}
            />
            <button
              type="button"
              onClick={() => setInviteOpen(false)}
              className="mt-1 shrink-0 rounded-xl bg-white/10 py-2 text-[11px] font-black text-white/75 active:scale-95"
            >
              Kapat
            </button>
          </div>
        )}

        {/* Davet edilen kişi: yayın akışı arkada kalır, kart ortada açılır. */}
        {incoming && (
          <div className="absolute inset-0 z-[55] flex items-center justify-center bg-black/60 px-4 backdrop-blur-[2px]">
            <PkInvitePanel
              mode="incoming"
              match={active}
              user={user}
              participants={participants}
              livekitRoom={livekitRoom}
              busy={busy}
              onAccept={() => run('accept', { id: active.id }).catch(() => null)}
              onDecline={decline}
            />
          </div>
        )}

        {!showFrames && active && !incoming && (
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            <PkInvitePanel
              mode="waiting"
              match={active}
              user={user}
              participants={participants}
              livekitRoom={livekitRoom}
              busy={busy}
              onStart={startMatch}
              onCancel={leaveMatch}
            />
          </div>
        )}
      </div>

      {showFrames && (
        <div className="flex shrink-0 flex-col rounded-t-2xl bg-[#141018]/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur">
          <PkLiveNotice
            started={started && !finished}
            finished={finished}
            canStart={isPlayer && guestPresent && !!active?.accepted && !started}
            guestName={active?.accepted ? (active?.guest_name || '') : ''}
            pendingName={!active?.accepted ? (active?.guest_name || '') : ''}
            onStart={startMatch}
            startBusy={busy}
            onLeave={isPlayer && (guestPresent || finished) ? leaveMatch : null}
            onRematch={isPlayer && finished && guestPresent ? rematch : null}
            rematchBusy={busy}
          />

          {finished && (
            <p className="mt-1 flex items-center gap-1.5 rounded-lg bg-amber-400/12 px-2 py-1 text-[10.5px] font-black text-amber-200">
              <Trophy className="h-3.5 w-3.5 shrink-0" />
              <span className="min-w-0 truncate">{resultText}</span>
            </p>
          )}

          <PkLiveChat messages={messages} user={user} />

          <PkActionBar
            onSend={onSendMessage}
            onRose={sendRose}
            onGift={() => onOpenGifts?.()}
          />
        </div>
      )}

      <PkRankingSheet
        open={rankOpen}
        roomId={roomId}
        onClose={() => setRankOpen(false)}
        onSelect={(person) => { setRankOpen(false); openPerson(person.user_id, person.name, person.avatar); }}
      />

      {/* Katılanlar: sesli odadaki izleyici listesinin aynısı. */}
      <VoiceViewerSheet
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        participants={participants}
        seats={seatRows}
        userId={user?.id}
        ownerId={ownerId}
        moderators={moderators}
        onSelect={(id) => { setViewerOpen(false); openPerson(id); }}
      />
    </div>
  );
}