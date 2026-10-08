import { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { SEKER_BET_LEVELS, SEKER_LINES } from './sekerConfig';

// Izgaranın dolma süresi ve şekerlerin yerine oturma payı.
const SPIN_MS = 4200;
const SETTLE_MS = 700;

/** Şeker oyununun durumu: bakiye, bahis, tur ve serbest turlar. */
export default function useSekerGame() {
  const [status, setStatus] = useState('loading');
  const [coins, setCoins] = useState(0);
  const [totalWon, setTotalWon] = useState(0);
  const [freeSpins, setFreeSpins] = useState(0);
  // "15 çevirme hakkı" kutusunun bedeli, kalan turu ve paket tur sayısı sunucudan gelir.
  const [sessionPrice, setSessionPrice] = useState(0);
  const [sessionSpins, setSessionSpins] = useState(0);
  const [sessionSize, setSessionSize] = useState(15);
  const [sessionResult, setSessionResult] = useState(null);
  const [bet, setBet] = useState(100);
  const [spins, setSpins] = useState(0);
  const [grid, setGrid] = useState(null);
  const [wins, setWins] = useState([]);
  const [win, setWin] = useState(0);
  const [bigWin, setBigWin] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [auto, setAuto] = useState(false);
  const [message, setMessage] = useState('');
  const busyRef = useRef(false);
  const stopRef = useRef(null);
  // Satın alınan 15 turda kazanan tutar: her turda artar, tur bitene kadar sıfırlanmaz.
  const sessionWinRef = useRef(0);

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

  const stop = useCallback(() => {
    if (!busyRef.current) return;
    stopRef.current?.();
  }, []);

  useEffect(() => () => { stopRef.current?.(); }, []);

  const applyState = useCallback((data) => {
    if (!data) return;
    if (typeof data.coins === 'number') setCoins(data.coins);
    if (typeof data.total_won === 'number') setTotalWon(data.total_won);
    if (typeof data.free_spins === 'number') setFreeSpins(data.free_spins);
    if (typeof data.bet === 'number') setBet(data.bet);
    if (typeof data.spins === 'number') setSpins(data.spins);
    if (typeof data.session_price === 'number') setSessionPrice(data.session_price);
    if (typeof data.session_spins === 'number') setSessionSpins(data.session_spins);
    if (typeof data.session_size === 'number') setSessionSize(data.session_size);
  }, []);

  useEffect(() => {
    let cancelled = false;
    base44.functions
      .invoke('seker-game', { action: 'state' })
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
    // Satın alınan çevirme hakkı ve bedava turlar tur ücreti almaz.
    const inSession = sessionSpins > 0;
    const cost = inSession || freeSpins > 0 ? 0 : bet * SEKER_LINES;
    if (coins < cost) {
      setAuto(false);
      setMessage('Yetersiz coin. Coin bakiyene dokunup coin yükle.');
      return;
    }
    busyRef.current = true;
    if (!inSession) sessionWinRef.current = 0;
    setStopping(false);
    setSpinning(true);
    // Çevirme hakkı sürerken biriken kazanç görünür kalır.
    setWin(inSession ? sessionWinRef.current : 0);
    setBigWin(0);
    setWins([]);
    setGrid(null);
    setMessage('');
    try {
      const [response] = await Promise.all([
        base44.functions.invoke('seker-game', { action: 'spin', bet }),
        wait(SPIN_MS - SETTLE_MS),
      ]);
      const data = response.data || {};
      setGrid(data.grid || null);
      setWins(data.wins || []);
      setStopping(true);
      // Şekerlerin yerine oturması; STOP'a basılırsa beklemeden sonuç gösterilir.
      await wait(SETTLE_MS);
      applyState(data);
      // Çevirme hakkı sürerken kazanç birikir; normal turda sıfırdan başlar.
      sessionWinRef.current += data.win || 0;
      setWin(sessionWinRef.current);
      setBigWin(inSession ? 0 : data.big_win || 0);
      // 15 tur bittiğinde biriken kazanç kabul ekranında gösterilir.
      if (inSession && (data.session_spins ?? 0) <= 0) setSessionResult(sessionWinRef.current);
    } catch (error) {
      const raw = error?.response?.data?.error;
      setAuto(false);
      setMessage(raw && !/rate limit/i.test(raw) ? raw : 'Çok hızlı oynuyorsun, birkaç saniye bekle.');
    } finally {
      stopRef.current = null;
      setStopping(false);
      setSpinning(false);
      busyRef.current = false;
    }
  }, [applyState, bet, coins, freeSpins, sessionSpins, status, wait]);

  const saveBet = useCallback(async (next) => {
    setBet(next);
    try {
      const response = await base44.functions.invoke('seker-game', { action: 'bet', bet: next });
      applyState(response.data);
    } catch (error) {
      // Bahis anlık olarak korunur.
    }
  }, [applyState]);

  const changeBet = useCallback((direction) => {
    if (busyRef.current) return;
    const index = SEKER_BET_LEVELS.indexOf(bet);
    const nextIndex = Math.min(SEKER_BET_LEVELS.length - 1, Math.max(0, (index < 0 ? 0 : index) + direction));
    const next = SEKER_BET_LEVELS[nextIndex];
    if (next === bet) return;
    saveBet(next);
  }, [bet, saveBet]);

  const maxBet = useCallback(() => {
    if (busyRef.current) return;
    const affordable = SEKER_BET_LEVELS.filter((value) => value * SEKER_LINES <= coins).pop() || SEKER_BET_LEVELS[0];
    if (affordable === bet) return;
    saveBet(affordable);
  }, [bet, coins, saveBet]);

  const toggleAuto = useCallback(() => setAuto((value) => !value), []);

  // Geri sayım yalnızca satın alınan çevirme hakkında akar; bedava turlar elle oynanır.
  useEffect(() => {
    if (spinning || status !== 'ready') return undefined;
    if (!auto && sessionSpins <= 0) return undefined;
    const timer = window.setTimeout(() => { spin(); }, 800);
    return () => window.clearTimeout(timer);
  }, [auto, sessionSpins, spin, spinning, status]);

  // "15 çevirme hakkı": bedel coinlerden düşülür, turlar kendiliğinden çevrilir.
  const buySession = useCallback(async () => {
    if (busyRef.current || status !== 'ready') return;
    if (coins < sessionPrice) {
      setMessage('Yetersiz coin. Coin bakiyene dokunup coin yükle.');
      return;
    }
    try {
      const response = await base44.functions.invoke('seker-game', { action: 'session', bet });
      applyState(response.data);
      setMessage('');
    } catch (error) {
      setMessage(error?.response?.data?.error || 'Çevirme hakkı alınamadı.');
    }
  }, [applyState, bet, coins, sessionPrice, status]);

  const clearSessionResult = useCallback(() => setSessionResult(null), []);

  return {
    status,
    coins,
    totalWon,
    freeSpins,
    bet,
    spins,
    spinning,
    stopping,
    grid,
    wins,
    win,
    bigWin,
    auto,
    message,
    spin,
    stop,
    changeBet,
    maxBet,
    toggleAuto,
    buySession,
    clearSessionResult,
    sessionPrice,
    sessionSpins,
    sessionSize,
    sessionResult,
  };
}