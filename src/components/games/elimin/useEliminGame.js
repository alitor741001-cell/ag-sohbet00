import { useCallback, useEffect, useRef, useState } from 'react';
import gameRequest from '@/lib/gameRequest';
import { landMs } from '@/components/games/reels/reelRoll';
import { eliminSound, unlockAudio } from './eliminSound';
import { BET_LEVELS, LINES } from './eliminConfig';

// Sonucun üzerine iniş: 6 sütunlu kare ızgara, ortak makara altyapısı.
const LAND_MS = landMs(6);

/** ELİMİNSLOT durumu: bakiye, bahis, tur kazancı, bedava turlar ve jackpot. */
export default function useEliminGame() {
  const [status, setStatus] = useState('loading');
  const [coins, setCoins] = useState(0);
  const [bet, setBet] = useState(100);
  const [totalWon, setTotalWon] = useState(0);
  const [freeSpins, setFreeSpins] = useState(0);
  const [chests, setChests] = useState(0);
  const [jackpot, setJackpot] = useState(0);
  // Zar dörtlüsünden gelen jackpot kazancı: ayrı kutlama ekranı açar.
  const [jackpotWin, setJackpotWin] = useState(0);
  const [spins, setSpins] = useState(0);
  const [grid, setGrid] = useState(null);
  const [wins, setWins] = useState([]);
  const [win, setWin] = useState(0);
  const [bigWin, setBigWin] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [stopping, setStopping] = useState(false);
  // Sonuç gelince makaraların ineceği ızgara ve tur anahtarı.
  const [landing, setLanding] = useState(null);
  const [spinKey, setSpinKey] = useState(0);
  const [auto, setAuto] = useState(false);
  const [sound, setSound] = useState(true);
  const [message, setMessage] = useState('');
  const busyRef = useRef(false);
  const stopRef = useRef(null);
  const soundRef = useRef(true);
  // Tur isteği sürerken DUR'a basılırsa iniş animasyonu atlanır.
  const skipLandingRef = useRef(false);

  useEffect(() => { soundRef.current = sound; }, [sound]);

  const play = useCallback((name) => {
    if (!soundRef.current) return;
    eliminSound[name]?.();
  }, []);

  // Bekleme; DUR'a basıldığında sona erer.
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
    // İniş sürerken bekleme kesilir; istek sürerken basıldıysa iniş atlanır.
    if (stopRef.current) stopRef.current();
    else skipLandingRef.current = true;
  }, []);

  useEffect(() => () => { stopRef.current?.(); }, []);

  const applyState = useCallback((data) => {
    if (!data) return;
    if (typeof data.coins === 'number') setCoins(data.coins);
    if (typeof data.total_won === 'number') setTotalWon(data.total_won);
    if (typeof data.free_spins === 'number') setFreeSpins(data.free_spins);
    if (typeof data.chests === 'number') setChests(data.chests);
    if (typeof data.jackpot === 'number') setJackpot(data.jackpot);
    if (typeof data.bet === 'number') setBet(data.bet);
    if (typeof data.spins === 'number') setSpins(data.spins);
  }, []);

  useEffect(() => {
    let cancelled = false;
    base44State().then((data) => {
      if (cancelled) return;
      applyState(data);
      setStatus('ready');
    }).catch((error) => {
      if (cancelled) return;
      setStatus('error');
      setMessage(error?.response?.data?.error || 'Oyun yüklenemedi.');
    });
    return () => { cancelled = true; };
  }, [applyState]);

  const spin = useCallback(async () => {
    if (busyRef.current || status !== 'ready') return;
    unlockAudio();
    // Bedava tur hakkı varsa tur ücret almaz.
    const isFree = freeSpins > 0;
    const cost = isFree ? 0 : bet * LINES;
    if (coins < cost) {
      setAuto(false);
      setMessage('Yetersiz coin. Coin bakiyene dokunup coin yükle.');
      return;
    }
    busyRef.current = true;
    // Bahis tur başlarken bakiyeden düşülür: coin gerçek zamanlı azalır.
    if (cost > 0) setCoins((value) => Math.max(0, value - cost));
    setStopping(false);
    setLanding(null);
    setSpinKey((key) => key + 1);
    skipLandingRef.current = false;
    setSpinning(true);
    setWin(0);
    setBigWin(0);
    setJackpotWin(0);
    setWins([]);
    setGrid(null);
    setMessage('');
    play('spin');
    try {
      const response = await gameRequest('elimin-game', { action: 'spin', bet });
      const data = response.data || {};
      // Sonuç geldi: makaralar gerçek sembollerin üzerine iner, sonra ızgara sabitlenir.
      if (data.grid) {
        setLanding(data.grid);
        if (!skipLandingRef.current) await wait(LAND_MS);
      }
      skipLandingRef.current = false;
      setLanding(null);
      setStopping(true);
      play('landing');
      setGrid(data.grid || null);
      setWins(data.wins || []);
      applyState(data);
      setWin(data.win || 0);
      setBigWin(data.big_win || 0);
      setJackpotWin(data.jackpot_win || 0);
      if (data.big_win > 0 || data.jackpot_trigger) play('bigWin');
      else if (data.win > 0) play('win');
      // Tavuk üçlüsü ve altın muz bonusu kutlama sesiyle duyurulur.
      if (data.free_trigger || data.chicken_trigger) play('bonus');
    } catch (error) {
      const raw = error?.response?.data?.error;
      setAuto(false);
      // Tur oynanmadıysa bahis bakiyeye geri döner.
      if (cost > 0) setCoins((value) => value + cost);
      setMessage(raw && error?.response?.status !== 429 && !/rate|limit|sınır|yoğun/i.test(raw) ? raw : 'Çok hızlı oynuyorsun, birkaç saniye bekle.');
    } finally {
      stopRef.current = null;
      setStopping(false);
      setSpinning(false);
      busyRef.current = false;
    }
  }, [applyState, bet, coins, freeSpins, play, status, wait]);

  const saveBet = useCallback(async (next) => {
    setBet(next);
    try {
      const response = await gameRequest('elimin-game', { action: 'bet', bet: next });
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

  const toggleAuto = useCallback(() => setAuto((value) => !value), []);
  const toggleSound = useCallback(() => setSound((value) => !value), []);

  // Otomatik tur: kazanç ekranı kapandıktan sonra kendiliğinden devam eder.
  useEffect(() => {
    if (!auto || spinning || status !== 'ready') return undefined;
    const timer = window.setTimeout(() => { spin(); }, 800);
    return () => window.clearTimeout(timer);
  }, [auto, spin, spinning, status]);

  return {
    status,
    coins,
    bet,
    totalWon,
    freeSpins,
    jackpot,
    jackpotWin,
    chests,
    spins,
    spinning,
    stopping,
    landing,
    spinKey,
    grid,
    wins,
    win,
    bigWin,
    auto,
    sound,
    message,
    spin,
    stop,
    changeBet,
    toggleAuto,
    toggleSound,
  };
}

// İlk durum isteği: yoğunlukta sessizce tekrar denenir.
async function base44State() {
  const response = await gameRequest('elimin-game', { action: 'state' });
  return response.data || {};
}