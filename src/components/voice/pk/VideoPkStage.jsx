import { useCallback, useEffect, useMemo, useRef, useState } from 'react';import { Clock3, Loader2, LogOut, Mic, MicOff, RotateCcw, Sparkles, Trophy, UserPlus, Video, Volume2, VolumeX } from 'lucide-react';
import { RoomEvent } from 'livekit-client';
import usePkCamera from '@/hooks/usePkCamera';
import usePkMatch from '@/hooks/usePkMatch';
import { useToast } from '@/components/ui/use-toast';
import PkGiftStrip from '@/components/voice/pk/PkGiftStrip';
import PkSquareTile from '@/components/voice/pk/PkSquareTile';
import PkComments from '@/components/voice/pk/PkComments';
import PkInvitePanel from '@/components/voice/pk/PkInvitePanel';
import formatCoinAmount from '@/components/voice/formatCoinAmount';

// Her tur 5 dakika sürer: kabul edildiği an süre başlar, süre bitince sonuç gelir.
const PK_SECONDS = 300;
const clock = (total) => `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;

/**
 * Görüntülü yayın: oda üst şeridinin hemen altında açılır; oda kartı, izleyici,
 * ayarlar ve çıkış düğmeleri görünür kalır. Yayın açıkken davet gönderilir,
 * davet edilen kişi kabul ederse yayına katılır, reddederse katılmaz.
 */
export default function VideoPkStage({
  open, onClose, topOffset = 0, roomId, roomName, user, participants = [], scores = {},
  gifts = [], coins, livekitRoom, onSendGift, messages = [], onSendMessage, voice,
}) {
  const { toast } = useToast();
  const { match, loaded, run, busy } = usePkMatch(roomId, open);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [target, setTarget] = useState('opponent');
  const [now, setNow] = useState(Date.now());
  const baseRef = useRef({});
  const finishedRef = useRef('');
  const autoRef = useRef(false);

  const isHost = match?.host_id === user?.id;
  const isGuest = match?.guest_id === user?.id;
  const isPlayer = isHost || isGuest;
  const opponentId = isHost ? match?.guest_id : isGuest ? match?.host_id : '';
  const opponentName = (isHost ? match?.guest_name : match?.host_name) || 'Rakip';

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
  const { localVideoRef, remoteTracks, error } = usePkCamera({ active: cameraOn, livekitRoom, selfId: user?.id });

  // Yayın açılır açılmaz kamera yayına girer; odada açık bir yayın varsa ona katılınır.
  useEffect(() => {
    if (!open) { autoRef.current = false; setInviteOpen(false); return; }
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
  const opponentMuted = !!opponentId && mutedIds.has(opponentId);

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
  const leftShare = leftScore + rightScore > 0 ? Math.round((leftScore / (leftScore + rightScore)) * 100) : 50;

  const elapsed = active?.started_at ? Math.max(0, Math.floor((now - new Date(active.started_at).getTime()) / 1000)) : 0;
  const timerText = !active ? '00:00' : solo || active.status === 'invite' ? clock(elapsed) : clock(live ? remaining : 0);

  const pressMic = async () => {
    if (!match?.id) return;
    const next = !iMuted;
    if (!!voice?.muted !== next) voice?.toggleMute?.();
    run('mute', { id: match.id, target_id: user.id, muted: next }).catch(() => null);
  };

  const pressOpponentAudio = async () => {
    if (!match?.id || !opponentId) return;
    run('mute', { id: match.id, target_id: opponentId, muted: !opponentMuted }).catch(() => null);
  };

  const invite = async (person) => {
    try {
      await run('invite', { room_id: roomId, room_name: roomName || '', guest_id: person.user_id, guest_name: person.name });
      setInviteOpen(false);
      toast({ title: 'Davet gönderildi', description: `${person.name || 'Kullanıcı'} kabul ederse yayına katılır.` });
    } catch (inviteError) {
      toast({ title: 'Davet gönderilemedi', description: inviteError?.response?.data?.error || inviteError.message, variant: 'destructive' });
    }
  };

  const leaveMatch = async () => {
    if (match?.id) await run('leave', { id: match.id }).catch(() => null);
    onClose?.();
  };

  // Yayını açan taraf için "Kapat" yayını bitirir; yalnızca seyreden kişi ekranı kapatır.
  const closeStage = () => {
    if (isPlayer && active && active.status !== 'ended') { leaveMatch(); return; }
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

  // Hediye: seçilen tarafa gönderilir; tek kişilik yayında izleyici yayıncıya gönderir.
  const giftTargetId = target === 'me' && isPlayer ? user?.id : (opponentId || active?.host_id || user?.id);
  const sendGift = (gift) => {
    if (!giftTargetId) return;
    onSendGift?.(gift, [giftTargetId]);
  };

  return (
    <div
      className="absolute inset-x-0 bottom-0 z-[120] flex flex-col overflow-hidden bg-[#07040d] text-white"
      style={{ top: topOffset }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-fuchsia-600/30 blur-3xl" />

      <header className="relative flex shrink-0 items-center gap-1.5 px-2 pb-1.5 pt-1.5">
        <span
          className="flame-live flex items-center gap-1 rounded-xl border border-fuchsia-200/70 px-2 py-1 text-[10px] font-black"
          style={{ backgroundImage: 'linear-gradient(115deg,#ffb3f0 0%,#d946ef 45%,#7c0ea0 100%)', boxShadow: '0 0 16px -2px rgba(217,70,239,0.95)' }}
        >
          <Sparkles className="h-3.5 w-3.5" /> Görüntülü Yayın
        </span>
        <span className="flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1 text-[11px] font-black tabular-nums">
          <Clock3 className="h-3 w-3 text-fuchsia-200" />
          {timerText}
        </span>
        {showFrames && isHost && (
          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            className="ml-auto flex h-8 items-center gap-1 rounded-full bg-fuchsia-500 px-2.5 text-[10.5px] font-black text-white active:scale-95"
          >
            <UserPlus className="h-3.5 w-3.5" /> Davet
          </button>
        )}
        {!showFrames && <span className="ml-auto" />}
        <button
          type="button"
          onClick={closeStage}
          className="flex h-8 shrink-0 items-center gap-1 rounded-full bg-white/10 px-2.5 text-[10.5px] font-black text-white/80 active:scale-95"
        >
          Kapat
        </button>
      </header>

      <div className="relative flex min-h-0 flex-1 flex-col gap-2 px-2 pb-1">
        {inviteOpen && (
          <div className="absolute inset-x-2 inset-y-0 z-20 flex flex-col rounded-2xl bg-[#0c0714]/97 p-1.5 ring-1 ring-fuchsia-400/30">
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
          <div className="min-h-0 flex-1 overflow-y-auto">
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
          <>
            <div className="flex shrink-0 gap-1.5">
              {seats.map((seat, index) => {
                const isMe = seat.id === user?.id;
                return (
                  <PkSquareTile
                    key={seat.id || index}
                    name={seat.name}
                    accent={index === 0 ? 'emerald' : 'fuchsia'}
                    mine={isMe}
                    localVideoRef={isMe ? localVideoRef : null}
                    track={isMe ? null : remoteTracks.find((item) => item.identity === seat.id)?.track}
                    avatar={seat.avatar}
                    score={scoreOf(seat.id)}
                    muted={mutedIds.has(seat.id)}
                    error={isMe ? error : ''}
                  />
                );
              })}
              {seats.length === 1 && isHost && (
                <button
                  type="button"
                  onClick={() => setInviteOpen(true)}
                  className="flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-fuchsia-300/50 bg-white/[0.04] p-2 text-[10.5px] font-black text-fuchsia-200 active:scale-95"
                >
                  <UserPlus className="h-6 w-6" /> Davet et
                  <span className="text-[9px] font-semibold text-white/45">Kabul eden yayına katılır</span>
                </button>
              )}
            </div>

            {seats.length > 1 && (
              <div className="shrink-0">
                <div className="flex items-end justify-between px-1 text-[11px] font-black tabular-nums">
                  <span className="text-emerald-300">{formatCoinAmount(leftScore)}</span>
                  <span className="text-white/45">{active.round_no ? `${active.round_no}. tur` : 'Yayın'}</span>
                  <span className="text-fuchsia-300">{formatCoinAmount(rightScore)}</span>
                </div>
                <div className="mt-1 flex h-2.5 overflow-hidden rounded-full bg-white/10">
                  <span className="bg-gradient-to-r from-emerald-400 to-emerald-600 transition-[width] duration-500" style={{ width: `${leftShare}%` }} />
                  <span className="flex-1 bg-gradient-to-r from-fuchsia-600 to-fuchsia-400" />
                </div>
              </div>
            )}

            {seats.length === 1 && (
              <p className="shrink-0 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-center text-[10.5px] font-semibold text-white/55">
                Yayındasın — davet gönderdiğin kişi kabul ederse yanında yayına katılır.
              </p>
            )}

            {finished && (
              <div className="shrink-0 rounded-2xl border border-amber-300/40 bg-amber-400/10 px-3 py-2">
                <p className="flex items-center gap-1.5 text-[12px] font-black text-amber-200">
                  <Trophy className="h-4 w-4" />
                  {leftScore === rightScore
                    ? 'Berabere'
                    : `${leftScore > rightScore ? seats[0]?.name : seats[1]?.name} turu kazandı`}
                </p>
                <p className="mt-0.5 text-[10.5px] font-semibold text-white/60">
                  {match?.left_id ? 'Karşılaşma ayrılma ile bitti.' : 'Süre doldu. Rövanş ile yeni tur başlatabilirsin.'}
                </p>
              </div>
            )}
          </>
        )}

        {!showFrames && !incoming && active && (
          <div className="min-h-0 flex-1 overflow-y-auto">
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

        {!incoming && showFrames && (
          <PkComments messages={messages} user={user} onSend={onSendMessage} disabled={false} />
        )}
      </div>

      {!incoming && showFrames && isPlayer && (
        <div className="shrink-0 px-2 pt-1.5">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={pressMic}
              aria-pressed={iMuted}
              className={`flex h-10 flex-1 items-center justify-center gap-1 rounded-xl text-[10.5px] font-black active:scale-95 ${iMuted ? 'bg-red-500 text-white' : 'bg-white/12 text-white/85'}`}
            >
              {iMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />} Mikrofon
            </button>
            {opponentId && (
              <button
                type="button"
                onClick={pressOpponentAudio}
                aria-pressed={opponentMuted}
                className={`flex h-10 flex-1 items-center justify-center gap-1 rounded-xl text-[10.5px] font-black active:scale-95 ${opponentMuted ? 'bg-red-500/90 text-white' : 'bg-white/12 text-white/85'}`}
              >
                {opponentMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />} Karşı ses
              </button>
            )}
            <button
              type="button"
              onClick={leaveMatch}
              className="flex h-10 items-center justify-center gap-1 rounded-xl bg-white/12 px-2.5 text-[10.5px] font-black text-white/85 active:scale-95"
            >
              <LogOut className="h-4 w-4" /> Ayrıl
            </button>
            {finished && isHost && (
              <button
                type="button"
                onClick={rematch}
                disabled={busy}
                className="flex h-10 items-center justify-center gap-1 rounded-xl bg-amber-400 px-2.5 text-[10.5px] font-black text-black active:scale-95 disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" /> Rövanş
              </button>
            )}
          </div>
        </div>
      )}

      {!incoming && showFrames && (
        <PkGiftStrip
          gifts={gifts}
          target={opponentId ? target : 'opponent'}
          opponentName={opponentName}
          coins={coins}
          onTargetChange={setTarget}
          onSend={sendGift}
        />
      )}

      {!showFrames && !incoming && (
        <p className="flex shrink-0 items-center justify-center gap-1 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-center text-[10px] font-semibold text-white/35">
          <Video className="h-3 w-3" /> Yayına katılan kişiyle kameralar yan yana görünür.
        </p>
      )}
    </div>
  );
}