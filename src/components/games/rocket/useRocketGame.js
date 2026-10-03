import { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { multiplierAt, colorForMult, MULT_COLOR_CLASS, DEFAULT_ROCKET_BET } from './rocketConfig';

// Sunucu istek limiti nedeniyle seyrek poll edilir; çarpan yerel saatle akıcı kalır.
const POLL_RUNNING = 3500;
const POLL_IDLE = 4000;
const CLOCK_TICK = 50;

// Bahis süresi dolduğu an tur yerel olarak da uçuşa geçer: sunucu yanıtı
// beklenmez, mekik geri sayım 0 olduğu saniyede havalanır.
function phaseAt(status, launchAt, now) {
  if (status === 'betting' && launchAt !== null && now >= launchAt) return 'running';
  return status;
}

/** Crash Rocket oyun durumu: sunucudan poll edilir, çarpan yerel saatle akıcı gösterilir. */
export default function useRocketGame() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const [clock, setClock] = useState(Date.now());

  const serverNowRef = useRef(Date.now());
  const fetchedAtRef = useRef(Date.now());
  const phaseRef = useRef(null);
  const launchAtRef = useRef(null);
  const hasDataRef = useRef(false);
  const autoFireRef = useRef(0);

  const applyResult = useCallback((res) => {
    if (!res) return;
    if (res.error) {
      setMessage(res.error);
      return;
    }
    serverNowRef.current = res.now;
    fetchedAtRef.current = Date.now();
    phaseRef.current = res.round?.status;
    launchAtRef.current = res.round?.phase_ends_at ? new Date(res.round.phase_ends_at).getTime() : null;
    hasDataRef.current = true;
    setData(res);
    setStatus('ready');
    setMessage(res.notice || '');
  }, []);

  const fetchState = useCallback(async () => {
    try {
      const response = await base44.functions.invoke('rocket-game', { action: 'state' });
      applyResult(response.data);
    } catch (e) {
      // Geçici istek limiti hatasında mevcut durum korunur.
      if (!hasDataRef.current) {
        setStatus('error');
        setMessage(e.message || 'Bağlantı hatası');
      }
    }
  }, [applyResult]);

  useEffect(() => {
    let timer;
    const loop = async () => {
      await fetchState();
      // Kalkış anı geçtiyse uçuş sürüyor sayılır: çakılma daha çabuk yakalanır.
      const localNow = serverNowRef.current + (Date.now() - fetchedAtRef.current);
      const flying =
        phaseRef.current === 'running' ||
        (phaseRef.current === 'betting' && launchAtRef.current !== null && localNow >= launchAtRef.current);
      timer = setTimeout(loop, flying ? POLL_RUNNING : POLL_IDLE);
    };
    loop();
    return () => clearTimeout(timer);
  }, [fetchState]);

  useEffect(() => {
    const id = setInterval(() => setClock(Date.now()), CLOCK_TICK);
    return () => clearInterval(id);
  }, []);

  const act = useCallback(
    async (payload) => {
      try {
        const response = await base44.functions.invoke('rocket-game', payload);
        applyResult(response.data);
        return response.data;
      } catch (e) {
        setMessage(e.message || 'İşlem başarısız');
        return null;
      }
    },
    [applyResult]
  );

  const placeBet = useCallback((slot) => act({ action: 'bet', slot }), [act]);
  const cashout = useCallback((slot) => act({ action: 'cashout', slot }), [act]);
  const changeBet = useCallback((slot, direction) => act({ action: 'changeBet', slot, direction }), [act]);
  const changeAuto = useCallback((slot, direction) => act({ action: 'setAuto', slot, direction }), [act]);
  const setAutoTarget = useCallback((slot, value) => act({ action: 'setAutoValue', slot, value }), [act]);

  // Yerel akıcı çarpan: sunucu saati + yerel geçen süre.
  const round = data?.round;
  const serverNow = serverNowRef.current + (clock - fetchedAtRef.current);
  const launchAt = round?.phase_ends_at ? new Date(round.phase_ends_at).getTime() : null;
  // Geri sayım 0'a indiği saniyede uçuş başlar; sunucu yanıtı beklenmez.
  const phase = phaseAt(round?.status, launchAt, serverNow);

  let liveMult = 1;
  if (phase === 'running') {
    const startAt = round?.started_at ? new Date(round.started_at).getTime() : launchAt;
    liveMult = startAt ? multiplierAt(serverNow - startAt) : 1;
  } else if (phase === 'crashed') {
    liveMult = round?.crash_at || 1;
  }

  // Bahis aşaması geri sayımı: tur başlamadan kaç saniye kaldı.
  let countdown = null;
  if (phase === 'betting' && launchAt) {
    countdown = Math.max(0, Math.ceil((launchAt - serverNow) / 1000));
  }

  // İki bahis alanı için aktif bahisler.
  const myBets = { 1: null, 2: null };
  (data?.bets || []).forEach((b) => {
    if (b.user_id !== data?.me || b.status !== 'active') return;
    const slot = b.slot === 2 ? 2 : 1;
    if (!myBets[slot]) myBets[slot] = b;
  });

  // Otomatik çekilme: yerel çarpan hedefe ulaştığı an sunucuya haber verilir,
  // kazanç beklemeden yatırılır. Bahis nakde dönünce tetikleme durur.
  useEffect(() => {
    if (phase !== 'running') return;
    const pending = [1, 2].some((slot) => {
      const target = slot === 2 ? data?.auto2 : data?.auto1;
      return myBets[slot] && target > 0 && liveMult >= target;
    });
    if (!pending || Date.now() - autoFireRef.current < 1500) return;
    autoFireRef.current = Date.now();
    fetchState();
  }, [phase, liveMult, data?.auto1, data?.auto2, myBets[1], myBets[2], fetchState]);

  return {
    status,
    round,
    phase,
    bets: data?.bets || [],
    history: data?.history || [],
    coins: data?.coins ?? 0,
    bet1: data?.bet1 ?? DEFAULT_ROCKET_BET,
    bet2: data?.bet2 ?? DEFAULT_ROCKET_BET,
    auto1: data?.auto1 ?? 0,
    auto2: data?.auto2 ?? 0,
    me: data?.me,
    myBets,
    liveMult,
    liveColor: MULT_COLOR_CLASS[colorForMult(liveMult)],
    countdown,
    message,
    placeBet,
    cashout,
    changeBet,
    changeAuto,
    setAutoTarget,
  };
}