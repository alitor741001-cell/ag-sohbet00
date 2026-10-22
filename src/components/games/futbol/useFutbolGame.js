import { useCallback, useEffect, useRef, useState } from 'react';
import gameRequest from '@/lib/gameRequest';
import { sekerliSound as gameSound, unlockAudio } from '@/lib/sekerliAudio';

// Tur durumu üç saniyede bir tazelenir; geri sayım yerel saatle akar.
const POLL_MS = 3000;
const CLOCK_MS = 250;
// Çekiliş bittikten sonra kazanan bu kadar ekranda kalır (sunucudaki RESULT_MS ile aynı).
const HOLD_MS = 3000;

/**
 * ALTIN GOL oyun durumu. Tur ortaktır: bütün oyuncular aynı turu oynar, tek bir
 * kazanan çekilir. Bahis ve ödemeler sunucuda işler; ekran tura göre akar.
 */
export default function useFutbolGame() {
  const [status, setStatus] = useState('loading');
  const [coins, setCoins] = useState(0);
  const [today, setToday] = useState(0);
  const [totalWon, setTotalWon] = useState(0);
  const [mode, setMode] = useState('normal');
  const [round, setRound] = useState(null);
  const [teams, setTeams] = useState([]);
  const [picksCount, setPicksCount] = useState(0);
  const [history, setHistory] = useState([]);
  const [selected, setSelected] = useState('');
  const [left, setLeft] = useState(0);
  const [message, setMessage] = useState('');
  const [prize, setPrize] = useState(null);
  const [sound, setSound] = useState(true);
  const [follow, setFollow] = useState(false);
  const [busy, setBusy] = useState(false);

  const offsetRef = useRef(0);
  const busyRef = useRef(false);
  const soundRef = useRef(true);
  const followRef = useRef(false);
  const myPicksRef = useRef([]);
  const prevRoundRef = useRef(0);
  const seenResultRef = useRef(0);
  const mountedRef = useRef(true);
  const healedRef = useRef(false);

  useEffect(() => { soundRef.current = sound; }, [sound]);
  useEffect(() => { followRef.current = follow; }, [follow]);
  useEffect(() => () => { mountedRef.current = false; }, []);

  const applyView = useCallback((data) => {
    if (!data || data.error) return;
    if (typeof data.now === 'number') offsetRef.current = data.now - Date.now();
    if (typeof data.coins === 'number') setCoins(data.coins);
    if (typeof data.today === 'number') setToday(data.today);
    if (typeof data.total_won === 'number') setTotalWon(data.total_won);
    if (data.mode) setMode(data.mode);
    if (data.round) setRound(data.round);
    if (typeof data.picks_count === 'number') setPicksCount(data.picks_count);
    if (Array.isArray(data.history)) setHistory(data.history);
    if (Array.isArray(data.teams)) {
      setTeams(data.teams);
      // "Önceki seçimi takip et" için son seçimler saklanır.
      const mine = data.teams
        .filter((team) => (team.mine || 0) > 0)
        .map((team) => ({ team_id: team.id, stake: team.mine }));
      if (mine.length) myPicksRef.current = mine;
    }

    // Tur kapandığında sonuç bir kez gösterilir.
    const last = data.last;
    if (last?.round_no && last.round_no !== seenResultRef.current) {
      seenResultRef.current = last.round_no;
      if (last.payout > 0) {
        setPrize({ amount: last.payout, stake: last.stake || 0, winner: last.winner_id || '' });
        if (soundRef.current) gameSound.big();
      }
    }
    setStatus('ready');
  }, []);

  const send = useCallback(async (payload) => {
    const response = await gameRequest('futbol-game', payload);
    return response.data;
  }, []);

  // Tur durumu: yoklama her istemcide turu ilerletir (bahis kapanır, kazanan çekilir).
  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const data = await send({ action: 'state' });
        if (!cancelled) applyView(data);
      } catch (error) {
        if (!cancelled) setStatus((value) => (value === 'loading' ? 'error' : value));
      }
    };
    poll();
    const timer = window.setInterval(poll, POLL_MS);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [applyView, send]);

  // Geri sayım: sunucu saati ile yerel saat farkı hesaba katılır.
  const phaseEnd = round?.phase_ends_at || '';
  useEffect(() => {
    if (!phaseEnd) return undefined;
    const render = () => {
      const end = new Date(phaseEnd).getTime();
      if (mountedRef.current) setLeft(Math.max(0, end - (Date.now() + offsetRef.current)));
    };
    render();
    const timer = window.setInterval(render, CLOCK_MS);
    return () => window.clearInterval(timer);
  }, [phaseEnd]);

  // Faz süresi dolduğu an tur ilerletilir: seçim bitince ibre beklemeden döner,
  // çekiliş bitince kazanan üç saniye daha ekranda kalır ve yeni tur ondan sonra açılır.
  const phase = round?.status || '';
  const over = !!phase && left <= 0;
  useEffect(() => {
    if (!over || (phase !== 'betting' && phase !== 'drawing')) return undefined;
    const timer = window.setTimeout(() => {
      send({ action: 'state' })
        .then((data) => { if (mountedRef.current) applyView(data); })
        .catch(() => null);
    }, phase === 'drawing' ? HOLD_MS + 250 : 0);
    return () => window.clearTimeout(timer);
  }, [over, phase, send, applyView]);

  const invoke = useCallback(async (payload) => {
    try {
      const data = await send(payload);
      if (data?.error) {
        setMessage(data.error);
        return null;
      }
      applyView(data);
      return data;
    } catch (error) {
      setMessage(error?.response?.data?.error || 'Bağlantı kurulamadı, tekrar dene.');
      return null;
    }
  }, [applyView, send]);

  // Yeni tur açıldığında açık olan "takip" seçenek seçimleri kendiliğinden koyar.
  useEffect(() => {
    const roundNo = round?.round_no || 0;
    if (!roundNo || roundNo === prevRoundRef.current) return;
    const previous = prevRoundRef.current;
    prevRoundRef.current = roundNo;
    if (!previous || round?.status !== 'betting') return;
    if (!followRef.current || !myPicksRef.current.length) return;
    const picks = myPicksRef.current;
    Promise.all(picks.map((pick) => send({ action: 'pick', team_id: pick.team_id, stake: pick.stake }).catch(() => null)))
      .then((results) => {
        const fresh = results.find((data) => data && !data.error);
        if (fresh && mountedRef.current) applyView(fresh);
      });
  }, [applyView, round, send]);

  // Uyarı ekranda kısa süre kalır.
  useEffect(() => {
    if (!message) return undefined;
    const timer = window.setTimeout(() => setMessage(''), 2800);
    return () => window.clearTimeout(timer);
  }, [message]);

  const pickTeam = useCallback((team) => {
    if (team.open === false) {
      setMessage('Bu kart seçtiğin modda kapalı.');
      return;
    }
    unlockAudio();
    if (soundRef.current) gameSound.click();
    setMessage('');
    setSelected((current) => (current === team.id ? '' : team.id));
  }, []);

  const addStake = useCallback(async (amount) => {
    if (!selected) {
      setMessage('Önce bir takım kartı seç.');
      return;
    }
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    unlockAudio();
    if (soundRef.current) gameSound.click();
    await invoke({ action: 'pick', team_id: selected, stake: amount });
    busyRef.current = false;
    setBusy(false);
  }, [invoke, selected]);

  const clearPicks = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    await invoke({ action: 'clear' });
    busyRef.current = false;
    setBusy(false);
  }, [invoke]);

  // Mod seçici kaldırıldı: kayıtlı mod kapalı bir modsa sekiz kartın hepsi açılır.
  useEffect(() => {
    if (status !== 'ready' || mode === 'normal' || healedRef.current) return;
    healedRef.current = true;
    invoke({ action: 'mode', mode: 'normal' });
  }, [status, mode, invoke]);

  const toggleSound = useCallback(() => {
    setSound((value) => {
      const next = !value;
      if (next) {
        unlockAudio();
        gameSound.click();
      }
      return next;
    });
  }, []);

  const toggleFollow = useCallback(() => {
    unlockAudio();
    if (soundRef.current) gameSound.click();
    setFollow((value) => !value);
  }, []);

  return {
    status,
    coins,
    today,
    totalWon,
    mode,
    round,
    teams,
    picksCount,
    history,
    selected,
    left,
    message,
    prize,
    sound,
    follow,
    busy,
    pickTeam,
    addStake,
    clearPicks,
    toggleSound,
    toggleFollow,
    clearPrize: useCallback(() => setPrize(null), []),
  };
}