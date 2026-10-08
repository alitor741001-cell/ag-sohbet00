import { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { BET_LEVELS, LINES, MAX_BET, MIN_BET } from './slotConfig';

const SPIN_DURATION_MS = 5000;
const SETTLE_MS = 800;
// Bu tur sayısından sonra turların bir kısmı yavaş döner.
const SLOW_AFTER_SPINS = 4;
const SLOW_CHANCE = 0.3;

export default function useSlotGame({ roomId } = {}) {
  const [status, setStatus] = useState('loading');
  const [coins, setCoins] = useState(0);
  const [noLimit, setNoLimit] = useState(false);
  const [grand, setGrand] = useState(0);
  const [pools, setPools] = useState(null);
  const [freeSpins, setFreeSpins] = useState(0);
  const [bet, setBet] = useState(100);
  const [lines, setLines] = useState(LINES);
  const [spins, setSpins] = useState(0);
  const [jackpots, setJackpots] = useState({ mega: 0, grand: 0, minor: 0, major: 0, mini: 0 });
  const [spinning, setSpinning] = useState(false);
  const [grid, setGrid] = useState(null);
  const [win, setWin] = useState(0);
  const [bigWin, setBigWin] = useState(0);
  const [jackpotHit, setJackpotHit] = useState(false);
  const [wins, setWins] = useState([]);
  const [auto, setAuto] = useState(false);
  // Kazanılan bedava turlar sırayla kendiliğinden döner.
  const [autoFree, setAutoFree] = useState(false);
  const [message, setMessage] = useState('');
  const busyRef = useRef(false);
  const stopRef = useRef(null);
  const roundRef = useRef(0);
  const [slow, setSlow] = useState(false);
  const [stopping, setStopping] = useState(false);
  // Bekleme; STOP'a basıldığında (ya da süre dolduğunda) sona erer.
  const wait = useCallback((ms) => new Promise((resolve) => {
    let timer = null;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      if (timer) window.clearTimeout(timer);
      stopRef.current = null;
      resolve();
    };
    timer = window.setTimeout(finish, ms);
    stopRef.current = finish;
  }), []);
  // STOP: tur hangi aşamada olursa olsun bekleme hemen biter ve sonuç gösterilir.
  const stop = useCallback(() => {
    if (!busyRef.current) return;
    stopRef.current?.();
  }, []);
  useEffect(() => () => { stopRef.current?.(); }, []);

  const applyState = useCallback((data) => {
    if (!data) return;
    if (typeof data.coins === 'number') setCoins(data.coins);
    if (typeof data.no_limit === 'boolean') setNoLimit(data.no_limit);
    if (typeof data.grand === 'number') setGrand(data.grand);
    if (data.pools) setPools(data.pools);
    if (typeof data.free_spins === 'number') setFreeSpins(data.free_spins);
    if (typeof data.bet === 'number') setBet(data.bet);
    if (typeof data.lines === 'number') setLines(data.lines);
    if (typeof data.spins === 'number') setSpins(data.spins);
    if (data.jackpots) setJackpots(data.jackpots);
  }, []);

  useEffect(() => {
    let cancelled = false;
    base44.functions
      .invoke('slot-game', { action: 'state' })
      .then((response) => {
        if (cancelled) return;
        applyState(response.data);
        setStatus('ready');
      })
      .catch((error) => {
        if (cancelled) return;
        setStatus('error');
        setMessage(error?.response?.data?.error || 'Oyun yüklenemedi.');
      });
    return () => { cancelled = true; };
  }, [applyState]);

  const spin = useCallback(async () => {
    if (busyRef.current || status !== 'ready') return;
    // Ücretsiz çevirme hakkı varsa tur bedavadır.
    const cost = freeSpins > 0 ? 0 : bet * lines;
    if (!noLimit && coins < cost) {
      setAuto(false);
      setMessage('Yetersiz coin. Coin kutusuna dokunup coin yükle.');
      return;
    }
    busyRef.current = true;
    // Bahis tur başlarken bakiyeden düşülür: coin gerçek zamanlı azalır.
    if (cost > 0 && !noLimit) setCoins((value) => Math.max(0, value - cost));
    roundRef.current += 1;
    // Birkaç turdan sonra arada sırada makaralar yavaş döner.
    setSlow(roundRef.current > SLOW_AFTER_SPINS && Math.random() < SLOW_CHANCE);
    setStopping(false);
    setSpinning(true);
    setWin(0);
    setBigWin(0);
    // Yeni tur: önceki turun sembolleri ve kazanç çizgileri temizlenir.
    setWins([]);
    setGrid(null);
    setMessage('');
    try {
      const [response] = await Promise.all([
        base44.functions.invoke('slot-game', { action: 'spin', bet, room_id: roomId }),
        wait(SPIN_DURATION_MS - SETTLE_MS),
      ]);
      const data = response.data || {};
      setGrid(data.grid || null);
      setWins(data.wins || []);
      setStopping(true);
      // Makaraların yerine oturması; STOP'a basılırsa beklemeden sonuç gösterilir.
      await wait(SETTLE_MS);
      applyState(data);
      setWin(data.win || 0);
      setBigWin(data.big_win || 0);
      setJackpotHit(!!data.jackpot_hit);
      // Kalan bedava tur varsa sıra kendiliğinden devam eder.
      setAutoFree((data.free_spins ?? 0) > 0);
    } catch (error) {
      const raw = error?.response?.data?.error;
      setAuto(false);
      setAutoFree(false);
      // Tur oynanmadıysa bahis bakiyeye geri döner.
      if (cost > 0 && !noLimit) setCoins((value) => value + cost);
      setMessage(raw && !/rate limit/i.test(raw) ? raw : 'Çok hızlı oynuyorsun, birkaç saniye bekle.');
    } finally {
      stopRef.current = null;
      setStopping(false);
      setSpinning(false);
      busyRef.current = false;
    }
  }, [applyState, bet, coins, freeSpins, lines, noLimit, roomId, status, wait]);

  const saveBet = useCallback(async (next) => {
    setBet(next);
    try {
      const response = await base44.functions.invoke('slot-game', { action: 'bet', bet: next });
      applyState(response.data);
    } catch (error) {
      // Bahis anlık olarak korunur.
    }
  }, [applyState]);

  const changeBet = useCallback((direction) => {
    if (busyRef.current) return;
    const index = BET_LEVELS.indexOf(bet);
    const nextIndex = Math.min(BET_LEVELS.length - 1, Math.max(0, (index < 0 ? 0 : index) + direction));
    const next = BET_LEVELS[nextIndex];
    if (next === bet) return;
    saveBet(next);
  }, [bet, saveBet]);

  const maxBet = useCallback(() => {
    if (busyRef.current) return;
    const affordable = noLimit ? MAX_BET : BET_LEVELS.filter((value) => value * lines <= coins).pop() || MIN_BET;
    if (affordable === bet) return;
    saveBet(affordable);
  }, [bet, coins, lines, noLimit, saveBet]);

  const toggleAuto = useCallback(() => setAuto((value) => !value), []);

  useEffect(() => {
    if (!auto || spinning || status !== 'ready') return undefined;
    const timer = window.setTimeout(() => { spin(); }, 850);
    return () => window.clearTimeout(timer);
  }, [auto, spin, spinning, status]);

  // Bedava turlar kendiliğinden döner ve bakiyeden coin harcamaz (tur bedeli 0).
  useEffect(() => {
    if (auto || !autoFree || spinning || status !== 'ready') return undefined;
    const timer = window.setTimeout(() => { spin(); }, 900);
    return () => window.clearTimeout(timer);
  }, [auto, autoFree, spin, spinning, status]);

  return {
    status,
    coins,
    noLimit,
    grand,
    pools,
    freeSpins,
    bet,
    lines,
    spins,
    jackpots,
    spinning,
    stopping,
    stop,
    grid,
    wins,
    slow,
    win,
    bigWin,
    jackpotHit,
    auto,
    message,
    spin,
    changeBet,
    maxBet,
    toggleAuto,
  };
}