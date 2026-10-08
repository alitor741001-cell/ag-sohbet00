import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BET_LEVELS,
  CASCADE_MULT,
  LINES,
  REFILL_CREDITS,
  START_CREDITS,
  tierFor,
} from './sekerliConfig';
import { EMPTY_CELLS, collapseGrid, createGrid, evaluateGrid } from './sekerliEngine';
import { sekerliSound, unlockAudio } from '@/lib/sekerliAudio';

// Tur zamanlamaları: makara akışı, kazanan parlaması, patlama ve düşme.
const SPIN_MS = 2100;
const WIN_HOLD_MS = 850;
const BOOM_MS = 420;
const FALL_MS = 520;
const FREE_DELAY_MS = 950;
const AUTO_DELAY_MS = 700;
const WIN_SHOW_MS = 1700;

/**
 * ŞEKERLİ MEYVE oyun durumu: demo kredi, makara turu, takla zinciri ve bedava çevrimler.
 * Tüm mantık istemcide çalışır; gerçek para, ödeme veya sunucu işlemi yoktur.
 */
export default function useSekerliGame() {
  const [credits, setCredits] = useState(START_CREDITS);
  const [betIndex, setBetIndex] = useState(0);
  const [grid, setGrid] = useState(() => createGrid());
  const [phase, setPhase] = useState('idle'); // idle | spin | win | boom | fall
  const [spinning, setSpinning] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [spinKey, setSpinKey] = useState(0);
  const [winCells, setWinCells] = useState(EMPTY_CELLS);
  const [newCells, setNewCells] = useState(EMPTY_CELLS);
  const [cascade, setCascade] = useState(0);
  const [tumbleWin, setTumbleWin] = useState(0);
  const [spinWin, setSpinWin] = useState(0);
  const [showWin, setShowWin] = useState(false);
  const [freeLeft, setFreeLeft] = useState(0);
  const [freeTotal, setFreeTotal] = useState(0);
  const [freeIntro, setFreeIntro] = useState(0);
  const [inFree, setInFree] = useState(false);
  const [bonus, setBonus] = useState(null);
  const [prize, setPrize] = useState(null);
  const [auto, setAuto] = useState(false);
  const [sound, setSound] = useState(true);
  const [message, setMessage] = useState('');
  const [broke, setBroke] = useState(false);
  const [busy, setBusy] = useState(false);

  const busyRef = useRef(false);
  const stopRef = useRef(null);
  const timersRef = useRef([]);
  const acceptRef = useRef(null);
  const runRef = useRef(() => {});
  const mountedRef = useRef(true);
  const creditsRef = useRef(credits);
  const betRef = useRef(BET_LEVELS[betIndex]);
  const freeLeftRef = useRef(0);
  const freeTotalRef = useRef(0);
  const inFreeRef = useRef(false);
  const autoRef = useRef(false);
  const soundRef = useRef(true);

  useEffect(() => { creditsRef.current = credits; }, [credits]);
  useEffect(() => { betRef.current = BET_LEVELS[betIndex]; }, [betIndex]);
  useEffect(() => { inFreeRef.current = inFree; }, [inFree]);

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

  /** Büyük kazanç ve bonus özeti ekranı onaylanana kadar akış bekler. */
  const waitAccept = useCallback(() => new Promise((resolve) => { acceptRef.current = resolve; }), []);

  const continueAfterOverlay = useCallback(() => {
    setPrize(null);
    setBonus(null);
    const resolve = acceptRef.current;
    acceptRef.current = null;
    if (resolve) resolve();
  }, []);

  const run = useCallback(async (isFree) => {
    const bet = betRef.current;
    const totalBet = bet * LINES;

    if (!isFree && creditsRef.current < totalBet) {
      autoRef.current = false;
      setAuto(false);
      setBroke(true);
      setMessage('Kredi yetmiyor. Demo kredi yükleyebilirsin.');
      return;
    }

    busyRef.current = true;
    setBusy(true);
    setMessage('');
    setBroke(false);
    setPrize(null);
    setWinCells(EMPTY_CELLS);
    setNewCells(EMPTY_CELLS);
    setCascade(0);
    setTumbleWin(0);
    setSpinWin(0);
    setShowWin(false);
    setStopping(false);
    if (!isFree) setCredits((value) => value - totalBet);

    const settled = createGrid();
    setGrid(settled);
    setSpinKey((key) => key + 1);
    setSpinning(true);
    setPhase('spin');
    if (soundRef.current) {
      unlockAudio();
      sekerliSound.spin();
    }
    await wait(SPIN_MS);
    if (!mountedRef.current) return;
    setSpinning(false);
    setPhase('idle');

    let working = settled;
    let step = 0;
    let gain = 0;
    let pendingFree = 0;

    // Takla zinciri: her kazanç patlar, yerine yeni semboller düşer ve çarpan büyür.
    for (;;) {
      const result = evaluateGrid(working);
      const units = result.lineTotal + result.scatterPay * LINES;
      const amount = units * bet;
      if (amount <= 0) break;

      const multiplier = CASCADE_MULT[Math.min(step, CASCADE_MULT.length - 1)];
      const stepAmount = amount * multiplier;
      step += 1;
      gain += stepAmount;
      if (result.freeSpins > 0) pendingFree += result.freeSpins;

      setCascade(step);
      setTumbleWin(gain);
      setSpinWin(gain);
      setWinCells(result.cells);
      setPhase('win');
      setShowWin(true);
      if (soundRef.current) sekerliSound.win(multiplier);
      await wait(WIN_HOLD_MS);
      if (!mountedRef.current) return;

      const cleared = new Set([...result.cells, ...result.scatterCells]);
      if (!cleared.size) break;

      setPhase('boom');
      if (soundRef.current) sekerliSound.pop();
      await wait(BOOM_MS);
      if (!mountedRef.current) return;

      const collapsed = collapseGrid(working, cleared);
      setGrid(collapsed.grid);
      setNewCells(collapsed.added);
      setWinCells(EMPTY_CELLS);
      setPhase('fall');
      await wait(FALL_MS);
      if (!mountedRef.current) return;

      working = collapsed.grid;
      setNewCells(EMPTY_CELLS);
      setPhase('idle');
    }

    setSpinning(false);
    setWinCells(EMPTY_CELLS);
    setNewCells(EMPTY_CELLS);
    setPhase('idle');
    busyRef.current = false;
    setBusy(false);

    if (gain > 0) {
      setCredits((value) => value + gain);
      if (isFree) {
        freeTotalRef.current += gain;
        setFreeTotal(freeTotalRef.current);
      }
    }

    const tier = tierFor(gain, totalBet);
    if (tier && pendingFree <= 0) {
      setPrize({ amount: gain, label: tier.label, tone: tier.tone, multiplier: gain / totalBet });
      if (soundRef.current) sekerliSound.big();
      await waitAccept();
      if (!mountedRef.current) return;
    } else if (gain > 0) {
      const timer = window.setTimeout(() => {
        if (mountedRef.current) setShowWin(false);
      }, WIN_SHOW_MS);
      timersRef.current.push(timer);
    }

    // Bedava çevrim akışı: bahis düşmeden zincir devam eder.
    if (isFree) {
      if (pendingFree > 0) {
        const boosted = freeLeftRef.current + pendingFree;
        freeLeftRef.current = boosted;
        setFreeLeft(boosted);
        if (soundRef.current) sekerliSound.free();
      }
      const left = Math.max(0, freeLeftRef.current - 1);
      freeLeftRef.current = left;
      setFreeLeft(left);
      if (left > 0) {
        await delay(FREE_DELAY_MS);
        if (!mountedRef.current) return;
        runRef.current(true);
        return;
      }
      inFreeRef.current = false;
      setInFree(false);
      setShowWin(false);
      const total = freeTotalRef.current;
      freeTotalRef.current = 0;
      setFreeTotal(0);
      setBonus({ amount: total });
      if (soundRef.current) sekerliSound.big();
      await waitAccept();
      if (!mountedRef.current) return;
    } else if (pendingFree > 0) {
      // Yıldız bonus: önce duyuru ekranı, sonra çevrimler.
      freeTotalRef.current = 0;
      setFreeTotal(0);
      freeLeftRef.current = pendingFree;
      setFreeLeft(pendingFree);
      inFreeRef.current = true;
      setInFree(true);
      setFreeIntro(pendingFree);
      if (soundRef.current) sekerliSound.free();
      return;
    }

    // Otomatik oyun: kredi yettiği sürece turlar kendiliğinden devam eder.
    if (autoRef.current) {
      if (creditsRef.current >= betRef.current * LINES) {
        await delay(AUTO_DELAY_MS);
        if (!mountedRef.current || !autoRef.current || busyRef.current) return;
        runRef.current(false);
      } else {
        autoRef.current = false;
        setAuto(false);
        setBroke(true);
        setMessage('Kredi yetmiyor. Demo kredi yükleyebilirsin.');
      }
    }
  }, [delay, wait, waitAccept]);

  useEffect(() => { runRef.current = run; }, [run]);

  // Uyarı ekranda kısa süre kalır, sonra kendiliğinden kaybolur.
  useEffect(() => {
    if (!message) return undefined;
    const timer = window.setTimeout(() => setMessage(''), 2800);
    return () => window.clearTimeout(timer);
  }, [message]);

  const spin = useCallback(() => {
    if (busyRef.current || inFreeRef.current || freeLeftRef.current > 0) return;
    unlockAudio();
    runRef.current(false);
  }, []);

  const stop = useCallback(() => {
    if (!busyRef.current) return;
    setStopping(true);
    stopRef.current?.();
  }, []);

  const startFreeSpins = useCallback(() => {
    if (freeLeftRef.current <= 0) return;
    setFreeIntro(0);
    runRef.current(true);
  }, []);

  const changeBet = useCallback((direction) => {
    if (busyRef.current || inFreeRef.current) return;
    if (soundRef.current) sekerliSound.click();
    setBetIndex((index) => Math.min(BET_LEVELS.length - 1, Math.max(0, index + direction)));
  }, []);

  const maxBet = useCallback(() => {
    if (busyRef.current || inFreeRef.current) return;
    let index = 0;
    BET_LEVELS.forEach((value, position) => {
      if (value * LINES <= creditsRef.current) index = position;
    });
    setBetIndex(index);
    if (soundRef.current) sekerliSound.click();
  }, []);

  const toggleAuto = useCallback(() => {
    if (inFreeRef.current) return;
    const next = !autoRef.current;
    autoRef.current = next;
    setAuto(next);
    if (soundRef.current) sekerliSound.click();
    if (next && !busyRef.current) runRef.current(false);
  }, []);

  const toggleSound = useCallback(() => {
    const next = !soundRef.current;
    soundRef.current = next;
    setSound(next);
    if (next) {
      unlockAudio();
      sekerliSound.click();
    }
  }, []);

  const refill = useCallback(() => {
    setCredits((value) => value + REFILL_CREDITS);
    setBroke(false);
    setMessage('');
    if (soundRef.current) sekerliSound.click();
  }, []);

  return {
    credits,
    bet: BET_LEVELS[betIndex],
    grid,
    phase,
    spinning,
    stopping,
    spinKey,
    winCells,
    newCells,
    cascade,
    cascadeMult: cascade > 0 ? CASCADE_MULT[Math.min(cascade - 1, CASCADE_MULT.length - 1)] : 1,
    tumbleWin,
    spinWin,
    showWin,
    freeLeft,
    freeTotal,
    freeIntro,
    inFree,
    bonus,
    prize,
    auto,
    sound,
    message,
    broke,
    busy,
    spin,
    stop,
    startFreeSpins,
    changeBet,
    maxBet,
    toggleAuto,
    toggleSound,
    continueAfterOverlay,
    refill,
  };
}