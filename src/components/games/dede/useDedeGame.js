import { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import gameRequest from '@/lib/gameRequest';
import { landMs } from '@/components/games/reels/reelRoll';
import { DEDE_BET_LEVELS, DEDE_LINES, scatterIntroGrid } from './dedeConfig';

// Sonucun üzerine iniş, karoların yerine oturması ve kazanç adımlarının süreleri.
const LAND_MS = landMs(6);
const DROP_MS = 380;
const HOLD_MS = 950;
const EXPLODE_MS = 320;
const END_MS = 650;
// Çevirme hakkı açılırken dört skatterin ekranda parladığı süre.
const SCATTER_INTRO_MS = 2200;

/** DEDE oyununun durumu: bakiye, bahis, tumbler adımları ve çarpan küreleri. */
export default function useDedeGame() {
  const [status, setStatus] = useState('loading');
  const [coins, setCoins] = useState(0);
  const [totalWon, setTotalWon] = useState(0);
  // "15 çevirme hakkı" kutusunun bedeli, kalan turu ve paket tur sayısı sunucudan gelir.
  const [sessionPrice, setSessionPrice] = useState(0);
  const [sessionSpins, setSessionSpins] = useState(0);
  const [sessionSize, setSessionSize] = useState(15);
  const [sessionResult, setSessionResult] = useState(null);
  // Skatterın başlattığı çevirme hakkı kutlaması: kapanmadan turlar başlamaz.
  const [sessionBonus, setSessionBonus] = useState(null);
  // Açılış anı: dört skatter ekranda parlar, sonra turlar kendiliğinden başlar.
  const [intro, setIntro] = useState(false);
  // Çevirme hakkı sürerken gelen skatter: eklenen bedelsiz tur sayısı.
  const [retrigger, setRetrigger] = useState(0);
  const [bet, setBet] = useState(100);
  const [spins, setSpins] = useState(0);
  const [grid, setGrid] = useState(null);
  const [wins, setWins] = useState([]);
  const [orbs, setOrbs] = useState([]);
  const [multiplier, setMultiplier] = useState(0);
  const [explode, setExplode] = useState(false);
  const [rolling, setRolling] = useState(false);
  // Sonuç gelince makaraların ineceği dizilim ve tur anahtarı.
  const [landing, setLanding] = useState(null);
  const [spinKey, setSpinKey] = useState(0);
  const [win, setWin] = useState(0);
  const [bigWin, setBigWin] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [auto, setAuto] = useState(false);
  const [message, setMessage] = useState('');
  const busyRef = useRef(false);
  const stopRef = useRef(null);
  // Satın alınan 15 turda kazanan tutar: her turda artar, tur bitene kadar sıfırlanmaz.
  const sessionWinRef = useRef(0);
  // Tur isteği sürerken DURDUR'a basılırsa iniş animasyonu atlanır.
  const skipLandingRef = useRef(false);

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
    // İniş sürerken bekleme kesilir; istek sürerken basıldıysa iniş atlanır.
    if (stopRef.current) stopRef.current();
    else skipLandingRef.current = true;
  }, []);

  useEffect(() => () => { stopRef.current?.(); }, []);

  const applyState = useCallback((data) => {
    if (!data) return;
    if (typeof data.coins === 'number') setCoins(data.coins);
    if (typeof data.total_won === 'number') setTotalWon(data.total_won);
    if (typeof data.bet === 'number') setBet(data.bet);
    if (typeof data.spins === 'number') setSpins(data.spins);
    if (typeof data.session_price === 'number') setSessionPrice(data.session_price);
    if (typeof data.session_spins === 'number') setSessionSpins(data.session_spins);
    if (typeof data.session_size === 'number') setSessionSize(data.session_size);
    // Biriken çarpan sunucudan gelir: tur bittiğinde de çemberde görünür kalır.
    if (typeof data.multiplier === 'number') setMultiplier(data.multiplier);
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
    // Satın alınan çevirme hakkı tur ücreti almaz.
    const inSession = sessionSpins > 0;
    const cost = inSession ? 0 : bet * DEDE_LINES;
    if (coins < cost) {
      setAuto(false);
      setMessage('Yetersiz coin. Coin bakiyene dokunup coin yükle.');
      return;
    }
    busyRef.current = true;
    // Bahis tur başlarken bakiyeden düşülür: coin gerçek zamanlı azalır.
    if (cost > 0) setCoins((value) => Math.max(0, value - cost));
    if (!inSession) sessionWinRef.current = 0;
    setRolling(true);
    setLanding(null);
    setSpinKey((key) => key + 1);
    skipLandingRef.current = false;
    setSpinning(true);
    // Çevirme hakkı sürerken biriken kazanç görünür kalır.
    setWin(inSession ? sessionWinRef.current : 0);
    setBigWin(0);
    setWins([]);
    setOrbs([]);
    // Çevirme hakkı sürerken biriken çarpan ekranda kalır; tek çevirmede sıfırdan başlar.
    setMultiplier((value) => (inSession ? value : 0));
    setMessage('');
    try {
      const response = await gameRequest('dede-game', { action: 'spin', bet });
      const data = response.data || {};
      const steps = data.steps || [];
      // Sonuç geldi: makaralar ilk dizilimin tam üzerine iner, sonra zincir oynar.
      const landed = steps[0]?.grid || data.grid || null;
      if (landed) {
        setLanding(landed);
        if (!skipLandingRef.current) await wait(LAND_MS);
      }
      skipLandingRef.current = false;
      setLanding(null);
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
        setWin(sessionWinRef.current + shown);
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
      // 4, 5 ya da 6 skatter: 15 çevirme hakkı bedelsiz başladı, kutlama ekranı açılır.
      if (data.session_bonus) setSessionBonus({ spins: data.session_spins ?? 15 });
      // Çevirme hakkı sürerken gelen skatter: ek 15 tur bedelsiz eklenir.
      if (data.session_retrigger) setRetrigger(data.retrigger_spins || 0);
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
      setRolling(false);
      setSpinning(false);
      busyRef.current = false;
    }
  }, [applyState, bet, coins, sessionSpins, status, wait]);

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

  // Geri sayım yalnızca satın alınan çevirme hakkında akar; bedava turlar elle oynanır.
  useEffect(() => {
    if (spinning || intro || status !== 'ready') return undefined;
    // Kutlama ekranı kapanana kadar beklenir: oyuncu 15 hakkı görüp başlatır.
    if (sessionBonus || retrigger) return undefined;
    if (!auto && sessionSpins <= 0) return undefined;
    const timer = window.setTimeout(() => { spin(); }, 800);
    return () => window.clearTimeout(timer);
  }, [auto, intro, retrigger, sessionBonus, sessionSpins, spin, spinning, status]);

  // Açılış anı: dört skatter dizilir ve parlar; çarpan ya da patlama olmaz,
  // sonra 15 ücretsiz tur kendiliğinden çevrilir.
  const playScatterIntro = useCallback(async () => {
    const grid = scatterIntroGrid();
    const cells = [];
    grid.forEach((column, reel) => {
      column.forEach((symbol, row) => {
        if (symbol === 'dede') cells.push({ reel, row });
      });
    });
    setIntro(true);
    setRolling(false);
    setLanding(null);
    setExplode(false);
    setGrid(grid);
    setWins([{ symbol: 'dede', count: cells.length, amount: 0, cells, scatter: true }]);
    setOrbs([]);
    setMultiplier(0);
    setWin(0);
    setBigWin(0);
    sessionWinRef.current = 0;
    await wait(SCATTER_INTRO_MS);
    setWins([]);
    setIntro(false);
  }, [wait]);

  // "15 çevirme hakkı": bedel coinlerden düşülür; açılışta skatterler parlar,
  // ardından turlar kendiliğinden çevrilir.
  const buySession = useCallback(async () => {
    if (busyRef.current || status !== 'ready') return;
    if (coins < sessionPrice) {
      setMessage('Yetersiz coin. Coin bakiyene dokunup coin yükle.');
      return;
    }
    busyRef.current = true;
    try {
      const response = await gameRequest('dede-game', { action: 'session', bet });
      applyState(response.data);
      await playScatterIntro();
      setMessage('');
    } catch (error) {
      setMessage(error?.response?.data?.error || 'Çevirme hakkı alınamadı.');
    } finally {
      busyRef.current = false;
    }
  }, [applyState, bet, coins, playScatterIntro, sessionPrice, status]);

  const clearSessionResult = useCallback(() => setSessionResult(null), []);
  const clearSessionBonus = useCallback(() => setSessionBonus(null), []);
  const clearRetrigger = useCallback(() => setRetrigger(0), []);

  return {
    status,
    coins,
    totalWon,
    bet,
    spins,
    spinning,
    rolling,
    landing,
    spinKey,
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
    clearSessionResult,
    clearSessionBonus,
    clearRetrigger,
    retrigger,
    intro,
    sessionPrice,
    sessionSpins,
    sessionSize,
    sessionResult,
    sessionBonus,
  };
}