import { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { BET_LEVELS, LINES, REELS, ROWS, tierFor } from './sekerliConfig';
import { EMPTY_CELLS, collapseBoard, mergeSymbols, randomSymbol, toBoard } from './sekerliBoard';
import { sekerliSound, unlockAudio } from '@/lib/sekerliAudio';

// Tur zamanlamaları: sonucun üzerine iniş, kazanan parlaması, patlama ve düşme.
const LAND_MS = 1450;
const WIN_HOLD_MS = 780;
const BOOM_MS = 400;
const FALL_MS = 480;
const AUTO_DELAY_MS = 700;
const WIN_SHOW_MS = 1700;

// Süs ızgarası: sunucu turu hesaplarken ekranda duran semboller.
const fillerGrid = () =>
  Array.from({ length: REELS }, () => Array.from({ length: ROWS }, () => randomSymbol()));

const cellKeys = (cells) => new Set((cells || []).map((cell) => `${cell.reel}-${cell.row}`));

/**
 * ŞEKERLİ MEYVE oyun durumu: coin bakiyesi, bahis, tur, takla zinciri ve çevirme hakkı.
 * Sonuç sunucudan gelir; ekran zinciri adım adım canlandırır.
 */
export default function useSekerliGame() {
  const [status, setStatus] = useState('loading');
  const [coins, setCoins] = useState(0);
  const [bet, setBet] = useState(BET_LEVELS[0]);
  const [spins, setSpins] = useState(0);
  const [totalWon, setTotalWon] = useState(0);
  // "15 çevirme hakkı" kutusunun bedeli, kalan turu ve paket tur sayısı sunucudan gelir.
  const [sessionPrice, setSessionPrice] = useState(0);
  const [sessionSpins, setSessionSpins] = useState(0);
  const [sessionSize, setSessionSize] = useState(15);
  const [sessionResult, setSessionResult] = useState(null);
  const [board, setBoard] = useState(() => toBoard(fillerGrid()));
  // Sonuç gelince makaraların ineceği ızgara: şerit doğrudan gerçek sembollere oturur.
  const [landing, setLanding] = useState(null);
  const [phase, setPhase] = useState('idle'); // idle | spin | win | boom | fall
  const [spinning, setSpinning] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [spinKey, setSpinKey] = useState(0);
  const [winCells, setWinCells] = useState(EMPTY_CELLS);
  const [newCells, setNewCells] = useState(EMPTY_CELLS);
  const [multiplier, setMultiplier] = useState(1);
  const [spinWin, setSpinWin] = useState(0);
  const [win, setWin] = useState(0);
  const [showWin, setShowWin] = useState(false);
  const [prize, setPrize] = useState(null);
  const [auto, setAuto] = useState(false);
  const [sound, setSound] = useState(true);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const busyRef = useRef(false);
  const stopRef = useRef(null);
  const timersRef = useRef([]);
  const acceptRef = useRef(null);
  const runRef = useRef(() => {});
  const mountedRef = useRef(true);
  const coinsRef = useRef(0);
  const betRef = useRef(BET_LEVELS[0]);
  const sessionRef = useRef(0);
  const autoRef = useRef(false);
  const soundRef = useRef(true);
  // Çevirme hakkı boyunca biriken kazanç: tur bitene kadar sıfırlanmaz.
  const sessionWinRef = useRef(0);
  // Tur isteği sürerken STOP'a basılırsa iniş animasyonu atlanır.
  const skipLandingRef = useRef(false);

  useEffect(() => { coinsRef.current = coins; }, [coins]);
  useEffect(() => { betRef.current = bet; }, [bet]);
  useEffect(() => { sessionRef.current = sessionSpins; }, [sessionSpins]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopRef.current?.();
      timersRef.current.forEach((id) => window.clearTimeout(id));
      timersRef.current = [];
      acceptRef.current?.();
    };
  }, []);

  /** Durdurulabilir bekleme: tur sırasında STOP'a basılırsa hemen biter. */
  const wait = useCallback((ms) => new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      stopRef.current = null;
      resolve();
    };
    const timer = window.setTimeout(finish, ms);
    stopRef.current = () => {
      window.clearTimeout(timer);
      finish();
    };
  }), []);

  /** Gecikmeli devam: bileşen kapandığında zamanlayıcı temizlenir. */
  const delay = useCallback((ms) => new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      timersRef.current = timersRef.current.filter((id) => id !== timer);
      resolve();
    }, ms);
    timersRef.current.push(timer);
  }), []);

  /** Büyük kazanç ekranı onaylanana kadar akış bekler. */
  const waitAccept = useCallback(() => new Promise((resolve) => { acceptRef.current = resolve; }), []);

  const continueAfterOverlay = useCallback(() => {
    setPrize(null);
    const resolve = acceptRef.current;
    acceptRef.current = null;
    if (resolve) resolve();
  }, []);

  const applyState = useCallback((data) => {
    if (!data) return;
    if (typeof data.coins === 'number') setCoins(data.coins);
    if (typeof data.bet === 'number') setBet(data.bet);
    if (typeof data.total_won === 'number') setTotalWon(data.total_won);
    if (typeof data.spins === 'number') setSpins(data.spins);
    if (typeof data.session_price === 'number') setSessionPrice(data.session_price);
    if (typeof data.session_spins === 'number') setSessionSpins(data.session_spins);
    if (typeof data.session_size === 'number') setSessionSize(data.session_size);
  }, []);

  useEffect(() => {
    let cancelled = false;
    base44.functions
      .invoke('sekerli-game', { action: 'state' })
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

  const run = useCallback(async () => {
    const currentBet = betRef.current;
    const totalBet = currentBet * LINES;
    // Çevirme hakkı sürerken turlar ücret almaz.
    const inSession = sessionRef.current > 0;
    const cost = inSession ? 0 : totalBet;

    if (!inSession && coinsRef.current < cost) {
      autoRef.current = false;
      setAuto(false);
      setMessage('Yetersiz coin. Coin bakiyene dokunup coin yükle.');
      return;
    }

    busyRef.current = true;
    setBusy(true);
    setMessage('');
    setPrize(null);
    setWinCells(EMPTY_CELLS);
    setNewCells(EMPTY_CELLS);
    setMultiplier(1);
    setSpinWin(0);
    setShowWin(false);
    setStopping(false);
    setLanding(null);
    skipLandingRef.current = false;
    // Bahis tur başlarken bakiyeden düşer: coin gerçek zamanlı azalır.
    if (cost > 0) setCoins((value) => Math.max(0, value - cost));
    if (!inSession) {
      sessionWinRef.current = 0;
      setWin(0);
    }

    setSpinning(true);
    setPhase('spin');
    setSpinKey((key) => key + 1);
    if (soundRef.current) {
      unlockAudio();
      sekerliSound.spin();
    }

    try {
      const response = await base44.functions.invoke('sekerli-game', { action: 'spin', bet: currentBet });
      const data = response.data || {};
      const steps = Array.isArray(data.steps) ? data.steps : [];
      const landed = steps.length ? steps[0].grid : data.final_grid;

      // Sonuç geldi: makaralar gerçek sembollerin üzerine iner, sonra ızgara sabitlenir.
      if (landed) {
        setLanding(landed);
        if (!skipLandingRef.current) await wait(LAND_MS);
        if (!mountedRef.current) return;
      }
      skipLandingRef.current = false;
      setLanding(null);
      setSpinning(false);
      setPhase('idle');
      let working = toBoard(landed);
      if (landed) setBoard(working);

      // Takla zinciri: her adım parlar, patlar ve yerine yeniler düşer.
      let gain = 0;
      for (let index = 0; index < steps.length; index += 1) {
        const step = steps[index];
        gain += Math.round(step.units * step.multiplier * currentBet);
        setMultiplier(step.multiplier);
        setSpinWin(gain);
        setWinCells(cellKeys(step.cells));
        setPhase('win');
        setShowWin(true);
        if (soundRef.current) sekerliSound.win(step.multiplier);
        await wait(WIN_HOLD_MS);
        if (!mountedRef.current) return;

        const cleared = cellKeys([...(step.cells || []), ...(step.scatter_cells || [])]);
        const nextGrid = steps[index + 1]?.grid || data.final_grid;
        const collapsed = collapseBoard(working, cleared);

        setPhase('boom');
        if (soundRef.current) sekerliSound.pop();
        await wait(BOOM_MS);
        if (!mountedRef.current) return;

        // Düşen karelerin sembolleri sunucudan gelir: ekran ile sonuç aynı kalır.
        working = mergeSymbols(collapsed.board, nextGrid);
        setBoard(working);
        setWinCells(EMPTY_CELLS);
        setNewCells(collapsed.added);
        setPhase('fall');
        await wait(FALL_MS);
        if (!mountedRef.current) return;
        setNewCells(EMPTY_CELLS);
        setPhase('idle');
      }

      applyState(data);
      // Çevirme hakkı boyunca kazanç birikir; normal turda tur kazancı yazılır.
      const won = data.win || 0;
      sessionWinRef.current += won;
      setWin(sessionWinRef.current);

      // Çevirme hakkı sürerken ara kutlama yapılmaz; sonuç tur bitince gösterilir.
      const tier = inSession ? null : tierFor(won, totalBet);
      if (tier) {
        setPrize({ amount: won, label: tier.label, tone: tier.tone, multiplier: won / totalBet });
        if (soundRef.current) sekerliSound.big();
        await waitAccept();
        if (!mountedRef.current) return;
      } else if (won > 0) {
        const timer = window.setTimeout(() => {
          if (mountedRef.current) setShowWin(false);
        }, WIN_SHOW_MS);
        timersRef.current.push(timer);
      }

      // 15 tur bittiğinde biriken kazanç kabul ekranında gösterilir.
      if (inSession && (data.session_spins ?? 0) <= 0) setSessionResult(sessionWinRef.current);
    } catch (error) {
      const raw = error?.response?.data?.error;
      autoRef.current = false;
      setAuto(false);
      // Tur oynanmadıysa bahis bakiyeye geri döner.
      if (cost > 0) setCoins((value) => value + cost);
      setMessage(raw && error?.response?.status !== 429 && !/rate|limit|sınır|yoğun/i.test(raw) ? raw : 'Çok hızlı oynuyorsun, birkaç saniye bekle.');
    } finally {
      stopRef.current = null;
      setStopping(false);
      setSpinning(false);
      setPhase('idle');
      busyRef.current = false;
      setBusy(false);
    }
  }, [applyState, wait, waitAccept]);

  useEffect(() => { runRef.current = run; }, [run]);

  // Uyarı ekranda kısa süre kalır, sonra kendiliğinden kaybolur.
  useEffect(() => {
    if (!message) return undefined;
    const timer = window.setTimeout(() => setMessage(''), 2800);
    return () => window.clearTimeout(timer);
  }, [message]);

  const spin = useCallback(() => {
    if (busyRef.current) return;
    unlockAudio();
    runRef.current();
  }, []);

  const stop = useCallback(() => {
    if (!busyRef.current) return;
    setStopping(true);
    // İniş sürerken bekleme kesilir; istek sürerken basıldıysa iniş atlanır.
    if (stopRef.current) stopRef.current();
    else skipLandingRef.current = true;
  }, []);

  const saveBet = useCallback(async (next) => {
    setBet(next);
    try {
      const response = await base44.functions.invoke('sekerli-game', { action: 'bet', bet: next });
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
    if (soundRef.current) sekerliSound.click();
    saveBet(next);
  }, [bet, saveBet]);

  const maxBet = useCallback(() => {
    if (busyRef.current) return;
    const affordable = BET_LEVELS.filter((value) => value * LINES <= coinsRef.current).pop() || BET_LEVELS[0];
    if (affordable === bet) return;
    if (soundRef.current) sekerliSound.click();
    saveBet(affordable);
  }, [bet, saveBet]);

  const toggleAuto = useCallback(() => setAuto((value) => {
    const next = !value;
    autoRef.current = next;
    if (soundRef.current) sekerliSound.click();
    return next;
  }), []);

  const toggleSound = useCallback(() => {
    const next = !soundRef.current;
    soundRef.current = next;
    setSound(next);
    if (next) {
      unlockAudio();
      sekerliSound.click();
    }
  }, []);

  // Geri sayım çevirme hakkında kendiliğinden akar; AUTO açıksa turlar sürer.
  useEffect(() => {
    if (spinning || status !== 'ready') return undefined;
    if (!auto && sessionSpins <= 0) return undefined;
    const timer = window.setTimeout(() => { spin(); }, 800);
    return () => window.clearTimeout(timer);
  }, [auto, sessionSpins, spin, spinning, status]);

  // "15 çevirme hakkı": bedel coinlerden düşülür, turlar serbest çevrilir.
  const buySession = useCallback(async () => {
    if (busyRef.current || status !== 'ready') return;
    if (coinsRef.current < sessionPrice) {
      setMessage('Yetersiz coin. Coin bakiyene dokunup coin yükle.');
      return;
    }
    try {
      const response = await base44.functions.invoke('sekerli-game', { action: 'session', bet });
      applyState(response.data);
      setMessage('');
    } catch (error) {
      setMessage(error?.response?.data?.error || 'Çevirme hakkı alınamadı.');
    }
  }, [applyState, bet, sessionPrice, status]);

  const clearSessionResult = useCallback(() => setSessionResult(null), []);

  return {
    status,
    coins,
    bet,
    spins,
    totalWon,
    board,
    landing,
    phase,
    spinning,
    stopping,
    spinKey,
    winCells,
    newCells,
    multiplier,
    spinWin,
    win,
    showWin,
    prize,
    auto,
    sound,
    message,
    busy,
    spin,
    stop,
    changeBet,
    maxBet,
    toggleAuto,
    toggleSound,
    buySession,
    clearSessionResult,
    continueAfterOverlay,
    sessionPrice,
    sessionSpins,
    sessionSize,
    sessionResult,
  };
}