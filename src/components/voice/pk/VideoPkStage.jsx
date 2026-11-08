import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Clock3, LogOut, Mic, MicOff, RotateCcw, Sparkles, Trophy, Volume2, VolumeX, X } from 'lucide-react';
import { RoomEvent } from 'livekit-client';
import usePkCamera from '@/hooks/usePkCamera';
import usePkMatch from '@/hooks/usePkMatch';
import { useToast } from '@/components/ui/use-toast';
import PkGiftStrip from '@/components/voice/pk/PkGiftStrip';
import PkSquareTile from '@/components/voice/pk/PkSquareTile';
import PkComments from '@/components/voice/pk/PkComments';
import PkInvitePanel from '@/components/voice/pk/PkInvitePanel';
import formatCoinAmount from '@/components/voice/formatCoinAmount';

// PK turu 5 dakika: "Başla" dendiği an süre başlar, süre bitince sonuç gelir.
const PK_SECONDS = 300;
const clock = (total) => `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;

/**
 * Görüntülü PK (TikTok düzeni): iki kare kamera yan yana, altında yorumlar,
 * hediye şeridi ve ses kontrolleri. Davet → kabul → Başla → 5 dakika → Rövanş.
 */
export default function VideoPkStage({
  open, onClose, roomId, roomName, user, participants = [], scores = {},
  gifts = [], coins, livekitRoom, onSendGift, messages = [], onSendMessage, voice,
}) {
  const { toast } = useToast();
  const { match, run, busy } = usePkMatch(roomId, open);
  const [target, setTarget] = useState('opponent');
  const [now, setNow] = useState(Date.now());
  const [secondsLeft, setSecondsLeft] = useState(PK_SECONDS);
  const baseRef = useRef({});
  const finishedRef = useRef('');
  const startRef = useRef(0);

  const isHost = match?.host_id === user?.id;
  const isGuest = match?.guest_id === user?.id;
  const opponentId = isHost ? match?.guest_id : isGuest ? match?.host_id : '';
  const opponentName = (isHost ? match?.guest_name : match?.host_name) || 'Rakip';
  const opponentAvatar = (isHost ? match?.guest_avatar : match?.host_avatar) || '';

  const remaining = match?.ends_at ? Math.max(0, Math.ceil((new Date(match.ends_at).getTime() - now) / 1000)) : 0;
  const live = match?.status === 'live';
  const timeUp = live && remaining === 0;
  const finished = match?.status === 'ended' || timeUp;
  const staleEnded = match?.status === 'ended'
    && Date.now() - new Date(match.started_at || match.created_date || 0).getTime() > 10 * 60 * 1000;
  const active = match && !staleEnded ? match : null;
  const showFrames = !!active && active.status !== 'invite';

  // Kamera yalnızca PK'nın iki tarafında açılır: izleyiciler kendi kameralarını yayınlamaz.
  const cameraOn = open && !!match && (isHost || isGuest) && (live || match.status === 'ended');
  const { localVideoRef, remoteTracks, error } = usePkCamera({ active: cameraOn, livekitRoom, selfId: user?.id });

  useEffect(() => {
    if (!open) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [open]);

  // Süre bitince karşılaşma kapanır (yalnızca bir kez, davet eden taraf yazar).
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
    startRef.current = Date.now();
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

  const myScore = scoreOf(user?.id);
  const opponentScore = scoreOf(opponentId);
  const total = myScore + opponentScore;
  const share = total > 0 ? Math.round((myScore / total) * 100) : 50;

  useEffect(() => {
    if (match?.status !== 'live' || !match?.ends_at) { setSecondsLeft(PK_SECONDS); return; }
    setSecondsLeft(Math.max(0, Math.ceil((new Date(match.ends_at).getTime() - Date.now()) / 1000)));
  }, [match?.status, match?.ends_at]);

  if (!open) return null;

  const iMuted = mutedIds.has(user?.id);
  const opponentMuted = !!opponentId && mutedIds.has(opponentId);

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
    } catch (inviteError) {
      toast({ title: 'Davet gönderilemedi', description: inviteError?.response?.data?.error || inviteError.message, variant: 'destructive' });
    }
  };

  const leaveMatch = async () => {
    if (match?.id) await run('leave', { id: match.id }).catch(() => null);
    onClose?.();
  };

  const rematch = async () => {
    if (!match?.id) return;
    await run('rematch', { id: match.id }).catch(() => null);
  };

  const sendGift = (gift) => {
    const to = target === 'me' ? user?.id : opponentId;
    if (!to) return;
    onSendGift?.(gift, [to]);
  };

  const inviteMode = !active ? 'pick' : active.status === 'invite' ? (isHost ? 'waiting' : isGuest ? 'incoming' : 'spectate') : null;

  // İki kare: oyuncuysan solda sen, izleyiciysen solda davet eden taraf durur.
  const seatOf = (id, hostSeat) => ({
    id,
    name: hostSeat ? (active?.host_name || 'Davet eden') : (active?.guest_name || 'Rakip'),
    avatar: hostSeat ? (active?.host_avatar || '') : (active?.guest_avatar || ''),
  });
  const seats = active
    ? (isGuest
      ? [seatOf(active.guest_id, false), seatOf(active.host_id, true)]
      : [seatOf(active.host_id, true), seatOf(active.guest_id, false)])
    : [];
  const leftScore = scoreOf(seats[0]?.id);
  const rightScore = scoreOf(seats[1]?.id);
  const leftShare = leftScore + rightScore > 0 ? Math.round((leftScore / (leftScore + rightScore)) * 100) : 50;

  return (
    <div className="fixed inset-0 z-[190] flex flex-col bg-[#07040d] text-white">
      <div aria-hidden="true" className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-fuchsia-600/40 blur-3xl" />

      <header className="relative flex shrink-0 items-center gap-2 px-3 pb-2" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 8px)' }}>
        <span
          className="flame-live flex items-center gap-1 rounded-xl border border-fuchsia-200/70 px-2 py-1 text-[11px] font-black"
          style={{ backgroundImage: 'linear-gradient(115deg,#ffb3f0 0%,#d946ef 45%,#7c0ea0 100%)', boxShadow: '0 0 16px -2px rgba(217,70,239,0.95)' }}
        >
          <Sparkles className="h-3.5 w-3.5" /> PK
          {Number(match?.round_no) > 1 && <span className="text-[9px]">· {match.round_no}. tur</span>}
        </span>
        <span className="flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1 text-[12px] font-black tabular-nums">
          <Clock3 className="h-3 w-3 text-fuchsia-200" />
          {showFrames ? clock(live ? remaining : 0) : '05:00'}
        </span>
        <button type="button" onClick={onClose} aria-label="PK'yı kapat" className="ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-white/10 active:scale-95">
          <X className="h-5 w-5" />
        </button>
      </header>

      <div className="relative flex min-h-0 flex-1 flex-col gap-2 px-2 pb-1">
        {showFrames && (
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
            </div>

            <div className="shrink-0">
              <div className="flex items-end justify-between px-1 text-[11px] font-black tabular-nums">
                <span className="text-emerald-300">{formatCoinAmount(leftScore)}</span>
                <span className="text-white/45">{active.round_no ? `${active.round_no}. tur` : 'PK'}</span>
                <span className="text-fuchsia-300">{formatCoinAmount(rightScore)}</span>
              </div>
              <div className="mt-1 flex h-2.5 overflow-hidden rounded-full bg-white/10">
                <span className="bg-gradient-to-r from-emerald-400 to-emerald-600 transition-[width] duration-500" style={{ width: `${leftShare}%` }} />
                <span className="flex-1 bg-gradient-to-r from-fuchsia-600 to-fuchsia-400" />
              </div>
            </div>

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

        {inviteMode && inviteMode !== 'spectate' && (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <PkInvitePanel
              mode={inviteMode}
              match={active}
              user={user}
              participants={participants}
              livekitRoom={livekitRoom}
              busy={busy}
              onInvite={invite}
              onStart={() => run('start', { id: active.id }).catch(() => null)}
              onCancel={() => run('finish', { id: active.id }).catch(() => null)}
              onAccept={() => run('accept', { id: active.id }).catch(() => null)}
              onDecline={() => run('decline', { id: active.id }).catch(() => null)}
            />
          </div>
        )}

        {inviteMode === 'spectate' && active && (
          <div className="rounded-2xl border border-white/12 bg-white/[0.05] p-3 text-center">
            <p className="text-[12px] font-black text-white">{active.host_name} → {active.guest_name}</p>
            <p className="mt-1 text-[10.5px] font-semibold text-white/55">
              {active.accepted ? 'PK birazdan başlıyor.' : 'Davet kabul edilince PK başlayacak.'}
            </p>
          </div>
        )}

        {showFrames && (
          <PkComments
            messages={messages}
            user={user}
            onSend={onSendMessage}
            disabled={false}
          />
        )}
      </div>

      {showFrames && (
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
            <button
              type="button"
              onClick={pressOpponentAudio}
              aria-pressed={opponentMuted}
              className={`flex h-10 flex-1 items-center justify-center gap-1 rounded-xl text-[10.5px] font-black active:scale-95 ${opponentMuted ? 'bg-red-500/90 text-white' : 'bg-white/12 text-white/85'}`}
            >
              {opponentMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />} Rakip sesi
            </button>
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

      {showFrames && (
        <PkGiftStrip
          gifts={gifts}
          target={target}
          opponentName={opponentName}
          coins={coins}
          onTargetChange={setTarget}
          onSend={sendGift}
        />
      )}

      {!showFrames && (
        <p className="shrink-0 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-center text-[10px] font-semibold text-white/35">
          PK 5 dakika sürer. Yorumlar ve hediyeler tur boyunca açık kalır.
        </p>
      )}
    </div>
  );
}