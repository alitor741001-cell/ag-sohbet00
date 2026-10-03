import { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { BET_LEVELS, DEFAULT_BET, SPIN_MS } from './luckyConfig';
import { playSpin, playWin } from './luckySound';

// Ücretsiz dönüşler ve otomatik mod kendiliğinden devam eder.
const NEXT_SPIN_DELAY = 1300;

/** Lucky Olympus oyun durumu: sunucu dönüşü belirler, ekranda 5 saniyelik uçuş oynar. */
export default function useLuckyGame() {
  const [state, setState] = useState(null);
  const [status, setStatus] = useState('loading');
  const [grid, setGrid] = useState(null);
  const [multiValues, setMultiValues] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [spinId, setSpinId] = useState(0);
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState('');
  const [auto, setAuto] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sheet, setSheet] = useState(null);

  const revealRef = useRef(null);
  const nextRef = useRef(null);
  const autoRef = useRef(false);
  const spinRef = useRef(false);
  const busyRef = useRef(false);
  const stateRef = useRef(null);
  const runSpinRef = useRef(null);

  const invoke = useCallback((payload) => base44.functions.invoke('lucky-game', payload).then((res) => res.data), []);

  const applyState = useCallback((data) => {
    setState((prev) => ({ ...(prev || {}), ...data }));
  }, []);

  useEffect(() => {
    let cancelled = false;
    invoke({ action: 'state' })
      .then((data) => {
        if (cancelled) return;
        if (!data || data.error) {
          setStatus('error');
          return;
        }
        setState(data);
        setStatus('ready');
        // Açılışta bakiye mevcut bahsi karşılamıyorsa en yüksek karşılanabilir kademe seçilir.
        const levels = data.levels || BET_LEVELS;
        const affordable = levels.filter((level) => level <= (data.coins ?? 0)).pop();
        if ((data.freeSpins ?? 0) <= 0 && affordable && affordable < (data.bet ?? DEFAULT_BET)) {
          invoke({ action: 'setBet', bet: affordable })
            .then((next) => {
              if (!cancelled && next && !next.error) setState(next);
            })
            .catch(() => {});
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [invoke]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => () => {
    window.clearTimeout(revealRef.current);
    window.clearTimeout(nextRef.current);
  }, []);

  const runSpin = useCallback(async () => {
    if (spinRef.current) return;
    if ((stateRef.current?.coins ?? 0) < (stateRef.current?.bet ?? DEFAULT_BET) && (stateRef.current?.freeSpins ?? 0) <= 0) {
      setMessage('Yetersiz coin.');
      setAuto(false);
      autoRef.current = false;
      return;
    }
    spinRef.current = true;
    setSpinning(true);
    setResult(null);
    setMessage('');
    setSpinId((id) => id + 1);
    playSpin();
    const startedAt = Date.now();

    let data = null;
    try {
      data = await invoke({ action: 'spin' });
    } catch (error) {
      spinRef.current = false;
      setSpinning(false);
      setMessage('Bağlantı hatası — tekrar dene.');
      return;
    }

    if (!data || data.error) {
      spinRef.current = false;
      setSpinning(false);
      setMessage(data?.error || 'Dönüş yapılamadı.');
      setAuto(false);
      autoRef.current = false;
      return;
    }

    // Makaralar 5 saniye döner; sonuç bu sürenin sonunda açılır.
    const wait = Math.max(0, (data.spinMs || SPIN_MS) - (Date.now() - startedAt));
    window.clearTimeout(revealRef.current);
    revealRef.current = window.setTimeout(() => {
      setGrid(data.grid);
      setMultiValues(data.multiValues);
      setResult(data);
      applyState(data);
      setSpinning(false);
      spinRef.current = false;
      if (data.totalWin > 0) playWin();
      const keepsGoing = (data.freeSpins ?? 0) > 0 || autoRef.current;
      const affordable = (data.coins ?? 0) >= (data.bet ?? DEFAULT_BET) || (data.freeSpins ?? 0) > 0;
      if (keepsGoing && affordable) {
        window.clearTimeout(nextRef.current);
        nextRef.current = window.setTimeout(() => runSpinRef.current?.(), NEXT_SPIN_DELAY);
      } else if (autoRef.current) {
        autoRef.current = false;
        setAuto(false);
        if (!affordable) setMessage('Yetersiz coin.');
      }
    }, wait);
  }, [applyState, invoke]);

  useEffect(() => {
    runSpinRef.current = runSpin;
  }, [runSpin]);

  const setBet = useCallback(async (value) => {
    if (spinRef.current || busyRef.current) return;
    const levels = stateRef.current?.levels || BET_LEVELS;
    const next = levels.includes(value) ? value : DEFAULT_BET;
    if ((stateRef.current?.bet ?? DEFAULT_BET) === next) return;
    applyState({ bet: next });
    const data = await invoke({ action: 'setBet', bet: next }).catch(() => null);
    if (data && !data.error) applyState(data);
  }, [applyState, invoke]);

  const shiftBet = useCallback((direction) => {
    const levels = stateRef.current?.levels || BET_LEVELS;
    const current = stateRef.current?.bet ?? DEFAULT_BET;
    const at = Math.max(0, levels.indexOf(current));
    const next = levels[Math.min(levels.length - 1, Math.max(0, at + direction))];
    return setBet(next);
  }, [setBet]);

  const maxBet = useCallback(() => {
    const levels = stateRef.current?.levels || BET_LEVELS;
    return setBet(levels[levels.length - 1]);
  }, [setBet]);

  const buyFreeSpins = useCallback(async () => {
    if (spinRef.current || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      const data = await invoke({ action: 'buyFreeSpins' }).catch(() => null);
      if (!data || data.error) {
        setMessage(data?.error || 'Satın alma başarısız.');
        return;
      }
      applyState(data);
      setMessage(`Ücretsiz dönüş paketi: ${data.bought} dönüş`);
      if (!spinRef.current) runSpinRef.current?.();
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [applyState, invoke]);

  const toggleAuto = useCallback(() => {
    setAuto((prev) => {
      const next = !prev;
      autoRef.current = next;
      window.clearTimeout(nextRef.current);
      if (next && !spinRef.current) runSpinRef.current?.();
      return next;
    });
  }, []);

  const levels = state?.levels || BET_LEVELS;
  const bet = state?.bet ?? DEFAULT_BET;
  const freeSpins = state?.freeSpins ?? 0;
  const multipliers = state?.multipliers || [];

  let banner = 'Başlatmak için DÖNDÜR\'e dokunun';
  if (spinning) banner = freeSpins > 0 ? 'Ücretsiz dönüş oynanıyor...' : 'Makaralar dönüyor...';
  else if (message) banner = message;
  else if (result) banner = result.totalWin > 0 ? `KAZANÇ +${Math.round(result.totalWin).toLocaleString('tr-TR')}` : 'Kazanç yok';
  else if (freeSpins > 0) banner = `Ücretsiz dönüş • ${freeSpins} kaldı`;

  return {
    status,
    coins: state?.coins ?? 0,
    bet,
    levels,
    buyCost: state?.buyCost ?? bet * 25,
    freeSpins,
    multipliers,
    multiplierValues: state?.multiplierValues || [],
    scatterTrigger: state?.scatterTrigger ?? 4,
    grid,
    multiValues,
    spinning,
    spinId,
    result,
    banner,
    auto,
    busy,
    sheet,
    setSheet,
    runSpin,
    setBet,
    shiftBet,
    maxBet,
    buyFreeSpins,
    toggleAuto,
  };
}