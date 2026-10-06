import { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import subscribeEntity from '@/components/data/entitySubscriptions';
import rocketRequests from '@/components/games/rocket/rocketRequests';
import {
  multiplierAt,
  colorForMult,
  MULT_COLOR_CLASS,
  DEFAULT_ROCKET_BET,
  ROCKET_BET_LEVELS,
  ROCKET_AUTO_LEVELS,
} from './rocketConfig';

// Tur durumu canlı yayından gelir; yoklama yalnızca çakılma anını yakalamak
// için çalışır. Seyrek tutulur ki istek bütçesi oyuncunun basışlarına kalsın.
const POLL_FLIGHT = 4000;
// Çakılma sonrası yeni tur yoklanır (tur arası bekleme kadar sonra).
const POLL_CRASHED = 2200;
const POLL_BETTING = 9000;
// Hata sonrası yenilemeler kısa süre bekler; butonlar beklemez.
const POLL_COOLDOWN = 6000;
// Uçuş sırasında bekleme kısa tutulur: çakılma anı ve gerçek çarpan yakalanır.
const POLL_COOLDOWN_FLIGHT = 3000;
const CLOCK_TICK = 50;
// Otomatik hedef ok tuşlarına hızlı basmak tek istek üretir.
const AUTO_SAVE_MS = 600;

// Bahis süresi dolduğu an tur yerel olarak da uçuşa geçer: sunucu yanıtı
// beklenmez, mekik geri sayım 0 olduğu saniyede havalanır.
function phaseAt(status, launchAt, now) {
  if (status === 'betting' && launchAt !== null && now >= launchAt) return 'running';
  return status;
}

// Yalnızca oyun kuralı reddi oyuncuya söylenir; bağlantı ve yoğunluk hataları
// sessizce kendini toparlar, ekrana uyarı düşmez.
function gameMessage(e) {
  const status = e?.response?.status;
  if (!e?.response || status >= 500 || status === 429) return '';
  return e?.response?.data?.error || '';
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
  const needsRecoveryRef = useRef(true);
  const autoFireRef = useRef(new Set());
  const roundNoRef = useRef(null);
  const pollNowRef = useRef(() => {});
  const busyRef = useRef(new Set());
  const cooldownRef = useRef(0);
  const multRef = useRef(1);
  // Çakılma sonrası cüzdan tazelemesi dağıtılmış gecikmeyle istenir.
  const crashRefreshRef = useRef(null);
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
    if (res.settings) {
      setData((prev) => {
        if (!prev) return prev;
        const next = { ...prev, ...res.values };
        if (res.bet && prev.round?.round_no === res.round_no) {
          next.bets = prev.bets.map((bet) => bet.id === res.bet.id ? res.bet : bet);
        }
        return next;
      });
      setMessage('');
      return;
    }
    if (res.patch) {
      setData((prev) => {
        if (!prev) return prev;
        if (prev.round?.round_no !== res.round_no) return { ...prev, coins: res.coins ?? prev.coins };
        const bets = prev.bets.filter((b) => !(b.user_id === prev.me && (b.slot === 2 ? 2 : 1) === res.slot));
        if (res.bet && !res.bet.cancelled) bets.push(res.bet);
        return { ...prev, coins: res.coins, bets };
      });
      setMessage('');
      return;
    }
    roundNoRef.current = res.round?.round_no;
    // Yoklama gecikmesi saati geriye çekmez: ilerleme saniyesi düşerken bir an
    // yükselmez, geri sayım tek yönde akar.
    serverNowRef.current = Math.max(
      hasDataRef.current ? serverNowRef.current + (Date.now() - fetchedAtRef.current) : 0,
      res.now
    );
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
      const result = await rocketRequests({ action: 'state', recover: needsRecoveryRef.current });
      applyResult(result);
      needsRecoveryRef.current = false;
    } catch {
      needsRecoveryRef.current = true;
      // Yoğunluk hatasında mevcut durum korunur, yoklama bir süre bekler.
      cooldownRef.current = Date.now() + POLL_COOLDOWN;
      if (!hasDataRef.current) setStatus('error');
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
      // Kalkış anı geçtiyse uçuş sürüyor sayılır: çakılma daha çabuk yakalanır.
      const localNow = serverNowRef.current + (Date.now() - fetchedAtRef.current);
      const flying =
        phaseRef.current === 'running' ||
        (phaseRef.current === 'betting' && launchAtRef.current !== null && localNow >= launchAtRef.current);
      // Oyuncunun isteği sürerken yoklama yapılmaz: buton anında karşılık bulur.
      if (busyRef.current.size) {
        timer = setTimeout(loop, 1200);
        running = false;
        return;
      }
      // Yoğunluk molasında uçuş bekletilmez: çakılma anı gecikmeden öğrenilir.
      if (Date.now() < cooldownRef.current) {
        timer = setTimeout(loop, flying ? POLL_COOLDOWN_FLIGHT : POLL_COOLDOWN);
        running = false;
        return;
      }
      await fetchState();
      if (cancelled) return;
      // Uçuşta sık, çakılma sonrası daha sık, bahis aşamasında seyrek tazelenir.
      const next = phaseRef.current === 'crashed'
        ? POLL_CRASHED
        : (flying ? POLL_FLIGHT : POLL_BETTING);
      // Stagger players' refreshes instead of a synchronized request burst.
      timer = setTimeout(loop, next + Math.random() * 250);
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

  // Tur, çakılma anı ve yeni tur canlı yayından gelir: oyuncular yoklamayı
  // beklemez, odadaki herkes aynı anda görür. Yayın gelince cüzdan ve bahisler
  // tek istekle arkadan tazelenir.
  useEffect(() => {
    const unsubscribe = subscribeEntity('RocketLive', (event) => {
      const live = event?.data;
      if (!live || typeof live.round_no !== 'number') return;
      setData((prev) => {
        if (!prev) return prev;
        // Gecikmiş yayın turu geriye almaz: eski tur ve eski aşama yok sayılır.
        const rank = { betting: 0, running: 1, crashed: 2 };
        if (live.round_no < (prev.round?.round_no ?? 0)) return prev;
        if (live.round_no === prev.round?.round_no && rank[live.status] < rank[prev.round?.status]) return prev;
        const next = { ...prev };
        next.round = {
          round_no: live.round_no,
          status: live.status,
          phase_ends_at: live.phase_ends_at,
          started_at: live.started_at,
          crash_at: live.status === 'crashed' ? live.crash_at : undefined,
        };
        if (Array.isArray(live.history) && live.history.length) next.history = live.history;
        // Yeni tur: bahis listesi o turun kayıtlarıyla tazelenir.
        if (prev.round?.round_no !== live.round_no) next.bets = [];
        return next;
      });
      roundNoRef.current = live.round_no;
      phaseRef.current = live.status;
      launchAtRef.current = live.phase_ends_at ? new Date(live.phase_ends_at).getTime() : null;
      // Yayın tur bilgisini zaten getirir: her olayda anında yoklama yapılırsa
      // odadaki herkes aynı saniyede istek atıp yoğunluk hatası alır. Yalnızca
      // çakılma sonrası cüzdan tazelemesi dağıtılmış gecikmeyle istenir.
      if (live.status === 'crashed') {
        clearTimeout(crashRefreshRef.current);
        crashRefreshRef.current = setTimeout(() => pollNowRef.current(), 400 + Math.random() * 1600);
      }
    });
    return () => {
      clearTimeout(crashRefreshRef.current);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => setClock(Date.now()), CLOCK_TICK);
    return () => clearInterval(id);
  }, []);

  // Uyarı ekranda 2 saniye kalır, sonra kendiliğinden kaybolur.
  useEffect(() => {
    if (!message) return undefined;
    const id = setTimeout(() => setMessage(''), 2000);
    return () => clearTimeout(id);
  }, [message]);

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
    Object.values(autoSaveRef.current).forEach(clearTimeout);
  }, []);

  // Oyun defteri yalnız açıldığında istenir: düzenli yoklamaya ek yük bindirmez.
  const loadLedger = useCallback(async () => {
    try {
      const result = await rocketRequests({ action: 'ledger' });
      if (result && !result.error) setLedger(result);
    } catch (e) {
      setMessage(gameMessage(e));
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
        const result = await rocketRequests(payload);
        applyResult(result);
        return result;
      } catch (e) {
        // Kural reddi (4xx) yoklamayı durdurmaz; sadece bağlantı ve yoğunluk
        // hatasında kısa bir mola verilir, aksi halde oyun ekranda donar.
        const status = e?.response?.status;
        if (!e?.response || status === 429 || status >= 500) {
          needsRecoveryRef.current = true;
          cooldownRef.current = Date.now() + POLL_COOLDOWN;
        }
        // Kural reddi oyuncuya söylenir. Bahis çekme/iptal ise yoğunlukta arka
        // planda tekrar dener: oyuncuya yoğunluk uyarısı gösterilmez, sonuç
        // (ödeme ya da kayıp) sunucudan geldiği an ekrana düşer.
        const fallback = payload.action === 'cashout' ? '' : (options.slot ? 'Bağlantı yoğun — tekrar dene.' : '');
        setMessage(gameMessage(e) || fallback);
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

  const cashout = useCallback((slot) => act(
    { action: 'cashout', slot, round_no: roundNoRef.current }, { slot, lockMult: true }
  ), [act]);

  // Bahis miktarı istemcide değişir; sunucuya yalnız bahis konulurken yazılır.
  const changeBet = useCallback((slot, direction) => {
    const next = shiftLevel(ROCKET_BET_LEVELS, betAmtRef.current[slot], direction);
    betAmtRef.current = { ...betAmtRef.current, [slot]: next };
    setBetAmt(betAmtRef.current);
  }, []);

  // Otomatik hedef sunucuya kısa bir gecikmeyle yazılır: ok tuşları anında tepki verir.
  const persistAuto = useCallback((slot, value, delay = AUTO_SAVE_MS) => {
    clearTimeout(autoSaveRef.current[slot]);
    autoSaveRef.current[slot] = setTimeout(async () => {
      const result = await act({ action: 'setAutoValue', slot, value, round_no: roundNoRef.current }, { key: `auto:${slot}` });
      // An edit made during a save must not be dropped by the duplicate guard.
      if (autoAmtRef.current[slot] !== value || (!result && busyRef.current.has(`auto:${slot}`))) {
        persistAuto(slot, autoAmtRef.current[slot]);
      }
    }, delay);
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
    persistAuto(slot, value, 0);
  }, [persistAuto]);

  // Yerel akıcı çarpan: sunucu saati + yerel geçen süre.
  const round = data?.round;
  const sinceSync = clock - fetchedAtRef.current;
  const serverNow = serverNowRef.current + sinceSync;
  // Görsel uçuş yerel saatle akar: yoklama gecikse ya da yoğunluk molası girse de
  // mekik durmaz. Çakılma haberi gelince çarpan gerçek çakılma noktasına oturur;
  // ödeme kararı her durumda sunucuda verilir.
  const displayNow = serverNow;
  const launchAt = round?.phase_ends_at ? new Date(round.phase_ends_at).getTime() : null;
  // Geri sayım 0'a indiği saniyede uçuş başlar; sunucu yanıtı beklenmez.
  const phase = phaseAt(round?.status, launchAt, serverNow);

  let liveMult = 1;
  let displayMult = 1;
  if (phase === 'running') {
    const startAt = round?.started_at ? new Date(round.started_at).getTime() : launchAt;
    if (startAt) {
      liveMult = multiplierAt(serverNow - startAt);
      displayMult = multiplierAt(displayNow - startAt);
    }
  } else if (phase === 'crashed') {
    liveMult = round?.crash_at || 1;
    displayMult = liveMult;
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

  // Bahis süresi dolduğu an tek istek gider: tur gecikmeden uçuşa geçer ve
  // çakılma anı sunucudan zamanında öğrenilir.
  useEffect(() => {
    if (phase !== 'betting' || !launchAt) return undefined;
    // Kalkışta tüm oyuncular aynı saniyede istek atmasın diye bekleme dağıtılır.
    const wait = Math.max(0, launchAt - (serverNowRef.current + (Date.now() - fetchedAtRef.current))) + 300 + Math.random() * 1500;
    const id = setTimeout(() => pollNowRef.current(), wait);
    return () => clearTimeout(id);
  }, [phase, launchAt]);

  // One target-specific settlement per slot, not repeated extra state polls.
  // The server uses the stored target and crash point, never a client multiplier.
  useEffect(() => {
    if (phase !== 'running') return;
    for (const slot of [1, 2]) {
      const bet = myBets[slot];
      const target = bet?.auto_at ?? 0;
      const key = `${round?.round_no}:${slot}`;
      if (!bet || target <= 1 || liveMult < target || busyRef.current.has(`cashout:${slot}`) || autoFireRef.current.has(key)) continue;
      autoFireRef.current.add(key);
      act({ action: 'cashout', automatic: true, slot, round_no: round.round_no }, { slot, lockMult: true })
        .then((result) => {
          if (!result || result.bet?.status === 'active') {
            autoSaveRef.current[`retry:${slot}`] = setTimeout(() => autoFireRef.current.delete(key), POLL_COOLDOWN);
          }
        });
    }
  }, [phase, liveMult, round?.round_no, myBets[1], myBets[2], act]);

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
    displayMult,
    liveColor: MULT_COLOR_CLASS[colorForMult(liveMult)],
    countdown,
    ledger,
    loadLedger,
    busy,
    pendingMult,
    message,
    placeBet,
    cashout,
    changeBet,
    changeAuto,
    setAutoTarget,
  };
}