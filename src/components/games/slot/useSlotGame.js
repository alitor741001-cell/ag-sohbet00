import { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { BET_STEP, LINES, MAX_BET, MIN_BET } from './slotConfig';

const sleep = (ms) => new Promise((resolve) => { window.setTimeout(resolve, ms); });

// Tur animasyonunun görünür kalması için en kısa dönüş süresi.
const SPIN_MIN_MS = 800;

export default function useSlotGame({ roomId } = {}) {
  const [status, setStatus] = useState('loading');
  const [coins, setCoins] = useState(0);
  const [unlimited, setUnlimited] = useState(false);
  const [bet, setBet] = useState(100);
  const [lines, setLines] = useState(LINES);
  const [spins, setSpins] = useState(0);
  const [jackpots, setJackpots] = useState({ mega: 0, grand: 0, minor: 0, major: 0, mini: 0 });
  const [bonusReady, setBonusReady] = useState(false);
  const [bonusAmount, setBonusAmount] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [win, setWin] = useState(0);
  const [bigWin, setBigWin] = useState(0);
  const [auto, setAuto] = useState(false);
  const [message, setMessage] = useState('');
  const busyRef = useRef(false);

  const applyState = useCallback((data) => {
    if (!data) return;
    if (typeof data.coins === 'number') setCoins(data.coins);
    if (typeof data.unlimited === 'boolean') setUnlimited(data.unlimited);
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

  // Jackpot sayaçları canlı artar.
  useEffect(() => {
    const timer = window.setInterval(() => {
      setJackpots((prev) => ({
        mega: prev.mega + 7,
        grand: prev.grand + 3,
        minor: prev.minor + 1,
        major: prev.major + 2,
        mini: prev.mini + 1,
      }));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const spin = useCallback(async () => {
    if (busyRef.current || status !== 'ready') return;
    const cost = bet * lines;
    if (!unlimited && coins < cost) {
      setAuto(false);
      setMessage('Yetersiz coin. Coin yanındaki + ile bonus al.');
      return;
    }
    busyRef.current = true;
    setSpinning(true);
    setWin(0);
    setBigWin(0);
    setMessage('');
    try {
      const [response] = await Promise.all([
        base44.functions.invoke('slot-game', { action: 'spin', bet, room_id: roomId }),
        sleep(SPIN_MIN_MS),
      ]);
      const data = response.data || {};
      applyState(data);
      setWin(data.win || 0);
      setBigWin(data.big_win || 0);
    } catch (error) {
      const raw = error?.response?.data?.error;
      setAuto(false);
      setMessage(raw && !/rate limit/i.test(raw) ? raw : 'Çok hızlı oynuyorsun, birkaç saniye bekle.');
    } finally {
      setSpinning(false);
      busyRef.current = false;
    }
  }, [applyState, bet, coins, lines, roomId, status, unlimited]);

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
    const affordable = unlimited ? MAX_BET : Math.floor(coins / lines / BET_STEP) * BET_STEP;
    const next = Math.min(MAX_BET, Math.max(MIN_BET, affordable));
    if (next === bet) return;
    saveBet(next);
  }, [bet, coins, lines, saveBet, unlimited]);

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
    bet,
    lines,
    spins,
    jackpots,
    bonusReady,
    bonusAmount,
    spinning,
    win,
    bigWin,
    auto,
    message,
    spin,
    changeBet,
    maxBet,
    claimBonus,
    toggleAuto,
  };
}