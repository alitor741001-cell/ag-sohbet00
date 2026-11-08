import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Trophy, UserPlus } from 'lucide-react';
import { RoomEvent } from 'livekit-client';
import usePkCamera from '@/hooks/usePkCamera';
import usePkMatch from '@/hooks/usePkMatch';
import { useToast } from '@/components/ui/use-toast';
import PkFeedTile from '@/components/voice/pk/PkFeedTile';
import PkInvitePanel from '@/components/voice/pk/PkInvitePanel';
import PkLiveHeader from '@/components/voice/pk/PkLiveHeader';
import PkScoreBar from '@/components/voice/pk/PkScoreBar';
import PkLiveChat from '@/components/voice/pk/PkLiveChat';
import PkLiveNotice from '@/components/voice/pk/PkLiveNotice';
import PkActionBar from '@/components/voice/pk/PkActionBar';
import PkRankingSheet from '@/components/voice/pk/PkRankingSheet';
import { useUserProfile } from '@/lib/profileCard';
import VoiceViewerSheet from '@/components/voice/VoiceViewerSheet';

// Her tur 5 dakika sürer: kabul edildiği an süre başlar, süre bitince sonuç gelir.
const clock = (total) => `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;

/**
 * Görüntülü PK ekranı: sesli odanın üstünde tam ekran açılır, oda bağlantısı arkada korunur.
 * Üstte yayıncı kartı, ortada iki kamera, altta sohbet–hediye–skor bulunur.
 */
export default function VideoPkStage({
  open, onClose, onLeft, roomId, roomName, user, participants = [], seatRows = [], moderators = [], ownerId,
  scores = {}, gifts = [], livekitRoom, onSendGift, onOpenGifts, messages = [], onSendMessage, voice, roomActions = null,
}) {
  const { toast } = useToast();
  const { openUserProfile } = useUserProfile();
  const { match, loaded, run, busy } = usePkMatch(roomId, open);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [rankOpen, setRankOpen] = useState(false);
  const [now, setNow] = useState(Date.now());
  const baseRef = useRef({});
  const finishedRef = useRef('');
  const autoRef = useRef(false);

  const isHost = match?.host_id === user?.id;
  const isGuest = match?.guest_id === user?.id;
  const isPlayer = isHost || isGuest;
  const opponentId = isHost ? match?.guest_id : isGuest ? match?.host_id : '';

  // Kamera karesi, izleyici listesi ve sıralama aynı gerçek profil kartını açar:
  // kartta odadan atma, yöneticilik, mikrofon, engelleme gibi işlemler hazır gelir.
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
  const live = match?.status === 'live';
  const timeUp = live && !!match?.guest_id && remaining === 0;
  const finished = match?.status === 'ended' || timeUp;
  const staleEnded = match?.status === 'ended'
    && Date.now() - new Date(match.started_at || match.created_date || 0).getTime() > 10 * 60 * 1000;
  const active = match && !staleEnded ? match : null;
  const showFrames = !!active && active.status !== 'invite';
  const solo = !!active && active.status === 'live' && !active.guest_id;
  // Davet alan kişi: kabul edene kadar yayın kareleri yerine kabul/ret kartı görünür.
  const incoming = !!active && active.guest_id === user?.id && !active.accepted;

  // Yayın yapan tarafların kamerası açılır; izleyiciler kendi kameralarını yayınlamaz.
  const cameraOn = open && isPlayer && !!active && (active.status === 'live' || active.status === 'ended');
  const { localVideoRef, remoteTracks, error, camOn, setCameraEnabled, mirror } = usePkCamera({ active: cameraOn, livekitRoom, selfId: user?.id });

  // Yayın açılır açılmaz kamera yayına girer; odada açık bir yayın varsa ona katılınır.
  useEffect(() => {
    if (!open) { autoRef.current = false; setInviteOpen(false); setViewerOpen(false); setRankOpen(false); return; }
    if (!loaded || autoRef.current) return;
    autoRef.current = true;
    if (active) return;
    run('broadcast', { room_id: roomId, room_name: roomName || '' }).catch(() => null);
  }, [open, loaded, active, roomId, roomName, run]);

  useEffect(() => {
    if (!open) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [open]);

  // Süre bitince tur kapanır (yalnızca bir kez, yayını açan taraf yazar).
  useEffect(() => {
    if (!match?.id || !timeUp || !isHost) return;
    if (finishedRef.current === match.id) return;
    finishedRef.current = match.id;
    run('finish', { id: match.id }).catch(() => null);
  }, [match?.id, timeUp, isHost, run]);

  // Her tur kendi puanından başlar: önceki turun hediyeleri yeni tura taşınmaz.
  useEffect(() => {
    baseRef.current = {};
    if (!match?.id || !user?.id) return;
    baseRef.current[user.id] = Number(scores[user.id]) || 0;
    if (opponentId) baseRef.current[opponentId] = Number(scores[opponentId]) || 0;
  }, [match?.id, match?.round_no, opponentId, user?.id, scores]);

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

  const scoreOf = useCallback((id) => {
    if (!id) return 0;
    const raw = Number(scores[id]) || 0;
    const start = baseRef.current[id];
    return start === undefined ? Math.max(0, raw) : Math.max(0, raw - start);
  }, [scores]);

  if (!open) return null;

  const iMuted = mutedIds.has(user?.id);

  // İki kare: yayına katılanlar soldan sağa dizilir, izleyici yayıncıyı solda görür.
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
  // Karşı taraf: üst şeritte adı, fotoğrafı ve takip düğmesiyle görünür.
  const rivalSeat = seats.find((seat) => seat.id && seat.id !== user?.id) || null;
  const rival = rivalSeat ? { id: rivalSeat.id, name: rivalSeat.name, avatar: rivalSeat.avatar } : null;

  const elapsed = active?.started_at ? Math.max(0, Math.floor((now - new Date(active.started_at).getTime()) / 1000)) : 0;
  const timerText = !active ? '00:00' : solo || active.status === 'invite' ? clock(elapsed) : clock(live ? remaining : 0);

  const pressMic = async () => {
    if (!match?.id) return;
    const next = !iMuted;
    if (!!voice?.muted !== next) voice?.toggleMute?.();
    run('mute', { id: match.id, target_id: user.id, muted: next }).catch(() => null);
  };

  const toggleCamera = () => setCameraEnabled(!camOn);

  const invite = async (person) => {
    try {
      await run('invite', { room_id: roomId, room_name: roomName || '', guest_id: person.user_id, guest_name: person.name });
      setInviteOpen(false);
      toast({ title: 'Davet gönderildi', description: `${person.name || 'Kullanıcı'} kabul ederse yayına katılır.` });
    } catch (inviteError) {
      toast({ title: 'Davet gönderilemedi', description: inviteError?.response?.data?.error || inviteError.message, variant: 'destructive' });
    }
  };

  // Yayından ayrıl: karşılaşma kapanır, oda ekranına dönülür.
  const leaveMatch = async () => {
    if (match?.id) await run('leave', { id: match.id }).catch(() => null);
    onLeft?.();
    onClose?.();
  };

  // Sağ üstteki X: yayındaki kişi için yayından ayrılma, izleyici için ekranı kapatma.
  const closeStage = () => {
    if (isPlayer && active) { leaveMatch(); return; }
    onClose?.();
  };

  const decline = async () => {
    if (match?.id) await run('decline', { id: match.id }).catch(() => null);
    onClose?.();
  };

  const rematch = async () => {
    if (!match?.id) return;
    await run('rematch', { id: match.id }).catch(() => null);
  };

  // Hediye: gül dışındaki hediyeler odanın hediye tahtasından gönderilir.
  const giftTargetId = opponentId || active?.host_id || user?.id;
  const sendGift = (gift) => {
    if (!giftTargetId) return;
    onSendGift?.(gift, [giftTargetId]);
  };

  // Paylaş: odanın bağlantısı arkadaşlarla paylaşılır; paylaşım yoksa bağlantı kopyalanır.
  const shareRoom = async () => {
    const url = `${window.location.origin}/sesli-oda/${roomId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: roomName || 'Sesli oda', url });
        return;
      }
      await navigator.clipboard?.writeText(url);
      toast({ title: 'Bağlantı kopyalandı', description: 'Arkadaşlarına gönderebilirsin.' });
    } catch (err) {
      /* kullanıcı paylaşımı kapattı */
    }
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
        viewerCount={participants.length}
        onOpenViewers={() => setViewerOpen(true)}
        galleryIndex={seats.length || 1}
        galleryTotal={Math.max(participants.length, seats.length, 1)}
        onOpenRanking={() => setRankOpen(true)}
        onClose={closeStage}
      />

      {showFrames && <PkScoreBar leftScore={leftScore} rightScore={rightScore} timerText={timerText} />}

      <div className="relative flex min-h-0 flex-1 flex-col">
        {inviteOpen && (
          <div className="absolute inset-2 z-40 flex flex-col rounded-2xl bg-[#0c0714]/97 p-1.5 ring-1 ring-fuchsia-400/30">
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

        {incoming && (
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
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

        {!incoming && !active && (
          <div className="flex min-h-0 flex-1 items-center justify-center gap-2 text-[11.5px] font-semibold text-white/55">
            <Loader2 className="h-4 w-4 animate-spin" /> Kamera yayına alınıyor…
          </div>
        )}

        {!incoming && showFrames && (
          <div className="flex min-h-0 flex-1 gap-0.5">
            {seats.map((seat, index) => {
              const isMe = seat.id === user?.id;
              const opponentSeat = !isMe && seat.id === opponentId;
              return (
                <PkFeedTile
                  key={seat.id || index}
                  name={isMe ? 'Sen' : seat.name}
                  avatar={seat.avatar}
                  score={scoreOf(seat.id)}
                  muted={mutedIds.has(seat.id)}
                  mine={isMe}
                  camOn={camOn}
                  mirror={mirror}
                  localVideoRef={isMe ? localVideoRef : null}
                  track={isMe ? null : remoteTracks.find((item) => item.identity === seat.id)?.track}
                  error={isMe ? error : ''}
                  onOpen={isMe ? null : () => openPerson(seat.id, seat.name, seat.avatar)}
                  footer={opponentSeat && isHost ? (
                    <button
                      type="button"
                      onClick={() => setInviteOpen(true)}
                      aria-label="Yayına davet et"
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/30 active:scale-95"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                />
              );
            })}

            {seats.length === 1 && (
              <button
                type="button"
                onClick={() => setInviteOpen(true)}
                className="flex min-h-0 flex-1 flex-col items-center justify-center gap-1 bg-white/[0.04] text-[10.5px] font-black text-fuchsia-200 active:scale-95"
              >
                <UserPlus className="h-6 w-6" /> Davet et
                <span className="px-2 text-center text-[9px] font-semibold text-white/45">Kabul eden yayına katılır</span>
              </button>
            )}
          </div>
        )}

        {!showFrames && !incoming && active && (
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            <PkInvitePanel
              mode="waiting"
              match={active}
              user={user}
              participants={participants}
              livekitRoom={livekitRoom}
              busy={busy}
              onStart={() => run('start', { id: active.id }).catch(() => null)}
              onCancel={leaveMatch}
            />
          </div>
        )}

      </div>

      {showFrames && (
        <div className="flex shrink-0 flex-col rounded-t-2xl bg-[#141018]/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur">
          <PkLiveNotice
            finished={finished}
            onLeave={active?.guest_id ? leaveMatch : null}
            onRematch={isHost && active?.guest_id ? rematch : null}
            rematchBusy={busy}
          />

          {finished && (
            <p className="mt-1 flex items-center gap-1.5 rounded-lg bg-amber-400/12 px-2 py-1 text-[10.5px] font-black text-amber-200">
              <Trophy className="h-3.5 w-3.5 shrink-0" />
              {leftScore === rightScore
                ? 'Berabere — rövanşla devam et'
                : `${leftScore > rightScore ? seats[0]?.name : seats[1]?.name} turu kazandı${match?.left_id ? ' (ayrılma)' : ''}`}
            </p>
          )}

          <PkLiveChat messages={messages} user={user} />

          <PkActionBar
            onSend={onSendMessage}
            onInvite={() => setInviteOpen(true)}
            onRose={sendRose}
            onGift={() => onOpenGifts?.()}
            onShare={shareRoom}
            camOn={camOn}
            micMuted={iMuted}
            onToggleCamera={toggleCamera}
            onToggleMic={pressMic}
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