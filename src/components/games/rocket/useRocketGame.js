import { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import {
  multiplierAt,
  colorForMult,
  MULT_COLOR_CLASS,
  DEFAULT_ROCKET_BET,
  ROCKET_BET_LEVELS,
  ROCKET_AUTO_LEVELS,
  formatMult,
} from './rocketConfig';

// Sunucu istek limiti nedeniyle seyrek poll edilir; çarpan yerel saatle akıcı kalır.
const POLL_RUNNING = 4000;
const POLL_IDLE = 9000;
// Sunucu reddi sonrası yoklama bekler: istek bütçesi oyuncunun butonlarına kalır.
const POLL_COOLDOWN = 12000;
const CLOCK_TICK = 50;
// Otomatik hedef ok tuşlarına hızlı basmak tek istek üretir.
const AUTO_SAVE_MS = 600;

// Bahis süresi dolduğu an tur yerel olarak da uçuşa geçer: sunucu yanıtı
// beklenmez, mekik geri sayım 0 olduğu saniyede havalanır.
function phaseAt(status, launchAt, now) {
  if (status === 'betting' && launchAt !== null && now >= launchAt) return 'running';
  return status;
}

// Sunucu reddi oyuncuya ham "500" yerine anlaşılır dille söylenir.
function friendlyError(e) {
  const status = e?.response?.status;
  const serverText = e?.response?.data?.error;
  if (!e?.response || status >= 500 || /rate|limit/i.test(serverText || e?.message || '')) {
    return 'Sunucu yoğun — birkaç saniye sonra tekrar dene.';
  }
  return serverText || e?.message || 'İşlem başarısız';
}

// Kademe listesindeki en yakın basamaktan bir adım ileri/geri gider.
function shiftLevel(levels, value, direction) {
  const index = levels.reduce(
    (best, lvl, i) => (Math.abs(lvl - value) < Math.abs(levels[best] - value) ? i : best),
    0
  );
  return levels[Math.min(levels.length - 1, Math.max(0, index + (direction > 0 ? 1 : -1)))];
}

/** Crash Rocket oyun durumu: sunucudan poll edilir, çarpan yerel saatle akıcı gösterilir. */
export default function useRocketGame() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const [clock, setClock] = useState(Date.now());
  const [ledger, setLedger] = useState(null);
  // Bahis miktarı ve otomatik hedef istemcide tutulur: oklar sunucuyu beklemez.
  const [betAmt, setBetAmt] = useState({ 1: DEFAULT_ROCKET_BET, 2: DEFAULT_ROCKET_BET });
  const [autoAmt, setAutoAmt] = useState({ 1: 0, 2: 0 });
  // İsteği süren alanlar: aynı butona ikinci dokunuş yeni istek açmaz.
  const [busy, setBusy] = useState({});
  // Çek'e dokunulduğu an sabitlenen çarpan: buton beklerken kazanç donar.
  const [pendingMult, setPendingMult] = useState({ 1: 0, 2: 0 });

  const serverNowRef = useRef(Date.now());
  const fetchedAtRef = useRef(Date.now());
  const phaseRef = useRef(null);
  const launchAtRef = useRef(null);
  const hasDataRef = useRef(false);
  const autoFireRef = useRef(0);
  const pollNowRef = useRef(() => {});
  const busyRef = useRef(new Set());
  const cooldownRef = useRef(0);
  const multRef = useRef(1);
  const seededRef = useRef(false);
  const autoSaveRef = useRef({});
  const betAmtRef = useRef({ 1: DEFAULT_ROCKET_BET, 2: DEFAULT_ROCKET_BET });
  const autoAmtRef = useRef({ 1: 0, 2: 0 });

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
      // Yoğunluk hatasında mevcut durum korunur, yoklama bir süre bekler.
      cooldownRef.current = Date.now() + POLL_COOLDOWN;
      if (!hasDataRef.current) {
        setStatus('error');
        setMessage(friendlyError(e));
      }
    }
  }, [applyResult]);

  useEffect(() => {
    let timer;
    let running = false;
    // Panel kapandığında döngü kesin olarak ölür: uçuştaki bir istek
    // yanıtlandığında arka planda yeni bir döngü başlatamaz. Aksi halde
    // kapanan her oyun arka planda yoklamaya devam edip istek limitini
    // dolduruyor ve bahis/çekilme istekleri reddediliyordu.
    let cancelled = false;
    const loop = async () => {
      if (running || cancelled) return;
      running = true;
      // Sekme arka plandayken sunucu yoklanmaz: istek bütçesi oyuncunun
      // butonlarına kalır, limit hatası oluşmaz.
      if (document.visibilityState === 'hidden') {
        timer = setTimeout(loop, 10000);
        running = false;
        return;
      }
      // Oyuncunun isteği sürerken yoklama yapılmaz: buton anında karşılık bulur.
      if (busyRef.current.size) {
        timer = setTimeout(loop, 1200);
        running = false;
        return;
      }
      if (Date.now() < cooldownRef.current) {
        timer = setTimeout(loop, POLL_COOLDOWN);
        running = false;
        return;
      }
      await fetchState();
      if (cancelled) return;
      // Kalkış anı geçtiyse uçuş sürüyor sayılır: çakılma daha çabuk yakalanır.
      const localNow = serverNowRef.current + (Date.now() - fetchedAtRef.current);
      const flying =
        phaseRef.current === 'running' ||
        (phaseRef.current === 'betting' && launchAtRef.current !== null && localNow >= launchAtRef.current);
      // Çakılma sonrası yeni tur kısa sürede yakalanır, bahis aşaması seyrek yoklanır.
      const quick = flying || phaseRef.current === 'crashed';
      timer = setTimeout(loop, quick ? POLL_RUNNING : POLL_IDLE);
      running = false;
    };
    // Sıradaki yoklamayı öne çeker: ek istek yapmadan anında tazeleme.
    pollNowRef.current = () => {
      if (running || cancelled) return;
      if (busyRef.current.size) return;
      clearTimeout(timer);
      loop();
    };
    loop();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [fetchState]);

  // Sekmeye dönüldüğünde durum hemen tazelenir.
  useEffect(() => {
    const onVisible = () => document.visibilityState === 'visible' && pollNowRef.current();
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setClock(Date.now()), CLOCK_TICK);
    return () => clearInterval(id);
  }, []);

  // Bahis ve otomatik hedef değerleri ilk yüklemede sunucudan bir kez alınır.
  useEffect(() => {
    if (seededRef.current || !data) return;
    seededRef.current = true;
    betAmtRef.current = {
      1: data.bet1 ?? DEFAULT_ROCKET_BET,
      2: data.bet2 ?? DEFAULT_ROCKET_BET,
    };
    autoAmtRef.current = { 1: data.auto1 ?? 0, 2: data.auto2 ?? 0 };
    setBetAmt(betAmtRef.current);
    setAutoAmt(autoAmtRef.current);
  }, [data]);

  useEffect(() => () => {
    clearTimeout(autoSaveRef.current[1]);
    clearTimeout(autoSaveRef.current[2]);
  }, []);

  // Oyun defteri yalnız açıldığında istenir: düzenli yoklamaya ek yük bindirmez.
  const loadLedger = useCallback(async () => {
    try {
      const response = await base44.functions.invoke('rocket-game', { action: 'ledger' });
      if (response.data && !response.data.error) setLedger(response.data);
    } catch (e) {
      setMessage(friendlyError(e));
    }
  }, []);

  const act = useCallback(
    async (payload, options = {}) => {
      const key = options.key ?? `${payload.action}:${payload.slot ?? 0}`;
      // Aynı butona üst üste basmak sunucuya ikinci istek göndermez.
      if (busyRef.current.has(key)) return null;
      busyRef.current.add(key);
      if (options.slot) {
        setBusy((prev) => ({ ...prev, [options.slot]: true }));
        // Çek'e basıldığı an çarpan sabitlenir: gösterilen kazanç donar.
        if (options.lockMult) {
          setPendingMult((prev) => ({ ...prev, [options.slot]: multRef.current }));
        }
      }
      try {
        const response = await base44.functions.invoke('rocket-game', payload);
        applyResult(response.data);
        return response.data;
      } catch (e) {
        // Tekrar denemek istek limitini daha da doldurur: hata doğrudan bildirilir.
        cooldownRef.current = Date.now() + POLL_COOLDOWN;
        setMessage(friendlyError(e));
        return null;
      } finally {
        busyRef.current.delete(key);
        if (options.slot) {
          setBusy((prev) => {
            const next = { ...prev };
            delete next[options.slot];
            return next;
          });
          setPendingMult((prev) => ({ ...prev, [options.slot]: 0 }));
        }
      }
    },
    [applyResult]
  );

  const placeBet = useCallback((slot) => {
    clearTimeout(autoSaveRef.current[slot]);
    return act(
      {
        action: 'bet',
        slot,
        amount: betAmtRef.current[slot],
        auto: autoAmtRef.current[slot],
      },
      { slot }
    );
  }, [act]);

  const cashout = useCallback((slot) => act({ action: 'cashout', slot }, { slot, lockMult: true }), [act]);

  // Bahis miktarı istemcide değişir; sunucuya yalnız bahis konulurken yazılır.
  const changeBet = useCallback((slot, direction) => {
    const next = shiftLevel(ROCKET_BET_LEVELS, betAmtRef.current[slot], direction);
    betAmtRef.current = { ...betAmtRef.current, [slot]: next };
    setBetAmt(betAmtRef.current);
  }, []);

  // Otomatik hedef sunucuya kısa bir gecikmeyle yazılır: ok tuşları anında tepki verir.
  const persistAuto = useCallback((slot, value) => {
    clearTimeout(autoSaveRef.current[slot]);
    autoSaveRef.current[slot] = setTimeout(() => {
      act({ action: 'setAutoValue', slot, value }, { key: `auto:${slot}` });
    }, AUTO_SAVE_MS);
  }, [act]);

  const changeAuto = useCallback((slot, direction) => {
    const next = shiftLevel(ROCKET_AUTO_LEVELS, autoAmtRef.current[slot], direction);
    autoAmtRef.current = { ...autoAmtRef.current, [slot]: next };
    setAutoAmt(autoAmtRef.current);
    persistAuto(slot, next);
  }, [persistAuto]);

  const setAutoTarget = useCallback((slot, value) => {
    clearTimeout(autoSaveRef.current[slot]);
    autoAmtRef.current = { ...autoAmtRef.current, [slot]: value };
    setAutoAmt(autoAmtRef.current);
    return act({ action: 'setAutoValue', slot, value }, { key: `auto:${slot}` });
  }, [act]);

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
  // Çek'e basıldığı an sabitlenecek çarpan için son değer tutulur.
  multRef.current = liveMult;

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
    const pending = [1, 2].some(
      (slot) => myBets[slot] && autoAmt[slot] > 0 && liveMult >= autoAmt[slot]
    );
    if (!pending || Date.now() - autoFireRef.current < 1500) return;
    autoFireRef.current = Date.now();
    // Ek istek yapılmaz: sıradaki yoklama öne çekilir.
    pollNowRef.current();
  }, [phase, liveMult, autoAmt[1], autoAmt[2], myBets[1], myBets[2]]);

  // Çakılma, oyuncunun otomatik hedefinin altında kaldıysa kaybın sebebi
  // açıkça yazılır: "hedefe geldi ama çekmedi" yanılgısı bu durumda oluşur.
  let missMessage = '';
  if (phase === 'crashed') {
    const mine = (data?.bets || []).filter((b) => b.user_id === data?.me);
    for (const slot of [1, 2]) {
      const target = slot === 2 ? data?.auto2 : data?.auto1;
      const row = mine.find((b) => (b.slot === 2 ? 2 : 1) === slot && b.status === 'lost');
      if (row && target > 0 && target > (round?.crash_at ?? 0)) {
        missMessage = `Çakılma ${formatMult(round.crash_at)} — otomatik hedef ${formatMult(target)}'e ulaşmadı.`;
        break;
      }
    }
  }

  return {
    status,
    round,
    phase,
    bets: data?.bets || [],
    history: data?.history || [],
    coins: data?.coins ?? 0,
    bet1: betAmt[1],
    bet2: betAmt[2],
    auto1: autoAmt[1],
    auto2: autoAmt[2],
    me: data?.me,
    myBets,
    liveMult,
    liveColor: MULT_COLOR_CLASS[colorForMult(liveMult)],
    countdown,
    ledger,
    loadLedger,
    busy,
    pendingMult,
    message: message || missMessage,
    placeBet,
    cashout,
    changeBet,
    changeAuto,
    setAutoTarget,
  };
}