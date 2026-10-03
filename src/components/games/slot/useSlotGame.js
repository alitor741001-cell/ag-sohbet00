import { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { BET_STEP, INITIAL_GRID, LINES, MAX_BET, MIN_BET, winCellsOf } from './slotSymbols';

const sleep = (ms) => new Promise((resolve) => { window.setTimeout(resolve, ms); });

export default function useSlotGame() {
  const [status, setStatus] = useState('loading');
  const [coins, setCoins] = useState(0);
  const [bet, setBet] = useState(100);
  const [lines, setLines] = useState(LINES);
  const [spins, setSpins] = useState(0);
  const [jackpots, setJackpots] = useState({ mega: 0, grand: 0, minor: 0, mini: 0 });
  const [bonusReady, setBonusReady] = useState(false);
  const [bonusAmount, setBonusAmount] = useState(0);
  const [displayGrid, setDisplayGrid] = useState(INITIAL_GRID);
  const [rollingReels, setRollingReels] = useState([]);
  const [tick, setTick] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [win, setWin] = useState(0);
  const [winCells, setWinCells] = useState([]);
  const [auto, setAuto] = useState(false);
  const [message, setMessage] = useState('');
  const busyRef = useRef(false);

  const applyState = useCallback((data) => {
    if (!data) return;
    if (typeof data.coins === 'number') setCoins(data.coins);
    if (typeof data.bet === 'number') setBet(data.bet);
    if (typeof data.lines === 'number') setLines(data.lines);
    if (typeof data.spins === 'number') setSpins(data.spins);
    if (data.jackpots) setJackpots(data.jackpots);
    if (typeof data.bonus_ready === 'boolean') setBonusReady(data.bonus_ready);
    if (typeof data.bonus_amount === 'number') setBonusAmount(data.bonus_amount);
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

  // Makaralar dönerken sembol akışı.
  useEffect(() => {
    if (!rollingReels.length) return undefined;
    const timer = window.setInterval(() => setTick((value) => value + 1), 90);
    return () => window.clearInterval(timer);
  }, [rollingReels.length]);

  // Jackpot sayaçları canlı artar.
  useEffect(() => {
    const timer = window.setInterval(() => {
      setJackpots((prev) => ({
        mega: prev.mega + 7,
        grand: prev.grand + 3,
        minor: prev.minor + 1,
        mini: prev.mini + 1,
      }));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const reveal = useCallback(async (finalGrid) => {
    for (let reel = 0; reel < finalGrid.length; reel += 1) {
      await sleep(110);
      setDisplayGrid((prev) => prev.map((column, index) => (index === reel ? finalGrid[reel] : column)));
      setRollingReels((prev) => prev.filter((index) => index !== reel));
    }
  }, []);

  const spin = useCallback(async () => {
    if (busyRef.current || status !== 'ready') return;
    const cost = bet * lines;
    if (coins < cost) {
      setAuto(false);
      setMessage('Yetersiz coin. Coin yanındaki + ile bonus al.');
      return;
    }
    busyRef.current = true;
    setSpinning(true);
    setWin(0);
    setWinCells([]);
    setMessage('');
    setRollingReels([0, 1, 2, 3, 4]);
    try {
      const response = await base44.functions.invoke('slot-game', { action: 'spin', bet });
      const data = response.data || {};
      applyState(data);
      await reveal(data.grid || displayGrid);
      setWin(data.win || 0);
      setWinCells(winCellsOf(data.wins));
    } catch (error) {
      setRollingReels([]);
      setMessage(error?.response?.data?.error || 'Tur başlatılamadı.');
    } finally {
      setSpinning(false);
      busyRef.current = false;
    }
  }, [applyState, bet, coins, displayGrid, lines, reveal, status]);

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
    const next = Math.min(MAX_BET, Math.max(MIN_BET, bet + direction * BET_STEP));
    if (next === bet) return;
    saveBet(next);
  }, [bet, saveBet]);

  const maxBet = useCallback(() => {
    if (busyRef.current) return;
    const affordable = Math.floor(coins / lines / BET_STEP) * BET_STEP;
    const next = Math.min(MAX_BET, Math.max(MIN_BET, affordable));
    if (next === bet) return;
    saveBet(next);
  }, [bet, coins, lines, saveBet]);

  const claimBonus = useCallback(async () => {
    if (!bonusReady) {
      setMessage('Bonus henüz hazır değil.');
      return;
    }
    try {
      const response = await base44.functions.invoke('slot-game', { action: 'bonus' });
      applyState(response.data);
      setMessage('Bonus hesabına eklendi.');
    } catch (error) {
      setMessage(error?.response?.data?.error || 'Bonus alınamadı.');
    }
  }, [applyState, bonusReady]);

  const toggleAuto = useCallback(() => setAuto((value) => !value), []);

  useEffect(() => {
    if (!auto || spinning || status !== 'ready') return undefined;
    const timer = window.setTimeout(() => { spin(); }, 850);
    return () => window.clearTimeout(timer);
  }, [auto, spin, spinning, status]);

  return {
    status,
    coins,
    bet,
    lines,
    spins,
    jackpots,
    bonusReady,
    bonusAmount,
    displayGrid,
    rollingReels,
    tick,
    spinning,
    win,
    winCells,
    auto,
    message,
    progress: spins % 20,
    spin,
    changeBet,
    maxBet,
    claimBonus,
    toggleAuto,
  };
}