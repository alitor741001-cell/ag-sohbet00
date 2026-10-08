import { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { CHIP_LEVELS, REVEAL_MS } from './rouletteConfig';

// Sayaç bu aralıkla iner: çark dönerken kalan saniye görünür.
const COUNTDOWN_STEP_MS = 250;

/** ROULETTE durumu: bakiye, jeton kademesi, masadaki bahisler ve tur sonucu. */
export default function useRouletteGame() {
  const [status, setStatus] = useState('loading');
  const [coins, setCoins] = useState(0);
  const [totalWon, setTotalWon] = useState(0);
  const [spins, setSpins] = useState(0);
  const [chip, setChip] = useState(CHIP_LEVELS[0]);
  // Masadaki bahisler: blok kimliği -> o bloğa konan toplam coin.
  const [bets, setBets] = useState({});
  const [lastBets, setLastBets] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [result, setResult] = useState(null);
  const [payout, setPayout] = useState(0);
  const [wins, setWins] = useState([]);
  const [message, setMessage] = useState('');
  const busyRef = useRef(false);

  const applyState = useCallback((data) => {
    if (!data) return;
    if (typeof data.coins === 'number') setCoins(data.coins);
    if (typeof data.total_won === 'number') setTotalWon(data.total_won);
    if (typeof data.spins === 'number') setSpins(data.spins);
  }, []);

  useEffect(() => {
    let cancelled = false;
    base44.functions
      .invoke('roulette-game', { action: 'state' })
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

  const stake = Object.values(bets).reduce((sum, amount) => sum + amount, 0);

  // Jeton masaya konur: blok dokunuşu seçili kademe kadar artırır.
  const placeBet = useCallback((blockId) => {
    if (busyRef.current) return;
    if (stake + chip > coins) {
      setMessage('Yetersiz coin. Coin bakiyene dokunup coin yükle.');
      return;
    }
    setMessage('');
    setBets({ ...bets, [blockId]: (bets[blockId] || 0) + chip });
  }, [bets, chip, coins, stake]);

  const clearBets = useCallback(() => {
    if (busyRef.current) return;
    setBets({});
    setMessage('');
  }, []);

  // REPEAT: bir önceki turun bahis düzeni yeniden masaya konur.
  const repeat = useCallback(() => {
    if (busyRef.current || !lastBets) return;
    const total = Object.values(lastBets).reduce((sum, amount) => sum + amount, 0);
    if (total > coins) {
      setMessage('Yetersiz coin. Coin bakiyene dokunup coin yükle.');
      return;
    }
    setBets({ ...lastBets });
    setMessage('');
  }, [coins, lastBets]);

  const spin = useCallback(async () => {
    if (busyRef.current || status !== 'ready') return;
    const placed = Object.entries(bets).map(([id, amount]) => ({ id, amount }));
    const total = placed.reduce((sum, bet) => sum + bet.amount, 0);
    if (!total) {
      setMessage('Önce masaya bahis koy.');
      return;
    }
    if (total > coins) {
      setMessage('Yetersiz coin. Coin bakiyene dokunup coin yükle.');
      return;
    }

    busyRef.current = true;
    setSpinning(true);
    setResult(null);
    setPayout(0);
    setWins([]);
    setMessage('');
    setCountdown(Math.ceil(REVEAL_MS / 1000));

    const startedAt = Date.now();
    const ticker = window.setInterval(() => {
      const left = Math.max(0, REVEAL_MS - (Date.now() - startedAt));
      setCountdown(Math.ceil(left / 1000));
    }, COUNTDOWN_STEP_MS);

    try {
      const [response] = await Promise.all([
        base44.functions.invoke('roulette-game', { action: 'spin', bets: placed }),
        new Promise((resolve) => window.setTimeout(resolve, REVEAL_MS)),
      ]);
      const data = response.data || {};
      applyState(data);
      setResult({ number: data.number, index: data.index });
      setPayout(data.payout || 0);
      setWins(data.wins || []);
      setLastBets(bets);
      setBets({});
    } catch (error) {
      const raw = error?.response?.data?.error;
      setMessage(raw && !/rate limit/i.test(raw) ? raw : 'Çok hızlı oynuyorsun, birkaç saniye bekle.');
    } finally {
      window.clearInterval(ticker);
      setCountdown(0);
      setSpinning(false);
      busyRef.current = false;
    }
  }, [applyState, bets, coins, status]);

  return {
    status,
    coins,
    totalWon,
    spins,
    chip,
    setChip,
    bets,
    stake,
    lastBets,
    spinning,
    countdown,
    result,
    payout,
    wins,
    message,
    placeBet,
    clearBets,
    repeat,
    spin,
  };
}