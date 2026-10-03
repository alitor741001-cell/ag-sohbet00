import { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import CrashTopBar from '@/components/games/CrashTopBar';
import CrashField from '@/components/games/CrashField';
import CrashBetPanel from '@/components/games/CrashBetPanel';
import { allowedBets, formatCoins } from '@/components/games/gameHelpers';
import { sounds } from '@/components/games/gameSounds';

const POLL_RUNNING = 2000;
const POLL_WAITING = 2500;
const NEXT_ROUND_DELAY = 4500;
const AUTO_ROUNDS = 10;

/** Crash Rocket — tur sunucuda yürür, oyuncu yalnızca bahis koyar ve zamanında çekilir. */
export default function CrashGame({ session, onOpenHelp, onOpenHistory }) {
  const { profile, config, call, toast, betCap } = session;
  const steps = config?.bet_steps || [];
  const minBet = config?.min_bet || 100;
  const coins = profile?.coins || 0;
  const allowed = allowedBets(steps, { minBet, maxBet: betCap || config?.max_bet || 0, coins });

  const [betA, setBetA] = useState(0);
  const [betB, setBetB] = useState(0);
  const [targetA, setTargetA] = useState(1.5);
  const [targetB, setTargetB] = useState(2);
  const [round, setRound] = useState(null);
  const [multiplier, setMultiplier] = useState(1);
  const [crashed, setCrashed] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [notice, setNotice] = useState('');
  const [recent, setRecent] = useState([]);
  const [auto, setAuto] = useState({ running: false, remaining: 0 });

  const roundIdRef = useRef(null);
  const crashedRef = useRef(false);
  const lastCrashRef = useRef(null);
  const autoRef = useRef(auto);
  const betRef = useRef({ a: 0, b: 0 });
  const targetRef = useRef({ a: 1.5, b: 2 });

  useEffect(() => { autoRef.current = auto; }, [auto]);
  useEffect(() => { crashedRef.current = crashed; }, [crashed]);
  useEffect(() => { betRef.current = { a: betA, b: betB }; }, [betA, betB]);
  useEffect(() => { targetRef.current = { a: targetA, b: targetB }; }, [targetA, targetB]);

  useEffect(() => {
    if (!allowed.length) return;
    if (!allowed.includes(betA)) setBetA(allowed[Math.min(allowed.length - 1, 2)]);
    if (!allowed.includes(betB)) setBetB(allowed[Math.min(allowed.length - 1, 3)]);
  }, [allowed, betA, betB]);

  // Üst şeritte son patlayan tur çarpanları gösterilir.
  const loadRecent = useCallback(async () => {
    const rows = await base44.entities.GameRound.filter({ status: 'crashed' }, '-crashed_at', 8).catch(() => []);
    setRecent((Array.isArray(rows) ? rows : []).map((row) => Number(row.crash_point || 0)).filter((value) => value > 1));
  }, []);

  useEffect(() => { loadRecent(); }, [loadRecent]);

  const syncRound = useCallback((data) => {
    if (!data || data.error || !data.round) return;
    roundIdRef.current = data.round.id;
    setRound(data.round);
    setCrashed(!!data.crashed);
    const value = data.crashed ? Number(data.round.crash_point || data.multiplier) : Number(data.multiplier);
    setMultiplier(Number.isFinite(value) && value > 0 ? value : 1);
  }, []);

  // Tur döngüsü: hazırlanıyor → uçuş → patlama → yeni tur
  useEffect(() => {
    let cancelled = false;
    let timer = null;
    let nextTimer = null;

    const step = async () => {
      if (cancelled) return;
      const payload = roundIdRef.current && !crashedRef.current
        ? { action: 'crash-state', round_id: roundIdRef.current }
        : { action: 'crash-round' };
      const data = await call(payload);
      if (cancelled) return;
      syncRound(data);
      if (data?.crashed && data.round && lastCrashRef.current !== data.round.id) {
        lastCrashRef.current = data.round.id;
        sounds.play('crash');
        setNotice(`Roket ${Number(data.round.crash_point || 0).toFixed(2)}x ile patladı`);
        loadRecent();
      }
      if (data?.crashed) {
        roundIdRef.current = null;
        nextTimer = setTimeout(() => { if (!cancelled) step(); }, NEXT_ROUND_DELAY);
        return;
      }
      timer = setTimeout(step, data?.round?.status === 'running' ? POLL_RUNNING : POLL_WAITING);
    };

    step();
    return () => { cancelled = true; clearTimeout(timer); clearTimeout(nextTimer); };
  }, [call, loadRecent, syncRound]);

  // Uçuş sırasında çarpan yerel olarak akıcı gösterilir (sonuç sunucudan doğrulanır).
  useEffect(() => {
    if (!round || round.status !== 'running' || crashed) return undefined;
    const startMs = new Date(round.started_at).getTime();
    let raf = 0;
    const loop = () => {
      setMultiplier(Math.max(1, Math.floor(Math.exp(0.11 * (Date.now() - startMs) / 1000) * 100) / 100));
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [round, crashed]);

  useEffect(() => {
    if (!round || round.status !== 'waiting') { setCountdown(0); return undefined; }
    const startMs = new Date(round.started_at).getTime();
    const id = setInterval(() => setCountdown(Math.max(0, Math.ceil((startMs - Date.now()) / 1000))), 250);
    return () => clearInterval(id);
  }, [round]);

  // Diğer oyuncuların bahis/çekilme durumları canlı yayınlanır.
  useEffect(() => {
    const unsubscribe = base44.entities.GameRound.subscribe((event) => {
      if (!event?.data || event.id !== roundIdRef.current) return;
      setRound((prev) => (prev ? { ...prev, ...event.data } : prev));
    });
    return unsubscribe;
  }, []);

  const myPlayer = round?.players?.find((player) => player.user_id === profile?.user_id) || null;
  const canBet = !!round && round.status === 'waiting';
  const playing = myPlayer?.state === 'playing';

  const placeBet = useCallback(async (stake, tgt) => {
    if (!round || round.status !== 'waiting') {
      toast({ title: 'Bahis kapalı', description: 'Yeni turun başlamasını bekle.', variant: 'destructive' });
      return;
    }
    if (myPlayer) { toast({ title: 'Bu tura zaten bahis koydun' }); return; }
    const data = await call({ action: 'crash-bet', round_id: round.id, bet: stake, target: tgt });
    if (data?.error) { setAuto((prev) => ({ ...prev, running: false, remaining: 0 })); return; }
    sounds.play('click');
    setNotice('');
    if (autoRef.current.running) {
      const remaining = Math.max(0, autoRef.current.remaining - 1);
      setAuto((prev) => ({ ...prev, running: remaining > 0, remaining }));
    }
  }, [call, myPlayer, round, toast]);

  // Otomatik bahis: her yeni turda 2. modüldeki coin ve hedefle oynar.
  useEffect(() => {
    if (!auto.running || !round || round.status !== 'waiting' || myPlayer) return undefined;
    if (auto.remaining <= 0) { setAuto((prev) => ({ ...prev, running: false })); return undefined; }
    const id = setTimeout(() => { placeBet(betRef.current.b, targetRef.current.b); }, 900);
    return () => clearTimeout(id);
  }, [auto, round, myPlayer, placeBet]);

  const cashOut = useCallback(async () => {
    if (!round || !playing) return;
    const data = await call({ action: 'crash-cashout', round_id: round.id });
    if (data?.error) return;
    if (data.round) syncRound(data);
    if (data.cashout?.ok) {
      sounds.play('cashout');
      setNotice(`${Number(data.cashout.multiplier).toFixed(2)}x ile çekildin · +${formatCoins(data.cashout.payout)} coin`);
    } else {
      sounds.play('crash');
      setNotice('Tam çekilecekken patladı — bu turu kaybettin.');
    }
  }, [call, playing, round, syncRound]);

  const primaryA = playing ? `Çekil ${multiplier.toFixed(2)}x` : canBet && !myPlayer ? 'Bahis yap' : 'Bekle';
  const subtitleA = playing ? `Hedef ${Number(targetA).toFixed(2)}x` : countdown > 0 ? `Yeni tur ${countdown} sn` : 'Tur bekleniyor';

  return (
    <div className="space-surface flex min-h-full flex-col gap-2 rounded-2xl px-2 pb-2 pt-2">
      <CrashTopBar coins={coins} recent={recent} onOpenHelp={onOpenHelp} onOpenHistory={onOpenHistory} />

      <p className="text-center text-[11px] font-black tracking-wide text-game-cream/70">
        Turlar:{round?.round_number ?? '—'}
      </p>

      <CrashField
        round={round}
        multiplier={multiplier}
        crashed={crashed}
        countdown={countdown}
        notice={notice}
        currentUserId={profile?.user_id}
      />

      <div className="grid grid-cols-2 gap-2 border-t border-white/10 pt-2">
        <CrashBetPanel
          bet={betA}
          onBetChange={setBetA}
          allowed={allowed}
          target={targetA}
          onTargetChange={setTargetA}
          primary={primaryA}
          subtitle={subtitleA}
          tone={playing ? 'gold' : 'blue'}
          disabled={!playing && (!canBet || !!myPlayer)}
          onClick={playing ? cashOut : () => placeBet(betA, targetA)}
        />
        <CrashBetPanel
          bet={betB}
          onBetChange={setBetB}
          allowed={allowed}
          target={targetB}
          onTargetChange={setTargetB}
          primary={auto.running ? 'Otomatik AÇIK' : 'Bahis yap'}
          subtitle={auto.running ? `${auto.remaining} tur kaldı` : 'Otomatik bahis'}
          tone={auto.running ? 'gold' : 'blue'}
          disabled={!allowed.length}
          onClick={() => {
            sounds.play('click');
            setAuto((prev) => (prev.running ? { running: false, remaining: 0 } : { running: true, remaining: AUTO_ROUNDS }));
          }}
        />
      </div>
    </div>
  );
}