import { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { DEDE_BET_LEVELS, DEDE_LINES } from './dedeConfig';

// Makaraların akışı, karoların yerine oturması ve kazanç adımlarının süreleri.
const ROLL_MS = 1400;
const DROP_MS = 380;
const HOLD_MS = 950;
const EXPLODE_MS = 320;
const END_MS = 650;

/** DEDE oyununun durumu: bakiye, bahis, tumbler adımları ve çarpan küreleri. */
export default function useDedeGame() {
  const [status, setStatus] = useState('loading');
  const [coins, setCoins] = useState(0);
  const [totalWon, setTotalWon] = useState(0);
  const [freeSpins, setFreeSpins] = useState(0);
  // "15 çevirme hakkı" kutusunun bedeli ve tur sayısı sunucudan gelir.
  const [sessionPrice, setSessionPrice] = useState(0);
  const [sessionSpins, setSessionSpins] = useState(15);
  const [bet, setBet] = useState(100);
  const [spins, setSpins] = useState(0);
  const [grid, setGrid] = useState(null);
  const [wins, setWins] = useState([]);
  const [orbs, setOrbs] = useState([]);
  const [multiplier, setMultiplier] = useState(0);
  const [explode, setExplode] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [win, setWin] = useState(0);
  const [bigWin, setBigWin] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [auto, setAuto] = useState(false);
  const [message, setMessage] = useState('');
  const busyRef = useRef(false);
  const stopRef = useRef(null);

  // Bekleme; DURDUR'a basıldığında (ya da süre dolduğunda) sona erer.
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
  }, []);

  useEffect(() => {
    let cancelled = false;
    base44.functions
      .invoke('dede-game', { action: 'state' })
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
    // Satın alınan çevirme hakkı varsa tur tekrar ücret almaz.
    const cost = freeSpins > 0 ? 0 : bet * DEDE_LINES;
    if (coins < cost) {
      setAuto(false);
      setMessage('Yetersiz coin. Coin bakiyene dokunup coin yükle.');
      return;
    }
    busyRef.current = true;
    setRolling(true);
    setSpinning(true);
    setWin(0);
    setBigWin(0);
    setWins([]);
    setOrbs([]);
    setMultiplier(0);
    setMessage('');
    try {
      const [response] = await Promise.all([
        base44.functions.invoke('dede-game', { action: 'spin', bet }),
        wait(ROLL_MS),
      ]);
      const data = response.data || {};
      const steps = data.steps || [];
      setRolling(false);
      let shown = 0;
      // Adımlar sırayla oynar: karo parlar, patlar, yerine yenisi düşer.
      for (let index = 0; index < steps.length; index += 1) {
        const step = steps[index];
        setGrid(step.grid);
        setWins([]);
        setOrbs([]);
        setMultiplier(0);
        await wait(DROP_MS);
        setWins(step.wins || []);
        setOrbs(step.orbs || []);
        setMultiplier(step.multiplier || 0);
        shown += step.amount || 0;
        setWin(shown);
        await wait(HOLD_MS);
        setExplode(true);
        await wait(EXPLODE_MS);
        setExplode(false);
      }
      if (data.grid) setGrid(data.grid);
      setWins([]);
      setOrbs([]);
      // Biriken çarpan tur bitince de görünür kalır: oyuncu son değeri görür.
      await wait(END_MS);
      applyState(data);
      setWin(data.win || 0);
      setBigWin(data.big_win || 0);
    } catch (error) {
      const raw = error?.response?.data?.error;
      setAuto(false);
      setMessage(raw && !/rate limit/i.test(raw) ? raw : 'Çok hızlı oynuyorsun, birkaç saniye bekle.');
    } finally {
      stopRef.current = null;
      setRolling(false);
      setSpinning(false);
      busyRef.current = false;
    }
  }, [applyState, bet, coins, freeSpins, status, wait]);

  const saveBet = useCallback(async (next) => {
    setBet(next);
    try {
      const response = await base44.functions.invoke('dede-game', { action: 'bet', bet: next });
      applyState(response.data);
    } catch (error) {
      // Bahis anlık olarak korunur.
    }
  }, [applyState]);

  const changeBet = useCallback((direction) => {
    if (busyRef.current) return;
    const index = DEDE_BET_LEVELS.indexOf(bet);
    const nextIndex = Math.min(DEDE_BET_LEVELS.length - 1, Math.max(0, (index < 0 ? 0 : index) + direction));
    const next = DEDE_BET_LEVELS[nextIndex];
    if (next === bet) return;
    saveBet(next);
  }, [bet, saveBet]);

  const maxBet = useCallback(() => {
    if (busyRef.current) return;
    const affordable = DEDE_BET_LEVELS.filter((value) => value * DEDE_LINES <= coins).pop() || DEDE_BET_LEVELS[0];
    if (affordable === bet) return;
    saveBet(affordable);
  }, [bet, coins, saveBet]);

  const toggleAuto = useCallback(() => setAuto((value) => !value), []);

  // Otomatik oyun ve satın alınan çevirme hakkı akışı; hak bitince kendiliğinden durur.
  useEffect(() => {
    if (spinning || status !== 'ready') return undefined;
    if (!auto && freeSpins <= 0) return undefined;
    const timer = window.setTimeout(() => { spin(); }, 800);
    return () => window.clearTimeout(timer);
  }, [auto, freeSpins, spin, spinning, status]);

  // "15 çevirme hakkı": bedel coinlerden düşülür, turlar kendiliğinden çevrilir.
  const buySession = useCallback(async () => {
    if (busyRef.current || status !== 'ready') return;
    if (coins < sessionPrice) {
      setMessage('Yetersiz coin. Coin bakiyene dokunup coin yükle.');
      return;
    }
    try {
      const response = await base44.functions.invoke('dede-game', { action: 'session', bet });
      applyState(response.data);
      setMessage('');
    } catch (error) {
      setMessage(error?.response?.data?.error || 'Çevirme hakkı alınamadı.');
    }
  }, [applyState, bet, coins, sessionPrice, status]);

  return {
    status,
    coins,
    totalWon,
    freeSpins,
    bet,
    spins,
    spinning,
    rolling,
    explode,
    grid,
    wins,
    orbs,
    multiplier,
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
    sessionPrice,
    sessionSpins,
  };
}