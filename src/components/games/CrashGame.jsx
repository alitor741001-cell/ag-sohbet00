import { useCallback, useEffect, useRef, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import CrashPlayers from '@/components/games/CrashPlayers';
import BetControls from '@/components/games/BetControls';
import { allowedBets, formatCoins } from '@/components/games/gameHelpers';
import { sounds } from '@/components/games/gameSounds';

const TARGETS = [1.2, 1.5, 2, 3, 5];
const POLL_RUNNING = 2000;
const POLL_WAITING = 2500;
const NEXT_ROUND_DELAY = 4500;

/** Crash Rocket — tur sunucuda yürür, oyuncu yalnızca bahis koyar ve zamanında çekilir. */
export default function CrashGame({ session }) {
  const { profile, config, call, toast, betCap } = session;
  const steps = config?.bet_steps || [];
  const minBet = config?.min_bet || 100;
  const coins = profile?.coins || 0;
  const allowed = allowedBets(steps, { minBet, maxBet: betCap || config?.max_bet || 0, coins });

  const [bet, setBet] = useState(0);
  const [target, setTarget] = useState(1.5);
  const [round, setRound] = useState(null);
  const [multiplier, setMultiplier] = useState(1);
  const [crashed, setCrashed] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [notice, setNotice] = useState('');
  const [auto, setAuto] = useState({ running: false, rounds: 10, remaining: 0 });

  const roundIdRef = useRef(null);
  const crashedRef = useRef(false);
  const lastCrashRef = useRef(null);
  const autoRef = useRef(auto);

  useEffect(() => { autoRef.current = auto; }, [auto]);
  useEffect(() => { crashedRef.current = crashed; }, [crashed]);

  useEffect(() => {
    if (!allowed.length) return;
    if (!allowed.includes(bet)) setBet(allowed[Math.min(allowed.length - 1, 2)]);
  }, [allowed, bet]);

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
  }, [call, syncRound]);

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

  const placeBet = useCallback(async () => {
    if (!round || round.status !== 'waiting') {
      toast({ title: 'Bahis kapalı', description: 'Yeni turun başlamasını bekle.', variant: 'destructive' });
      return;
    }
    if (myPlayer) { toast({ title: 'Bu tura zaten bahis koydun' }); return; }
    const data = await call({ action: 'crash-bet', round_id: round.id, bet, target });
    if (data?.error) { setAuto((prev) => ({ ...prev, running: false, remaining: 0 })); return; }
    sounds.play('click');
    setNotice('');
    if (autoRef.current.running) {
      const remaining = Math.max(0, autoRef.current.remaining - 1);
      setAuto((prev) => ({ ...prev, running: remaining > 0, remaining }));
    }
  }, [bet, call, myPlayer, round, target, toast]);

  useEffect(() => {
    if (!auto.running || !round || round.status !== 'waiting' || myPlayer) return undefined;
    if (auto.remaining <= 0) { setAuto((prev) => ({ ...prev, running: false })); return undefined; }
    const id = setTimeout(() => { placeBet(); }, 900);
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
      setNotice('Tam çekilecekken patladı!');
    }
  }, [call, playing, round, syncRound]);

  const progress = Math.min(1, Math.max(0, Math.log(Math.max(1, multiplier)) / Math.log(12)));
  const tone = crashed ? 'text-game-red' : multiplier >= 2 ? 'text-game-green' : 'text-game-neon';
  const chip = (active) => `min-w-0 flex-1 rounded-xl border px-1.5 py-1.5 text-[10px] font-black tabular-nums transition-transform active:scale-95 ${active ? 'border-game-neon/70 bg-game-neon/15 text-game-neon' : 'border-white/10 bg-black/40 text-white/65'}`;

  return (
    <div className="space-y-3">
      <div className="relative h-56 overflow-hidden rounded-2xl border border-game-neon/30 bg-gradient-to-b from-[#0b1030] to-[#05050a] sm:h-72">
        <div className="game-stars absolute inset-0 opacity-70" />
        <div className="absolute inset-x-0 top-2 flex items-center justify-between px-3 text-[10px] font-black tracking-widest text-white/55">
          <span>TUR #{round?.round_number || '-'}</span>
          <span>{canBet ? 'BAHİS AÇIK' : crashed ? 'PATLADI' : 'UÇUŞTA'}</span>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className={`text-5xl font-black tabular-nums [text-shadow:0_0_26px_currentColor] ${tone}`}>{multiplier.toFixed(2)}x</p>
          {canBet && <p className="mt-1 text-xs font-bold text-game-neon">{countdown > 0 ? `${countdown} sn sonra başlıyor` : 'Roket hazırlanıyor...'}</p>}
          {crashed && <p className="mt-1 text-xs font-bold text-game-red">PATLADI · {Number(round?.crash_point || multiplier).toFixed(2)}x</p>}
        </div>
        <div className="absolute bottom-3 left-0 w-full px-6">
          <div className="relative h-24">
            <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-game-neon/10 via-game-neon/45 to-game-neon/10" />
            {!crashed && (
              <div className="absolute bottom-0 h-px bg-gradient-to-r from-game-neon/0 via-game-neon/80 to-game-neon/0" style={{ width: `${progress * 82}%` }} />
            )}
            <div
              className="absolute transition-[left,bottom] duration-150 ease-out"
              style={{ left: `calc(${progress * 74}% + 3%)`, bottom: `${progress * 58}%`, transform: `rotate(${progress * 20}deg)` }}
            >
              <span className={`block text-3xl ${crashed ? 'game-crash' : 'game-float'}`}>🚀</span>
            </div>
          </div>
        </div>
      </div>

      {notice && <p className="game-rise text-center text-[11px] font-bold text-white/70">{notice}</p>}

      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <BetControls value={bet} onChange={setBet} steps={steps} minBet={minBet} maxBet={betCap || config?.max_bet} coins={coins} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={!canBet || !!myPlayer || !allowed.length || bet > coins}
          onClick={placeBet}
          className="min-w-0 flex-1 rounded-2xl border-2 border-game-green/70 bg-game-green/20 py-3 text-xs font-black tracking-[0.14em] text-game-green transition-transform active:scale-95 disabled:opacity-35"
        >
          BAHİS YAP
        </button>
        <button
          type="button"
          disabled={!playing}
          onClick={cashOut}
          className="flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-2xl border-2 border-game-neon/70 bg-game-neon/20 py-3 text-xs font-black tracking-[0.14em] text-game-neon transition-transform active:scale-95 disabled:opacity-35"
        >
          <TrendingUp className="h-4 w-4" />
          {playing ? `ÇEKİL ${formatCoins(bet * multiplier)}` : 'ÇEKİL'}
        </button>
      </div>

      {myPlayer && (
        <p className="text-center text-[11px] font-bold text-white/70">
          Bahsin {formatCoins(myPlayer.bet)} coin · Hedef {Number(myPlayer.target) > 1 ? `${Number(myPlayer.target).toFixed(2)}x` : 'manuel'} ·{' '}
          {myPlayer.state === 'cashed' ? `Çekildi ${Number(myPlayer.cashout_multiplier).toFixed(2)}x` : myPlayer.state === 'lost' ? 'Kaybetti' : 'Uçuşta'}
        </p>
      )}

      <div className="rounded-2xl border border-white/10 bg-black/40 p-2">
        <div className="flex items-center justify-between text-[9px] font-black tracking-[0.2em] text-white/50">
          <span>HEDEF ÇARPAN</span>
          <span className="tabular-nums">{target > 1 ? `${target.toFixed(2)}x` : 'manuel'}</span>
        </div>
        <div className="mt-1.5 flex gap-1.5">
          <button type="button" onClick={() => { sounds.play('click'); setTarget(0); }} className={chip(target === 0)}>Manuel</button>
          {TARGETS.map((value) => (
            <button key={value} type="button" onClick={() => { sounds.play('click'); setTarget(value); }} className={chip(target === value)}>
              {value.toFixed(2)}x
            </button>
          ))}
        </div>
        <p className="mt-1 text-[10px] text-white/45">Hedef seçersen tur o çarpana ulaştığında otomatik çekilirsin.</p>
      </div>

      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/40 p-2">
        <button
          type="button"
          onClick={() => {
            sounds.play('click');
            setAuto((prev) => (prev.running ? { ...prev, running: false, remaining: 0 } : { ...prev, running: true, remaining: prev.rounds }));
          }}
          className={`rounded-xl border px-3 py-2 text-[11px] font-black transition-transform active:scale-95 ${auto.running ? 'border-game-red/60 bg-game-red/15 text-game-red' : 'border-game-violet/50 bg-game-violet/15 text-game-violet'}`}
        >
          {auto.running ? 'AUTO DURDUR' : 'OTOMATİK OYNAT'}
        </button>
        <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-black/50 px-2 py-1.5">
          <input
            type="number"
            min={1}
            max={100}
            value={auto.rounds}
            onChange={(event) => setAuto((prev) => ({ ...prev, rounds: Math.max(1, Math.min(100, Number(event.target.value) || 1)) }))}
            className="w-10 bg-transparent text-center text-xs font-black tabular-nums text-white outline-none"
          />
          <span className="text-[10px] text-white/50">tur</span>
        </div>
        {auto.running && <span className="ml-auto text-[10px] font-black text-game-neon">kalan {auto.remaining}</span>}
      </div>

      <CrashPlayers players={round?.players || []} currentUserId={profile?.user_id} />
    </div>
  );
}