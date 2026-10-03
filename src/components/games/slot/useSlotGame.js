import { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { BET_STEP, LINES, MAX_BET, MIN_BET } from './slotConfig';

const sleep = (ms) => new Promise((resolve) => { window.setTimeout(resolve, ms); });

const SPIN_DURATION_MS = 10000;
const SETTLE_MS = 800;

export default function useSlotGame({ roomId } = {}) {
  const [status, setStatus] = useState('loading');
  const [coins, setCoins] = useState(0);
  const [unlimited, setUnlimited] = useState(false);
  const [noLimit, setNoLimit] = useState(false);
  const [grand, setGrand] = useState(0);
  const [bet, setBet] = useState(100);
  const [lines, setLines] = useState(LINES);
  const [spins, setSpins] = useState(0);
  const [jackpots, setJackpots] = useState({ mega: 0, grand: 0, minor: 0, major: 0, mini: 0 });
  const [bonusReady, setBonusReady] = useState(false);
  const [bonusAmount, setBonusAmount] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [grid, setGrid] = useState(null);
  const [win, setWin] = useState(0);
  const [bigWin, setBigWin] = useState(0);
  const [jackpotHit, setJackpotHit] = useState(false);
  const [auto, setAuto] = useState(false);
  const [message, setMessage] = useState('');
  const busyRef = useRef(false);
  const stopRef = useRef(null);
  const [stopping, setStopping] = useState(false);
  const [stopRequested, setStopRequested] = useState(false);
  const stop = useCallback(() => {
    if (!busyRef.current) return;
    setStopRequested(true);
    stopRef.current?.();
  }, []);
  useEffect(() => () => { stopRef.current?.(); }, []);

  const applyState = useCallback((data) => {
    if (!data) return;
    if (typeof data.coins === 'number') setCoins(data.coins);
    if (typeof data.unlimited === 'boolean') setUnlimited(data.unlimited);
    if (typeof data.no_limit === 'boolean') setNoLimit(data.no_limit);
    if (typeof data.grand === 'number') setGrand(data.grand);
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

  const spin = useCallback(async () => {
    if (busyRef.current || status !== 'ready') return;
    const cost = bet * lines;
    if (!noLimit && coins < cost) {
      setAuto(false);
      setMessage('Yetersiz coin. Coin yanındaki + ile bonus al.');
      return;
    }
    busyRef.current = true;
    setStopRequested(false);
    setStopping(false);
    setSpinning(true);
    setWin(0);
    setBigWin(0);
    setMessage('');
    const duration = new Promise((resolve) => {
      const timer = window.setTimeout(() => {
        setStopRequested(true);
        resolve();
      }, SPIN_DURATION_MS - SETTLE_MS);
      stopRef.current = () => { window.clearTimeout(timer); resolve(); };
    });
    try {
      const [response] = await Promise.all([
        base44.functions.invoke('slot-game', { action: 'spin', bet, room_id: roomId }),
        duration,
      ]);
      const data = response.data || {};
      setGrid(data.grid || null);
      setStopping(true);
      await sleep(SETTLE_MS);
      applyState(data);
      setWin(data.win || 0);
      setBigWin(data.big_win || 0);
      setJackpotHit((data.wins || []).some((item) => item.symbol === 'jackpot'));
    } catch (error) {
      const raw = error?.response?.data?.error;
      setAuto(false);
      setMessage(raw && !/rate limit/i.test(raw) ? raw : 'Çok hızlı oynuyorsun, birkaç saniye bekle.');
    } finally {
      stopRef.current?.();
      stopRef.current = null;
      setStopping(false);
      setStopRequested(false);
      setSpinning(false);
      busyRef.current = false;
    }
  }, [applyState, bet, coins, lines, noLimit, roomId, status]);

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
    const affordable = noLimit ? MAX_BET : Math.floor(coins / lines / BET_STEP) * BET_STEP;
    const next = Math.min(MAX_BET, Math.max(MIN_BET, affordable));
    if (next === bet) return;
    saveBet(next);
  }, [bet, coins, lines, noLimit, saveBet]);

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
    unlimited,
    noLimit,
    grand,
    bet,
    lines,
    spins,
    jackpots,
    bonusReady,
    bonusAmount,
    spinning,
    stopping,
    stopRequested,
    stop,
    grid,
    win,
    bigWin,
    jackpotHit,
    auto,
    message,
    spin,
    changeBet,
    maxBet,
    claimBonus,
    toggleAuto,
  };
}