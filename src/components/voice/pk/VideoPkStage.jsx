import { useEffect, useMemo, useRef, useState } from 'react';
import { Sparkles, Users, VideoOff, X } from 'lucide-react';
import usePkCamera from '@/hooks/usePkCamera';
import formatCoinAmount from '@/components/voice/formatCoinAmount';
import PkGiftStrip from '@/components/voice/pk/PkGiftStrip';

// PK süresi: 3 dakika. Süre bitince sonuç ekranı çıkar.
const PK_SECONDS = 180;

const clock = (total) => `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;

/** Karşı tarafın kamerası: gelen görüntü doğrudan oynatılır. */
function RemoteVideo({ track }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current || !track) return undefined;
    const stream = new MediaStream([track.mediaStreamTrack]);
    ref.current.srcObject = stream;
    ref.current.play?.().catch(() => {});
    return () => { if (ref.current) ref.current.srcObject = null; };
  }, [track]);
  return <video ref={ref} autoPlay playsInline muted className="h-full w-full object-cover" />;
}

/**
 * Görüntülü PK: kişinin kamerası açılır, karşı taraf seçilir. İki görüntü yan yana durur,
 * altta hediye şeridi ve izleyici sayısı görünür. Hediyeler gönderildikçe puanlar yükselir.
 */
export default function VideoPkStage({ open, onClose, user, participants = [], scores = {}, gifts = [], coins, livekitRoom, onSendGift }) {
  const [opponentId, setOpponentId] = useState('');
  const [target, setTarget] = useState('opponent');
  const [secondsLeft, setSecondsLeft] = useState(PK_SECONDS);
  const [finished, setFinished] = useState(false);
  const [viewersOpen, setViewersOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const baseRef = useRef({});
  const { localVideoRef, remoteTracks, error } = usePkCamera({ active: open, livekitRoom, selfId: user?.id });

  const others = useMemo(
    () => participants.filter((person) => person?.user_id && person.user_id !== user?.id),
    [participants, user?.id],
  );

  useEffect(() => {
    if (!open) return;
    if (!others.length) { setOpponentId(''); return; }
    if (!others.some((person) => person.user_id === opponentId)) setOpponentId(others[0].user_id);
  }, [open, others, opponentId]);

  // Süre: PK açıldığında başlar, bittiğinde sonuç gösterilir.
  useEffect(() => {
    if (!open) return undefined;
    setSecondsLeft(PK_SECONDS);
    setFinished(false);
    setViewersOpen(false);
    setPickerOpen(false);
    setTarget('opponent');
    baseRef.current = {};
    const timer = setInterval(() => {
      setSecondsLeft((value) => {
        if (value <= 1) { clearInterval(timer); setFinished(true); return 0; }
        return value - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [open]);

  // Puanlar PK başlangıcındaki değerden sayılır: hediye aldıkça yükselir.
  useEffect(() => {
    if (!open || !user?.id) return;
    if (baseRef.current[user.id] === undefined) baseRef.current[user.id] = Number(scores[user.id]) || 0;
    if (opponentId && baseRef.current[opponentId] === undefined) baseRef.current[opponentId] = Number(scores[opponentId]) || 0;
  }, [open, user?.id, opponentId, scores]);

  if (!open) return null;

  const opponent = others.find((person) => person.user_id === opponentId) || null;
  const opponentName = opponent?.name || 'Rakip';
  const myScore = Math.max(0, (Number(scores[user?.id]) || 0) - (baseRef.current[user?.id] || 0));
  const opponentScore = Math.max(0, (Number(scores[opponentId]) || 0) - (baseRef.current[opponentId] || 0));
  const total = myScore + opponentScore;
  const share = total > 0 ? Math.round((myScore / total) * 100) : 50;
  const remoteTrack = remoteTracks.find((item) => item.identity === opponentId)?.track || null;
  const iWon = myScore >= opponentScore;

  const send = (gift) => {
    const to = target === 'me' ? user?.id : opponentId;
    if (!to) return;
    onSendGift?.(gift, [to]);
  };

  return (
    <div className="fixed inset-0 z-[190] flex flex-col bg-[#07040d] text-white">
      <div aria-hidden="true" className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-fuchsia-600/40 blur-3xl" />

      <header className="relative flex shrink-0 items-center gap-2 px-3 pb-2" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 8px)' }}>
        <span
          className="flame-live flex items-center gap-1 rounded-xl border border-fuchsia-200/70 px-2 py-1 text-[11px] font-black"
          style={{ backgroundImage: 'linear-gradient(115deg,#ffb3f0 0%,#d946ef 45%,#7c0ea0 100%)', boxShadow: '0 0 16px -2px rgba(217,70,239,0.95)' }}
        >
          <Sparkles className="h-3.5 w-3.5" /> GÖRÜNTÜLÜ PK
        </span>
        <span className="rounded-lg bg-white/10 px-2 py-1 text-[12px] font-black tabular-nums">{clock(secondsLeft)}</span>
        <button type="button" onClick={onClose} aria-label="PK'yı kapat" className="ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-white/10 active:scale-95">
          <X className="h-5 w-5" />
        </button>
      </header>

      {/* İki görüntü yan yana: solda ben, sağda rakip. */}
      <div className="relative flex min-h-0 flex-1 gap-1.5 px-2">
        <div className="relative flex-1 overflow-hidden rounded-2xl border-2 border-emerald-400/70 bg-black">
          <video ref={localVideoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
          {error && (
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/70 px-2 text-center text-[11px] font-semibold text-white/80">
              <VideoOff className="h-6 w-6 text-white/60" /> {error}
            </span>
          )}
          <span className="absolute left-1.5 top-1.5 rounded-md bg-emerald-500/90 px-1.5 py-0.5 text-[9px] font-black">SEN</span>
        </div>

        <div className="relative flex-1 overflow-hidden rounded-2xl border-2 border-fuchsia-400/70 bg-black">
          {remoteTrack ? (
            <RemoteVideo track={remoteTrack} />
          ) : (
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-gradient-to-b from-[#2a0b3a] to-[#0d0416] px-2 text-center">
              {opponent?.avatar ? (
                <img src={opponent.avatar} alt="" className="h-16 w-16 rounded-full object-cover ring-2 ring-fuchsia-300/60" />
              ) : (
                <VideoOff className="h-8 w-8 text-white/40" />
              )}
              <span className="text-[11px] font-bold text-white/85">{opponentName}</span>
              <span className="text-[9px] text-white/55">Kamera bekleniyor</span>
            </span>
          )}
          <button
            type="button"
            onClick={() => setPickerOpen((value) => !value)}
            className="absolute right-1.5 top-1.5 max-w-[85%] truncate rounded-md bg-fuchsia-500/90 px-1.5 py-0.5 text-[9px] font-black active:scale-95"
          >
            {opponentName}
          </button>
        </div>

        {/* Rakip seçimi */}
        {pickerOpen && (
          <div className="absolute inset-x-2 top-12 z-10 max-h-[45%] overflow-y-auto rounded-2xl border border-white/15 bg-[#140a1e]/95 p-2">
            <p className="mb-1 px-1 text-[10px] font-bold uppercase tracking-wide text-white/60">Rakip seç</p>
            {others.length === 0 && <p className="px-1 py-2 text-[11px] text-white/60">Odada başka kişi yok.</p>}
            {others.map((person) => (
              <button
                key={person.user_id}
                type="button"
                onClick={() => { setOpponentId(person.user_id); setPickerOpen(false); }}
                className={`flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left active:scale-[0.98] ${person.user_id === opponentId ? 'bg-fuchsia-500/25' : ''}`}
              >
                {person.avatar
                  ? <img src={person.avatar} alt="" className="h-7 w-7 rounded-full object-cover" />
                  : <span className="h-7 w-7 rounded-full bg-white/15" />}
                <span className="min-w-0 flex-1 truncate text-[12px] font-bold">{person.name || 'Kullanıcı'}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Puan çubuğu: hediye aldıkça yükselen iki taraf. */}
      <div className="shrink-0 px-2 pt-2">
        <div className="flex items-end justify-between px-1 text-[11px] font-black tabular-nums">
          <span className="text-emerald-300">{formatCoinAmount(myScore)}</span>
          <span className="text-white/50">PK</span>
          <span className="text-fuchsia-300">{formatCoinAmount(opponentScore)}</span>
        </div>
        <div className="mt-1 flex h-2.5 overflow-hidden rounded-full bg-white/10">
          <span className="bg-gradient-to-r from-emerald-400 to-emerald-600 transition-[width] duration-500" style={{ width: `${share}%` }} />
          <span className="flex-1 bg-gradient-to-r from-fuchsia-600 to-fuchsia-400" />
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewersOpen((value) => !value)}
            className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/85 active:scale-95"
          >
            <Users className="h-3 w-3" /> {participants.length} izleyici
          </button>
          <button
            type="button"
            onClick={() => { setFinished(true); }}
            className="ml-auto rounded-full bg-white/12 px-2.5 py-1 text-[10px] font-black text-white/85 active:scale-95"
          >
            PK'yı bitir
          </button>
        </div>
      </div>

      {viewersOpen && (
        <div className="mx-2 mt-1.5 max-h-[26%] shrink-0 overflow-y-auto rounded-2xl border border-white/12 bg-white/[0.05] p-1.5">
          {participants.map((person) => (
            <div key={person.user_id || person.name} className="flex items-center gap-2 px-1 py-1">
              {person.avatar
                ? <img src={person.avatar} alt="" className="h-6 w-6 rounded-full object-cover" />
                : <span className="h-6 w-6 rounded-full bg-white/15" />}
              <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-white/85">{person.name || 'Kullanıcı'}</span>
              {person.user_id === user?.id && <span className="text-[9px] font-black text-emerald-300">SEN</span>}
            </div>
          ))}
        </div>
      )}

      <PkGiftStrip
        gifts={gifts}
        coins={coins}
        target={target}
        opponentName={opponentName}
        onTargetChange={setTarget}
        onSend={send}
      />

      {/* Sonuç: süre bittiğinde veya PK bitirildiğinde. */}
      {finished && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-black/80 px-6 text-center">
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/60">PK bitti</span>
          <span className={`text-2xl font-black ${iWon ? 'text-emerald-300' : 'text-fuchsia-300'}`}>
            {iWon ? 'Kazandın!' : `${opponentName} kazandı`}
          </span>
          <span className="text-[12px] font-bold tabular-nums text-white/75">
            {formatCoinAmount(myScore)} — {formatCoinAmount(opponentScore)}
          </span>
          <button type="button" onClick={onClose} className="mt-2 rounded-full bg-white px-5 py-2 text-sm font-black text-black active:scale-95">
            Kapat
          </button>
        </div>
      )}
    </div>
  );
}