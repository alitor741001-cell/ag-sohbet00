import { useEffect, useRef, useState } from 'react';
import { Track } from 'livekit-client';
import { Loader2, Mic, MicOff, PhoneOff, RotateCcw, UserPlus, Video, VideoOff, Volume2, VolumeX, WifiOff } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import useVideoPk from '@/hooks/useVideoPk';
import usePkLiveKit from '@/hooks/usePkLiveKit';
import PkFeedTile from '@/components/voice/pk/PkFeedTile';
import PkScoreBar from '@/components/voice/pk/PkScoreBar';
import PkInviteSheet from '@/components/videopk/PkInviteSheet';


const clock = (total) => `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
const errorText = (error) => error?.response?.data?.error || error?.message || 'İşlem yapılamadı';

/**
 * Görüntülü PK katmanı: sesli odanın üst bölümüne gömülür, ayrı sayfa açmaz.
 * İki kamera yan yana kare olarak durur; koltuklar, sohbet ve mikrofonlar aynen çalışmaya devam eder.
 * Puanlar sunucudaki maç kaydından okunur — hediye gönderildikçe iki tarafta gerçek zamanlı ilerler.
 */
export default function VideoPkLayer({ open, onOpen, onClose, roomId, user, onOpenProfile, onMatchChange }) {
  const { toast } = useToast();
  const { active, invites, loaded, busy, run, ensureLobby } = useVideoPk(user, { poll: open });
  const [inviteOpen, setInviteOpen] = useState(false);
  // Boş alana dokununca PK kazara bitmez: Bitir iki dokunuşla çalışır.
  const [confirmFinish, setConfirmFinish] = useState(false);
  const confirmTimerRef = useRef(0);
  const [rivalMuted, setRivalMuted] = useState(false);
  const [now, setNow] = useState(Date.now());
  const openedRef = useRef(false);
  const endedRef = useRef('');
  const leavingRef = useRef('');
  // Süre dolduğunda turun bir kez kapatılması için.
  const autoEndRef = useRef('');

  const isHost = active?.host_id === user?.id;
  const isGuest = active?.guest_id === user?.id;
  const paired = !!active?.accepted && !!active?.guest_id && active?.status === 'live';
  const pendingInvite = active && active.guest_id && !active.accepted && isHost ? active : null;
  const rival = paired
    ? {
      id: isHost ? active.guest_id : active.host_id,
      name: isHost ? active.guest_name : active.host_name,
      avatar: isHost ? active.guest_avatar : active.host_avatar,
    }
    : null;

  const {
    room, localTrack, remoteTracks, remoteInfo, status, error,
    camOn, setCameraEnabled, micOn, setMicEnabled, startAudio,
  } = usePkLiveKit({
    matchId: open ? active?.id : null,
    // Kamera yalnızca alan açıkken ve tur sürerken yayınlanır; tur bitince kaynak serbest bırakılır.
    enabled: open && !!active?.id && active?.status === 'live' && (isHost || isGuest),
    selfId: user?.id,
  });

  // Tur 5 dakika sürer: kalan süre sunucudaki bitiş anından okunur.
  const endsAt = active?.ends_at ? new Date(active.ends_at).getTime() : 0;
  // Biten tur: sonuç ekranı kaybolmaz, iki taraf da rövanş isteyebilir.
  const finishedMatch = open && active?.status === 'ended' && active?.settled && active?.guest_id ? active : null;

  // Maç bilgisi odaya bildirilir: hediye tahtasında PK tarafları da alıcı olarak çıkar.
  useEffect(() => {
    onMatchChange?.(open ? active : null);
  }, [open, active, onMatchChange]);

  // Alan açıldığında kişinin kendi kamerası açılır; davet bu lobiye düşer.
  useEffect(() => {
    if (!open) { openedRef.current = false; return; }
    if (!loaded || !user?.id || openedRef.current) return;
    // Biten tur varsa yeni lobi açılmaz: kişi önce rövanşa karar verir.
    if (finishedMatch) return;
    openedRef.current = true;
    ensureLobby(roomId).catch(() => null);
  }, [open, loaded, user?.id, roomId, ensureLobby, finishedMatch]);

  // Süre dolunca tur kendiliğinden biter: sonuç iki tarafta da aynı kayıttan okunur.
  useEffect(() => {
    if (!open || !paired || !endsAt || now < endsAt) return;
    const key = `${active?.id}:${active?.round_no}`;
    if (autoEndRef.current === key) return;
    autoEndRef.current = key;
    run('finish', { id: active.id }).catch(() => null);
  }, [open, paired, endsAt, now, active?.id, active?.round_no, run]);

  // Tur karşı tarafça bitirildiyse alan kendiliğinden kapanır; tek kişilik lobi
  // başka bir PK yüzünden kapandıysa sessizce yeniden açılır.
  useEffect(() => {
    if (!open || active?.status !== 'ended' || endedRef.current === active.id) return;
    endedRef.current = active.id;
    // Sonuçlanan tur ekranda kalır: rövanş bu ekrandan istenir.
    if (active.settled) return;
    if (active.guest_id) { onClose?.(); return; }
    ensureLobby(roomId).catch(() => null);
  }, [open, active, onClose, ensureLobby, roomId]);

  // Alan kapatıldığında açık kalan oturum sunucuda da kapatılır: hayalet PK kalmaz.
  useEffect(() => {
    if (open) return;
    const id = active?.id;
    if (!id || active?.status === 'ended' || leavingRef.current === id) return;
    leavingRef.current = id;
    run('leave', { id, end: true }).catch(() => null);
  }, [open, active, run]);

  useEffect(() => {
    if (!open) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [open]);

  // Karşı tarafın sesi istenirse kısılır: oda sesi etkilenmez.
  const toggleRivalAudio = () => {
    const next = !rivalMuted;
    setRivalMuted(next);
    room?.remoteParticipants?.forEach((participant) => {
      participant.trackPublications?.forEach((publication) => {
        if (publication.kind !== Track.Kind.Audio) return;
        try { publication.track?.setVolume?.(next ? 0 : 1); } catch (volumeError) { /* yayın hazır değil */ }
      });
    });
  };

  const sendInvite = async (person) => {
    if (paired) {
      toast({ title: 'Zaten bir rakibin var', description: 'Önce mevcut PK turunu bitir.' });
      return;
    }
    try {
      await run('invite', {
        room_id: roomId,
        mode: 'video',
        guest_id: person.user_id,
        guest_name: person.name,
      });
      setInviteOpen(false);
      toast({ title: 'PK daveti gönderildi', description: `${person.name || 'Kullanıcı'} kabul edince kameralar açılır.` });
    } catch (inviteError) {
      toast({ title: 'Davet gönderilemedi', description: errorText(inviteError), variant: 'destructive' });
    }
  };

  const acceptInvite = async (invite) => {
    try {
      // Önce kabul yazılır, sonra alan açılır: lobi açma isteği maçı kapatmaz.
      await run('accept', { id: invite.id });
      if (!open) onOpen?.();
      startAudio();
      toast({ title: 'PK başladı', description: `${invite.host_name || 'Rakip'} ile kameralar bağlanıyor.` });
    } catch (acceptError) {
      toast({ title: 'Davet kabul edilemedi', description: errorText(acceptError), variant: 'destructive' });
    }
  };

  const declineInvite = async (invite) => {
    await run('decline', { id: invite.id }).catch(() => null);
    toast({ title: 'Davet reddedildi', description: `${invite.host_name || 'Kullanıcı'} bilgilendirilecek.` });
  };

  // PK'yi bitir: tur sunucuda sonuçlandırılır, kamera ve mikrofon serbest bırakılır,
  // oda olduğu gibi (koltuklar, sohbet, mikrofonlar) çalışmaya devam eder.
  const finishPk = async () => {
    window.clearTimeout(confirmTimerRef.current);
    setConfirmFinish(false);
    const id = active?.id;
    const hadRival = !!active?.guest_id;
    if (id) {
      await run('finish', { id, force: true }).catch(() => null);
      // Rakip varsa sonuç ekranı açık kalır (rövanş buradan istenir); yoksa lobi tümüyle kapanır.
      if (!hadRival) await run('leave', { id, end: true }).catch(() => null);
    }
    setInviteOpen(false);
    if (!hadRival) onClose?.();
  };

  // Rövanş: aynı rakibe yeni tur isteği gider, karşı taraf kabul edince 5 dakikalık tur başlar.
  const sendRematch = async () => {
    const id = finishedMatch?.id || active?.id;
    if (!id) return;
    try {
      await run('rematch', { id });
      toast({
        title: 'Rövanş isteği gönderildi',
        description: `${rival?.name || active?.guest_name || 'Rakip'} kabul edince tur yeniden başlar.`,
      });
    } catch (rematchError) {
      toast({ title: 'Rövanş isteği gönderilemedi', description: errorText(rematchError), variant: 'destructive' });
    }
  };

  const closeFinished = async () => {
    const id = finishedMatch?.id;
    if (id) await run('leave', { id, end: true }).catch(() => null);
    onClose?.();
  };

  const myScore = (Number(isHost ? active?.host_score : active?.guest_score) || 0) * 1000;
  const rivalScore = (Number(isHost ? active?.guest_score : active?.host_score) || 0) * 1000;
  // Sayaç geriye doğru iner: tur 5 dakikadır.
  const remaining = paired && endsAt ? Math.max(0, Math.ceil((endsAt - now) / 1000)) : 0;
  const resultText = active?.winner_id
    ? (active.winner_id === user?.id ? 'Kazandın' : 'Kaybettin')
    : 'Berabere';

  const incoming = invites[0] || null;

  return (
    <>
      {open && (
        <div className="shrink-0 px-2 pb-1.5" onClick={startAudio}>
          <PkScoreBar leftScore={myScore} rightScore={rivalScore} timerText={clock(paired ? remaining : 300)} />

          {/* İki kare kamera yan yana: solda kendi görüntün, sağda rakip.
              Yükseklik ekrana göre sınırlanır: altındaki buton satırı her cihazda görünür kalır. */}
          <div className="mt-1 flex items-stretch gap-1.5" style={{ height: 'clamp(104px, 24vh, 176px)' }}>
            <div className="relative h-full w-1/2 min-w-0 overflow-hidden rounded-2xl bg-black ring-1 ring-white/12">
              <PkFeedTile
                name={user?.full_name || 'Sen'}
                avatar={user?.avatar}
                score={myScore}
                mine
                muted={!micOn}
                camOn={camOn}
                track={localTrack}
                error={error}
                footer={(
                  <>
                    <button
                      type="button"
                      onClick={(event) => { event.stopPropagation(); setCameraEnabled(!camOn); }}
                      aria-label={camOn ? 'Kamerayı kapat' : 'Kamerayı aç'}
                      className={`flex h-6 w-6 items-center justify-center rounded-full ring-1 active:scale-95 ${camOn ? 'bg-black/60 text-white ring-white/25' : 'bg-red-500/85 text-white ring-white/30'}`}
                    >
                      {camOn ? <Video className="h-3.5 w-3.5" /> : <VideoOff className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={(event) => { event.stopPropagation(); setMicEnabled(!micOn); }}
                      aria-label={micOn ? 'Mikrofonu kapat' : 'Mikrofonu aç'}
                      className={`flex h-6 w-6 items-center justify-center rounded-full ring-1 active:scale-95 ${micOn ? 'bg-black/60 text-white ring-white/25' : 'bg-red-500/85 text-white ring-white/30'}`}
                    >
                      {micOn ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
                    </button>
                  </>
                )}
              />
            </div>

            <div className="relative h-full w-1/2 min-w-0 overflow-hidden rounded-2xl bg-black ring-1 ring-white/12">
              {paired ? (
                <>
                  <PkFeedTile
                    name={rival?.name || 'Rakip'}
                    avatar={rival?.avatar}
                    score={rivalScore}
                    muted={!remoteInfo.micEnabled}
                    track={remoteTracks[0]?.track || null}
                    onOpen={rival?.id ? () => onOpenProfile?.(rival.id) : undefined}
                    footer={(
                      <button
                        type="button"
                        onClick={(event) => { event.stopPropagation(); toggleRivalAudio(); }}
                        aria-label={rivalMuted ? 'Sesi aç' : 'Sesi kapat'}
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white ring-1 ring-white/25 active:scale-95"
                      >
                        {rivalMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                      </button>
                    )}
                  />
                  {/* Karşı taraf kamerasını kapatınca kare siyah kalmaz: durumu yazar. */}
                  {!remoteInfo.cameraEnabled && (
                    <span className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-1 bg-[#0d0712]/85 px-2 text-center">
                      {rival?.avatar
                        ? <img src={rival.avatar} alt="" className="h-10 w-10 rounded-full object-cover ring-2 ring-white/30" />
                        : <VideoOff className="h-6 w-6 text-white/40" />}
                      <span className="text-[10px] font-black text-white/80">Kamera kapalı</span>
                    </span>
                  )}
                </>
              ) : finishedMatch ? (
                <div className="flex h-full flex-col items-center justify-center gap-1 px-2 text-center">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-fuchsia-500/15 ring-1 ring-fuchsia-400/40">
                    <UserPlus className="h-4 w-4 text-fuchsia-300" />
                  </span>
                  <p className="truncate text-[11px] font-black text-white">
                    {(isHost ? finishedMatch.guest_name : finishedMatch.host_name) || 'Rakip'}
                  </p>
                  <p className="text-[9.5px] font-bold text-amber-300">Tur bitti</p>
                </div>
              ) : (
                // Rakip karesine dokununca davet sayfası açılır.
                <button
                  type="button"
                  onClick={() => setInviteOpen(true)}
                  className="flex h-full w-full flex-col items-center justify-center gap-1.5 px-2 text-center active:scale-[0.99]"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-fuchsia-500/15 ring-1 ring-fuchsia-400/40">
                    <UserPlus className="h-4 w-4 text-fuchsia-300" />
                  </span>
                  <p className="text-[11px] font-black text-white">Rakip bekleniyor</p>
                  <p className="text-[9.5px] leading-snug text-white/50">
                    {pendingInvite
                      ? `${pendingInvite.guest_name || 'Davet edilen kişi'} · yanıt bekleniyor`
                      : 'Davet için buraya dokun'}
                  </p>
                  {status === 'connecting' && (
                    <p className="flex items-center gap-1 text-[9px] font-semibold text-white/45">
                      <Loader2 className="h-2.5 w-2.5 animate-spin" /> Kamera açılıyor…
                    </p>
                  )}
                  {status === 'disconnected' && (
                    <p className="flex items-center gap-1 text-[9px] font-semibold text-amber-300">
                      <WifiOff className="h-2.5 w-2.5" /> Bağlantı kesildi
                    </p>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Tur sonucu: kazanan ve skor, karelerin hemen altında yazar. */}
          {finishedMatch && (
            <p className="mt-1 flex items-center justify-center gap-1.5 text-center text-[10.5px] font-black text-amber-300">
              <span>{resultText}</span>
              <span className="text-white/70">{Math.round(myScore / 1000)} — {Math.round(rivalScore / 1000)}</span>
            </p>
          )}

          {/* Kontroller karelerin hemen altında ayrı satırda durur.
              Tur bittiyse yerine Rövanş ve Kapat çıkar. */}
          <div className="mt-1.5 flex items-center gap-1.5">
            {finishedMatch ? (
              <>
                <button
                  type="button"
                  onClick={sendRematch}
                  disabled={busy}
                  className="flex h-9 flex-1 items-center justify-center gap-1 rounded-xl bg-fuchsia-500 text-[11px] font-black text-white active:scale-[0.98] disabled:opacity-45"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Rövanş
                </button>
                <button
                  type="button"
                  onClick={closeFinished}
                  disabled={busy}
                  className="h-9 shrink-0 rounded-xl bg-white/14 px-3 text-[11px] font-black text-white active:scale-[0.98] disabled:opacity-45"
                >
                  Kapat
                </button>
              </>
            ) : (
              <>
                {/* Bitir belirgin kırmızı durur; kazara bitmemesi için iki dokunuş ister. */}
                <button
                  type="button"
                  onClick={() => {
                    if (!confirmFinish) {
                      setConfirmFinish(true);
                      window.clearTimeout(confirmTimerRef.current);
                      confirmTimerRef.current = window.setTimeout(() => setConfirmFinish(false), 4000);
                      return;
                    }
                    finishPk();
                  }}
                  disabled={busy}
                  className={`flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl text-[11.5px] font-black text-white transition active:scale-[0.98] disabled:opacity-45 ${
                    confirmFinish
                      ? 'bg-rose-600 ring-2 ring-rose-300'
                      : 'bg-gradient-to-r from-rose-600 to-red-500 shadow-[0_8px_22px_-8px_rgba(244,63,94,0.95)]'
                  }`}
                >
                  <PhoneOff className="h-4 w-4" /> {confirmFinish ? 'Bitirmek için tekrar dokun' : 'PK’yi Bitir'}
                </button>
                {incoming && (
                  <button
                    type="button"
                    onClick={() => acceptInvite(incoming)}
                    className="flex h-10 items-center gap-1 rounded-xl bg-emerald-500 px-2.5 text-[11px] font-black text-black active:scale-[0.98]"
                  >
                    Gelen davet
                  </button>
                )}
              </>
            )}
          </div>

          {error && <p className="mt-1 text-center text-[10px] font-semibold text-amber-300">{error}</p>}
        </div>
      )}

      {/* Gelen davet: süre sınırı yok, kullanıcı yanıtlayana kadar bekler. */}
      {incoming && (
        <div
          className="fixed inset-x-2 z-[240] rounded-2xl border border-fuchsia-400/40 bg-[#1c0f26]/97 p-2.5 shadow-[0_12px_40px_-12px_rgba(217,70,239,0.85)]"
          style={{ bottom: 'calc(var(--keyboard-height, 0px) + max(var(--voice-bar-height, 64px), 64px) + 3.6rem)' }}
        >
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => onOpenProfile?.(incoming.host_id)} className="shrink-0 active:scale-95">
              {incoming.host_avatar
                ? <img src={incoming.host_avatar} alt="" className="h-9 w-9 rounded-full object-cover ring-2 ring-fuchsia-400/60" />
                : <span className="block h-9 w-9 rounded-full bg-white/15" />}
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-[9.5px] font-black uppercase tracking-wide text-fuchsia-300">
                {Number(incoming.round_no) > 1 ? 'Rövanş isteği · görüntülü PK' : 'Görüntülü PK daveti'}
              </p>
              <p className="truncate text-[12.5px] font-bold text-white">{incoming.host_name || 'Kullanıcı'}</p>
            </div>
            <button
              type="button"
              onClick={() => declineInvite(incoming)}
              disabled={busy}
              className="h-8 shrink-0 rounded-xl bg-white/12 px-2.5 text-[10.5px] font-black text-white active:scale-95 disabled:opacity-50"
            >
              REDDET
            </button>
            <button
              type="button"
              onClick={() => acceptInvite(incoming)}
              disabled={busy}
              className="h-8 shrink-0 rounded-xl bg-emerald-500 px-2.5 text-[10.5px] font-black text-black active:scale-95 disabled:opacity-50"
            >
              KABUL ET
            </button>
          </div>
        </div>
      )}

      <PkInviteSheet
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        user={user}
        busy={busy}
        onInvite={sendInvite}
        onOpenProfile={onOpenProfile}
      />
    </>
  );
}