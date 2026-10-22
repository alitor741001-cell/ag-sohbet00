import { useCallback, useEffect, useRef, useState } from 'react';
import gameRequest from '@/lib/gameRequest';
import { landWait } from '@/components/games/reels/reelMotion';
import { SEKER_BET_LEVELS, SEKER_LINES } from './sekerConfig';
import { END_MS, playCascadeSteps } from '@/components/games/reels/cascadeSteps';
import useBetQueue from '@/hooks/useBetQueue';
import useWalletCoinsLive from '@/hooks/useWalletCoinsLive';
import { useCurrentUser } from '@/lib/useCurrentUser';


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
  // Patlama anı: kazanan şekerler bu sırada söner.
  const [explode, setExplode] = useState(false);
  // Sonuç gelince sütunların ineceği ızgara ve tur anahtarı.
  const [landing, setLanding] = useState(null);
  const [spinKey, setSpinKey] = useState(0);
  const [auto, setAuto] = useState(false);
  const [message, setMessage] = useState('');
  const busyRef = useRef(false);
  const stopRef = useRef(null);
  // Satın alınan 15 turda kazanan tutar: her turda artar, tur bitene kadar sıfırlanmaz.
  const sessionWinRef = useRef(0);
  // Tur isteği sürerken STOP'a basılırsa iniş animasyonu atlanır.
  const skipLandingRef = useRef(false);
  // Canlı abonelik geldikçe bakiye anında tazelenir.
  const { user } = useCurrentUser();
  useWalletCoinsLive(user?.id, (value) => setCoins(value));

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
    if (typeof data.bet === 'number') setBet(data.bet);
    if (typeof data.spins === 'number') setSpins(data.spins);
    if (typeof data.session_price === 'number') setSessionPrice(data.session_price);
    if (typeof data.session_spins === 'number') setSessionSpins(data.session_spins);
    if (typeof data.session_size === 'number') setSessionSize(data.session_size);
  }, []);

  useEffect(() => {
    let cancelled = false;
    gameRequest('seker-game', { action: 'state' })
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
    // Bahis tur başlarken bakiyeden düşülür: coin gerçek zamanlı azalır.
    if (cost > 0) setCoins((value) => Math.max(0, value - cost));
    if (!inSession) sessionWinRef.current = 0;
    setStopping(false);
    setLanding(null);
    setSpinKey((key) => key + 1);
    const startedAt = Date.now();
    skipLandingRef.current = false;
    setSpinning(true);
    // Çevirme hakkı sürerken biriken kazanç görünür kalır.
    setWin(inSession ? sessionWinRef.current : 0);
    setBigWin(0);
    setWins([]);
    setGrid(null);
    setExplode(false);
    setMessage('');
    try {
      const response = await gameRequest('seker-game', { action: 'spin', bet });
      const data = response.data || {};
      const steps = data.steps || [];
      // Sonuç geldi: sütunlar ilk tahtanın üzerine iner, sonra zincir oynar.
      const landed = steps[0]?.grid || data.grid || null;
      if (landed) {
        setLanding(landed);
        // Makaralar soldan sağa sırayla durur: 6 sütun x 6 satır.
        if (!skipLandingRef.current) await wait(landWait(6, 6, startedAt));
      }
      skipLandingRef.current = false;
      setLanding(null);
      setStopping(true);
      // Tahta hemen görünür: sütunlar durduğu an ekranda duran dizilim budur.
      setGrid(landed);
      // Adımlar sırayla oynar: küme parlar, patlar, yerine yenisi düşer.
      await playCascadeSteps(steps, {
        wait,
        setGrid,
        setWins,
        setExplode,
        addWin: (shown) => setWin(sessionWinRef.current + shown),
      });
      // Patlayan şekerler gitti: turun sonunda duran tahta gösterilir.
      if (data.grid) setGrid(data.grid);
      setWins([]);
      await wait(END_MS);
      applyState(data);
      // 4 altın şeker: 10 bedava tur kazanıldığında otomatik çevirme başlar.
      if (data.free_trigger && (data.free_spins ?? 0) > 0) setAuto(true);
      // Çevirme hakkı sürerken kazanç birikir; normal turda sıfırdan başlar.
      sessionWinRef.current += data.win || 0;
      setWin(sessionWinRef.current);
      setBigWin(inSession ? 0 : data.big_win || 0);
      // 15 tur bittiğinde biriken kazanç kabul ekranında gösterilir.
      if (inSession && (data.session_spins ?? 0) <= 0) setSessionResult(sessionWinRef.current);
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
  }, [applyState, bet, coins, freeSpins, sessionSpins, status, wait]);

  const enqueueBet = useBetQueue();

  const saveBet = useCallback((next) => {
    setBet(next);
    // İstekler sıraya girer: hızlı basışta geç dönen eski yanıt yeni bahsi geri düşürmez.
    enqueueBet(() => gameRequest('seker-game', { action: 'bet', bet: next }), applyState);
  }, [applyState, enqueueBet]);

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
    if (!auto && sessionSpins <= 0 && freeSpins <= 0) return undefined;
    // Bedava turlar tükenince otomatik döndürme kendiliğinden durur.
    if (freeSpins <= 0 && !auto && sessionSpins <= 0) return undefined;
    const timer = window.setTimeout(() => { spin(); }, 800);
    return () => window.clearTimeout(timer);
  }, [auto, sessionSpins, freeSpins, spin, spinning, status]);

  // "15 çevirme hakkı": bedel coinlerden düşülür, turlar kendiliğinden çevrilir.
  const buySession = useCallback(async () => {
    if (busyRef.current || status !== 'ready') return;
    if (coins < sessionPrice) {
      setMessage('Yetersiz coin. Coin bakiyene dokunup coin yükle.');
      return;
    }
    busyRef.current = true;
    try {
      const response = await gameRequest('seker-game', { action: 'session', bet });
      applyState(response.data);
      setMessage('');
    } catch (error) {
      const raw = error?.response?.data?.error;
      setMessage(raw && error?.response?.status !== 429 && !/rate|limit|sınır|yoğun/i.test(raw) ? raw : 'Çok hızlı işlem yapıyorsun, birkaç saniye bekle.');
    } finally {
      busyRef.current = false;
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
    explode,
    landing,
    spinKey,
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