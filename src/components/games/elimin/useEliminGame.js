import { useCallback, useEffect, useRef, useState } from 'react';
import gameRequest from '@/lib/gameRequest';
import { landWait } from '@/components/games/reels/reelMotion';
import { eliminSound, unlockAudio } from './eliminSound';
import { BET_LEVELS, CHEST_MAX, LINES, REELS, ROWS } from './eliminConfig';
import { END_MS, playCascadeSteps } from '@/components/games/reels/cascadeSteps';
import useBetQueue from '@/hooks/useBetQueue';
import useWalletCoinsLive from '@/hooks/useWalletCoinsLive';
import { useCurrentUser } from '@/lib/useCurrentUser';


/** ELİMİNSLOT durumu: bakiye, bahis, tur kazancı, çevirme hakkı ve jackpot. */
export default function useEliminGame() {
  const [status, setStatus] = useState('loading');
  const [coins, setCoins] = useState(0);
  const [bet, setBet] = useState(100);
  const [totalWon, setTotalWon] = useState(0);
  const [chests, setChests] = useState(0);
  // Sandık barı dolduğunda ödenecek birikim: jackpot havuzundan ayrıdır.
  const [chestValue, setChestValue] = useState(0);
  // Tavuk üçlüsünden gelen bedava turlar.
  const [freeSpins, setFreeSpins] = useState(0);
  const [jackpot, setJackpot] = useState(0);
  // Zar dörtlüsünden gelen jackpot kazancı: ayrı kutlama ekranı açar.
  const [jackpotWin, setJackpotWin] = useState(0);
  // Satın alınan "15 çevirme hakkı" turu ve tur bittiğinde gösterilen toplam.
  const [sessionSpins, setSessionSpins] = useState(0);
  const [sessionPrice, setSessionPrice] = useState(0);
  const [sessionSize, setSessionSize] = useState(15);
  const [sessionResult, setSessionResult] = useState(null);
  const [spins, setSpins] = useState(0);
  const [grid, setGrid] = useState(null);
  const [wins, setWins] = useState([]);
  const [win, setWin] = useState(0);
  const [bigWin, setBigWin] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [stopping, setStopping] = useState(false);
  // Patlama anı: kazanan kartlar bu sırada söner.
  const [explode, setExplode] = useState(false);
  // Sonuç gelince makaraların ineceği ızgara ve tur anahtarı.
  const [landing, setLanding] = useState(null);
  const [spinKey, setSpinKey] = useState(0);
  const [auto, setAuto] = useState(false);
  const [sound, setSound] = useState(true);
  const [message, setMessage] = useState('');
  const busyRef = useRef(false);
  // Çevirme hakkı turunda biriken kazanç: tur bitince topluca gösterilir.
  const sessionWinRef = useRef(0);
  const stopRef = useRef(null);
  const soundRef = useRef(true);
  // Tur isteği sürerken DUR'a basılırsa iniş animasyonu atlanır.
  const skipLandingRef = useRef(false);
  // Canlı abonelik geldikçe bakiye anında tazelenir.
  const { user } = useCurrentUser();
  useWalletCoinsLive(user?.id, (value) => setCoins(value));

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
    if (typeof data.chests === 'number') setChests(data.chests);
    if (typeof data.chest_value === 'number') setChestValue(data.chest_value);
    if (typeof data.free_spins === 'number') setFreeSpins(data.free_spins);
    if (typeof data.jackpot === 'number') setJackpot(data.jackpot);
    if (typeof data.session_spins === 'number') setSessionSpins(data.session_spins);
    if (typeof data.session_price === 'number') setSessionPrice(data.session_price);
    if (typeof data.session_size === 'number') setSessionSize(data.session_size);
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
    // Bedava turlar ve çevirme hakkı turları ücret almaz.
    const inSession = sessionSpins > 0;
    const isFree = freeSpins > 0 || inSession;
    const cost = isFree ? 0 : bet * LINES;
    if (coins < cost) {
      setAuto(false);
      setMessage('Yetersiz coin. Coin bakiyene dokunup coin yükle.');
      return;
    }
    // Çevirme hakkı turu dışındaki turlarda biriken kazanç sıfırlanır.
    if (!inSession) sessionWinRef.current = 0;
    busyRef.current = true;
    // Bahis tur başlarken bakiyeden düşülür: coin gerçek zamanlı azalır.
    if (cost > 0) setCoins((value) => Math.max(0, value - cost));
    setStopping(false);
    setLanding(null);
    setSpinKey((key) => key + 1);
    const startedAt = Date.now();
    skipLandingRef.current = false;
    setSpinning(true);
    setWin(0);
    setBigWin(0);
    setJackpotWin(0);
    setWins([]);
    setGrid(null);
    setExplode(false);
    setMessage('');
    play('spin');
    try {
      const response = await gameRequest('elimin-game', { action: 'spin', bet });
      const data = response.data || {};
      const steps = data.steps || [];
      // Sonuç geldi: makaralar ilk dizilimin üzerine iner, sonra zincir oynar.
      const landed = steps[0]?.grid || data.grid || null;
      if (landed) {
        setLanding(landed);
        // Makaralar soldan sağa sırayla durur.
        if (!skipLandingRef.current) await wait(landWait(REELS, ROWS, startedAt));
      }
      skipLandingRef.current = false;
      setLanding(null);
      setStopping(true);
      play('landing');
      // Dizilim hemen görünür: makara durduğu an ekranda duran ızgara budur.
      setGrid(landed);
      // Adımlar sırayla oynar: küme parlar, patlar, yerine yenisi düşer.
      await playCascadeSteps(steps, {
        wait,
        setGrid,
        setWins,
        setExplode,
        addWin: setWin,
      });
      // Patlayan kartlar gitti: turun sonunda duran dizilim gösterilir.
      if (data.grid) setGrid(data.grid);
      setWins([]);
      await wait(END_MS);
      applyState(data);
      setWin(data.win || 0);
      // Çevirme hakkı turunda büyük kazanç ekranı yerine tur sonundaki toplam gösterilir.
      setBigWin(inSession ? 0 : (data.big_win || 0));
      setJackpotWin(data.jackpot_win || 0);
      // Üç tavuk gelince bedava turlar eklenir ve sırayla çevrilir.
      if (data.free_trigger) setMessage(`TAVUK İKRAMİYESİ · ${data.free_gain || 3} BEDAVA TUR`);
      // Tur kazançları çevirme hakkı boyunca toplanır.
      if (inSession) {
        sessionWinRef.current += (data.win || 0) + (data.jackpot_win || 0);
        if ((data.session_spins ?? 0) <= 0) setSessionResult(sessionWinRef.current);
      }
      if (data.big_win > 0 || data.jackpot_trigger || data.free_trigger) play('bigWin');
      else if (data.win > 0) play('win');
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
  }, [applyState, bet, coins, freeSpins, play, sessionSpins, status, wait]);

  const enqueueBet = useBetQueue();

  const saveBet = useCallback((next) => {
    setBet(next);
    // İstekler sıraya girer: hızlı basışta geç dönen eski yanıt yeni bahsi geri düşürmez.
    enqueueBet(() => gameRequest('elimin-game', { action: 'bet', bet: next }), applyState);
  }, [applyState, enqueueBet]);

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
    const highest = BET_LEVELS[BET_LEVELS.length - 1];
    if (highest === bet) return;
    saveBet(highest);
  }, [bet, saveBet]);

  // 15 çevirme hakkı: bedel bahis kademesine göre baştan düşülür, turlar ücretsiz çevrilir.
  const buySession = useCallback(async () => {
    if (busyRef.current || status !== 'ready') return;
    if (sessionSpins > 0) {
      setMessage('Devam eden çevirme hakkın var.');
      return;
    }
    if (coins < sessionPrice) {
      setMessage('Yetersiz coin. Coin bakiyene dokunup coin yükle.');
      return;
    }
    unlockAudio();
    busyRef.current = true;
    setMessage('');
    try {
      const response = await gameRequest('elimin-game', { action: 'session', bet });
      applyState(response.data);
    } catch (error) {
      const raw = error?.response?.data?.error;
      setMessage(raw && error?.response?.status !== 429 && !/rate|limit|sınır|yoğun/i.test(raw) ? raw : 'Çok hızlı işlem yapıyorsun, birkaç saniye bekle.');
    } finally {
      busyRef.current = false;
    }
  }, [applyState, bet, coins, sessionPrice, sessionSpins, status]);

  const clearSessionResult = useCallback(() => setSessionResult(null), []);

  // Sandık barı dolunca sandığa basılır: biriken jackpot bakiyeye eklenir, bar sıfırlanır.
  const collectChest = useCallback(async () => {
    if (busyRef.current || status !== 'ready' || chests < CHEST_MAX) return 0;
    unlockAudio();
    busyRef.current = true;
    setMessage('');
    try {
      const response = await gameRequest('elimin-game', { action: 'chest', bet });
      applyState(response.data);
      play('bigWin');
      return response.data?.chest_win || 0;
    } catch (error) {
      const raw = error?.response?.data?.error;
      setMessage(raw && error?.response?.status !== 429 && !/rate|limit|sınır|yoğun/i.test(raw) ? raw : 'Çok hızlı işlem yapıyorsun, birkaç saniye bekle.');
      return 0;
    } finally {
      busyRef.current = false;
    }
  }, [applyState, bet, chests, play, status]);

  const toggleAuto = useCallback(() => setAuto((value) => !value), []);
  const toggleSound = useCallback(() => setSound((value) => !value), []);

  // Otomatik tur: AUTO açıkken veya çevirme hakkı sürerken kendiliğinden devam eder.
  useEffect(() => {
    if (spinning || status !== 'ready') return undefined;
    if (!auto && sessionSpins <= 0 && freeSpins <= 0) return undefined;
    const timer = window.setTimeout(() => { spin(); }, 800);
    return () => window.clearTimeout(timer);
  }, [auto, freeSpins, sessionSpins, spin, spinning, status]);

  return {
    status,
    coins,
    bet,
    totalWon,
    jackpot,
    jackpotWin,
    chests,
    chestValue,
    freeSpins,
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
    sound,
    message,
    spin,
    stop,
    changeBet,
    maxBet,
    buySession,
    clearSessionResult,
    collectChest,
    sessionSpins,
    sessionPrice,
    sessionSize,
    sessionResult,
    toggleAuto,
    toggleSound,
  };
}

// İlk durum isteği: yoğunlukta sessizce tekrar denenir.
async function base44State() {
  const response = await gameRequest('elimin-game', { action: 'state' });
  return response.data || {};
}