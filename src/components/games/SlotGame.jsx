import { useCallback, useEffect, useRef, useState } from 'react';
import { Crown } from 'lucide-react';
import SlotGrid from '@/components/games/SlotGrid';
import SpinButton from '@/components/games/SpinButton';
import JackpotOverlay from '@/components/games/JackpotOverlay';
import BetControls from '@/components/games/BetControls';
import AutoSpinBar from '@/components/games/AutoSpinBar';
import { allowedBets, emptyColumns, formatCoins, randomColumn } from '@/components/games/gameHelpers';
import { sounds } from '@/components/games/gameSounds';

const STOP_DELAYS = [300, 500, 700, 900, 1100];
const POOLS = [
  { key: 'jackpot_mini', label: 'Mini', tone: 'text-game-green', symbol: '⭐' },
  { key: 'jackpot_major', label: 'Major', tone: 'text-game-gold', symbol: '💎' },
  { key: 'jackpot_mega', label: 'Mega', tone: 'text-game-violet', symbol: '👑' },
];

/** Slot ve Jackpot oyunu — tüm sonuçlar sunucudan gelir. */
export default function SlotGame({ variant = 'slot', session }) {
  const { profile, config, symbols, betCap, call, toast, jackpotMinBet } = session;
  const jackpotVariant = variant === 'jackpot';
  const steps = config?.bet_steps || [];
  const minBet = config?.min_bet || 100;
  const coins = profile?.coins || 0;
  const allowed = allowedBets(steps, { minBet, maxBet: betCap || config?.max_bet || 0, coins });

  const [bet, setBet] = useState(0);
  const [columns, setColumns] = useState(emptyColumns);
  const [rolling, setRolling] = useState([false, false, false, false, false]);
  const [spinning, setSpinning] = useState(false);
  const [winRows, setWinRows] = useState([]);
  const [result, setResult] = useState(null);
  const [jackpotFlash, setJackpotFlash] = useState(null);
  const [auto, setAuto] = useState({ running: false, remaining: 0 });
  const timers = useRef([]);
  const busyRef = useRef(false);

  useEffect(() => {
    if (!allowed.length) return;
    if (!allowed.includes(bet)) setBet(allowed[Math.min(allowed.length - 1, 2)]);
  }, [allowed, bet]);

  // Dönen makaralar hızlı sembol akışı gösterir.
  useEffect(() => {
    if (!rolling.some(Boolean)) return undefined;
    const id = setInterval(() => {
      setColumns((prev) => prev.map((column, index) => (rolling[index] ? randomColumn(symbols) : column)));
    }, 70);
    return () => clearInterval(id);
  }, [rolling, symbols]);

  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  useEffect(() => {
    if (!jackpotFlash) return undefined;
    const id = setTimeout(() => setJackpotFlash(null), 3000);
    return () => clearTimeout(id);
  }, [jackpotFlash]);

  const stopAuto = useCallback(() => setAuto({ running: false, remaining: 0 }), []);

  const runSpin = useCallback(async () => {
    if (busyRef.current) return;
    if (!allowed.length || bet > coins) {
      toast({ title: 'Yeterli coin yok', description: 'Bahsi düşür veya MAX ile sınırı gör.', variant: 'destructive' });
      stopAuto();
      return;
    }
    busyRef.current = true;
    setSpinning(true);
    setResult(null);
    setWinRows([]);
    setJackpotFlash(null);
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setRolling([true, true, true, true, true]);
    sounds.play('spin');

    const data = await call({
      action: 'spin',
      game: jackpotVariant ? 'jackpot' : 'slot',
      bet,
      request_id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    });

    if (!data || data.error) {
      busyRef.current = false;
      setSpinning(false);
      setRolling([false, false, false, false, false]);
      stopAuto();
      return;
    }

    const spin = data.spin;
    STOP_DELAYS.forEach((delay, reel) => {
      timers.current.push(setTimeout(() => {
        setColumns((prev) => prev.map((column, index) => (index === reel ? spin.grid[reel] : column)));
        setRolling((prev) => prev.map((flag, index) => (index === reel ? false : flag)));
        sounds.play('reel');
      }, delay));
    });

    timers.current.push(setTimeout(() => {
      busyRef.current = false;
      setSpinning(false);
      setWinRows([...new Set((spin.lines || []).map((line) => line.row))]);
      setResult(spin);
      if (spin.jackpot?.amount) { sounds.play('jackpot'); setJackpotFlash(spin.jackpot); }
      else if (spin.payout > 0) sounds.play('win');
      else sounds.play('click');
    }, STOP_DELAYS[STOP_DELAYS.length - 1] + 280));
  }, [allowed.length, bet, call, coins, jackpotVariant, stopAuto, toast]);

  // Otomatik spin zinciri
  useEffect(() => {
    if (!auto.running || spinning) return undefined;
    if (auto.remaining <= 0) { setAuto({ running: false, remaining: 0 }); return undefined; }
    const id = setTimeout(() => {
      setAuto((prev) => ({ running: prev.remaining - 1 > 0, remaining: Math.max(0, prev.remaining - 1) }));
      runSpin();
    }, 700);
    return () => clearTimeout(id);
  }, [auto, spinning, runSpin]);

  const payout = result?.payout || 0;
  const autoMax = config?.auto_max || 100;

  return (
    <div className="space-y-3">
      {jackpotVariant ? (
        <div className="rounded-2xl border border-game-violet/40 bg-gradient-to-b from-game-violet/25 to-transparent p-2.5">
          <div className="flex items-stretch gap-1.5">
            {POOLS.map((pool) => (
              <div key={pool.key} className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/45 px-1.5 py-1.5 text-center">
                <p className="text-[9px] font-black tracking-widest text-white/60">{pool.symbol} {pool.label.toUpperCase()}</p>
                <p className={`truncate text-xs font-black tabular-nums ${pool.tone}`}>{formatCoins(config?.[pool.key] || 0)}</p>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="text-lg">🏆</span>
            <h2 className="game-glow text-xl font-black tracking-[0.26em] text-game-gold">JACKPOT</h2>
            <span className="text-lg">🏆</span>
          </div>
          <p className="mt-0.5 text-center text-[10px] text-white/60">{formatCoins(jackpotMinBet)} coin ve üzeri bahislerde jackpot açılır.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-game-gold/25 bg-gradient-to-b from-game-gold/15 to-transparent p-2.5">
          <div className="flex items-center justify-center gap-2 text-game-gold">
            <Crown className="h-4 w-4" />
            <h2 className="text-sm font-black tracking-[0.24em]">SLOT OYUNU</h2>
            <Crown className="h-4 w-4" />
          </div>
          <p className="mt-0.5 text-center text-[10px] text-white/60">5 makara · 3 hat · bonus sembolü ve jackpot şansı</p>
        </div>
      )}

      <div className="relative">
        <SlotGrid columns={columns} rolling={rolling} symbols={symbols} winRows={winRows} />
        {payout > 0 && (
          <div className="pointer-events-none absolute inset-x-0 top-1 flex justify-center">
            <span className="game-coin-pop rounded-full border border-game-gold/60 bg-black/85 px-3 py-1 text-sm font-black text-game-gold">
              +{formatCoins(payout)} 🪙
            </span>
          </div>
        )}
      </div>

      {result && (
        <p className="game-rise text-center text-[11px] font-bold text-white/70">
          {result.jackpot?.amount
            ? `${result.jackpot.label} kazandın!`
            : result.bonus
              ? `Bonus! ${result.bonus.count} sembol · ${formatCoins(result.bonus.amount)} coin`
              : result.payout > 0
                ? `${result.lines.length} hat kazandı · ${formatCoins(result.payout)} coin`
                : 'Bu spin boş geldi, tekrar dene.'}
        </p>
      )}

      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <BetControls value={bet} onChange={setBet} steps={steps} minBet={minBet} maxBet={betCap || config?.max_bet} coins={coins} />
        </div>
        <SpinButton spinning={spinning} disabled={spinning || !allowed.length || bet > coins} onClick={runSpin} />
      </div>

      <AutoSpinBar
        running={auto.running}
        remaining={auto.remaining}
        disabled={spinning || !allowed.length || bet > coins}
        onStart={(count) => setAuto({ running: true, remaining: Math.min(count, autoMax) })}
        onStop={stopAuto}
      />

      {jackpotFlash && <JackpotOverlay jackpot={jackpotFlash} />}
    </div>
  );
}