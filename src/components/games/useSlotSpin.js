import { useCallback, useEffect, useRef, useState } from 'react';
import { allowedBets, emptyColumns, randomColumn } from '@/components/games/gameHelpers';
import { sounds } from '@/components/games/gameSounds';

const STOP_DELAYS = [300, 500, 700, 900, 1100];

/** Slot döndürme mantığı: bahis, makara animasyonu, kazanç ve otomatik oynatma. Tüm sonuçlar sunucudan gelir. */
export default function useSlotSpin(session, { game = 'slot', scatterId = 'bonus' } = {}) {
  const { profile, config, symbols, betCap, call, toast } = session;
  const steps = config?.bet_steps || [];
  const minBet = config?.min_bet || 100;
  const coins = profile?.coins || 0;
  const maxBet = betCap || config?.max_bet || 0;
  const allowed = allowedBets(steps, { minBet, maxBet, coins });

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
  const startAuto = useCallback((rounds) => {
    setAuto({ running: true, remaining: Math.max(1, Math.min(config?.auto_max || 100, Number(rounds) || 10)) });
  }, [config?.auto_max]);

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
      game,
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
  }, [allowed.length, bet, call, coins, game, stopAuto, toast]);

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

  const scatterCount = columns.reduce((total, column) => total + column.filter((id) => id === scatterId).length, 0);

  return {
    allowed,
    coins,
    minBet,
    maxBet,
    bet,
    setBet,
    columns,
    rolling,
    spinning,
    winRows,
    result,
    jackpotFlash,
    auto,
    startAuto,
    stopAuto,
    spinOnce: runSpin,
    scatterCount,
  };
}