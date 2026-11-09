import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Loader2, Trophy, X } from 'lucide-react';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/ui/use-toast';
import VideoPkStage from '@/components/videopk/VideoPkStage';
import VideoPkBar from '@/components/videopk/VideoPkBar';
import PkInviteSheet from '@/components/videopk/PkInviteSheet';
import PkInboxSheet from '@/components/videopk/PkInboxSheet';
import PkViewerSheet from '@/components/videopk/PkViewerSheet';
import PkGiftSheet from '@/components/videopk/PkGiftSheet';
import PkChat from '@/components/videopk/PkChat';
import useVideoPk, { PK_INVITE_TTL_MS, videoLobbyId } from '@/hooks/useVideoPk';
import usePkLiveKit from '@/hooks/usePkLiveKit';
import usePkViewers from '@/hooks/usePkViewers';
import { useUserProfile } from '@/lib/profileCard';
import formatCoinAmount from '@/components/voice/formatCoinAmount';

const TOUR_SECONDS = 5 * 60;
const clock = (total) => `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;

/**
 * Görüntülü PK sayfası: sesli odadan tamamen bağımsız çalışır.
 * Sesli oda bağlantısı buraya geçilirken kapatılır; yalnızca PK odasındaki iki kişinin
 * görüntüsü ve sesi duyulur. Puanlar sunucudaki maç kaydından okunur — herkes aynı sayıyı görür.
 */
export default function VideoPkPage() {
  const { user, loading } = useCurrentUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  const backRoom = new URLSearchParams(window.location.search).get('oda');
  const { openUserProfile } = useUserProfile();
  // İzleyiciler: PK hangi sesli odadan açıldıysa o odada kalan dinleyiciler.
  const viewerPeople = usePkViewers(backRoom);
  const viewers = viewerPeople.length;

  const { lobby, joined, active, invites, declined, loaded, busy, run, ensureLobby } = useVideoPk(user);
  const [now, setNow] = useState(Date.now());
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const lobbyStarted = useRef(false);
  const declinedRef = useRef('');
  const expiredRef = useRef('');
  const exitRef = useRef(null);

  const isHost = active?.host_id === user?.id;
  const isGuest = active?.guest_id === user?.id;
  const paired = !!active?.accepted && !!active?.guest_id;
  const live = paired && active?.status === 'live';
  // Sohbet son maçın akışını saklar: turdan ayrılınca da yazışma okunabilir kalır.
  const [chatMatchId, setChatMatchId] = useState('');
  useEffect(() => { if (active?.id) setChatMatchId(active.id); }, [active?.id]);
  // Yalnızca açık olan turda yazılabilir; geçmiş tur okunur.
  const chatWritable = !!active?.id && active.id === chatMatchId && active.status !== 'ended';
  const rival = paired
    ? {
      id: isHost ? active.guest_id : active.host_id,
      name: isHost ? active.guest_name : active.host_name,
      avatar: isHost ? active.guest_avatar : active.host_avatar,
    }
    : null;

  // Rakip ayrıldığında tur sessizce bitmez: tek kamera görünümüne dönülür ve haber verilir.
  const wasPaired = useRef(false);
  // Kendi ayrıldığımızda "rakip ayrıldı" uyarısı çıkmaz.
  const leavingSelf = useRef(false);
  useEffect(() => {
    if (live) { wasPaired.current = true; return; }
    if (!wasPaired.current) return;
    wasPaired.current = false;
    if (leavingSelf.current) { leavingSelf.current = false; return; }
    if (!active?.settled) toast({ title: 'Rakip ayrıldı', description: 'PK turu tek kamera görünümüne döndü.' });
  }, [live, active?.settled, toast]);

  const { localTrack, remoteTracks, status, error, camOn, setCameraEnabled, micOn, setMicEnabled, startAudio } = usePkLiveKit({
    // Kişi kendi lobisinde tek kamerayla yayında kalır; davet kabul edilince aynı maç odasına geçilir.
    matchId: active?.id,
    enabled: !!active?.id && active?.status !== 'ended',
    selfId: user?.id,
  });

  // Sayfadan çıkarken yalnızca sürmekte olan oturum kapatılır; bitmiş tur yeniden açılmaz.
  exitRef.current = active && active.status === 'live'
    ? { id: active.id, host: !!isHost }
    : null;

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Sayfaya girildiğinde kişinin kendi lobisi bir kez açılır (kabul edilmiş maç varsa açılmaz).
  useEffect(() => {
    if (!loaded || !user?.id || lobbyStarted.current || joined) return;
    lobbyStarted.current = true;
    ensureLobby().catch(() => null);
  }, [loaded, joined, user?.id, ensureLobby]);

  // Davet reddedildi: davet sahibine bir kez bildirilir, lobi tekrar tek kameraya döner.
  useEffect(() => {
    if (!declined || declinedRef.current === declined.id) return;
    declinedRef.current = declined.id;
    toast({ title: 'Davet reddedildi', description: `${declined.guest_name || 'Rakip'} PK davetini kabul etmedi.` });
    ensureLobby().catch(() => null);
  }, [declined, toast, ensureLobby]);

  // Bekleyen davet zaman aşımına uğrarsa sahibine bildirilir ve davet kapatılır.
  const pending = active && active.guest_id && !active.accepted ? active : null;
  const pendingExpired = !!pending && now - new Date(pending.invited_at || pending.created_date || 0).getTime() > PK_INVITE_TTL_MS;
  useEffect(() => {
    if (!pending || !pendingExpired || !isHost) return;
    if (expiredRef.current === pending.id) return;
    expiredRef.current = pending.id;
    toast({ title: 'Davetin süresi doldu', description: `${pending.guest_name || 'Rakip'} yanıt vermedi.` });
    run('cancel-invite', { id: pending.id }).catch(() => null);
  }, [pending, pendingExpired, isHost, run, toast]);

  const remaining = live && active?.ends_at ? Math.max(0, Math.ceil((new Date(active.ends_at).getTime() - now) / 1000)) : 0;
  const timerText = active?.settled ? '00:00' : live ? clock(remaining) : clock(TOUR_SECONDS);

  // Tur süresi bittiğinde sonuç sunucuda bir kez işlenir; iki taraf da aynı sonucu görür.
  const finishRef = useRef('');
  useEffect(() => {
    if (!live || !active?.id || remaining > 0) return;
    if (finishRef.current === active.id) return;
    finishRef.current = active.id;
    run('finish', { id: active.id }).catch(() => null);
  }, [live, active?.id, remaining, run]);

  // Sayfadan çıkıldığında PK oturumu kapatılır: lobide kimseye açık davet kalmaz.
  const runRef = useRef(run);
  runRef.current = run;
  useEffect(() => () => {
    const current = exitRef.current;
    if (!current) return;
    runRef.current?.('leave', { id: current.id, end: current.host }).catch(() => null);
  }, []);

  const myScore = (Number(isHost ? active?.host_score : active?.guest_score) || 0) * 1000;
  const rivalScore = (Number(isHost ? active?.guest_score : active?.host_score) || 0) * 1000;

  const invite = async (person) => {
    if (paired) {
      toast({ title: 'Zaten bir rakibin var', description: 'Önce mevcut PK turunu bitir.' });
      return;
    }
    try {
      await run('invite', {
        room_id: videoLobbyId(user.id),
        mode: 'video',
        guest_id: person.user_id,
        guest_name: person.name,
      });
      setInviteOpen(false);
      toast({ title: 'PK daveti gönderildi', description: `${person.name || 'Kullanıcı'} kabul ederse çift kamera açılır.` });
    } catch (inviteError) {
      toast({
        title: 'Davet gönderilemedi',
        description: inviteError?.response?.data?.error || inviteError.message,
        variant: 'destructive',
      });
    }
  };

  const acceptInvite = async (inviteRecord) => {
    try {
      await run('accept', { id: inviteRecord.id });
      // Kabul edildiği an çift kamera açılır: kamera ve mikrofon kendiliğinden devreye girer.
      setInboxOpen(false);
      startAudio();
      setCameraEnabled(true);
      setMicEnabled(true);
      toast({ title: 'PK başladı', description: `${inviteRecord.host_name || 'Rakip'} ile çift kamera açıldı.` });
    } catch (acceptError) {
      toast({
        title: 'Davet kabul edilemedi',
        description: acceptError?.response?.data?.error || acceptError.message,
        variant: 'destructive',
      });
    }
  };

  const declineInvite = async (inviteRecord) => {
    await run('decline', { id: inviteRecord.id }).catch(() => null);
    toast({ title: 'Davet reddedildi', description: `${inviteRecord.host_name || 'Kullanıcı'} bilgilendirilecek.` });
  };

  const sendGift = async (gift) => {
    if (!active?.id || !rival?.id) return;
    try {
      const data = await run('gift', { id: active.id, target_id: rival.id, gift_id: gift.id });
      toast({
        title: `${gift.name} gönderildi`,
        description: `Yeni bakiye: ${formatCoinAmount(data?.coins || 0)} coin`,
      });
    } catch (giftError) {
      toast({
        title: 'Hediye gönderilemedi',
        description: giftError?.response?.data?.error || giftError.message,
        variant: 'destructive',
      });
    }
  };

  // Maçtan ayrıl: sayfadan çıkılmaz, tek kamera görünümüne dönülür.
  const leaveMatch = async () => {
    leavingSelf.current = true;
    if (paired && active?.id) {
      await run('leave', { id: active.id, end: !!isHost }).catch(() => null);
    }
    setGiftOpen(false);
    lobbyStarted.current = false;
    finishRef.current = '';
    await ensureLobby().catch(() => null);
  };

  const rematch = async () => {
    if (!active?.id) return;
    await run('rematch', { id: active.id }).catch(() => null);
    finishRef.current = '';
    startAudio();
  };

  const exitPage = async () => {
    if (active?.status === 'live' && active?.id) {
      await run('leave', { id: active.id, end: !!isHost }).catch(() => null);
    }
    navigate(backRoom ? `/sesli-oda/${backRoom}` : '/');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0b0610] text-white">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  const resultText = (() => {
    if (!active?.settled) return '';
    if (myScore === rivalScore) return `Berabere · ${formatCoinAmount(myScore)} — ${formatCoinAmount(rivalScore)}`;
    const mineWon = myScore > rivalScore;
    return `${mineWon ? 'Turu kazandın' : `${rival?.name || 'Rakip'} kazandı`} · ${formatCoinAmount(myScore)} — ${formatCoinAmount(rivalScore)}`;
  })();

  return (
    <div
      className="fixed inset-0 z-[120] flex flex-col bg-black text-white"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
      onClick={startAudio}
    >
      <div className="flex shrink-0 items-center gap-2 px-3 py-2">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-black leading-tight">Görüntülü PK</p>
          <p className="truncate text-[10px] font-semibold text-white/50">
            {rival ? `Rakip: ${rival.name || 'Kullanıcı'}` : 'Sesli odadan bağımsız · davet göndererek başla'}
          </p>
        </div>
        {backRoom && (
          <button
            type="button"
            onClick={() => setViewerOpen(true)}
            aria-label="İzleyiciler"
            className="flex shrink-0 items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-black text-white/85 active:scale-95"
          >
            <Eye className="h-3.5 w-3.5" />
            {viewers}
            <span className="text-[10px] font-semibold text-white/60">izleyici</span>
          </button>
        )}
        <button
          type="button"
          onClick={exitPage}
          aria-label="Çıkış"
          className="rounded-full bg-white/10 p-2 text-white/80 active:scale-95"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {pending && !pendingExpired && (
        <div className="mx-3 mb-1.5 flex items-center gap-2 rounded-xl bg-fuchsia-500/12 px-2.5 py-1.5 ring-1 ring-fuchsia-400/30">
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-fuchsia-300" />
          <p className="min-w-0 flex-1 truncate text-[10.5px] font-semibold text-white/80">
            {pending.guest_name || 'Rakip'} bekleniyor · davet gönderildi
          </p>
          {isHost && (
            <button
              type="button"
              onClick={() => run('cancel-invite', { id: pending.id }).catch(() => null)}
              className="shrink-0 rounded-lg bg-white/10 px-2 py-1 text-[10px] font-black text-white/75"
            >
              İptal
            </button>
          )}
        </div>
      )}

      {paired && status === 'disconnected' && (
        <p className="mx-3 mb-1.5 rounded-lg bg-amber-400/15 px-2.5 py-1 text-center text-[10.5px] font-bold text-amber-200">
          Bağlantı kesildi — sayfayı yenileyerek tekrar bağlanabilirsin.
        </p>
      )}

      <VideoPkStage
        me={{ avatar: user?.avatar }}
        rival={rival}
        paired={paired}
        myTrack={localTrack}
        rivalTrack={remoteTracks[0]?.track || null}
        camOn={camOn}
        error={error}
        myScore={myScore}
        rivalScore={rivalScore}
        timerText={timerText}
        live={live}
        peerStatus={status}
        onOpenRival={rival?.id ? () => openUserProfile(rival.id) : null}
      />

      {/* Tur sonucu: iki tarafta da aynı skor ve aynı kazanan görünür. */}
      {active?.settled && (
        <div className="absolute inset-x-3 top-1/3 z-40 rounded-2xl border border-amber-300/40 bg-[#1a0f22]/95 p-3 text-center shadow-[0_0_30px_-10px_rgba(250,204,21,0.8)]">
          <p className="flex items-center justify-center gap-1.5 text-[12.5px] font-black text-amber-200">
            <Trophy className="h-4 w-4" /> Tur bitti
          </p>
          <p className="mt-1 text-[11px] font-semibold text-white/75">{resultText}</p>
          <div className="mt-2.5 flex gap-1.5">
            <button
              type="button"
              onClick={rematch}
              disabled={busy}
              className="h-9 flex-1 rounded-xl bg-emerald-500 text-[11.5px] font-black text-black active:scale-95 disabled:opacity-50"
            >
              Rövanş
            </button>
            <button
              type="button"
              onClick={leaveMatch}
              className="h-9 flex-1 rounded-xl bg-white/10 text-[11.5px] font-black text-white/80 active:scale-95"
            >
              Turdan ayrıl
            </button>
          </div>
        </div>
      )}

      <VideoPkBar
        inviteCount={invites.length}
        invites={invites}
        onAcceptInvite={acceptInvite}
        onDeclineInvite={declineInvite}
        busy={busy}
        onOpenProfile={openUserProfile}
        onOpenInbox={() => setInboxOpen(true)}
        onOpenInvite={() => setInviteOpen(true)}
        inviteDisabled={paired || busy}
        inviteLabel={paired ? 'PK Sürüyor' : 'PK Davet Et'}
        micOn={micOn}
        onMic={() => setMicEnabled(!micOn)}
        camOn={camOn}
        onCam={() => setCameraEnabled(!camOn)}
        onChat={() => setChatOpen(true)}
        chatOpen={chatOpen}
        chatDisabled={!chatMatchId}
        onGift={() => setGiftOpen(true)}
        giftDisabled={!live || !!active?.settled}
        onExit={leaveMatch}
        exitDisabled={!live}
        inMatch={live}
      />

      <PkInviteSheet
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        user={user}
        busy={busy}
        onInvite={invite}
        onOpenProfile={openUserProfile}
      />
      <PkInboxSheet
        open={inboxOpen}
        onClose={() => setInboxOpen(false)}
        invites={invites}
        busy={busy}
        onAccept={acceptInvite}
        onDecline={declineInvite}
        onOpenProfile={openUserProfile}
      />
      <PkViewerSheet
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        people={viewerPeople}
        onOpenProfile={openUserProfile}
      />
      <PkChat
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        matchId={chatMatchId}
        hostId={active?.host_id}
        user={user}
        viewers={viewers}
        readOnly={!chatWritable}
      />
      <PkGiftSheet open={giftOpen} onClose={() => setGiftOpen(false)} onSend={sendGift} busy={busy} />
    </div>
  );
}